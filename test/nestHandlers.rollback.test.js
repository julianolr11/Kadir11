const assert = require('assert');
const { setupNestHandlers } = require('../scripts/handlers/nestHandlers');

function mockIpc() {
  const h = {};
  return {
    on: (c, f) => (h[c] = f),
    emit: async (c, ...a) => h[c] && h[c]({}, { ...a }[0], ...a),
    _h: h,
  };
}
function mockBrowserWindow() {
  return { getAllWindows: () => [{ webContents: { send() {} } }] };
}

describe('nestHandlers rollback', () => {
  it('re-adds egg if createPet fails', async () => {
    const ipc = mockIpc();
    const BW = mockBrowserWindow();
    let nests = [{ eggId: 'eggAve', start: Date.now(), rarity: 'Raro' }];
    setupNestHandlers({
      getCurrentPet: () => ({}),
      getItems: () => ({}),
      setItems: () => {},
      getNestCount: () => 3,
      getNestsData: () => nests,
      setNestsData: (v) => {
        nests = v;
      },
      generateRarity: () => 'Raro',
      generatePetFromEgg: () => ({ name: 'Novo', petId: '999999' }),
      petManager: {
        createPet: async () => {
          throw new Error('fail');
        },
      },
      broadcastPenUpdate: () => {},
      getHatchWindow: () => null,
      ipcMain: ipc,
      BrowserWindow: BW,
    });
    await ipc.emit('hatch-egg', 0);
    assert.strictEqual(nests.length, 1, 'egg re-added after failure');
    assert.strictEqual(nests[0].eggId, 'eggAve');
  });

  it('logs invalid index without altering nests', async () => {
    const ipc = mockIpc();
    const BW = mockBrowserWindow();
    let nests = [];
    setupNestHandlers({
      getCurrentPet: () => ({}),
      getItems: () => ({}),
      setItems: () => {},
      getNestCount: () => 3,
      getNestsData: () => nests,
      setNestsData: (v) => {
        nests = v;
      },
      generateRarity: () => 'Comum',
      generatePetFromEgg: () => ({ name: 'X', petId: '1' }),
      petManager: { createPet: async (d) => d },
      broadcastPenUpdate: () => {},
      getHatchWindow: () => null,
      ipcMain: ipc,
      BrowserWindow: BW,
    });
    await ipc.emit('hatch-egg', 5);
    assert.strictEqual(nests.length, 0, 'nests unchanged');
  });
});
