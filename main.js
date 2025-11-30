const { app, ipcMain, globalShortcut, BrowserWindow } = require('electron');
const windowManager = require('./scripts/windowManager');
// Bootstrap unificado de handlers
const { registerAllHandlers } = require('./scripts/bootstrap/registerHandlers');
const petManager = require('./scripts/petManager');
const {
  getRequiredXpForNextLevel,
  calculateXpGain,
  increaseAttributesOnLevelUp,
} = require('./scripts/petExperience');
const appState = require('./scripts/managers/stateManager');
const { createStoreState } = require('./scripts/state/storeState');
const {
  initSpecies,
  generatePetFromEgg,
  generateRarity,
  getSpeciesData,
} = require('./scripts/logic/petGeneration');

// Bootstrap do electron-store isolado
let Store;
try {
  console.log('Inicializando electron-store (bootstrap)');
  Store = require('electron-store');
  if (typeof Store !== 'function') throw new Error('electron-store inválido');
} catch (err) {
  console.error('Falha ao inicializar electron-store:', err);
  throw err;
}
const store = new Store();
const state = createStoreState(store);

// currentPet agora gerenciado exclusivamente via stateManager (appState)
// Removido estado duplicado local
let journeyImagesCache = null;

// Inicializa módulo de janelas centralizado
const { initGameWindows } = require('./scripts/windows/gameWindows');
const {
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
  getStoreWindow,
  getItemsWindow,
  getHatchWindow,
  closeAllGameWindows,
  closeNestsWindow,
} = initGameWindows({ windowManager });

// Proxy para funções de estado (mantém assinatura para handlers existentes)
const {
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
} = state;

// Inicializar species (mantém side-effect anterior)
initSpecies(__dirname).catch((err) => console.error('Erro initSpecies:', err));

app.whenReady().then(() => {
  console.log('Aplicativo iniciado');
  petManager.cleanupOrphanPets().catch((err) => {
    console.error('Erro ao limpar pets órfãos:', err);
  });
  if (store.get('coins') === undefined) {
    store.set('coins', 20);
  }
  windowManager.createStartWindow();

  globalShortcut.register('Ctrl+Shift+D', () => {
    const focusedWindow = BrowserWindow.getFocusedWindow();
    if (focusedWindow && focusedWindow.webContents) {
      focusedWindow.webContents.toggleDevTools();
      console.log('DevTools aberto na janela ativa');
    } else {
      console.log('Nenhuma janela ativa encontrada para abrir o DevTools');
    }
  });

  // Bootstrap único dos handlers
  const journeyImagesCacheRef = { value: journeyImagesCache };
  registerAllHandlers({
    electron: { ipcMain, BrowserWindow },
    managers: { windowManager, appState, petManager },
    store: { store },
    stateAccessors: {
      getCoins,
      setCoins,
      getItems,
      setItems,
      getPenInfo,
      getNestCount,
      getNestPrice,
      getNestsData,
      setNestsData,
      broadcastPenUpdate,
      broadcastNestUpdate,
      getDifficulty,
      setDifficulty,
    },
    petGeneration: { generateRarity, generatePetFromEgg, getSpeciesData, baseDir: __dirname },
    cache: { journeyImagesCacheRef },
    windows: {
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
    },
    xp: { xpUtils: { calculateXpGain, getRequiredXpForNextLevel, increaseAttributesOnLevelUp } },
    handlers: require('./scripts/handlers/handlersIndex'),
  });
  journeyImagesCache = journeyImagesCacheRef.value;

  app.on('activate', () => {
    if (windowManager.getStartWindow() === null) {
      windowManager.createStartWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
  console.log('Atalhos globais desregistrados');
});

// Handler para obter o pet atual
ipcMain.handle('get-current-pet', async () => {
  const pet = appState.currentPet;
  if (pet) {
    pet.items = getItems();
    return pet;
  }
  return null;
});

// (movido para gameHandlers) ipcMain.on('train-pet' ... )

// (movido para windowPositioningHandlers) ipcMain.on('itens-pet' ... )

// (movido para windowPositioningHandlers) ipcMain.on('store-pet' ... )

// (movido para gameHandlers) ipcMain.on('battle-pet' ... )

// Funções de criação de janelas agora centralizadas em scripts/windows/gameWindows.js
// closeAllGameWindows exposto pelo módulo importado acima

// (movido para gameHandlers) ipcMain.on('open-battle-mode-window' ... )

// (movido para gameHandlers) ipcMain.on('open-journey-mode-window' ... )

// (movido para gameHandlers) ipcMain.on('open-lair-mode-window' ... )

// (movido para gameHandlers) ipcMain.on('open-journey-scene-window' ... )

// (movido para windowPositioningHandlers) ipcMain.on('resize-journey-window' ... )

// (movido para windowPositioningHandlers) ipcMain.on('resize-pen-window' ... )

// (movido para windowPositioningHandlers) ipcMain.on('resize-lair-window' ... )

// (movido para gameHandlers) ipcMain.on('open-train-menu-window' ... )

// (movido para gameHandlers) ipcMain.on('open-train-attributes-window' ... )

// (movido para gameHandlers) ipcMain.on('open-train-force-window' ... )

// (movido para gameHandlers) ipcMain.on('open-train-defense-window' ... )

// (duplicado / movido para storeHandlers) ipcMain.on('buy-item' ... )

// (movido para storeHandlers) ipcMain.on('unequip-item' ... )

// (movido para nestHandlers) ipcMain.on('place-egg-in-nest' ... )

// (movido para nestHandlers) ipcMain.on('hatch-egg' ... )

// (movido para battleMechanicsHandlers) ipcMain.on('use-move' ... )

// (movido para battleMechanicsHandlers) ipcMain.on('use-bravura' ... )

// (movido para battleMechanicsHandlers) ipcMain.on('update-health' ... )

// (movido para gameHandlers) ipcMain.on('increase-attribute' ... )

// (movido para petHandlers) ipcMain.on('kadirfull' ... )

// (movido para gameHandlers) ipcMain.on('reward-pet' ... )

// (movido para gameHandlers) ipcMain.on('journey-complete' ... )

// (movido para gameHandlers) ipcMain.on('battle-result' ... )

// (movido para movesHandlers) ipcMain.on('learn-move' ... )

// (movido para settingsHandlers) ipcMain.handle('get-pen-info', 'get-nest-count', 'get-nests-data', 'get-nest-price', 'get-difficulty', 'set-difficulty' ... )

// (movido para assetsHandlers) ipcMain.handle('get-species-info', 'get-journey-images' ... )

module.exports = { app, ipcMain, globalShortcut, windowManager, petManager };
