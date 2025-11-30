const { setupNestHandlers } = require('../scripts/handlers/nestHandlers');
const assert = require('assert');

function mockIpc() {
  const h = {};
  return { on: (c, f) => (h[c] = f), emit: async (c, ...a) => h[c] && h[c]({}, ...a) };
}
function browserWindowMixed() {
  return { getAllWindows: () => [{ webContents: { send() {} } }, {}] };
}

describe('nestHandlers broadcast branches', () => {
  it('place-egg-in-nest broadcast skips window without webContents', async () => {
    const ipc = mockIpc();
    let items = { eggAve: 1 };
    let nests = [];
    const pet = { petId: 'P1', items: {} };
    setupNestHandlers({
      getCurrentPet: () => pet,
      getItems: () => items,
      setItems: (v) => (items = v),
      getNestCount: () => 3,
      getNestsData: () => nests,
      setNestsData: (v) => (nests = v),
      generateRarity: () => 'Comum',
      generatePetFromEgg: () => ({ name: 'Gerado', petId: 'X' }),
      petManager: { createPet: async (d) => d },
      broadcastPenUpdate: () => {},
      getHatchWindow: () => null,
      ipcMain: ipc,
      BrowserWindow: browserWindowMixed(),
    });
    await ipc.emit('place-egg-in-nest', 'eggAve');
    assert.strictEqual(nests.length, 1);
  });
});
