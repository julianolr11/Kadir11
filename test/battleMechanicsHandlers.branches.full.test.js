const assert = require('assert');
const { setupBattleMechanicsHandlers } = require('../scripts/handlers/battleMechanicsHandlers');

function makeIpc(){
  const handlers = {};
  return {
    on:(ch,fn)=>{handlers[ch]=fn;},
    emit:(ch,...args)=>handlers[ch]&&handlers[ch]({},...args),
    _handlers:handlers
  };
}

describe('battleMechanicsHandlers extra branch coverage', () => {
  it('handles energy fallback when undefined and empty windows array', async () => {
    const ipc = makeIpc();
    const pet = { petId:'P1', name:'SemEnergia', energy:undefined };
    const petManager = { updatePet: async()=>{} };
    const BrowserWindow = { getAllWindows: () => [] };
    setupBattleMechanicsHandlers({ ipcMain:ipc, getCurrentPet:()=>pet, petManager, BrowserWindow });
    ipc.emit('use-move',{ name:'Golpe', cost:2 });
    assert.strictEqual(pet.energy, 0); // 0 - 2 floored to 0 from undefined -> 0 then clamp
  });
  it('handles bravura fallback when undefined and windows only without webContents', async () => {
    const ipc = makeIpc();
    const pet = { petId:'P2', name:'SemBravura', bravura:undefined };
    const petManager = { updatePet: async()=>{} };
    const BrowserWindow = { getAllWindows: () => [{},{}] };
    setupBattleMechanicsHandlers({ ipcMain:ipc, getCurrentPet:()=>pet, petManager, BrowserWindow });
    ipc.emit('use-bravura',3);
    assert.strictEqual(pet.bravura,0);
  });
  it('clamps health when negative and when above max', async () => {
    const ipc = makeIpc();
    const pet = { petId:'P3', name:'Clamp', currentHealth:10, maxHealth:20 };
    const petManager = { updatePet: async()=>{} };
    const BrowserWindow = { getAllWindows: () => [{ webContents:{ send:()=>{} } }] };
    setupBattleMechanicsHandlers({ ipcMain:ipc, getCurrentPet:()=>pet, petManager, BrowserWindow });
    ipc.emit('update-health', -5); // clamp to 0
    assert.strictEqual(pet.currentHealth,0);
    ipc.emit('update-health', 999); // clamp to max 20
    assert.strictEqual(pet.currentHealth,20);
  });
});
