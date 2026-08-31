<template>
  <main class="login-page">
    <section class="login-showcase">
      <div class="login-showcase-inner">
        <div class="login-brand">
          <span class="header-logo-icon login-brand-mark" aria-hidden="true">
            <svg viewBox="0 0 16 16" fill="none">
              <rect x="2" y="3" width="8" height="2.2" rx="1" fill="currentColor" />
              <rect x="5" y="7" width="9" height="2.2" rx="1" fill="currentColor" opacity=".85" />
              <rect x="3" y="11" width="7" height="2.2" rx="1" fill="currentColor" opacity=".7" />
            </svg>
          </span>
          <span class="login-brand-name">RPA 任务看板</span>
        </div>

        <div class="login-intro">
          <h1 class="login-headline">排班、执行、记录，<br />都在一条时间线上。</h1>
          <p class="login-sub">多用户影刀 RPA 排班与执行看板</p>
        </div>

        <div class="gantt-wall" aria-hidden="true">
          <div class="gantt-ruler mono">
            <span>08:00</span><span>11:00</span><span>14:00</span><span>17:00</span><span>20:00</span>
          </div>
          <div class="gantt-rows">
            <div v-for="row in wallRows" :key="row.label" class="gantt-row">
              <span class="gantt-label">{{ row.label }}</span>
              <div class="gantt-track">
                <span class="gantt-bar" :class="row.state" :style="{ left: row.x + '%', width: row.w + '%' }"></span>
              </div>
            </div>
            <div class="gantt-now-layer">
              <span class="gantt-now"></span>
            </div>
          </div>
        </div>

        <ul class="login-features">
          <li><strong>全员甘特排班</strong><span>拖拽调整时段，跨天任务自动顺延到次日</span></li>
          <li><strong>影刀计划绑定</strong><span>每个任务绑定唯一 scheduleUuid</span></li>
          <li><strong>执行记录归位</strong><span>运行状态与日志按绑定区间归属</span></li>
        </ul>
      </div>
    </section>

    <section class="login-panel">
      <div class="login-card">
        <h2 class="login-card-title">{{ auth.authMode === 'dev' ? '开发环境登录' : '登录' }}</h2>
        <p class="login-card-sub">{{ auth.authMode === 'dev' ? '选择开发用户进入排班沙盘' : '使用飞书账号进入看板' }}</p>

        <n-alert v-if="route.query.error || error" type="error" :show-icon="true" class="login-alert">
          {{ route.query.error || error }}
        </n-alert>

        <n-spin :show="loading">
          <template v-if="auth.authMode === 'dev'">
            <div v-if="users.length" class="login-user-list">
              <button
                v-for="user in users"
                :key="user.id"
                type="button"
                class="login-user-card"
                :disabled="switchingId === String(user.id)"
                @click="chooseUser(user)"
              >
                <n-avatar round :src="user.avatar_url || undefined">
                  <template v-if="!user.avatar_url">{{ user.display_name?.slice(0, 1) }}</template>
                  <template #fallback>{{ user.display_name?.slice(0, 1) }}</template>
                </n-avatar>
                <span><strong>{{ user.display_name }}</strong><small>用户 ID：{{ user.id }}</small></span>
                <n-spin v-if="switchingId === String(user.id)" size="small" />
                <span v-else aria-hidden="true">→</span>
              </button>
            </div>
            <n-empty v-else-if="!loading" description="暂无可用开发用户" />
          </template>

          <div v-if="auth.feishuEnabled" class="feishu-login-action">
            <span v-if="auth.authMode === 'dev'" class="login-divider">或</span>
            <n-button type="primary" size="large" block @click="loginWithFeishu">
              <template #icon>
                <svg viewBox="0 0 24 24" fill="none" width="18" height="18" aria-hidden="true">
                  <path
                    d="M3.4 11.2 20.6 3.8c.6-.3 1.2.3.9.9l-6.9 16c-.3.6-1.2.6-1.4-.1l-2-6.1a1 1 0 0 0-.6-.6l-6.1-1.9c-.7-.2-.7-1.1-.1-1.4Z"
                    fill="currentColor"
                  />
                </svg>
              </template>
              使用飞书登录
            </n-button>
          </div>
          <n-alert v-else-if="auth.authMode === 'feishu' && !loading" type="error" :show-icon="true">
            飞书登录配置不完整，请联系管理员。
          </n-alert>
        </n-spin>

        <p class="login-footnote">
          {{ auth.authMode === 'dev' ? '开发用户切换仅用于本地与测试环境。' : '登录即表示使用飞书身份建立本系统会话。' }}
        </p>
      </div>
    </section>
  </main>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { NAlert, NAvatar, NButton, NEmpty, NSpin, useMessage } from 'naive-ui'
import { auth, feishuAuthorizationUrl, listDevUsers, loadSession, switchDevUser } from '../services/authService.js'

// 展示墙：08:00–20:00 共 720 分钟，x/w 均为时间轴百分比
const wallRows = [
  { label: '发票数据同步', state: 'done dim', x: 4.2, w: 12.5 },
  { label: '订单巡检机器人', state: 'running', x: 18.8, w: 18.8 },
  { label: '日报自动汇总', state: 'done', x: 41.7, w: 20.8 },
  { label: '库存对账', state: 'queued', x: 66.7, w: 12.5 },
]

const route = useRoute()
const router = useRouter()
const message = useMessage()
const users = ref([])
const loading = ref(true)
const switchingId = ref('')
const error = ref('')

onMounted(async () => {
  try {
    await loadSession({ force: true })
    if (auth.authenticated) return router.replace('/schedule')
    if (auth.authMode === 'dev') users.value = await listDevUsers()
  } catch (reason) {
    error.value = reason.message || '登录信息加载失败'
  } finally {
    loading.value = false
  }
})

async function chooseUser(user) {
  switchingId.value = String(user.id)
  try {
    await switchDevUser(user.id)
    message.success(`已切换为 ${user.display_name}`)
    const redirect = typeof route.query.redirect === 'string' && route.query.redirect.startsWith('/')
      ? route.query.redirect
      : '/schedule'
    await router.replace(redirect)
  } catch (reason) {
    error.value = reason.message || '用户切换失败'
  } finally {
    switchingId.value = ''
  }
}

function loginWithFeishu() {
  const redirect = typeof route.query.redirect === 'string' && route.query.redirect.startsWith('/')
    ? route.query.redirect
    : '/schedule'
  window.location.assign(feishuAuthorizationUrl({ intent: 'login', redirect }))
}
</script>
