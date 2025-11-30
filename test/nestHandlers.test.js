const assert = require('assert');
const { setupNestHandlers } = require('../scripts/handlers/nestHandlers');

function mockIpc() {
  const handlers = {};
  return {
    on: (channel, fn) => { handlers[channel] = fn; },
    emit: async (channel, ...args) => { if (handlers[channel]) return handlers[channel]({ reply(){} }, ...args); },
    _handlers: handlers
  };
}

function mockBrowserWindow() {
  const sends = [];
  const win = { webContents: { send: (ch, data) => sends.push({ ch, data }) } };
  return {
    getAllWindows: () => [win],
    _sends: sends,
    _win: win
  };
}

describe('nestHandlers', () => {
  it('place-egg-in-nest should consume egg and add nest', async () => {
    const ipc = mockIpc();
    const BW = mockBrowserWindow();
    let items = { eggAve: 2 };
    let nests = [];
    const currentPet = { items: {}, petId: '000001' };
    setupNestHandlers({
      getCurrentPet: () => currentPet,
      getItems: () => items,
      setItems: v => { items = v; },
      getNestCount: () => 3,
      getNestsData: () => nests,
      setNestsData: v => { nests = v; },
      generateRarity: () => 'Raro',
      generatePetFromEgg: () => ({ name: 'Novo', petId: '000002' }),
      petManager: { createPet: async d => d },
      broadcastPenUpdate: () => {},
      getHatchWindow: () => null,
      ipcMain: ipc,
      BrowserWindow: BW
    });
    await ipc.emit('place-egg-in-nest', 'eggAve');
    assert.strictEqual(items.eggAve, 1, 'egg count should decrement');
    assert.strictEqual(nests.length, 1, 'nest added');
    assert.ok(BW._sends.some(s => s.ch === 'nests-data-updated'), 'broadcast nests update');
  });

  it('place-egg-in-nest should block when capacity reached', async () => {
    const ipc = mockIpc();
    const BW = mockBrowserWindow();
    let items = { eggAve: 1 };
    let nests = [{}, {}, {}];
    const currentPet = { items: {}, petId: '000001' };
    setupNestHandlers({
      getCurrentPet: () => currentPet,
      getItems: () => items,
      setItems: v => { items = v; },
      getNestCount: () => 3,
      getNestsData: () => nests,
      setNestsData: v => { nests = v; },
      generateRarity: () => 'Comum',
      generatePetFromEgg: () => ({ name: 'Novo', petId: '000002' }),
      petManager: { createPet: async d => d },
      broadcastPenUpdate: () => {},
      getHatchWindow: () => null,
      ipcMain: ipc,
      BrowserWindow: BW
    });
    await ipc.emit('place-egg-in-nest', 'eggAve');
    assert.strictEqual(items.eggAve, 1, 'egg should remain');
    assert.strictEqual(nests.length, 3, 'no new nest');
  });

  it('hatch-egg should remove nest and create pet', async () => {
    const ipc = mockIpc();
    const BW = mockBrowserWindow();
    let items = { eggAve: 0 };
    let nests = [{ eggId: 'eggAve', start: Date.now(), rarity: 'Raro' }];
    const currentPet = { items: {}, petId: '000001' };
    let createdPetId = null;
    setupNestHandlers({
      getCurrentPet: () => currentPet,
      getItems: () => items,
      setItems: v => { items = v; },
      getNestCount: () => 3,
      getNestsData: () => nests,
      setNestsData: v => { nests = v; },
      generateRarity: () => 'Raro',
      generatePetFromEgg: () => ({ name: 'Novo', petId: '000099' }),
      petManager: { createPet: async d => { createdPetId = d.petId; return d; } },
      broadcastPenUpdate: () => {},
      getHatchWindow: () => null,
      ipcMain: ipc,
      BrowserWindow: BW
    });
    await ipc.emit('hatch-egg', 0);
    assert.strictEqual(nests.length, 0, 'nest removed');
    assert.strictEqual(createdPetId, '000099', 'pet created');
    assert.ok(BW._sends.some(s => s.ch === 'pet-created'), 'broadcast pet-created');
  });
});
