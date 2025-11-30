const assert = require('assert');
const { setupBattleMechanicsHandlers } = require('../scripts/handlers/battleMechanicsHandlers');

function mockIpc() {
  const h = {};
  return { on: (c, f) => (h[c] = f), emit: async (c, ...a) => h[c] && h[c]({}, ...a) };
}
function browserWindowWithMixed() {
  return { getAllWindows: () => [{ webContents: { send() {} } }, {}] };
}

describe('battleMechanicsHandlers additional branches', () => {
  it('handles move with undefined cost (cost fallback 0)', async () => {
    const ipc = mockIpc();
    const pet = { petId: 'A1', name: 'SemCusto', energy: 4 };
    setupBattleMechanicsHandlers({
      getCurrentPet: () => pet,
      petManager: { updatePet: async () => {} },
      ipcMain: ipc,
      BrowserWindow: browserWindowWithMixed(),
    });
    await ipc.emit('use-move', { name: 'Zero' }); // sem cost
    assert.strictEqual(pet.energy, 4, 'energy unchanged com cost 0');
  });
  it('bravura default amount (undefined) and mixed windows broadcasting', async () => {
    const ipc = mockIpc();
    const pet = { petId: 'A2', name: 'Brav', bravura: 2 };
    setupBattleMechanicsHandlers({
      getCurrentPet: () => pet,
      petManager: { updatePet: async () => {} },
      ipcMain: ipc,
      BrowserWindow: browserWindowWithMixed(),
    });
    await ipc.emit('use-bravura'); // amount undefined => cost 1
    assert.strictEqual(pet.bravura, 1);
  });
  it('health broadcast with window lacking webContents (false branch)', async () => {
    const ipc = mockIpc();
    const pet = { petId: 'A3', name: 'Vida', currentHealth: 5, maxHealth: 10 };
    setupBattleMechanicsHandlers({
      getCurrentPet: () => pet,
      petManager: { updatePet: async () => {} },
      ipcMain: ipc,
      BrowserWindow: browserWindowWithMixed(),
    });
    await ipc.emit('update-health', 7);
    assert.strictEqual(pet.currentHealth, 7);
  });
});
