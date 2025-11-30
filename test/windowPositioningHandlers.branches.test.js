const assert = require('assert');
const { setupWindowPositioningHandlers } = require('../scripts/handlers/windowPositioningHandlers');

function mockIpc(){ const h={}; return { on:(c,f)=>h[c]=f, emit:async(c,...a)=> h[c] && h[c]({},...a), _h:h }; }
function makeWindow(title,bounds={x:0,y:0,width:250,height:150}){return { _title:title,_bounds:{...bounds},_pos:{x:bounds.x,y:bounds.y}, webContents:{ send(){}, on(){}, once(){} }, getTitle(){return this._title;}, getBounds(){return this._bounds;}, setPosition(x,y){this._pos.x=x; this._pos.y=y;}, setSize(w,h){this._bounds.width=w; this._bounds.height=h;} };}

describe('windowPositioningHandlers branches', () => {
  it('handles missing pet for itens-pet', async () => {
    const ipc = mockIpc();
    setupWindowPositioningHandlers({
      createItemsWindow: () => makeWindow('Items'),
      getStoreWindow: () => null,
      getItemsWindow: () => null,
      getCurrentPet: () => null, // triggers error branch
      getCoins: () => 0,
      getItems: () => ({}),
      ipcMain: ipc,
      BrowserWindow: { getAllWindows: () => [] },
      screen: { getPrimaryDisplay: () => ({ workAreaSize:{ width:1000, height:800 } }) }
    });
    await ipc.emit('itens-pet', {}); // should early return without throwing
  });

  it('store-pet alignment fromItems', async () => {
    const ipc = mockIpc();
    const itemsWin = makeWindow('Items');
    const storeWin = makeWindow('Store');
    setupWindowPositioningHandlers({
      createItemsWindow: () => itemsWin,
      createStoreWindow: () => storeWin,
      getStoreWindow: () => storeWin,
      getItemsWindow: () => itemsWin,
      getCurrentPet: () => ({ name:'PetY' }),
      getCoins: () => 5,
      getItems: () => ({}),
      ipcMain: ipc,
      BrowserWindow: { getAllWindows: () => [itemsWin, storeWin] },
      screen: { getPrimaryDisplay: () => ({ workAreaSize:{ width:1200, height:900 } }) }
    });
    await ipc.emit('store-pet', { fromItems: true });
    // After alignment, positions should differ (side by side)
    assert.notStrictEqual(itemsWin._pos.x, storeWin._pos.x, 'windows positioned side by side');
  });

  it('resize journey and lair windows', async () => {
    const ipc = mockIpc();
    const journeyWin = makeWindow('Journey Mode', { width:200, height:100 });
    const lairWin = makeWindow('Lair Room', { width:200, height:100 });
    setupWindowPositioningHandlers({
      createItemsWindow: () => null,
      createStoreWindow: () => null,
      getStoreWindow: () => null,
      getItemsWindow: () => null,
      getCurrentPet: () => ({ name:'P' }),
      getCoins: () => 0,
      getItems: () => ({}),
      ipcMain: ipc,
      BrowserWindow: { getAllWindows: () => [journeyWin, lairWin] },
      screen: { getPrimaryDisplay: () => ({ workAreaSize:{ width:1400, height:1000 } }) }
    });
    await ipc.emit('resize-journey-window', { width: 500, height: 300 });
    await ipc.emit('resize-lair-window', { width: 450, height: 280 });
    assert.strictEqual(journeyWin.getBounds().width, 500);
    assert.strictEqual(lairWin.getBounds().width, 450);
  });

  it('handles failed createStoreWindow returning null', async () => {
    const ipc = mockIpc();
    setupWindowPositioningHandlers({
      createItemsWindow: () => null,
      createStoreWindow: () => null,
      getStoreWindow: () => null,
      getItemsWindow: () => null,
      getCurrentPet: () => ({ name:'Pet' }),
      getCoins: () => 0,
      getItems: () => ({}),
      ipcMain: ipc,
      BrowserWindow: { getAllWindows: () => [] },
      screen: { getPrimaryDisplay: () => ({ workAreaSize:{ width:800, height:600 } }) }
    });
    await ipc.emit('store-pet', {}); // just ensure no throw
  });
});
