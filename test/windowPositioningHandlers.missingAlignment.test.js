const { setupWindowPositioningHandlers } = require('../scripts/handlers/windowPositioningHandlers');

function mockIpc(){ const h={}; return { on:(c,f)=>h[c]=f, emit:(c,...a)=>h[c]&&h[c]({},...a) }; }
function BWEmpty(){ return { getAllWindows: () => [] }; }

describe('windowPositioningHandlers missing alignment counterpart branches', () => {
  it('fromItems true but itemsWindow missing skips alignment', () => {
    const ipc = mockIpc();
    setupWindowPositioningHandlers({
      createStoreWindow: () => ({ webContents:{ on:()=>{} } }),
      getItemsWindow: () => null,
      getStoreWindow: () => null,
      createItemsWindow: () => ({ webContents:{ on:()=>{} } }),
      getCurrentPet: () => ({ name:'PetX', coins:0, items:{} }),
      getCoins: () => 0,
      getItems: () => ({}),
      ipcMain: ipc,
      BrowserWindow: BWEmpty(),
      screen: { getPrimaryDisplay: () => ({ workAreaSize:{ width:800, height:600 } }) }
    });
    ipc.emit('store-pet',{ fromItems:true });
  });
  it('fromStore true but storeWindow missing skips alignment', () => {
    const ipc = mockIpc();
    setupWindowPositioningHandlers({
      createItemsWindow: () => ({ webContents:{ on:()=>{} } }),
      createStoreWindow: () => ({ webContents:{ on:()=>{} } }),
      getStoreWindow: () => null,
      getItemsWindow: () => null,
      getCurrentPet: () => ({ name:'PetY', coins:0, items:{} }),
      getCoins: () => 0,
      getItems: () => ({}),
      ipcMain: ipc,
      BrowserWindow: BWEmpty(),
      screen: { getPrimaryDisplay: () => ({ workAreaSize:{ width:1024, height:768 } }) }
    });
    ipc.emit('itens-pet',{ fromStore:true });
  });
});
