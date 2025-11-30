const assert = require('assert');

function loadModule() {
  delete require.cache[require.resolve('../scripts/create-pet.js')];
  global.document = { addEventListener: () => {} };
  global.window = {}; // minimal
  return require('../scripts/create-pet.js');
}

describe('generateSpecie extra branches', () => {
  it('falls back to all species when no neutrals', () => {
    const mod = loadModule();
    mod._setSpecieData({ A: { element: 'fogo' }, B: { element: 'agua' } });
    const specie = mod.generateSpecie(
      { attack: 1, defense: 1, speed: 1, magic: 1, life: 1 },
      'terra'
    );
    assert.ok(['A', 'B'].includes(specie));
  });

  it('emergency fallback when specieData empty', () => {
    const mod = loadModule();
    mod._setSpecieData({});
    const specie = mod.generateSpecie({ attack: 2, defense: 2, speed: 2, magic: 2, life: 2 }, 'ar');
    assert.ok(
      ['Draconídeo', 'Reptilóide', 'Ave', 'Fera', 'Monstro', 'Criatura Mística'].includes(specie)
    );
  });
});
