const NODE_20_MINIMUM = Object.freeze({ major: 20, minor: 19, patch: 0 });
const NODE_22_MINIMUM = Object.freeze({ major: 22, minor: 12, patch: 0 });

function parseNodeVersion(value) {
  const match = String(value || '').trim().replace(/^v/, '').match(/^(\d+)\.(\d+)\.(\d+)/);
  if (!match) return null;
  return {
    major: Number(match[1]),
    minor: Number(match[2]),
    patch: Number(match[3]),
  };
}

function isSupportedNodeVersion(value) {
  const version = parseNodeVersion(value);
  if (!version) return false;
  if (version.major === NODE_20_MINIMUM.major) {
    if (version.minor !== NODE_20_MINIMUM.minor) {
      return version.minor > NODE_20_MINIMUM.minor;
    }
    return version.patch >= NODE_20_MINIMUM.patch;
  }
  if (version.major < NODE_22_MINIMUM.major) return false;
  if (version.major > NODE_22_MINIMUM.major) return true;
  if (version.minor !== NODE_22_MINIMUM.minor) {
    return version.minor > NODE_22_MINIMUM.minor;
  }
  return version.patch >= NODE_22_MINIMUM.patch;
}

function assertSupportedNodeVersion(value = process.versions.node) {
  if (isSupportedNodeVersion(value)) return;
  console.error(
    `Node.js 版本不受支持：当前 ${value || '未知'}，PyTaskGantt 要求 ^20.19.0 或 >=22.12.0。`,
  );
  console.error('请先切换 Node.js 版本后重新执行 npm start，例如：nvm use 24');
  process.exitCode = 1;
}

if (require.main === module) assertSupportedNodeVersion();

module.exports = {
  NODE_20_MINIMUM,
  NODE_22_MINIMUM,
  parseNodeVersion,
  isSupportedNodeVersion,
  assertSupportedNodeVersion,
};
