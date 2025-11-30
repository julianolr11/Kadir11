const assert = require('assert');
const { JSDOM } = require('jsdom');

function setupDom(){
  const html = `<!DOCTYPE html><body>
    <div id="intro-container" style="display:block"></div>
    <button id="start-quiz-button"></button>
    <div id="create-pet-container" style="display:none"></div>
    <h1 id="question-title"></h1>
    <div id="question-text"></div>
    <div id="options-container"></div>
    <div id="element-selection" style="display:none"></div>
    <div id="name-selection" style="display:none"><input id="pet-name" /><button id="create-pet-button"></button></div>
    <div id="final-animation" style="display:none"></div>
    <video id="final-animation-video"></video>
    <img id="final-animation-gif" />
    <div id="pet-reveal" style="display:none"><img id="pet-image" /><div id="pet-message"></div></div>
  </body>`;
  const dom = new JSDOM(html, { pretendToBeVisual:true });
  global.window = dom.window;
  global.document = dom.window.document;
  global.performance = { now: () => Date.now() };
  // Remover flag de teste para exercitar auto-init
  delete global.__KADIR_TEST__;
  // Mock electronAPI usado em _initDomListeners
  window.electronAPI = {
    getSpeciesInfo: async () => ({ specieData:{ Fera:{ element:'fogo', dir:'Fera', race:'Fera' } }, specieImages:{}, specieBioImages:{} }),
    onPetCreated: (cb) => { window.__onPetCreated = cb; },
    on: () => {},
    createPet: () => {},
    animationFinished: () => {}
  };
  return dom;
}

describe('create-pet auto init listeners branch', () => {
  it('auto initializes DOM listeners when __KADIR_TEST__ ausente', async () => {
    setupDom();
    delete require.cache[require.resolve('../scripts/create-pet.js')];
    const mod = require('../scripts/create-pet.js');
    // Clica start para disparar loadQuestions via listener
    global.fetch = async () => ({ json: async () => ([{ text:'Q', options:[{ text:'A', points:{ attack:0, defense:0, speed:0, magic:0, life:0 }}] }]) });
    document.getElementById('start-quiz-button').click();
    await new Promise(r=>setTimeout(r,0));
    assert.strictEqual(document.getElementById('create-pet-container').style.display,'flex');
  });
});
