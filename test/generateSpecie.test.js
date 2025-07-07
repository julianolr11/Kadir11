const assert = require('assert');
const path = require('path');

describe('generateSpecie', function () {
  function loadCreatePet() {
    delete require.cache[require.resolve('../scripts/create-pet.js')];
    global.document = { addEventListener: () => {} };
    global.window = {};
    return require('../scripts/create-pet.js');
  }

  it('prefers element specific species when available', function () {
    const createPet = loadCreatePet();
    createPet._setSpecieData({
      'Mawthorn': { element: 'agua' },
      'Monstro': {}
    });
    const specie = createPet.generateSpecie({ attack: 1, defense: 1, speed: 1, magic: 1, life: 1 }, 'agua');
    assert.strictEqual(specie, 'Mawthorn');
  });

  it('falls back to generic species when none match element', function () {
    const createPet = loadCreatePet();
    createPet._setSpecieData({
      'Monstro': {},
      'Fera': {}
    });
    const specie = createPet.generateSpecie({ attack: 1, defense: 1, speed: 1, magic: 1, life: 1 }, 'terra');
    assert.ok(['Monstro', 'Fera'].includes(specie));
  });
});
