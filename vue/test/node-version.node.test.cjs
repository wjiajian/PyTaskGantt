const test = require('node:test');
const assert = require('node:assert/strict');
const {
  parseNodeVersion,
  isSupportedNodeVersion,
} = require('../scripts/check-node-version.cjs');

test('Node.js 启动门禁拒绝 Vite 8 不支持的版本', () => {
  assert.deepEqual(parseNodeVersion('v20.19.0'), { major: 20, minor: 19, patch: 0 });
  assert.equal(isSupportedNodeVersion('18.19.0'), false);
  assert.equal(isSupportedNodeVersion('20.18.9'), false);
  assert.equal(isSupportedNodeVersion('20.19.0'), true);
  assert.equal(isSupportedNodeVersion('21.7.3'), false);
  assert.equal(isSupportedNodeVersion('22.11.0'), false);
  assert.equal(isSupportedNodeVersion('22.12.0'), true);
  assert.equal(isSupportedNodeVersion('23.0.0'), true);
  assert.equal(isSupportedNodeVersion('24.18.0'), true);
});
