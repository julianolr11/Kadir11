const assert = require('assert');
const { setupBattleMechanicsHandlers } = require('../scripts/handlers/battleMechanicsHandlers');

function mockIpc() {
  const handlers = {}; return {
    on: (ch, fn) => { handlers[ch] = fn; },
    emit: async (ch, ...args) => { if (handlers[ch]) return handlers[ch]({}, ...args); },
    _handlers: handlers
  };
}
function mockBrowserWindow() { return { getAllWindows: () => [{ webContents: { send(){} } }] }; }

describe('battleMechanicsHandlers error branches', () => {
  it('rolls back energy on petManager failure', async () => {
    const ipc = mockIpc();
    const BW = mockBrowserWindow();
    const pet = { petId: '010', name: 'ErrPet', energy: 5 };
    setupBattleMechanicsHandlers({
      getCurrentPet: () => pet,
      petManager: { updatePet: async () => { throw new Error('fail'); } },
      ipcMain: ipc,
      BrowserWindow: BW
    });
    await ipc.emit('use-move', { name: 'Falha', cost: 3 });
    assert.strictEqual(pet.energy, 5, 'energy rolled back on error');
  });

  it('rolls back health on failure', async () => {
    const ipc = mockIpc();
    const BW = mockBrowserWindow();
    const pet = { petId: '011', name: 'ErrPetH', currentHealth: 10, maxHealth: 50 };
    setupBattleMechanicsHandlers({
      getCurrentPet: () => pet,
      petManager: { updatePet: async () => { throw new Error('fail'); } },
      ipcMain: ipc,
      BrowserWindow: BW
    });
    await ipc.emit('update-health', 40);
    assert.strictEqual(pet.currentHealth, 10, 'health rolled back');
  });

  it('rolls back bravura on failure', async () => {
    const ipc = mockIpc();
    const BW = mockBrowserWindow();
    const pet = { petId: '012', name: 'ErrPetB', bravura: 4 };
    setupBattleMechanicsHandlers({
      getCurrentPet: () => pet,
      petManager: { updatePet: async () => { throw new Error('fail'); } },
      ipcMain: ipc,
      BrowserWindow: BW
    });
    await ipc.emit('use-bravura', 3);
    assert.strictEqual(pet.bravura, 4, 'bravura rolled back');
  });
});
