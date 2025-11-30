const assert = require('assert');
const { setupNestHandlers } = require('../scripts/handlers/nestHandlers');

function makeIpc() {
  const h = {};
  return {
    on: (c, f) => (h[c] = f),
    emit: (c, ...a) => (h[c] ? h[c]({}, ...a) : undefined),
    _h: h,
  };
}

describe('nestHandlers additional branches', () => {
  it('place-egg-in-nest with empty windows array', () => {
    const ipc = makeIpc();
    const pet = { name: 'Pet', petId: '1', items: { eggAve: 2 } };
    const opts = {
      ipcMain: ipc,
      getCurrentPet: () => pet,
      getItems: () => pet.items,
      setItems: (it) => (pet.items = it),
      getNestCount: () => 5,
      getNestsData: () => [],
      setNestsData: () => {},
      generateRarity: () => 'Comum',
      petManager: {},
      broadcastPenUpdate: () => {},
      getHatchWindow: () => null,
      generatePetFromEgg: () => ({ name: 'Novo', petId: 'X' }),
      BrowserWindow: { getAllWindows: () => [] },
    };
    setupNestHandlers(opts);
    ipc.emit('place-egg-in-nest', 'eggAve');
    assert.strictEqual(pet.items.eggAve, 1);
  });
  it('hatch-egg with empty windows array still re-adds on error', async () => {
    const ipc = makeIpc();
    const nests = [{ eggId: 'eggAve', rarity: 'Raro' }];
    const opts = {
      ipcMain: ipc,
      getCurrentPet: () => ({}),
      getItems: () => ({}),
      setItems: () => {},
      getNestCount: () => 5,
      getNestsData: () => nests,
      // Avoid destructive self-clear when handler passes same reference.
      setNestsData: (n) => {
        if (n === nests) return;
        nests.length = 0;
        n.forEach((x) => nests.push(x));
      },
      generateRarity: () => 'Comum',
      generatePetFromEgg: () => ({ name: 'Falha' }),
      petManager: {
        createPet: async () => {
          throw new Error('fail');
        },
      },
      broadcastPenUpdate: () => {},
      getHatchWindow: () => null,
      BrowserWindow: { getAllWindows: () => [] },
    };
    setupNestHandlers(opts);
    await ipc.emit('hatch-egg', 0); // await async handler promise
    assert.strictEqual(nests.length, 1);
  });
});
