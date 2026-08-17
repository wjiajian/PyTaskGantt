import { describe, expect, it } from 'vitest'
import {
  escapeHtml,
  createBotColorMap,
  filterTasks,
  formatDuration,
  getBotColor,
  isCrossDay,
  parseTimeToDate,
  summarizeSyncCutoff,
} from '../src/services/dataService.js'

describe('frontend data utilities', () => {
  it('为不同机器人生成稳定且不受八色调色板限制的颜色', () => {
    expect(getBotColor('机器人1')).toBe(getBotColor('机器人1'))
    expect(getBotColor('机器人1')).not.toBe(getBotColor('机器人10'))

    const names = Array.from({ length: 10 }, (_, index) => `机器人${index}`)
    const colors = createBotColorMap(names)
    expect(new Set(colors.values()).size).toBe(names.length)

    const rows = names.map((bot, index) => ({
      id: String(index), task: `任务${index}`, start: '09:00:00', finish: '10:00:00', bot,
    }))
    const allRows = filterTasks(rows)
    const filteredRows = filterTasks(rows, { selectedBots: ['机器人1', '机器人8'] })
    expect(filteredRows.map(row => row.color)).toEqual([
      allRows.find(row => row.bot === '机器人1').color,
      allRows.find(row => row.bot === '机器人8').color,
    ])
  })

  it('保留跨天任务语义', () => {
    expect(isCrossDay('23:30:00', '01:15:00')).toBe(true)
    expect(formatDuration('23:30:00', '01:15:00')).toBe('1h 45m')
    const { start, end } = parseTimeToDate('23:30:00', '01:15:00')
    expect(end.getTime() - start.getTime()).toBe(105 * 60 * 1000)
  })

  it('转义甘特 group 中的用户输入', () => {
    expect(escapeHtml('<img src=x onerror="alert(1)">')).toBe('&lt;img src=x onerror=&quot;alert(1)&quot;&gt;')
  })

  it('按所有者过滤并保留历史任务入口', () => {
    const rows = [
      { id: '1', task: '我的任务', start: '09:00:00', finish: '09:30:00', bot: 'A', owner: { id: 'u1' } },
      { id: '2', task: '历史任务', start: '10:00:00', finish: '10:30:00', bot: 'B', owner: null },
    ]
    expect(filterTasks(rows, { selectedOwners: ['legacy'] }).map(row => row.id)).toEqual(['2'])
  })

  it('影刀数据截至取已绑定任务的最早成功同步时间且标记缺失项', () => {
    expect(summarizeSyncCutoff([
      { schedule_uuid: 's1', last_synced_at: '2026-07-22T04:00:00.000Z' },
      { schedule_uuid: 's2', last_synced_at: '2026-07-22T04:05:00.000Z' },
      { schedule_uuid: 's3', last_synced_at: null },
      { schedule_uuid: '', last_synced_at: null },
    ])).toEqual({
      boundCount: 3,
      timestamp: '2026-07-22T04:00:00.000Z',
      incomplete: true,
    })
  })
})
