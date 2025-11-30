const assert = require('assert');

describe('create-pet load functions', () => {
  function loadModule() {
    delete require.cache[require.resolve('../scripts/create-pet.js')];
    global.document = { addEventListener: () => {} };
    global.window = {
      electronAPI: {
        getSpeciesInfo: async () => ({
          specieData: { A: { element: 'fogo' }, B: {} },
          specieBioImages: {},
          specieImages: {},
        }),
      },
    };
    return require('../scripts/create-pet.js');
  }

  it('loadSpeciesData populates specieData', async () => {
    const mod = loadModule();
    await mod.loadSpeciesData();
    const specie = mod.generateSpecie(
      { attack: 1, defense: 1, speed: 1, magic: 1, life: 1 },
      'fogo'
    );
    assert.strictEqual(specie, 'A');
  });

  it('loadQuestions consumes fetch JSON', async () => {
    const mod = loadModule();
    global.fetch = async () => ({
      json: async () => [
        {
          text: 'Q1',
          options: [
            { text: 'Opt', points: { attack: 1, defense: 0, speed: 0, magic: 0, life: 0 } },
          ],
        },
      ],
    });
    // Stub initQuiz side-effect expecting selectRandomQuestions + showQuestion not needed
    global.document.getElementById = () => ({ style: {}, textContent: '', disabled: false });
    // Call loadQuestions and ensure no throw
    await mod.loadQuestions();
  });
});
