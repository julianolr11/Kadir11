// Centraliza acesso ao store e funções relacionadas a economia, ninho e cercado
// Fase 3 Refactor
const { BrowserWindow } = require('electron');

const penLimits = { small: 3, medium: 6, large: 10 };

function createStoreState(store) {
  function getCoins() {
    return store.get('coins', 20);
  }
  function setCoins(v) {
    store.set('coins', v);
  }
  function getItems() {
    return store.get('items', {});
  }
  function setItems(v) {
    store.set('items', v);
  }
  function getDifficulty() {
    return store.get('difficulty', 1);
  }
  function setDifficulty(v) {
    store.set('difficulty', v);
  }
  function getPenInfo() {
    const size = store.get('penSize', 'small');
    return { size, maxPets: penLimits[size] || 3 };
  }
  function broadcastPenUpdate() {
    const info = getPenInfo();
    BrowserWindow.getAllWindows().forEach((w) => {
      if (w.webContents) w.webContents.send('pen-updated', info);
    });
  }
  function getNestCount() {
    return store.get('nestCount', 0);
  }
  function getNestPrice() {
    return 50 * Math.pow(2, getNestCount());
  }
  function getNestsData() {
    return store.get('nestsData', []);
  }
  function setNestsData(data) {
    store.set('nestsData', data);
  }
  function broadcastNestUpdate() {
    const count = getNestCount();
    BrowserWindow.getAllWindows().forEach((w) => {
      if (w.webContents) w.webContents.send('nest-updated', count);
    });
  }
  return {
    getCoins,
    setCoins,
    getItems,
    setItems,
    getDifficulty,
    setDifficulty,
    getPenInfo,
    broadcastPenUpdate,
    getNestCount,
    getNestPrice,
    getNestsData,
    setNestsData,
    broadcastNestUpdate,
  };
}

module.exports = { createStoreState };
