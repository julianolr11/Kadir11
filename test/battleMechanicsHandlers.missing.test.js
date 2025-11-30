const { setupBattleMechanicsHandlers } = require('../scripts/handlers/battleMechanicsHandlers');

function mockIpc(){ const h={}; return { on:(c,f)=>h[c]=f, emit:(c,...a)=>h[c]&&h[c]({},...a) }; }
function mockBrowserWindow(){ return { getAllWindows: () => [] }; }

describe('battleMechanicsHandlers missing pet/move early returns', () => {
  it('handles missing pet for use-move/update-health/use-bravura', async () => {
    const ipc = mockIpc();
    setupBattleMechanicsHandlers({ getCurrentPet: () => null, petManager:{ updatePet: async()=>{} }, ipcMain: ipc, BrowserWindow: mockBrowserWindow() });
    await ipc.emit('use-move', { name:'X', cost:1 });
    await ipc.emit('update-health', 10);
    await ipc.emit('use-bravura', 2);
  });
  it('handles missing move object', async () => {
    const ipc = mockIpc();
    const pet = { petId:'001', name:'P', energy:5, currentHealth:10, maxHealth:10, bravura:3 };
    setupBattleMechanicsHandlers({ getCurrentPet: () => pet, petManager:{ updatePet: async()=>{} }, ipcMain: ipc, BrowserWindow: mockBrowserWindow() });
    await ipc.emit('use-move', null); // should early return
  });
});
