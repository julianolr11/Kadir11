const assert = require('assert');
const { setupBattleMechanicsHandlers } = require('../scripts/handlers/battleMechanicsHandlers');

function mockIpc() {
  const handlers = {};
  return {
    on: (ch, fn) => {
      handlers[ch] = fn;
    },
    emit: async (ch, ...args) => {
      if (handlers[ch]) return handlers[ch]({}, ...args);
    },
    _handlers: handlers,
  };
}

function mockBrowserWindow() {
  const sends = [];
  const win = { webContents: { send: (ch, data) => sends.push({ ch, data }) } };
  return { getAllWindows: () => [win], _sends: sends };
}

describe('battleMechanicsHandlers', () => {
  it('use-move reduces energy and floors at 0', async () => {
    const ipc = mockIpc();
    const BW = mockBrowserWindow();
    const pet = { petId: '001', name: 'X', energy: 5 };
    let updatedEnergy = null;
    setupBattleMechanicsHandlers({
      getCurrentPet: () => pet,
      petManager: {
        updatePet: async (_, data) => {
          updatedEnergy = data.energy;
        },
      },
      ipcMain: ipc,
      BrowserWindow: BW,
    });
    await ipc.emit('use-move', { name: 'Golpe', cost: 3 });
    assert.strictEqual(pet.energy, 2);
    assert.strictEqual(updatedEnergy, 2);
    await ipc.emit('use-move', { name: 'Exausto', cost: 10 });
    assert.strictEqual(pet.energy, 0);
    assert.ok(BW._sends.some((s) => s.ch === 'pet-data'));
  });

  it('use-bravura reduces bravura and floors at 0', async () => {
    const ipc = mockIpc();
    const BW = mockBrowserWindow();
    const pet = { petId: '002', name: 'Y', bravura: 2 };
    let updatedBravura = null;
    setupBattleMechanicsHandlers({
      getCurrentPet: () => pet,
      petManager: {
        updatePet: async (_, data) => {
          updatedBravura = data.bravura;
        },
      },
      ipcMain: ipc,
      BrowserWindow: BW,
    });
    await ipc.emit('use-bravura', 1);
    assert.strictEqual(pet.bravura, 1);
    assert.strictEqual(updatedBravura, 1);
    await ipc.emit('use-bravura', 5);
    assert.strictEqual(pet.bravura, 0);
  });

  it('update-health applies clamp and broadcasts', async () => {
    // isolate by using fresh ipc & pet only for this test
    const ipc = mockIpc();
    const BW = mockBrowserWindow();
    const pet = { petId: '003', name: 'Z', currentHealth: 10, maxHealth: 50 };
    let updatedHealth = null;
    setupBattleMechanicsHandlers({
      getCurrentPet: () => pet,
      petManager: {
        updatePet: async (_, data) => {
          updatedHealth = data.currentHealth;
        },
      },
      ipcMain: ipc,
      BrowserWindow: BW,
    });
    await ipc.emit('update-health', 40);
    assert.strictEqual(updatedHealth, 40);
    assert.strictEqual(pet.currentHealth, 40);
    await ipc.emit('update-health', -10);
    assert.strictEqual(updatedHealth, 0);
    assert.strictEqual(pet.currentHealth, 0);
  });
});
