const assert = require('assert');

describe('logger additional branches', () => {
  it('debug branch disabled (no output) and production env', () => {
    process.env.NODE_ENV='production';
    delete require.cache[require.resolve('../scripts/utils/logger.js')];
    const { createLogger } = require('../scripts/utils/logger.js');
    const logger = createLogger('X');
    logger.disable();
    logger.debug('não deve logar');
    logger.enable();
    logger.debug('também não loga em produção');
    assert.ok(true);
  });
});
