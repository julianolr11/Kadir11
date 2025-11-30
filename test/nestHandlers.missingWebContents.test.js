const assert = require('assert');
const path = require('path');

// Minimal re-import of handler setup
const { setupNestHandlers } = require('../scripts/handlers/nestHandlers');

function makeIpc() {
  const h = {};
  return {
    on: (c, f) => (h[c] = f),
    emit: (c, ...a) => (h[c] ? h[c]({}, ...a) : undefined),
    _h: h,
  };
}

// This test targets the branch where getHatchWindow returns an object without webContents.
// The handler should skip sending loading events but still proceed with hatching logic.

describe('nestHandlers hatch-egg without webContents window branch', () => {
  it('skips loading events yet hatches successfully', async () => {
    const ipc = makeIpc();
    const nests = [{ id: 1, egg: 'eggAve' }];
    let createdPet = null;
    const opts = {
      ipcMain: ipc,
      getNestsData: () => nests,
      setNestsData: (d) => {
        nests.splice(0, nests.length, ...d);
      },
      getHatchWindow: () => ({
        /* missing webContents simulates branch */
      }),
      generatePetFromEgg: () => ({
        id: 'temp',
        specie: 'Pidgly',
        race: 'Pidgly',
        element: 'terra',
      }),
      petManager: {
        createPet: async (pet) => {
          createdPet = { ...pet, petId: '000099' };
          return createdPet;
        },
      },
      broadcastPenUpdate: () => {},
      BrowserWindow: { getAllWindows: () => [] },
      sendToAllWindows: () => {},
      logger: { debug: () => {} },
    };
    setupNestHandlers(opts);
    await ipc.emit('hatch-egg', 0);
    assert.strictEqual(nests.length, 0, 'Egg should be removed after successful hatch');
    assert.ok(createdPet && createdPet.specie === 'Pidgly', 'Pet should be created');
  });
});
