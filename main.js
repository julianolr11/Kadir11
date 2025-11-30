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
const fs = require('fs');
const path = require('path');

// Importar o electron-store no processo principal
let Store;
try {
    console.log('Tentando carregar o electron-store no main.js');
    Store = require('electron-store');
    console.log('electron-store carregado com sucesso:', typeof Store);
    if (typeof Store !== 'function') {
        throw new Error('electron-store não é uma função construtora');
    }
} catch (err) {
    console.error('Erro ao carregar electron-store no main.js:', err.message);
    console.error('Stack do erro:', err.stack);
    throw err; // Re-throw pra ver o erro completo
}

const store = new Store();

let currentPet = null;
let lastUpdate = Date.now();
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
let journeyImagesCache = null;
let journeySceneWindow = null;
let nestsWindow = null;
let hatchWindow = null;

function updateNestsPosition() {
    if (nestsWindow && windowManager.penWindow) {
        const bounds = windowManager.penWindow.getBounds();
        nestsWindow.setPosition(bounds.x, bounds.y + bounds.height);
    }
}

function getCoins() {
    return store.get('coins', 20);
}

function setCoins(value) {
    store.set('coins', value);
}

function getItems() {
    return store.get('items', {});
}

function setItems(value) {
    store.set('items', value);
}

function getDifficulty() {
    return store.get('difficulty', 1);
}

function setDifficulty(value) {
    store.set('difficulty', value);
}

const penLimits = { small: 3, medium: 6, large: 10 };

function getPenInfo() {
    const size = store.get('penSize', 'small');
    return { size, maxPets: penLimits[size] || 3 };
}

function broadcastPenUpdate() {
    const info = getPenInfo();
    BrowserWindow.getAllWindows().forEach(w => {
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
    BrowserWindow.getAllWindows().forEach(w => {
        if (w.webContents) w.webContents.send('nest-updated', count);
    });
}

function generateRarity() {
    const roll = Math.floor(Math.random() * 100);
    if (roll < 40) return 'Comum';
    if (roll < 70) return 'Incomum';
    if (roll < 85) return 'Raro';
    if (roll < 95) return 'MuitoRaro';
    if (roll < 99) return 'Epico';
    return 'Lendario';
}
let eggSpecieMap = {};
let specieData = {};
let specieImages = {};
let specieBioImages = {};
let loadSpeciesData;
(async () => {
    const constants = await import('./scripts/constants.mjs');
    eggSpecieMap = constants.eggSpecieMap;
    specieData = constants.specieData;
    specieImages = constants.specieImages;
    specieBioImages = constants.specieBioImages;
    loadSpeciesData = constants.loadSpeciesData;
    await loadSpeciesData(__dirname);
})();

function generatePetFromEgg(eggId, rarity) {
    const list = eggSpecieMap[eggId] || ['Ave'];
    const specie = Array.isArray(list) ? list[Math.floor(Math.random() * list.length)] : list;
    const info = specieData[specie] || {};
    const attributes = {
        attack: Math.floor(Math.random() * 5) + 1,
        defense: Math.floor(Math.random() * 5) + 1,
        speed: Math.floor(Math.random() * 5) + 1,
        magic: Math.floor(Math.random() * 5) + 1,
        life: (Math.floor(Math.random() * 5) + 1) * 10
    };

    let statusImage = '';
    let bioImage = '';
    if (info.race) {
        const base = info.element
            ? path.posix.join(info.dir, info.element, info.race)
            : path.posix.join(info.dir, info.race);
        const monsBase = path.join(__dirname, 'Assets', 'Mons');
        const frontGif = path.join(monsBase, base, 'front.gif');
        const raceGif = path.join(monsBase, base, `${info.race}.gif`);
        if (fs.existsSync(frontGif)) {
            statusImage = path.posix.join(base, 'front.gif');
        } else if (fs.existsSync(raceGif)) {
            statusImage = path.posix.join(base, `${info.race}.gif`);
        } else {
            statusImage = path.posix.join(base, `${info.race}.png`);
        }
        bioImage = path.posix.join(base, `${info.race}.png`);
    } else if (info.dir) {
        statusImage = `${info.dir}/${info.dir.toLowerCase()}.png`;
        bioImage = `${info.dir}/${info.dir.toLowerCase()}.png`;
    } else {
        statusImage = 'eggsy.png';
        bioImage = 'eggsy.png';
    }

    return {
        name: 'Eggsy',
        element: info.element || 'puro',
        attributes,
        specie,
        rarity: rarity || generateRarity(),
        level: 1,
        experience: 0,
        createdAt: new Date().toISOString(),
        image: statusImage,
        race: info.race || null,
        bio: '',
        bioImage,
        statusImage,
        hunger: 100,
        happiness: 100,
        currentHealth: attributes.life,
        maxHealth: attributes.life,
        energy: 100,
        kadirPoints: 10
    };
}

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
        closeNestsWindow,
        createHatchWindow,
        closeHatchWindow,
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
        getCurrentPet: () => currentPet,
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

    registerMovesHandlers({ getCurrentPet: () => currentPet, petManager });

    registerSettingsHandlers({ store, getPenInfo, getNestCount, getNestPrice, getNestsData, getDifficulty, setDifficulty });

    registerAssetsHandlers({
        loadSpeciesData,
        getSpeciesData: () => ({ specieData, specieBioImages, specieImages }),
        getJourneyImagesCache: () => journeyImagesCache,
        setJourneyImagesCache: (cache) => { journeyImagesCache = cache; },
        baseDir: __dirname
    });

    // Registrar lifecycle (timers e battle handler)
    const { resetTimers } = registerLifecycleHandlers({
        ipcMain,
        getCurrentPet: () => currentPet,
        petManager,
        BrowserWindow
    });

    // Expor resetTimers globalmente para uso ao selecionar pet
    global.resetTimers = resetTimers;

    // Registrar window positioning handlers (itens-pet, store-pet, resize-*)
    setupWindowPositioningHandlers({
        createItemsWindow,
        createStoreWindow,
        getStoreWindow: () => storeWindow,
        getItemsWindow: () => itemsWindow,
        getCurrentPet: () => currentPet,
        getCoins,
        getItems
    });

    // Registrar nest handlers (place-egg-in-nest, hatch-egg)
    setupNestHandlers({
        getCurrentPet: () => currentPet,
        getItems,
        setItems,
        getNestCount,
        getNestsData,
        setNestsData,
        generateRarity,
        generatePetFromEgg,
        petManager,
        broadcastPenUpdate,
        getHatchWindow: () => hatchWindow
    });

    // Registrar battle mechanics handlers (use-move, use-bravura)
    setupBattleMechanicsHandlers({
        getCurrentPet: () => currentPet,
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
    if (currentPet) {
        currentPet.items = getItems();
        return currentPet;
    }
    return null;
});

// (movido para gameHandlers) ipcMain.on('train-pet' ... )

// (movido para windowPositioningHandlers) ipcMain.on('itens-pet' ... )

// (movido para windowPositioningHandlers) ipcMain.on('store-pet' ... )

// (movido para gameHandlers) ipcMain.on('battle-pet' ... )

function createBattleModeWindow() {
    if (battleModeWindow) {
        battleModeWindow.show();
        battleModeWindow.focus();
        return battleModeWindow;
    }

    // Usar o diretório atual pois main.js está na raiz do projeto
    const preloadPath = require('path').join(__dirname, 'preload.js');
    console.log('Caminho do preload.js para battleModeWindow:', preloadPath);

    battleModeWindow = new BrowserWindow({
        width: 850,
        height: 450,
        frame: false,
        transparent: true,
        resizable: false,
        show: false,
        webPreferences: {
            preload: preloadPath,
            nodeIntegration: false,
            contextIsolation: true,
        },
    });

    battleModeWindow.loadFile('views/game/battle-mode.html');
    windowManager.attachFadeHandlers(battleModeWindow);
    battleModeWindow.on('closed', () => {
        console.log('battleModeWindow fechada');
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

    const preloadPath = require('path').join(__dirname, 'preload.js');
    console.log('Caminho do preload.js para journeyModeWindow:', preloadPath);

    journeyModeWindow = new BrowserWindow({
        width: 1100,
        height: 700,

        frame: false,
        transparent: true,
        resizable: false,
        show: false,
        webPreferences: {
            preload: preloadPath,
            nodeIntegration: false,
            contextIsolation: true,
        },
    });

    journeyModeWindow.loadFile('views/game/journey-mode.html');
    windowManager.attachFadeHandlers(journeyModeWindow);
    journeyModeWindow.on('closed', () => {
        console.log('journeyModeWindow fechada');
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

    const preloadPath = require('path').join(__dirname, 'preload.js');
    lairModeWindow = new BrowserWindow({
        width: 1050,
        height: 880,
        frame: false,
        transparent: true,
        resizable: false,
        show: false,
        webPreferences: {
            preload: preloadPath,
            nodeIntegration: false,
            contextIsolation: true,
        },
    });

    lairModeWindow.loadFile('views/game/lair-mode.html');
    windowManager.attachFadeHandlers(lairModeWindow);
    lairModeWindow.on('closed', () => { lairModeWindow = null; });

    return lairModeWindow;
}

function createJourneySceneWindow() {
    if (journeySceneWindow) {
        journeySceneWindow.show();
        journeySceneWindow.focus();
        return journeySceneWindow;
    }

    const preloadPath = require('path').join(__dirname, 'preload.js');

    journeySceneWindow = new BrowserWindow({
        width: 1078,
        height: 719,
        frame: false,
        transparent: true,
        resizable: false,
        show: false,
        webPreferences: {
            preload: preloadPath,
            nodeIntegration: false,
            contextIsolation: true,
        },
    });

    journeySceneWindow.loadFile('views/game/journey-scene.html');
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

    const preloadPath = require('path').join(__dirname, 'preload.js');

    trainWindow = new BrowserWindow({
        width: 800,
        height: 500,
        frame: false,
        transparent: true,
        resizable: false,
        show: false,
        webPreferences: {
            preload: preloadPath,
            nodeIntegration: false,
            contextIsolation: true,
        },
    });

    trainWindow.loadFile('views/game/train.html');

    if (centerOnShow) {
        trainWindow.once('ready-to-show', () => {
            windowManager.centerWindow(trainWindow);
        });
    }

    if (typeof onReadyToShow === 'function') {
        trainWindow.once('ready-to-show', () => onReadyToShow(trainWindow));
    }

    windowManager.attachFadeHandlers(trainWindow);
    trainWindow.on('closed', () => {
        trainWindow = null;
        if (windowManager.statusWindow) {
            windowManager.centerWindow(windowManager.statusWindow);
        }
    });

    return trainWindow;
}

function createTrainMenuWindow() {
    if (trainMenuWindow) {
        trainMenuWindow.show();
        trainMenuWindow.focus();
        return trainMenuWindow;
    }

    const preloadPath = require('path').join(__dirname, 'preload.js');

    trainMenuWindow = new BrowserWindow({
        width: 300,
        height: 180,
        frame: false,
        transparent: true,
        resizable: false,
        show: false,
        webPreferences: {
            preload: preloadPath,
            nodeIntegration: false,
            contextIsolation: true,
        },
    });

    trainMenuWindow.loadFile('views/game/train-menu.html');
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

    const preloadPath = require('path').join(__dirname, 'preload.js');

    trainAttributesWindow = new BrowserWindow({
        width: 300,
        height: 250,
        frame: false,
        transparent: true,
        resizable: false,
        show: false,
        webPreferences: {
            preload: preloadPath,
            nodeIntegration: false,
            contextIsolation: true,
        },
    });

    trainAttributesWindow.loadFile('views/game/train-attributes.html');
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

    const preloadPath = require('path').join(__dirname, 'preload.js');

    trainForceWindow = new BrowserWindow({
        width: 1074,
        height: 715,
        frame: false,
        transparent: true,
        resizable: false,
        show: false,
        webPreferences: {
            preload: preloadPath,
            nodeIntegration: false,
            contextIsolation: true,
        },
    });

    trainForceWindow.loadFile('views/game/train-force.html');
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

    const preloadPath = require('path').join(__dirname, 'preload.js');

    trainDefenseWindow = new BrowserWindow({
        width: 1074,
        height: 715,
        frame: false,
        transparent: true,
        resizable: false,
        show: false,
        webPreferences: {
            preload: preloadPath,
            nodeIntegration: false,
            contextIsolation: true,
        },
    });

    trainDefenseWindow.loadFile('views/game/train-defense.html');
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
        return itemsWindow;
    }

    const preloadPath = require('path').join(__dirname, 'preload.js');

    itemsWindow = new BrowserWindow({
        width: 450,
        height: 500,
        frame: false,
        transparent: true,
        resizable: false,
        show: false,
        webPreferences: {
            preload: preloadPath,
            nodeIntegration: false,
            contextIsolation: true,
        },
    });

    itemsWindow.loadFile('views/management/items.html');
    windowManager.attachFadeHandlers(itemsWindow);
    itemsWindow.on('closed', () => {
        itemsWindow = null;
        if (storeWindow) {
            windowManager.centerWindow(storeWindow);
        }
    });

    return itemsWindow;
}

function createStoreWindow() {
    if (storeWindow) {
        storeWindow.show();
        storeWindow.focus();
        return storeWindow;
    }

    const preloadPath = require('path').join(__dirname, 'preload.js');

    storeWindow = new BrowserWindow({
        width: 350,
        height: 300,
        frame: false,
        transparent: true,
        resizable: false,
        show: false,
        webPreferences: {
            preload: preloadPath,
            nodeIntegration: false,
            contextIsolation: true,
        },
    });

    storeWindow.loadFile('views/management/store.html');
    windowManager.attachFadeHandlers(storeWindow);
    storeWindow.on('closed', () => {
        storeWindow = null;
        if (itemsWindow) {
            windowManager.centerWindow(itemsWindow);
        }
    });

    return storeWindow;
}

function createNestsWindow() {
    if (getNestCount() <= 0) {
        return null;
    }
    if (nestsWindow) {
        nestsWindow.show();
        nestsWindow.focus();
        return nestsWindow;
    }

    const preloadPath = require('path').join(__dirname, 'preload.js');

    nestsWindow = new BrowserWindow({
        width: 300,
        height: 130,
        frame: false,
        transparent: true,
        resizable: false,
        show: false,
        webPreferences: {
            preload: preloadPath,
            nodeIntegration: false,
            contextIsolation: true,
        },
    });

    nestsWindow.loadFile('views/management/nests.html');
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

    const preloadPath = require('path').join(__dirname, 'preload.js');

    hatchWindow = new BrowserWindow({
        width: 350,
        height: 400,
        frame: false,
        transparent: true,
        resizable: false,
        show: false,
        webPreferences: {
            preload: preloadPath,
            nodeIntegration: false,
            contextIsolation: true,
        },
    });

    hatchWindow.loadFile('views/setup/hatch.html');
    windowManager.attachFadeHandlers(hatchWindow);
    hatchWindow.on('closed', () => {
        hatchWindow = null;
    });

    return hatchWindow;
}

function closeBattleModeWindow() {
    if (battleModeWindow) {
        battleModeWindow.close();
    }
}

function closeJourneyModeWindow() {
    if (journeyModeWindow) {
        journeyModeWindow.close();
    }
}

function closeLairModeWindow() {
    if (lairModeWindow) {
        lairModeWindow.close();
    }
}

function closeJourneySceneWindow() {
    if (journeySceneWindow) {
        journeySceneWindow.close();
    }
}

function closeTrainWindow() {
    if (trainWindow) {
        trainWindow.close();
    }
}

function closeTrainMenuWindow() {
    if (trainMenuWindow) {
        trainMenuWindow.close();
    }
}

function closeTrainAttributesWindow() {
    if (trainAttributesWindow) {
        trainAttributesWindow.close();
    }
}

function closeTrainForceWindow() {
    if (trainForceWindow) {
        trainForceWindow.close();
    }
}

function closeItemsWindow() {
    if (itemsWindow) {
        itemsWindow.close();
    }
}

function closeStoreWindow() {
    if (storeWindow) {
        storeWindow.close();
    }
}

function closeNestsWindow() {
    if (nestsWindow) {
        nestsWindow.close();
    }
}

function closeHatchWindow() {
    if (hatchWindow) {
        hatchWindow.close();
    }
}

function closeAllGameWindows() {
    windowManager.closeTrayWindow();
    windowManager.closeStatusWindow();
    windowManager.closeCreatePetWindow();
    windowManager.closeStartWindow();
    closeBattleModeWindow();
    closeLairModeWindow();
    closeJourneyModeWindow();
    closeJourneySceneWindow();
    closeTrainMenuWindow();
    closeTrainAttributesWindow();
    closeTrainForceWindow();
    closeTrainWindow();
    closeItemsWindow();
    closeStoreWindow();
    closeNestsWindow();
    closeHatchWindow();
}

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