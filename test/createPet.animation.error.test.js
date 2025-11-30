const assert = require('assert');
const { JSDOM } = require('jsdom');

function setupDom(
  html = `<!DOCTYPE html><body>
  <div id="final-animation" style="display:none"></div>
  <video id="final-animation-video" style="display:none"></video>
  <img id="final-animation-gif" style="display:none" />
  <div id="pet-reveal" style="display:none"><img id="pet-image" style="opacity:0" /><div id="pet-message" style="opacity:0"></div></div>
</body>`
) {
  const dom = new JSDOM(html, { pretendToBeVisual: true });
  global.window = dom.window;
  global.document = dom.window.document;
  global.__KADIR_TEST__ = true;
  return dom;
}

describe('create-pet animation error handler branch', () => {
  beforeEach(() => {
    delete require.cache[require.resolve('../scripts/create-pet.js')];
    setupDom();
  });

  it('covers video.onerror fallback (GIF path) sem deixar timers pendurados', () => {
    const mod = require('../scripts/create-pet.js');
    window.electronAPI = { animationFinished: () => {} };
    const video = document.getElementById('final-animation-video');
    // Force play() to return undefined so playPromise logic é ignorado
    video.play = () => undefined;
    // Executa todos setTimeout imediatamente para evitar execução tardia após suite
    const originalSetTimeout = global.setTimeout;
    global.setTimeout = (fn) => {
      fn();
      return 0;
    };
    mod.showFinalAnimation({ name: 'Erro', image: 'path.gif' });
    // Dispara erro explícito para acionar onerror
    video.onerror();
    // Restaura setTimeout
    global.setTimeout = originalSetTimeout;
    assert.strictEqual(video.style.display, 'none');
    assert.strictEqual(document.getElementById('final-animation-gif').style.display, 'block');
  });
});
