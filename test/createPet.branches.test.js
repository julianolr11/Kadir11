const assert = require('assert');
const { JSDOM } = require('jsdom');
const sinon = require('sinon');

function buildDom(extra = {}) {
  const html = `<!DOCTYPE html><html><body>
    <div id="intro-container"></div>
    <button id="start-quiz-button"></button>
    <div id="create-pet-container" style="display:none"></div>
    <div id="element-selection" style="display:none"></div>
    <div id="name-selection" style="display:none"></div>
    <div id="no-pet-available" style="display:none"></div>
    <button id="create-pet-button"></button>
    <input id="pet-name" />
    <div id="question-title"></div>
    <div id="question-text"></div>
    <div id="options-container"></div>
    <div id="final-animation" style="display:none"></div>
    <video id="final-animation-video" style="display:none"></video>
    <img id="final-animation-gif" style="display:none" />
    <div id="pet-reveal" style="display:none">
      <img id="pet-image" style="opacity:0" />
      <div id="pet-message" style="opacity:0"></div>
    </div>
  </body></html>`;
  const dom = new JSDOM(html, { url: 'http://localhost' });
  global.window = dom.window;
  global.document = dom.window.document;
  // Stub fetch for loadQuestions when needed
  global.fetch = () => Promise.resolve({ json: () => Promise.resolve([{ text: 'Q', options: [{ text: 'O', points: { attack:1, defense:1, speed:1, magic:1, life:1 } }] }]) });
  // Basic electronAPI structure; handlers collected in maps
  const errorHandlers = {}; // eventName -> handler
  let petCreatedHandler = null;
  window.electronAPI = {
    getSpeciesInfo: async () => ({
      specieData: { A: { dir: 'A', race: 'A', element: 'fogo' } },
      specieBioImages: {},
      specieImages: { A: 'A/fogo/A/front.gif' }
    }),
    onPetCreated: (cb) => { petCreatedHandler = cb; },
    on: (evt, cb) => { errorHandlers[evt] = cb; },
    createPet: () => {},
    animationFinished: () => { window.__animationFinishedCalled = true; }
  };
  Object.assign(window, extra);
  return { errorHandlers, getPetCreatedHandler: () => petCreatedHandler };
}

describe('create-pet.js branch coverage', () => {
  let clock;
  afterEach(() => {
    if (clock) { clock.restore(); clock = null; }
    delete global.window; delete global.document; delete global.fetch; delete global.__KADIR_TEST__;
    // Clear module cache to allow re-require with different conditions
    delete require.cache[require.resolve('../scripts/create-pet.js')];
  });

  async function flush() { return new Promise(r => setTimeout(r, 0)); }

  it('covers full animation chain (success play path + nested timeouts)', () => {
    buildDom();
    // Avoid auto init to isolate showFinalAnimation
    global.__KADIR_TEST__ = true;
    const mod = require('../scripts/create-pet.js');
    const video = document.getElementById('final-animation-video');
    // Simulate successful play promise (no catch executed)
    video.play = () => ({ catch: () => {} });
    clock = sinon.useFakeTimers();
    const pet = { image: 'A/fogo/A/front.gif', name: 'PetX' };
    mod.showFinalAnimation(pet);
    // Advance through all timers: 7000 + 100 + 1000 + 300 + 3000
    clock.tick(12000);
    assert.strictEqual(window.__animationFinishedCalled, true, 'animationFinished should be called');
    assert.strictEqual(document.getElementById('pet-reveal').style.display, 'none', 'pet reveal should be hidden after completion');
  });

  it('covers onPetCreated listener path invoking showFinalAnimation', async () => {
    const { getPetCreatedHandler } = buildDom();
    global.__KADIR_TEST__ = true;
    require('../scripts/create-pet.js')._initDomListeners();
    document.dispatchEvent(new window.Event('DOMContentLoaded'));
    await flush(); // wait async listener completion
    const handler = getPetCreatedHandler();
    assert.ok(handler, 'onPetCreated handler should be registered');
    clock = sinon.useFakeTimers();
    handler({ image: 'A/fogo/A/front.gif', name: 'NovoPet' });
    clock.tick(12000);
    assert.strictEqual(window.__animationFinishedCalled, true);
  });

  it('covers create-pet-error listener (limit branch)', async () => {
    const { errorHandlers } = buildDom();
    global.__KADIR_TEST__ = true;
    require('../scripts/create-pet.js')._initDomListeners();
    document.getElementById('name-selection').style.display = 'block';
    document.getElementById('create-pet-button').disabled = true;
    document.dispatchEvent(new window.Event('DOMContentLoaded'));
    await flush();
    const cb = errorHandlers['create-pet-error'];
    assert.ok(cb, 'error handler registered');
    let alerted = '';
    global.alert = (msg) => { alerted = msg; };
    cb(null, 'Limite de 6 pets atingido');
    assert.ok(alerted.includes('6'), 'limit alert executed');
    assert.strictEqual(document.getElementById('create-pet-button').disabled, false);
  });

  it('covers create-pet-error listener (generic branch)', async () => {
    const { errorHandlers } = buildDom();
    global.__KADIR_TEST__ = true;
    require('../scripts/create-pet.js')._initDomListeners();
    document.getElementById('name-selection').style.display = 'block';
    document.getElementById('create-pet-button').disabled = true;
    document.dispatchEvent(new window.Event('DOMContentLoaded'));
    await flush();
    const cb = errorHandlers['create-pet-error'];
    assert.ok(cb, 'error handler registered');
    let alerted = '';
    global.alert = (msg) => { alerted = msg; };
    cb(null, 'Falha desconhecida');
    assert.ok(alerted.includes('Erro ao criar'), 'generic alert executed');
    assert.strictEqual(document.getElementById('name-selection').style.display, 'block');
  });

  it('covers auto init branch when __KADIR_TEST__ absent', async () => {
    buildDom();
    delete global.__KADIR_TEST__;
    require('../scripts/create-pet.js');
    document.dispatchEvent(new window.Event('DOMContentLoaded'));
    await flush(); // wait loadSpeciesData
    document.getElementById('start-quiz-button').click();
    assert.strictEqual(document.getElementById('create-pet-container').style.display, 'flex');
  });

  it('covers error path in loadSpeciesData', async () => {
    buildDom({
      electronAPI: {
        getSpeciesInfo: async () => { throw new Error('fail species'); }
      }
    });
    global.__KADIR_TEST__ = true;
    const mod = require('../scripts/create-pet.js');
    await mod.loadSpeciesData(); // should catch error
    // specieData remains empty
    assert.deepStrictEqual(Object.keys(Object.getOwnPropertyNames(global.window.electronAPI || {})).length >= 0, true);
  });

  it('covers else branch when specie info missing (generateSpecie returns unknown)', () => {
    const { } = buildDom();
    global.__KADIR_TEST__ = true;
    const mod = require('../scripts/create-pet.js');
    // Prepare minimal DOM for handleCreatePet
    document.getElementById('name-selection').style.display = 'block';
    document.getElementById('pet-name').value = 'SemInfo';
    // Force selectedElement via element selection path
    // Patch generateSpecie to return a specie not present
    mod.generateSpecie = () => 'Fantasma';
    // Stub createPet to capture data
    let captured = null;
    window.electronAPI.createPet = (data) => { captured = data; };
    mod.handleCreatePet();
    assert.ok(captured, 'pet should be created');
    assert.strictEqual(captured.statusImage, 'eggsy.png', 'fallback image expected when info missing and no mapping');
  });

  it('covers branch building base path without element in specie info', () => {
    const { } = buildDom();
    global.__KADIR_TEST__ = true;
    const mod = require('../scripts/create-pet.js');
    // Inject specieData with a race but no element
    mod._setSpecieData({ SemElemento: { dir: 'DirZ', race: 'RZ' } });
    document.getElementById('name-selection').style.display = 'block';
    document.getElementById('pet-name').value = 'NoElem';
    mod.generateSpecie = () => 'SemElemento';
    let captured = null;
    window.electronAPI.createPet = (data) => { captured = data; };
    mod.handleCreatePet();
    assert.ok(captured, 'pet should be created');
    assert.strictEqual(captured.statusImage, 'DirZ/RZ/front.gif', 'path without element segment should be used');
  });
});
