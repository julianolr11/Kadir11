// Fase 3 Refactor: Centraliza criação e acesso às janelas do jogo
const { BrowserWindow } = require('electron');
const path = require('path');

function initGameWindows({ windowManager }) {
  // Referências internas
  let battleModeWindow = null;
  let journeyModeWindow = null;
  let lairModeWindow = null;
  let trainWindow = null;
  let trainMenuWindow = null;
  let trainAttributesWindow = null;
  let trainForceWindow = null;
  let trainDefenseWindow = null;
  let itemsWindow = null;
  let storeWindow = null;
  let journeySceneWindow = null;
  let nestsWindow = null;
  let hatchWindow = null;

  function preloadPath() {
    return path.join(__dirname, '..', '..', 'preload.js');
  }

  function createBattleModeWindow() {
    if (battleModeWindow) {
      battleModeWindow.show();
      battleModeWindow.focus();
      return battleModeWindow;
    }
    battleModeWindow = new BrowserWindow({
      width: 850,
      height: 450,
      frame: false,
      transparent: true,
      resizable: false,
      show: false,
      webPreferences: { preload: preloadPath(), nodeIntegration: false, contextIsolation: true },
    });
    battleModeWindow.loadFile(path.join('views', 'game', 'battle-mode.html'));
    windowManager.attachFadeHandlers(battleModeWindow);
    battleModeWindow.on('closed', () => {
      battleModeWindow = null;
    });
    return battleModeWindow;
  }

  function createJourneyModeWindow() {
    if (journeyModeWindow) {
      journeyModeWindow.show();
      journeyModeWindow.focus();
      return journeyModeWindow;
    }
    journeyModeWindow = new BrowserWindow({
      width: 1100,
      height: 700,
      frame: false,
      transparent: true,
      resizable: false,
      show: false,
      webPreferences: { preload: preloadPath(), nodeIntegration: false, contextIsolation: true },
    });
    journeyModeWindow.loadFile(path.join('views', 'game', 'journey-mode.html'));
    windowManager.attachFadeHandlers(journeyModeWindow);
    journeyModeWindow.on('closed', () => {
      journeyModeWindow = null;
    });
    return journeyModeWindow;
  }

  function createLairModeWindow() {
    if (lairModeWindow) {
      lairModeWindow.show();
      lairModeWindow.focus();
      return lairModeWindow;
    }
    lairModeWindow = new BrowserWindow({
      width: 1050,
      height: 880,
      frame: false,
      transparent: true,
      resizable: false,
      show: false,
      webPreferences: { preload: preloadPath(), nodeIntegration: false, contextIsolation: true },
    });
    lairModeWindow.loadFile(path.join('views', 'game', 'lair-mode.html'));
    windowManager.attachFadeHandlers(lairModeWindow);
    lairModeWindow.on('closed', () => {
      lairModeWindow = null;
    });
    return lairModeWindow;
  }

  function createJourneySceneWindow() {
    if (journeySceneWindow) {
      journeySceneWindow.show();
      journeySceneWindow.focus();
      return journeySceneWindow;
    }
    journeySceneWindow = new BrowserWindow({
      width: 1280,
      height: 800,
      frame: false,
      transparent: true,
      resizable: false,
      show: false,
      webPreferences: { preload: preloadPath(), nodeIntegration: false, contextIsolation: true },
    });
    journeySceneWindow.loadFile(path.join('views', 'game', 'journey-scene.html'));
    windowManager.attachFadeHandlers(journeySceneWindow);
    journeySceneWindow.on('closed', () => {
      journeySceneWindow = null;
    });
    return journeySceneWindow;
  }

  function createTrainWindow(options = {}) {
    const { centerOnShow = true, onReadyToShow } = options;
    if (trainWindow) {
      trainWindow.show();
      trainWindow.focus();
      return trainWindow;
    }
    trainWindow = new BrowserWindow({
      width: 800,
      height: 500,
      frame: false,
      transparent: true,
      resizable: false,
      show: false,
      webPreferences: { preload: preloadPath(), nodeIntegration: false, contextIsolation: true },
    });
    trainWindow.loadFile(path.join('views', 'game', 'train.html'));
    if (centerOnShow) {
      trainWindow.once('ready-to-show', () => windowManager.centerWindow(trainWindow));
    }
    if (typeof onReadyToShow === 'function') {
      trainWindow.once('ready-to-show', () => onReadyToShow(trainWindow));
    }
    windowManager.attachFadeHandlers(trainWindow);
    trainWindow.on('closed', () => {
      trainWindow = null;
      if (windowManager.statusWindow) windowManager.centerWindow(windowManager.statusWindow);
    });
    return trainWindow;
  }

  function createTrainMenuWindow() {
    if (trainMenuWindow) {
      trainMenuWindow.show();
      trainMenuWindow.focus();
      return trainMenuWindow;
    }
    trainMenuWindow = new BrowserWindow({
      width: 300,
      height: 180,
      frame: false,
      transparent: true,
      resizable: false,
      show: false,
      webPreferences: { preload: preloadPath(), nodeIntegration: false, contextIsolation: true },
    });
    trainMenuWindow.loadFile(path.join('views', 'game', 'train-menu.html'));
    windowManager.attachFadeHandlers(trainMenuWindow);
    trainMenuWindow.on('closed', () => {
      trainMenuWindow = null;
    });
    return trainMenuWindow;
  }

  function createTrainAttributesWindow() {
    if (trainAttributesWindow) {
      trainAttributesWindow.show();
      trainAttributesWindow.focus();
      return trainAttributesWindow;
    }
    trainAttributesWindow = new BrowserWindow({
      width: 300,
      height: 250,
      frame: false,
      transparent: true,
      resizable: false,
      show: false,
      webPreferences: { preload: preloadPath(), nodeIntegration: false, contextIsolation: true },
    });
    trainAttributesWindow.loadFile(path.join('views', 'game', 'train-attributes.html'));
    windowManager.attachFadeHandlers(trainAttributesWindow);
    trainAttributesWindow.on('closed', () => {
      trainAttributesWindow = null;
    });
    return trainAttributesWindow;
  }

  function createTrainForceWindow() {
    if (trainForceWindow) {
      trainForceWindow.show();
      trainForceWindow.focus();
      return trainForceWindow;
    }
    trainForceWindow = new BrowserWindow({
      width: 1074,
      height: 715,
      frame: false,
      transparent: true,
      resizable: false,
      show: false,
      webPreferences: { preload: preloadPath(), nodeIntegration: false, contextIsolation: true },
    });
    trainForceWindow.loadFile(path.join('views', 'game', 'train-force.html'));
    windowManager.attachFadeHandlers(trainForceWindow);
    trainForceWindow.on('closed', () => {
      trainForceWindow = null;
    });
    return trainForceWindow;
  }

  function createTrainDefenseWindow() {
    if (trainDefenseWindow) {
      trainDefenseWindow.show();
      trainDefenseWindow.focus();
      return trainDefenseWindow;
    }
    trainDefenseWindow = new BrowserWindow({
      width: 1074,
      height: 715,
      frame: false,
      transparent: true,
      resizable: false,
      show: false,
      webPreferences: { preload: preloadPath(), nodeIntegration: false, contextIsolation: true },
    });
    trainDefenseWindow.loadFile(path.join('views', 'game', 'train-defense.html'));
    windowManager.attachFadeHandlers(trainDefenseWindow);
    trainDefenseWindow.on('closed', () => {
      trainDefenseWindow = null;
    });
    return trainDefenseWindow;
  }

  function createItemsWindow() {
    if (itemsWindow) {
      itemsWindow.show();
      itemsWindow.focus();
      // Reposicionar se store estiver aberta
      if (storeWindow && !storeWindow.isDestroyed()) {
        windowManager.centerWindowsSideBySide(itemsWindow, storeWindow);
      }
      return itemsWindow;
    }
    itemsWindow = new BrowserWindow({
      width: 450,
      height: 500,
      frame: false,
      transparent: true,
      resizable: false,
      show: false,
      webPreferences: { preload: preloadPath(), nodeIntegration: false, contextIsolation: true },
    });
    itemsWindow.loadFile(path.join('views', 'management', 'items.html'));
    windowManager.attachFadeHandlers(itemsWindow);
    itemsWindow.on('closed', () => {
      itemsWindow = null;
      if (storeWindow) windowManager.centerWindow(storeWindow);
    });
    return itemsWindow;
  }

  function createStoreWindow() {
    if (storeWindow) {
      storeWindow.show();
      storeWindow.focus();
      // Reposicionar se items estiver aberta
      if (itemsWindow && !itemsWindow.isDestroyed()) {
        windowManager.centerWindowsSideBySide(itemsWindow, storeWindow);
      }
      return storeWindow;
    }
    storeWindow = new BrowserWindow({
      width: 600,
      height: 500,
      frame: false,
      transparent: true,
      resizable: false,
      show: false,
      webPreferences: { preload: preloadPath(), nodeIntegration: false, contextIsolation: true },
    });
    storeWindow.loadFile(path.join('views', 'management', 'store.html'));
    windowManager.attachFadeHandlers(storeWindow);
    storeWindow.on('closed', () => {
      storeWindow = null;
      if (itemsWindow) windowManager.centerWindow(itemsWindow);
    });
    return storeWindow;
  }

  function createNestsWindow(getNestCount) {
    // Sempre criar janela (mesmo com 0 ninhos para mostrar link de compra)
    if (nestsWindow) {
      nestsWindow.show();
      nestsWindow.focus();
      return nestsWindow;
    }
    nestsWindow = new BrowserWindow({
      width: 300,
      height: 130,
      frame: false,
      transparent: true,
      resizable: false,
      show: false,
      webPreferences: { preload: preloadPath(), nodeIntegration: false, contextIsolation: true },
    });
    nestsWindow.loadFile(path.join('views', 'management', 'nests.html'));
    windowManager.attachFadeHandlers(nestsWindow);
    nestsWindow.on('closed', () => {
      nestsWindow = null;
    });
    updateNestsPosition();
    return nestsWindow;
  }

  function createHatchWindow() {
    if (hatchWindow) {
      hatchWindow.show();
      hatchWindow.focus();
      return hatchWindow;
    }
    hatchWindow = new BrowserWindow({
      width: 350,
      height: 400,
      frame: false,
      transparent: true,
      resizable: false,
      show: false,
      webPreferences: { preload: preloadPath(), nodeIntegration: false, contextIsolation: true },
    });
    hatchWindow.loadFile(path.join('views', 'setup', 'hatch.html'));
    windowManager.attachFadeHandlers(hatchWindow);
    hatchWindow.on('closed', () => {
      hatchWindow = null;
    });
    return hatchWindow;
  }

  function updateNestsPosition() {
    if (nestsWindow && windowManager.penWindow) {
      const bounds = windowManager.penWindow.getBounds();
      nestsWindow.setPosition(bounds.x, bounds.y + bounds.height);
    }
  }

  function closeNestsWindow() {
    if (nestsWindow && !nestsWindow.isDestroyed()) {
      nestsWindow.close();
    }
  }

  // Getters para uso em handlers externos
  const getStoreWindow = () => storeWindow;
  const getItemsWindow = () => itemsWindow;
  const getHatchWindow = () => hatchWindow;

  function closeAllGameWindows() {
    [
      battleModeWindow,
      journeyModeWindow,
      lairModeWindow,
      journeySceneWindow,
      trainMenuWindow,
      trainAttributesWindow,
      trainForceWindow,
      trainDefenseWindow,
      trainWindow,
      itemsWindow,
      storeWindow,
      nestsWindow,
      hatchWindow,
    ].forEach((w) => {
      if (w) w.close();
    });
  }

  return {
    createBattleModeWindow,
    createJourneyModeWindow,
    createJourneySceneWindow,
    createLairModeWindow,
    createTrainWindow,
    createTrainMenuWindow,
    createTrainAttributesWindow,
    createTrainForceWindow,
    createTrainDefenseWindow,
    createItemsWindow,
    createStoreWindow,
    createNestsWindow,
    createHatchWindow,
    updateNestsPosition,
    closeNestsWindow,
    getStoreWindow,
    getItemsWindow,
    getHatchWindow,
    closeAllGameWindows,
  };
}

module.exports = { initGameWindows };
