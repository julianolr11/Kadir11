const { app, ipcMain, globalShortcut, BrowserWindow, screen } = require('electron');
const windowManager = require('./scripts/windowManager');
const { registerWindowHandlers } = require('./scripts/handlers/windowHandlers');
const { registerPetHandlers } = require('./scripts/handlers/petHandlers');
const { registerStoreHandlers } = require('./scripts/handlers/storeHandlers');
const { registerGameHandlers } = require('./scripts/handlers/gameHandlers');
const { registerMovesHandlers } = require('./scripts/handlers/movesHandlers');
const { registerSettingsHandlers } = require('./scripts/handlers/settingsHandlers');
const { registerAssetsHandlers } = require('./scripts/handlers/assetsHandlers');
const { registerLifecycleHandlers } = require('./scripts/handlers/lifecycleHandlers');
const { setupWindowPositioningHandlers } = require('./scripts/handlers/windowPositioningHandlers');
const { setupNestHandlers } = require('./scripts/handlers/nestHandlers');
const { setupBattleMechanicsHandlers } = require('./scripts/handlers/battleMechanicsHandlers');
const { resolveIdleGif, getRandomEnemyIdle, extractElementFromPath } = require('./scripts/utils/idleAssets');
const petManager = require('./scripts/petManager');
const { getRequiredXpForNextLevel, calculateXpGain, increaseAttributesOnLevelUp } = require('./scripts/petExperience');
const appState = require('./scripts/managers/stateManager');
const { createStoreState } = require('./scripts/state/storeState');
const { initSpecies, generatePetFromEgg, generateRarity, getSpeciesData } = require('./scripts/logic/petGeneration');

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
let lastUpdate = Date.now();
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
    closeAllGameWindows
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
  broadcastNestUpdate
} = state;

// Inicializar species (mantém side-effect anterior)
initSpecies(__dirname).catch(err => console.error('Erro initSpecies:', err));

app.whenReady().then(() => {
    console.log('Aplicativo iniciado');
    petManager.cleanupOrphanPets().catch(err => {
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

    // Registrar handlers modulares da Fase 1
    registerWindowHandlers(
        windowManager,
        getPenInfo,
        getNestCount,
        getItems,
        createNestsWindow,
        () => {}, // closeNestsWindow responsabilidade movida para módulo de janelas
        createHatchWindow,
        () => {}, // closeHatchWindow idem
        updateNestsPosition
    );

    registerPetHandlers(
        windowManager,
        getItems,
        getCoins,
        broadcastPenUpdate,
        closeAllGameWindows
    );

    // ---- Fase 2: Store handlers migrados (buy/use/redeem/unequip) ----
    registerStoreHandlers({
        getCurrentPet: () => currentPet,
        getCoins,
        setCoins,
        getItems,
        setItems,
        getNestPrice,
        getNestCount,
        broadcastPenUpdate,
        broadcastNestUpdate,
        petManager,
        store,
        windowManager
    });

    // Registro dos handlers de jogo (batalha/jornada/treino/lair)
    registerGameHandlers({
        getCurrentPet: () => appState.currentPet,
        petManager,
        windowManager,
        createBattleModeWindow,
        createJourneyModeWindow,
        createJourneySceneWindow,
        createLairModeWindow,
        createTrainWindow,
        createTrainMenuWindow,
        createTrainAttributesWindow,
        createTrainForceWindow,
        createTrainDefenseWindow,
        getRandomEnemyIdle,
        resolveIdleGif,
        extractElementFromPath,
        xpUtils: { calculateXpGain, getRequiredXpForNextLevel, increaseAttributesOnLevelUp },
        storeFns: { getItems, setItems, getCoins, setCoins }
    });

    registerMovesHandlers({ getCurrentPet: () => appState.currentPet, petManager });

    registerSettingsHandlers({ store, getPenInfo, getNestCount, getNestPrice, getNestsData, getDifficulty, setDifficulty });

    registerAssetsHandlers({
        loadSpeciesData: () => {}, // já carregado em initSpecies
        getSpeciesData: () => getSpeciesData(),
        getJourneyImagesCache: () => journeyImagesCache,
        setJourneyImagesCache: (cache) => { journeyImagesCache = cache; },
        baseDir: __dirname
    });

    // Registrar lifecycle (timers e battle handler)
    const { resetTimers } = registerLifecycleHandlers({
        ipcMain,
        getCurrentPet: () => appState.currentPet,
        petManager,
        BrowserWindow
    });

    // Expor resetTimers globalmente para uso ao selecionar pet
    global.resetTimers = resetTimers;

    // Registrar window positioning handlers (itens-pet, store-pet, resize-*)
    setupWindowPositioningHandlers({
        createItemsWindow,
        createStoreWindow,
        getStoreWindow,
        getItemsWindow,
        getCurrentPet: () => appState.currentPet,
        getCoins,
        getItems
    });

    // Registrar nest handlers (place-egg-in-nest, hatch-egg)
    setupNestHandlers({
        getCurrentPet: () => appState.currentPet,
        getItems,
        setItems,
        getNestCount,
        getNestsData,
        setNestsData,
        generateRarity,
        generatePetFromEgg,
        petManager,
        broadcastPenUpdate,
        getHatchWindow
    });

    // Registrar battle mechanics handlers (use-move, use-bravura)
    setupBattleMechanicsHandlers({
        getCurrentPet: () => appState.currentPet,
        petManager
    });

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