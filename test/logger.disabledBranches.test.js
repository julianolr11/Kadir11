const { createLogger } = require('../scripts/utils/logger');
const assert = require('assert');

describe('logger disabled branch sides', () => {
  it('calls info/warn/group when disabled (no output side)', () => {
    const logger = createLogger('X');
    logger.disable();
    logger.info('Info');
    logger.warn('Warn');
    logger.group('G');
    logger.groupEnd();
    // just ensure enabled stayed false
    assert.strictEqual(logger.enabled, false);
  });
  it('time end executes when disabled in production (debug skipped)', () => {
    process.env.NODE_ENV = 'production';
    const logger = createLogger('Y');
    logger.disable();
    const end = logger.time('Perf');
    end(); // debug should be skipped (branch false)
    assert.strictEqual(logger.enabled, false);
    process.env.NODE_ENV = 'test';
  });
});
