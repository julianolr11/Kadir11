const assert = require('assert');
const { setupWindowPositioningHandlers } = require('../scripts/handlers/windowPositioningHandlers');

function makeIpc(){ const h={}; return { on:(c,f)=>h[c]=f, emit:(c,...a)=>h[c]&&h[c]({},...a) }; }

function stubWin(title){
  return {
    _title:title,
    getTitle(){ return this._title; },
    getBounds(){ return { width:200, height:200 }; },
    setPosition:()=>{},
    setSize:()=>{},
    webContents:{ send:()=>{}, on:()=>{} }
  };
}

describe('windowPositioningHandlers extra branches', () => {
  it('skips alignment when openOptions undefined (items)', () => {
    const ipc = makeIpc();
    const currentPet={ name:'P' };
    setupWindowPositioningHandlers({
      ipcMain:ipc,
      getCurrentPet:()=>currentPet,
      createItemsWindow:()=>({ webContents:{ on:()=>{}, send:()=>{} } }),
      createStoreWindow:()=>null,
      getStoreWindow:()=>null,
      getItemsWindow:()=>null,
      getCoins:()=>0,
      getItems:()=>({}),
      BrowserWindow:{ getAllWindows:()=>[] }
    });
    ipc.emit('itens-pet'); // no openOptions
  });
  it('skips alignment when openOptions undefined (store)', () => {
    const ipc = makeIpc();
    const currentPet={ name:'P' };
    setupWindowPositioningHandlers({
      ipcMain:ipc,
      getCurrentPet:()=>currentPet,
      createStoreWindow:()=>({ webContents:{ on:()=>{}, send:()=>{} } }),
      createItemsWindow:()=>null,
      getItemsWindow:()=>null,
      getStoreWindow:()=>null,
      getItems:()=>({}),
      BrowserWindow:{ getAllWindows:()=>[] }
    });
    ipc.emit('store-pet');
  });
  it('resize journey/window false branches with invalid size and no matching windows', () => {
    const ipc = makeIpc();
    setupWindowPositioningHandlers({
      ipcMain:ipc,
      createItemsWindow:()=>null,
      createStoreWindow:()=>null,
      getCurrentPet:()=>({ name:'X' }),
      getItems:()=>({}),
      getCoins:()=>0,
      getItemsWindow:()=>null,
      getStoreWindow:()=>null,
      BrowserWindow:{ getAllWindows:()=>[stubWin('Other')] }
    });
    ipc.emit('resize-journey-window');
    ipc.emit('resize-journey-window',{});
    ipc.emit('resize-pen-window');
    ipc.emit('resize-pen-window',{ width:100 });
    ipc.emit('resize-lair-window');
    ipc.emit('resize-lair-window',{ height:50 });
  });
});
