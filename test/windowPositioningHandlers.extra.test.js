const assert = require('assert');
const { setupWindowPositioningHandlers } = require('../scripts/handlers/windowPositioningHandlers');

describe('windowPositioningHandlers extra branches', () => {
  function build(opts) {
    const handlers = {};
    const ipcMain = { on: (evt, cb) => { handlers[evt] = cb; } };
    const wins = [];
    const BrowserWindow = {
      getAllWindows: () => wins
    };
    const storeWindow = {
      getBounds: () => ({ width: 300, height: 200 }),
      setPosition: () => {},
      getTitle: () => 'Store',
      webContents: {
        on: () => {},
        send: () => {},
      }
    };
    const itemsWindow = {
      getBounds: () => ({ width: 250, height: 180 }),
      setPosition: () => {},
      getTitle: () => 'Items',
      webContents: {
        on: () => {},
        send: () => {},
      }
    };
    const screen = opts.screen || { getPrimaryDisplay: () => ({ workAreaSize: { width: 1200, height: 800 } }) };
    const state = { pet: { name: 'PetX', items: {}, coins: 0 } };
    setupWindowPositioningHandlers({
      createItemsWindow: opts.createItemsWindow,
      createStoreWindow: opts.createStoreWindow,
      getStoreWindow: () => storeWindow,
      getItemsWindow: () => itemsWindow,
      getCurrentPet: () => opts.hasPet ? state.pet : null,
      getCoins: () => 15,
      getItems: () => ({ a: 1 }),
      ipcMain,
      BrowserWindow,
      screen
    });
    return { handlers, wins, storeWindow, itemsWindow };
  }

  it('handles missing pet for store-pet', () => {
    const { handlers } = build({ hasPet: false, createStoreWindow: () => ({ webContents: { on: () => {} } }) });
    handlers['store-pet']({}, {}); // should early return without throwing
  });

  it('handles failed items window creation', () => {
    const { handlers } = build({ hasPet: true, createItemsWindow: () => null });
    handlers['itens-pet']({}, {}); // early return path
  });

  it('catches alignment error for items window', () => {
    const errScreen = { getPrimaryDisplay: () => { throw new Error('screen fail'); } };
    const { handlers } = build({
      hasPet: true,
      createItemsWindow: () => ({ webContents: { on: () => {} } }),
      screen: errScreen
    });
    handlers['itens-pet']({}, { fromStore: true });
  });

  it('catches alignment error for store window', () => {
    const errScreen = { getPrimaryDisplay: () => { throw new Error('screen fail'); } };
    const { handlers } = build({
      hasPet: true,
      createStoreWindow: () => ({ webContents: { on: () => {} } }),
      screen: errScreen
    });
    handlers['store-pet']({}, { fromItems: true });
  });

  it('invokes did-finish-load callbacks for items and store windows', () => {
    let itemsLoadCb, storeLoadCb;
    const createItemsWindow = () => ({
      webContents: { on: (evt, cb) => { if (evt === 'did-finish-load') itemsLoadCb = cb; }, send: () => {} }
    });
    const createStoreWindow = () => ({
      webContents: { on: (evt, cb) => { if (evt === 'did-finish-load') storeLoadCb = cb; }, send: () => {} }
    });
    const { handlers } = build({ hasPet: true, createItemsWindow, createStoreWindow });
    handlers['itens-pet']({}, {});
    handlers['store-pet']({}, {});
    // Execute callbacks to cover lines inside
    if (itemsLoadCb) itemsLoadCb();
    if (storeLoadCb) storeLoadCb();
  });
});
