const assert = require('assert');
const { createLogger } = require('../scripts/utils/logger');

describe('logger extra branches', () => {
  it('covers warn and error paths plus groupEnd when disabled/enabled', () => {
    const logger = createLogger('X');
    logger.group('TestGroup');
    logger.groupEnd();
    logger.warn('Aviso');
    logger.error('Erro');
    logger.disable();
    logger.group('HiddenGroup');
    logger.groupEnd();
    logger.enable();
  });
});
