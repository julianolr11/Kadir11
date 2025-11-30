const assert = require('assert');
const { JSDOM } = require('jsdom');

function setupDom(html = `<!DOCTYPE html><body>
  <div id="create-pet-container" style="display:none"></div>
  <div id="element-selection" style="display:none">
    <button class="element-button" data-element="fogo"><span class="element-label"></span></button>
  </div>
  <div id="name-selection" style="display:none">
    <input id="pet-name" value="" />
    <button id="create-pet-button"></button>
  </div>
  <div id="no-pet-available" style="display:none"></div>
  <div id="intro-container" style="display:block"></div>
  <button id="start-quiz-button"></button>
  <h1 id="question-title"></h1>
  <div id="question-text"></div>
  <div id="options-container"></div>
  <div id="final-animation" style="display:none"></div>
  <video id="final-animation-video" style="display:none"></video>
  <img id="final-animation-gif" style="display:none" />
  <div id="pet-reveal" style="display:none"><img id="pet-image" style="opacity:0" /><div id="pet-message" style="opacity:0"></div></div>
</body>`){
  const dom = new JSDOM(html, { pretendToBeVisual: true });
  global.window = dom.window;
  global.document = dom.window.document;
  global.performance = { now: () => Date.now() };
  global.__KADIR_TEST__ = true;
  global.alert = (msg) => { (global.__ALERTS__ ||= []).push(msg); };
  return dom;
}

describe('create-pet extras', () => {
  beforeEach(() => {
    delete require.cache[require.resolve('../scripts/create-pet.js')];
    setupDom();
  });

  it('resetQuiz reinstates initial UI and stats', async () => {
    const mod = require('../scripts/create-pet.js');
    // Injeta perguntas diretamente evitando listeners
    global.fetch = async () => ({ json: async () => ([{ text:'Q', options:[{ text:'A', points:{ attack:1, defense:1, speed:1, magic:1, life:1 }}] }]) });
    // Simula initQuiz manual
    mod.loadQuestions();
    await new Promise(r=>setTimeout(r,0));
    mod.resetQuiz();
    assert.strictEqual(document.getElementById('create-pet-container').style.display, 'block');
    assert.strictEqual(document.getElementById('element-selection').style.display, 'none');
  });

  it('handleCreatePet aborts on empty name', () => {
    const mod = require('../scripts/create-pet.js');
    mod._setSpecieData({ Fera: { element:'fogo', dir:'Fera', race:'Fera' } });
    window.electronAPI = { createPet: () => {} };
    // Preparar estado
    document.getElementById('name-selection').style.display = 'block';
    document.getElementById('pet-name').value = '';
    mod.handleCreatePet();
    assert.ok(global.__ALERTS__.some(a => a.includes('insira um nome')));
    assert.strictEqual(document.getElementById('create-pet-button').disabled, false);
  });

  it('handleCreatePet aborts on long name', () => {
    const mod = require('../scripts/create-pet.js');
    mod._setSpecieData({ Fera: { element:'fogo', dir:'Fera', race:'Fera' } });
    window.electronAPI = { createPet: () => {} };
    document.getElementById('name-selection').style.display = 'block';
    document.getElementById('pet-name').value = 'ABCDEFGHIJKLMNOP'; // 16 chars
    mod.handleCreatePet();
    assert.ok(global.__ALERTS__.some(a => a.includes('máximo 15')));
  });

  it('fallback statusImage uses eggsy.png when race missing and no specieImages', () => {
    const mod = require('../scripts/create-pet.js');
    mod._setSpecieData({ Fera: { element:'fogo', dir:'Fera' } }); // sem race
    window.electronAPI = { createPet: d => { global.__PET_SENT__ = d; } };
    document.getElementById('name-selection').style.display = 'block';
    document.getElementById('pet-name').value = 'Ok';
    // define elemento previamente
    mod.showElementSelection();
    const fogoBtn = document.querySelector('.element-button[data-element="fogo"]');
    fogoBtn.click();
    mod.handleCreatePet();
    assert.strictEqual(global.__PET_SENT__.statusImage, 'eggsy.png');
  });

  it('showFinalAnimation percorre cadeia completa e chama animationFinished', () => {
    const mod = require('../scripts/create-pet.js');
    window.electronAPI = { animationFinished: () => { global.__ANIM_FINISHED__ = true; } };
    // Monkeypatch play para rejeitar (força fallback gif)
    const video = document.getElementById('final-animation-video');
    video.play = () => Promise.reject(new Error('play fail'));
    // Monkeypatch timeouts para execução imediata sequencial
    const originalTimeout = global.setTimeout;
    global.setTimeout = (fn) => { fn(); return 0; };
    mod.showFinalAnimation({ name:'PetZ', image:'x.png' });
    global.setTimeout = originalTimeout;
    assert.ok(global.__ANIM_FINISHED__);
  });
});
