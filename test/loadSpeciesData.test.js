const assert = require('assert');
const path = require('path');

describe('loadSpeciesData', function () {
  it('returns known species when directories exist', async function () {
    const constants = await import('../scripts/constants.js');
    await constants.loadSpeciesData(path.resolve(__dirname, '..'));
    assert.ok(constants.specieData.Besta, 'Expected Besta species to be loaded');
  });
});
