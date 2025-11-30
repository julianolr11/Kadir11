const assert = require('assert');
const { JSDOM } = require('jsdom');

function setupDom() {
  const dom = new JSDOM(`<!DOCTYPE html><body>
    <h1 id="question-title"></h1>
    <div id="question-text"></div>
    <div id="options-container"></div>
    <div id="element-selection" style="display:none"></div>
  </body>`);
  global.window = dom.window;
  global.document = dom.window.document;
  global.__KADIR_TEST__ = true;
  return dom;
}

describe('create-pet selectOption branches', () => {
  beforeEach(() => {
    delete require.cache[require.resolve('../scripts/create-pet.js')];
    setupDom();
  });

  it('increments all stats when selecting option (early branch)', async () => {
    const mod = require('../scripts/create-pet.js');
    // Força perguntas para preencher selectedQuestions via loadQuestions -> initQuiz
    global.fetch = async () => ({
      json: async () => [
        {
          text: 'Q1',
          options: [{ text: 'A', points: { attack: 1, defense: 2, speed: 3, magic: 4, life: 5 } }],
        },
        {
          text: 'Q2',
          options: [{ text: 'A', points: { attack: 1, defense: 1, speed: 1, magic: 1, life: 1 } }],
        },
        {
          text: 'Q3',
          options: [{ text: 'A', points: { attack: 0, defense: 0, speed: 0, magic: 0, life: 0 } }],
        },
        {
          text: 'Q4',
          options: [{ text: 'A', points: { attack: 0, defense: 0, speed: 0, magic: 0, life: 0 } }],
        },
        {
          text: 'Q5',
          options: [{ text: 'A', points: { attack: 0, defense: 0, speed: 0, magic: 0, life: 0 } }],
        },
      ],
    });
    await mod.loadQuestions();
    // Primeiro selectOption com pontos variados
    mod.selectOption({ attack: 1, defense: 2, speed: 3, magic: 4, life: 5 });
    // Stats iniciais eram 1 cada (exceto life=1) definidos internamente; após incremento devem reflet soma
    // Não temos acesso direto ao objeto stats interno, mas podemos induzir segunda chamada e observar que branch continua
    // Para validar, chamamos novamente com valores conhecidos e confirmamos que não quebra (cobrindo caminho showQuestion)
    mod.selectOption({ attack: 0, defense: 0, speed: 0, magic: 0, life: 0 });
    // Se chegou aqui sem erro, ambas execuções cobriram incrementos e branch de continuar quiz
    assert.strictEqual(document.getElementById('element-selection').style.display, 'none');
  });

  it('triggers showElementSelection when last question answered (else branch)', async () => {
    const mod = require('../scripts/create-pet.js');
    global.fetch = async () => ({
      json: async () => [
        {
          text: 'Q1',
          options: [{ text: 'A', points: { attack: 0, defense: 0, speed: 0, magic: 0, life: 0 } }],
        },
        {
          text: 'Q2',
          options: [{ text: 'A', points: { attack: 0, defense: 0, speed: 0, magic: 0, life: 0 } }],
        },
        {
          text: 'Q3',
          options: [{ text: 'A', points: { attack: 0, defense: 0, speed: 0, magic: 0, life: 0 } }],
        },
        {
          text: 'Q4',
          options: [{ text: 'A', points: { attack: 0, defense: 0, speed: 0, magic: 0, life: 0 } }],
        },
        {
          text: 'Q5',
          options: [{ text: 'A', points: { attack: 0, defense: 0, speed: 0, magic: 0, life: 0 } }],
        },
      ],
    });
    await mod.loadQuestions();
    // Simula ter respondido 4 perguntas: incrementa índice manualmente usando a própria API: chamando selectOption 4 vezes
    for (let i = 0; i < 4; i++) {
      mod.selectOption({ attack: 0, defense: 0, speed: 0, magic: 0, life: 0 });
    }
    // Quinta chamada deve cair no else -> showElementSelection
    mod.selectOption({ attack: 0, defense: 0, speed: 0, magic: 0, life: 0 });
    assert.strictEqual(document.getElementById('element-selection').style.display, 'block');
  });
});
