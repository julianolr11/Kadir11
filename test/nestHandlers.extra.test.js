const assert = require('assert');
const { setupNestHandlers } = require('../scripts/handlers/nestHandlers');

describe('nestHandlers extra branches', () => {
  function base(options = {}) {
    const handlers = {};
    const ipcMain = { on: (evt, cb) => { handlers[evt] = cb; } };
    const wins = [];
    const BrowserWindow = {
      getAllWindows: () => wins
    };
    const currentPet = { name: 'Atual', petId: '000001', items: { eggAve: 1 } };
    const state = {
      items: { eggAve: 1 },
      nests: [],
      hatchWindow: options.hatchWindow || null
    };
    const petManager = {
      createPet: async (data) => ({ ...data, petId: '000099' })
    };
    setupNestHandlers({
      getCurrentPet: () => options.hasPet === false ? null : currentPet,
      getItems: () => state.items,
      setItems: (i) => { if (options.failSetItems) throw new Error('set fail'); state.items = i; },
      getNestCount: () => 3,
      getNestsData: () => state.nests,
      setNestsData: (n) => { state.nests = n; },
      generateRarity: () => 'Raro',
      generatePetFromEgg: (eggId, rarity) => ({ name: 'Gerado', eggId, rarity }),
      petManager,
      broadcastPenUpdate: () => {},
      getHatchWindow: () => state.hatchWindow,
      ipcMain,
      BrowserWindow
    });
    return { handlers, state };
  }

  it('covers error catch in place-egg-in-nest when setItems throws', async () => {
    const { handlers } = base({ failSetItems: true });
    handlers['place-egg-in-nest']({}, 'eggAve');
  });

  it('covers hatch-egg branch sending to hatch window when isLoading true', async () => {
    let onceHandler;
    const hatchWindow = {
      webContents: {
        isLoading: () => true,
        once: (evt, cb) => { if (evt === 'did-finish-load') { onceHandler = cb; } },
        send: () => {}
      }
    };
    const { handlers, state } = base({ hatchWindow });
    // Prepare a nest
    state.nests.push({ eggId: 'eggAve', start: Date.now(), rarity: 'Raro' });
    handlers['hatch-egg']({}, 0);
    // Simulate finish load
    if (onceHandler) onceHandler();
  });

  it('covers hatch-egg branch sending immediately when hatch window not loading', async () => {
    const hatchWindow = {
      webContents: {
        isLoading: () => false,
        once: () => {},
        send: () => {}
      }
    };
    const { handlers, state } = base({ hatchWindow });
    state.nests.push({ eggId: 'eggAve', start: Date.now(), rarity: 'Raro' });
    handlers['hatch-egg']({}, 0);
  });

  it('covers insufficient eggs path', () => {
    // items eggAve = 0 triggers insufficient eggs
    const handlers = {};
    const ipcMain = { on: (evt, cb) => { handlers[evt] = cb; } };
    setupNestHandlers({
      getCurrentPet: () => ({ name: 'P', items: { eggAve: 0 } }),
      getItems: () => ({ eggAve: 0 }),
      setItems: () => {},
      getNestCount: () => 3,
      getNestsData: () => [],
      setNestsData: () => {},
      generateRarity: () => 'Comum',
      generatePetFromEgg: () => ({}),
      petManager: { createPet: async () => ({}) },
      broadcastPenUpdate: () => {},
      getHatchWindow: () => null,
      ipcMain,
      BrowserWindow: { getAllWindows: () => [] }
    });
    handlers['place-egg-in-nest']({}, 'eggAve');
  });

  it('cobre erro em broadcast rollback quando getAllWindows lança', async () => {
    const handlers = {};
    const ipcMain = { on: (evt, cb) => { handlers[evt] = cb; } };
    let callCount = 0;
    const BrowserWindow = {
      getAllWindows: () => {
        callCount++;
        if (callCount === 1) return []; // primeira vez ok (broadcast sucesso)
        throw new Error('crash'); // segunda vez (rollback) lança
      }
    };
    let nests = [{ eggId:'eggAve', start:Date.now(), rarity:'Comum' }];
    setupNestHandlers({
      getCurrentPet: () => ({ name: 'P', items: {} }),
      getItems: () => ({}),
      setItems: () => {},
      getNestCount: () => 3,
      getNestsData: () => nests,
      setNestsData: (n) => { nests = n; },
      generateRarity: () => 'Raro',
      generatePetFromEgg: () => ({ name:'Pet' }),
      petManager: { createPet: async () => { throw new Error('fail'); } },
      broadcastPenUpdate: () => {},
      getHatchWindow: () => null,
      ipcMain,
      BrowserWindow
    });
    // Executar handler, espera que entre no catch e re-adicione egg
    await handlers['hatch-egg']({}, 0);
    // Mesmo com erro no getAllWindows, o egg foi re-add antes da linha que lança
    // Na verdade, o código re-adiciona antes do segundo getAllWindows
    // então nests deve ter 1
    assert.ok(nests.length >= 1, 'Egg deveria ter sido re-adicionado');
  });

  it('cobre broadcast rollback com window sem webContents', async () => {
    const handlers = {};
    const ipcMain = { on: (evt, cb) => { handlers[evt] = cb; } };
    let nests = [{ eggId:'eggAve', start:Date.now(), rarity:'Comum' }];
    setupNestHandlers({
      getCurrentPet: () => ({ name: 'P', items: {} }),
      getItems: () => ({}),
      setItems: () => {},
      getNestCount: () => 3,
      getNestsData: () => nests,
      setNestsData: (n) => { nests = n; },
      generateRarity: () => 'Raro',
      generatePetFromEgg: () => ({ name:'Pet' }),
      petManager: { createPet: async () => { throw new Error('fail'); } },
      broadcastPenUpdate: () => {},
      getHatchWindow: () => null,
      ipcMain,
      BrowserWindow: { getAllWindows: () => [ {}, { webContents: null }, { webContents: { send: () => {} } } ] }
    });
    await handlers['hatch-egg']({}, 0);
    // Ao entrar no catch de createPet, egg é re-adicionado
    assert.ok(nests.length >= 1, 'Egg deveria ter sido re-adicionado no rollback');
  });

  it('cobre sucesso com hatchWindow ausente (null)', () => {
    const handlers = {};
    const ipcMain = { on: (evt, cb) => { handlers[evt] = cb; } };
    let nests = [{ eggId:'eggAve', start:Date.now(), rarity:'Comum' }];
    setupNestHandlers({
      getCurrentPet: () => ({ name: 'P', items: {} }),
      getItems: () => ({}),
      setItems: () => {},
      getNestCount: () => 3,
      getNestsData: () => nests,
      setNestsData: (n) => { nests = n; },
      generateRarity: () => 'Raro',
      generatePetFromEgg: () => ({ name:'Pet' }),
      petManager: { createPet: async () => ({ petId:'99', name:'Novo' }) },
      broadcastPenUpdate: () => {},
      getHatchWindow: () => null,
      ipcMain,
      BrowserWindow: { getAllWindows: () => [ { webContents: { send: () => {} } } ] }
    });
    handlers['hatch-egg']({}, 0);
    assert.strictEqual(nests.length, 0);
  });

  it('cobre hatchWindow com webContents null', () => {
    const handlers = {};
    const ipcMain = { on: (evt, cb) => { handlers[evt] = cb; } };
    let nests = [{ eggId:'eggAve', start:Date.now(), rarity:'Comum' }];
    setupNestHandlers({
      getCurrentPet: () => ({ name: 'P', items: {} }),
      getItems: () => ({}),
      setItems: () => {},
      getNestCount: () => 3,
      getNestsData: () => nests,
      setNestsData: (n) => { nests = n; },
      generateRarity: () => 'Raro',
      generatePetFromEgg: () => ({ name:'Pet' }),
      petManager: { createPet: async () => ({ petId:'99', name:'Novo' }) },
      broadcastPenUpdate: () => {},
      getHatchWindow: () => ({ webContents: null }),
      ipcMain,
      BrowserWindow: { getAllWindows: () => [ { webContents: { send: () => {} } } ] }
    });
    handlers['hatch-egg']({}, 0);
    assert.strictEqual(nests.length, 0);
  });
});
