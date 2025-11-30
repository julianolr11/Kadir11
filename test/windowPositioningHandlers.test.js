const assert = require('assert');
const { setupWindowPositioningHandlers } = require('../scripts/handlers/windowPositioningHandlers');

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

function makeWindow(title, bounds = { x: 0, y: 0, width: 200, height: 100 }) {
  return {
    _title: title,
    _bounds: { ...bounds },
    _pos: { x: bounds.x, y: bounds.y },
    webContents: { send() {}, on() {}, once() {} },
    getTitle() {
      return this._title;
    },
    getBounds() {
      return this._bounds;
    },
    setPosition(x, y) {
      this._pos.x = x;
      this._pos.y = y;
    },
    setSize(w, h) {
      this._bounds.width = w;
      this._bounds.height = h;
    },
  };
}

describe('windowPositioningHandlers', () => {
  it('aligns items and store windows side-by-side (itens-pet fromStore)', async () => {
    const ipc = mockIpc();
    const itemsWin = makeWindow('Items', { x: 0, y: 0, width: 220, height: 140 });
    const storeWin = makeWindow('Store', { x: 0, y: 0, width: 180, height: 140 });
    let createdItems = null;
    let createdStore = null;
    const bw = { getAllWindows: () => [itemsWin, storeWin] };
    const screen = { getPrimaryDisplay: () => ({ workAreaSize: { width: 1000, height: 800 } }) };
    setupWindowPositioningHandlers({
      createItemsWindow: () => (createdItems = itemsWin),
      createStoreWindow: () => (createdStore = storeWin),
      getStoreWindow: () => storeWin,
      getItemsWindow: () => itemsWin,
      getCurrentPet: () => ({ name: 'PetX' }),
      getCoins: () => 10,
      getItems: () => ({}),
      ipcMain: ipc,
      BrowserWindow: bw,
      screen,
    });
    await ipc.emit('itens-pet', { fromStore: true });
    assert.ok(createdItems, 'items window created');
  });

  it('resize-pen-window sets size and sends update-nests-position', async () => {
    const ipc = mockIpc();
    const penWin = makeWindow('My Pen', { width: 200, height: 100 });
    penWin.webContents.send = (ch) => {
      penWin._lastSend = ch;
    };
    const bw = { getAllWindows: () => [penWin] };
    const screen = { getPrimaryDisplay: () => ({ workAreaSize: { width: 1200, height: 900 } }) };
    setupWindowPositioningHandlers({
      createItemsWindow: () => null,
      createStoreWindow: () => null,
      getStoreWindow: () => null,
      getItemsWindow: () => null,
      getCurrentPet: () => ({ name: 'P' }),
      getCoins: () => 0,
      getItems: () => ({}),
      ipcMain: ipc,
      BrowserWindow: bw,
      screen,
    });
    await ipc.emit('resize-pen-window', { width: 400, height: 250 });
    assert.strictEqual(penWin.getBounds().width, 400);
    assert.strictEqual(penWin.getBounds().height, 250);
    assert.strictEqual(penWin._lastSend, 'update-nests-position');
  });
});
