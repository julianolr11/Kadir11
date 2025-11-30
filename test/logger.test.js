const assert = require('assert');
const { createLogger } = require('../scripts/utils/logger');

describe('logger utility', () => {
  it('respects enable/disable', () => {
    const originalLog = console.log;
    let count = 0; console.log = () => { count++; };
    const logger = createLogger('Test');
    logger.info('one');
    logger.disable();
    logger.info('two');
    logger.enable();
    logger.info('three');
    console.log = originalLog;
    assert.strictEqual(count, 2, 'only enabled logs counted');
  });

  it('group and groupEnd do not throw when enabled', () => {
    const logger = createLogger('Grp');
    console.group = () => {}; console.groupEnd = () => {};
    logger.group('start'); logger.groupEnd();
  });

  it('time() returns a function that logs debug', () => {
    const originalDebug = console.log; let dbg=0;
    console.log = () => { dbg++; };
    const logger = createLogger('Perf');
    const end = logger.time('op');
    end();
    console.log = originalDebug;
    assert.ok(dbg >= 1, 'debug logged duration');
  });
});
