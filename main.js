const { app, ipcMain, globalShortcut, BrowserWindow, screen } = require('electron');
const windowManager = require('./scripts/windowManager');
const { registerWindowHandlers } = require('./scripts/handlers/windowHandlers');
const { registerPetHandlers } = require('./scripts/handlers/petHandlers');
const petManager = require('./scripts/petManager');
const { getRequiredXpForNextLevel, calculateXpGain, increaseAttributesOnLevelUp } = require('./scripts/petExperience');
const { startPetUpdater, resetTimers } = require('./scripts/petUpdater');
const { setupBattleHandler } = require('./scripts/battleHandler');
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

    startPetUpdater(() => currentPet);
    setupBattleHandler(ipcMain, () => currentPet, petManager, BrowserWindow);

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

ipcMain.on('train-pet', async () => {
    if (!currentPet) {
        console.error('Nenhum pet selecionado para treinar');
        return;
    }

    console.log('Abrindo janela de treinamento para:', currentPet.name);
    const statusWin = windowManager.createStatusWindow();
    const trainWin = createTrainWindow({
        centerOnShow: false,
        onReadyToShow: () => {
            if (statusWin) {
                windowManager.centerWindowsSideBySide(statusWin, trainWin);
            }
        }
    });

    if (trainWin) {
        trainWin.webContents.on('did-finish-load', () => {
            currentPet.coins = getCoins();
            currentPet.items = getItems();
            trainWin.webContents.send('pet-data', currentPet);
        });
    }

    if (statusWin) {
        statusWin.webContents.on('did-finish-load', () => {
            currentPet.items = getItems();
            statusWin.webContents.send('pet-data', currentPet);
            statusWin.webContents.send('activate-status-tab', 'tab-moves');
        });
    }

});

ipcMain.on('itens-pet', (event, options) => {
    if (currentPet) {
        console.log('Abrindo janela de itens para:', currentPet.name);
        const win = createItemsWindow();
        if (win) {
            win.webContents.on('did-finish-load', () => {
                currentPet.coins = getCoins();
                currentPet.items = getItems();
                win.webContents.send('pet-data', currentPet);
            });

            // Se os itens foram abertos a partir da janela de loja, alinhar as janelas
            if (options && options.fromStore && storeWindow) {
                try {
                    const display = screen.getPrimaryDisplay();
                    const screenWidth = display.workAreaSize.width;
                    const screenHeight = display.workAreaSize.height;
                    const storeBounds = storeWindow.getBounds();
                    const itemsBounds = win.getBounds();
                    const totalWidth = storeBounds.width + itemsBounds.width;
                    const maxHeight = Math.max(storeBounds.height, itemsBounds.height);

                    const startX = Math.round((screenWidth - totalWidth) / 2);
                    const startY = Math.round((screenHeight - maxHeight) / 2);

                    win.setPosition(startX, startY);
                    storeWindow.setPosition(startX + itemsBounds.width, startY);
                } catch (err) {
                    console.error('Erro ao posicionar janelas:', err);
                }
            }
        }
    } else {
        console.error('Nenhum pet selecionado para abrir itens');
    }
});

ipcMain.on('store-pet', (event, options) => {
    if (currentPet) {
        console.log('Abrindo janela de loja para:', currentPet.name);
        const win = createStoreWindow();
        if (win) {
            win.webContents.on('did-finish-load', () => {
                currentPet.items = getItems();
                win.webContents.send('pet-data', currentPet);
            });

            // Se a loja foi aberta a partir da janela de itens, alinhar as janelas
            if (options && options.fromItems && itemsWindow) {
                try {
                    const display = screen.getPrimaryDisplay();
                    const screenWidth = display.workAreaSize.width;
                    const screenHeight = display.workAreaSize.height;
                    const itemsBounds = itemsWindow.getBounds();
                    const storeBounds = win.getBounds();
                    const totalWidth = itemsBounds.width + storeBounds.width;
                    const maxHeight = Math.max(itemsBounds.height, storeBounds.height);

                    const startX = Math.round((screenWidth - totalWidth) / 2);
                    const startY = Math.round((screenHeight - maxHeight) / 2);

                    itemsWindow.setPosition(startX, startY);
                    win.setPosition(startX + itemsBounds.width, startY);
                } catch (err) {
                    console.error('Erro ao posicionar janelas:', err);
                }
            }
        }
    } else {
        console.error('Nenhum pet selecionado para abrir loja');
    }
});

ipcMain.on('battle-pet', async () => {
    if (currentPet) {
        if (currentPet.energy < 5) {
            console.log(`Energia insuficiente para batalhar: ${currentPet.energy}/5`);
            BrowserWindow.getAllWindows().forEach(window => {
                if (window.webContents) {
                    window.webContents.send('show-battle-error', 'Descanse um pouco até sua próxima batalha! Energia insuficiente.');
                }
            });
            return;
        }

        const minHealth = currentPet.maxHealth * 0.3;
        if (currentPet.currentHealth < minHealth) {
            console.log(`Vida insuficiente para batalhar: ${currentPet.currentHealth}/${currentPet.maxHealth}`);
            BrowserWindow.getAllWindows().forEach(window => {
                if (window.webContents) {
                    window.webContents.send('show-battle-error', 'Seu pet precisa de pelo menos 30% de vida para batalhar.');
                }
            });
            return;
        }

        console.log('Pet batalhando:', currentPet.name);

        currentPet.energy = Math.max(currentPet.energy - 5, 0);
        console.log(`Energia gasta: ${currentPet.energy + 5} -> ${currentPet.energy}`);

        const damageTaken = Math.floor(Math.random() * 11) + 5;
        const oldHealth = currentPet.currentHealth;
        currentPet.currentHealth = Math.max(currentPet.currentHealth - damageTaken, 0);
        console.log(`Dano recebido: ${damageTaken}. Vida: ${oldHealth} -> ${currentPet.currentHealth}`);

        const baseXp = 10;
        const xpGained = calculateXpGain(baseXp, currentPet.rarity);
        currentPet.experience = (currentPet.experience || 0) + xpGained;
        console.log(`Pet ganhou ${xpGained} XP. Total: ${currentPet.experience}`);

        let requiredXp = getRequiredXpForNextLevel(currentPet.level);
        while (currentPet.experience >= requiredXp && currentPet.level < 100) {
            currentPet.level += 1;
            currentPet.experience -= requiredXp;
            currentPet.kadirPoints = (currentPet.kadirPoints || 0) + 5;
            increaseAttributesOnLevelUp(currentPet);
            console.log(`Pet subiu para o nível ${currentPet.level}! XP restante: ${currentPet.experience}`);
            requiredXp = getRequiredXpForNextLevel(currentPet.level);
        }

        try {
            await petManager.updatePet(currentPet.petId, {
                level: currentPet.level,
                experience: currentPet.experience,
                attributes: currentPet.attributes,
                maxHealth: currentPet.maxHealth,
                currentHealth: currentPet.currentHealth,
                energy: currentPet.energy,
                kadirPoints: currentPet.kadirPoints
            });
        } catch (err) {
            console.error('Erro ao atualizar pet após batalha:', err);
        }

        BrowserWindow.getAllWindows().forEach(window => {
            if (window.webContents) {
                window.webContents.send('pet-data', currentPet);
            }
        });
    } else {
        console.error('Nenhum pet selecionado para batalhar');
        BrowserWindow.getAllWindows().forEach(window => {
            if (window.webContents) {
                window.webContents.send('show-battle-error', 'Nenhum pet selecionado para batalhar!');
            }
        });
    }
});

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

ipcMain.on('open-battle-mode-window', () => {
    console.log('Recebido open-battle-mode-window');
    if (!currentPet) {
        console.error('Nenhum pet selecionado para batalhar');
        BrowserWindow.getAllWindows().forEach(window => {
            if (window.webContents) {
                window.webContents.send('show-battle-error', 'Nenhum pet selecionado para batalhar!');
            }
        });
        return;
    }

    const minHealth = currentPet.maxHealth * 0.3;
    if (currentPet.currentHealth < minHealth) {
        BrowserWindow.getAllWindows().forEach(window => {
            if (window.webContents) {
                window.webContents.send('show-battle-error', 'Seu pet precisa de pelo menos 30% de vida para batalhar.');
            }
        });
        return;
    }

    createBattleModeWindow();
});

ipcMain.on('open-journey-mode-window', () => {
    console.log('Recebido open-journey-mode-window');
    const win = createJourneyModeWindow();
    if (currentPet && win) {
        win.webContents.on('did-finish-load', () => {
            currentPet.items = getItems();
            win.webContents.send('pet-data', currentPet);
        });
    }
});

ipcMain.on('open-lair-mode-window', () => {
    console.log('Recebido open-lair-mode-window');
    const win = createLairModeWindow();
    if (currentPet && win) {
        win.webContents.on('did-finish-load', () => {
            currentPet.items = getItems();
            win.webContents.send('pet-data', currentPet);
        });
    }
});

ipcMain.on('open-journey-scene-window', async (event, data) => {
    console.log('Recebido open-journey-scene-window');
    const win = createJourneySceneWindow();
    if (!win) return;
    const enemy = await getRandomEnemyIdle(currentPet ? currentPet.statusImage : null);
    const enemyName = enemy ? path.basename(path.dirname(enemy)) : '';
    const enemyElement = extractElementFromPath(enemy);
    win.webContents.on('did-finish-load', () => {
        win.webContents.send('scene-data', {
            background: data.background,
            playerPet: currentPet ? resolveIdleGif(currentPet.statusImage || currentPet.image) : null,
            enemyPet: enemy,
            enemyName,
            enemyElement,
            statusEffects: currentPet ? currentPet.statusEffects || [] : []
        });
        if (currentPet) {
            currentPet.items = getItems();
            win.webContents.send('pet-data', currentPet);
        }
    });
});

ipcMain.on('resize-journey-window', (event, size) => {
    if (journeyModeWindow && size && size.width && size.height) {
        journeyModeWindow.setSize(Math.round(size.width), Math.round(size.height));
    }
});

ipcMain.on('resize-pen-window', (event, size) => {
    if (windowManager.penWindow && size && size.width && size.height) {
        windowManager.penWindow.setSize(Math.round(size.width), Math.round(size.height));
        updateNestsPosition();
    }
});

ipcMain.on('resize-lair-window', (event, size) => {
    if (lairModeWindow && size && size.width && size.height) {
        lairModeWindow.setSize(Math.round(size.width), Math.round(size.height));
    }
});

ipcMain.on('open-train-menu-window', () => {
    if (!currentPet) {
        console.error('Nenhum pet selecionado para treinar');
        return;
    }
    createTrainMenuWindow();
});

ipcMain.on('open-train-attributes-window', () => {
    if (!currentPet) {
        console.error('Nenhum pet selecionado para treinar');
        return;
    }
    createTrainAttributesWindow();
});

ipcMain.on('open-train-force-window', () => {
    if (!currentPet) {
        console.error('Nenhum pet selecionado para treinar');
        return;
    }
    const win = createTrainForceWindow();
    if (win) {
        win.webContents.on('did-finish-load', () => {
            win.webContents.send('pet-data', currentPet);
        });
    }
});

ipcMain.on('open-train-defense-window', () => {
    if (!currentPet) {
        console.error('Nenhum pet selecionado para treinar');
        return;
    }
    const win = createTrainDefenseWindow();
    if (win) {
        win.webContents.on('did-finish-load', () => {
            win.webContents.send('pet-data', currentPet);
        });
    }
});

ipcMain.on('buy-item', async (event, item) => {
    if (!currentPet) return;
    const prices = {
        healthPotion: 10,
        meat: 5,
        staminaPotion: 8,
        chocolate: 2,
        finger: 35,
        turtleShell: 35,
        feather: 35,
        orbe: 35,
        terrainMedium: 100,
        terrainLarge: 200
    };
    let price = prices[item];
    if (item === 'nest') {
        price = getNestPrice();
    }
    if (price === undefined) return;
    if (getCoins() < price) {
        BrowserWindow.getAllWindows().forEach(w => {
            if (w.webContents) w.webContents.send('show-store-error', 'Moedas insuficientes!');
        });
        return;
    }

    if (item === 'nest') {
        const count = getNestCount();
        if (count >= 3) {
            BrowserWindow.getAllWindows().forEach(w => {
                if (w.webContents) w.webContents.send('show-store-error', 'Limite de ninhos atingido!');
            });
            return;
        }
    }

    setCoins(getCoins() - price);
    currentPet.coins = getCoins();

    if (item === 'terrainMedium' || item === 'terrainLarge') {
        const current = store.get('penSize', 'small');
        if (item === 'terrainMedium' && current === 'small') {
            store.set('penSize', 'medium');
            broadcastPenUpdate();
        } else if (item === 'terrainLarge' && current !== 'large') {
            store.set('penSize', 'large');
            broadcastPenUpdate();
        }
    } else if (item === 'nest') {
        store.set('nestCount', getNestCount() + 1);
        broadcastNestUpdate();
    } else {
        const items = getItems();
        items[item] = (items[item] || 0) + 1;
        setItems(items);
        currentPet.items = items;
    }

    BrowserWindow.getAllWindows().forEach(w => {
        if (w.webContents) w.webContents.send('pet-data', currentPet);
    });
});

ipcMain.handle('use-item', async (event, item) => {
    if (!currentPet) return;
    const items = getItems();
    if (!items[item]) return;
    if (items[item] <= 0) return;

    switch (item) {
        case 'healthPotion':
            currentPet.currentHealth = Math.min(currentPet.currentHealth + 20, currentPet.maxHealth);
            break;
        case 'meat':
            currentPet.hunger = Math.min((currentPet.hunger || 0) + 20, 100);
            currentPet.happiness = Math.min((currentPet.happiness || 0) + 10, 100);
            const healAmount = Math.round(currentPet.maxHealth * 0.05);
            currentPet.currentHealth = Math.min(currentPet.currentHealth + healAmount, currentPet.maxHealth);
            break;
        case 'staminaPotion':
            currentPet.energy = Math.min((currentPet.energy || 0) + 20, 100);
            break;
        case 'chocolate':
            currentPet.happiness = Math.min((currentPet.happiness || 0) + 20, 100);
            currentPet.energy = Math.min((currentPet.energy || 0) + 10, 100);
            currentPet.hunger = Math.min((currentPet.hunger || 0) + 3, 100);
            break;
        case 'finger':
        case 'turtleShell':
        case 'feather':
        case 'orbe': {
            if (currentPet.equippedItem === item) {
                return;
            }
            if (currentPet.equippedItem) {
                items[currentPet.equippedItem] = (items[currentPet.equippedItem] || 0) + 1;
            }
            currentPet.equippedItem = item;
            break;
        }
    }

    items[item] -= 1;
    setItems(items);
    currentPet.items = items;

    try {
        await petManager.updatePet(currentPet.petId, {
            currentHealth: currentPet.currentHealth,
            hunger: currentPet.hunger,
            happiness: currentPet.happiness,
            energy: currentPet.energy,
            equippedItem: currentPet.equippedItem
        });
    } catch (err) {
        console.error('Erro ao usar item:', err);
    }
    BrowserWindow.getAllWindows().forEach(w => {
        if (w.webContents) w.webContents.send('pet-data', currentPet);
    });
    return currentPet.currentHealth;
});

ipcMain.on('unequip-item', async () => {
    if (!currentPet || !currentPet.equippedItem) return;
    const items = getItems();
    const eq = currentPet.equippedItem;
    items[eq] = (items[eq] || 0) + 1;
    currentPet.equippedItem = null;
    setItems(items);
    currentPet.items = items;
    try {
        await petManager.updatePet(currentPet.petId, { equippedItem: null });
    } catch (err) {
        console.error('Erro ao remover item:', err);
    }
    BrowserWindow.getAllWindows().forEach(w => {
        if (w.webContents) w.webContents.send('pet-data', currentPet);
    });
});

ipcMain.on('place-egg-in-nest', async (event, eggId) => {
    if (!currentPet) return;
    const items = getItems();
    if (!items[eggId] || items[eggId] <= 0) return;
    const nestCount = getNestCount();
    let nests = getNestsData();
    if (nests.length >= nestCount) return;
    items[eggId] -= 1;
    setItems(items);
    currentPet.items = items;
    nests.push({ eggId, start: Date.now(), rarity: generateRarity() });
    setNestsData(nests);
    BrowserWindow.getAllWindows().forEach(w => {
        if (w.webContents) w.webContents.send('pet-data', currentPet);
        if (w.webContents) w.webContents.send('nests-data-updated', nests);
    });
});

ipcMain.on('hatch-egg', async (event, index) => {
    const nests = getNestsData();
    const egg = nests[index];
    if (!egg) return;
    nests.splice(index, 1);
    setNestsData(nests);
    try {
        const petData = generatePetFromEgg(egg.eggId, egg.rarity);
        const newPet = await petManager.createPet(petData);
        BrowserWindow.getAllWindows().forEach(w => {
            if (w.webContents) w.webContents.send('nests-data-updated', nests);
            if (w !== hatchWindow && w.webContents) {
                w.webContents.send('pet-created', newPet);
            }
        });
        if (hatchWindow && hatchWindow.webContents) {
            const sendPet = () => hatchWindow.webContents.send('pet-created', newPet);
            if (hatchWindow.webContents.isLoading()) {
                hatchWindow.webContents.once('did-finish-load', sendPet);
            } else {
                sendPet();
            }
        }
        broadcastPenUpdate();
    } catch (err) {
        console.error('Erro ao chocar ovo:', err);
    }
});

ipcMain.on('use-move', async (event, move) => {
    if (!currentPet || !move) return;
    const cost = move.cost || 0;
    currentPet.energy = Math.max((currentPet.energy || 0) - cost, 0);

    try {
        await petManager.updatePet(currentPet.petId, {
            energy: currentPet.energy
        });
        BrowserWindow.getAllWindows().forEach(w => {
            if (w.webContents) w.webContents.send('pet-data', currentPet);
        });
    } catch (err) {
        console.error('Erro ao aplicar custo do movimento:', err);
    }
});

ipcMain.on('use-bravura', async (event, amount) => {
    if (!currentPet) return;
    const cost = amount || 1;
    currentPet.bravura = Math.max((currentPet.bravura || 0) - cost, 0);
    try {
        await petManager.updatePet(currentPet.petId, { bravura: currentPet.bravura });
        BrowserWindow.getAllWindows().forEach(w => { if (w.webContents) w.webContents.send('pet-data', currentPet); });
    } catch (err) {
        console.error('Erro ao atualizar bravura:', err);
    }
});

ipcMain.on('update-health', async (event, newHealth) => {
    if (!currentPet) return;
    currentPet.currentHealth = Math.max(0, Math.min(currentPet.maxHealth, newHealth));
    try {
        await petManager.updatePet(currentPet.petId, { currentHealth: currentPet.currentHealth });
        BrowserWindow.getAllWindows().forEach(w => {
            if (w.webContents) w.webContents.send('pet-data', currentPet);
        });
    } catch (err) {
        console.error('Erro ao atualizar vida do pet:', err);
    }
});

ipcMain.on('increase-attribute', async (event, payload) => {
    if (!currentPet || !payload) return;
    const { name, amount } = payload;
    if (!name) return;
    const inc = amount || 1;
    if (!currentPet.attributes) currentPet.attributes = {};
    currentPet.attributes[name] = (currentPet.attributes[name] || 0) + inc;
    if (name === 'life') {
        const ratio = currentPet.currentHealth / currentPet.maxHealth;
        currentPet.maxHealth = currentPet.attributes.life;
        currentPet.currentHealth = Math.round(currentPet.maxHealth * ratio);
    }
    try {
        await petManager.updatePet(currentPet.petId, {
            attributes: currentPet.attributes,
            maxHealth: currentPet.maxHealth,
            currentHealth: currentPet.currentHealth
        });
        BrowserWindow.getAllWindows().forEach(w => {
            if (w.webContents) w.webContents.send('pet-data', currentPet);
        });
    } catch (err) {
        console.error('Erro ao aumentar atributo:', err);
    }
});

ipcMain.on('kadirfull', async () => {
    if (!currentPet) return;
    currentPet.currentHealth = currentPet.maxHealth;
    currentPet.hunger = 100;
    currentPet.happiness = 100;
    currentPet.energy = 100;

    try {
        await petManager.updatePet(currentPet.petId, {
            currentHealth: currentPet.currentHealth,
            hunger: currentPet.hunger,
            happiness: currentPet.happiness,
            energy: currentPet.energy
        });
        BrowserWindow.getAllWindows().forEach(w => {
            if (w.webContents) w.webContents.send('pet-data', currentPet);
        });
    } catch (err) {
        console.error('Erro ao aplicar kadirfull:', err);
    }
});

ipcMain.on('reward-pet', async (event, reward) => {
    if (!currentPet || !reward) return;
    if (reward.item) {
        const items = getItems();
        const qty = reward.qty || 1;
        items[reward.item] = (items[reward.item] || 0) + qty;
        setItems(items);
        currentPet.items = items;
    }
    if (reward.coins) {
        setCoins(getCoins() + reward.coins);
    }
    if (reward.kadirPoints) {
        currentPet.kadirPoints = (currentPet.kadirPoints || 0) + reward.kadirPoints;
    }
    if (reward.bravura) {
        currentPet.bravura = (currentPet.bravura || 0) + reward.bravura;
    }
    if (reward.experience) {
        currentPet.experience = (currentPet.experience || 0) + reward.experience;
        let requiredXp = getRequiredXpForNextLevel(currentPet.level);
        while (currentPet.experience >= requiredXp && currentPet.level < 100) {
            currentPet.level += 1;
            currentPet.experience -= requiredXp;
            currentPet.kadirPoints = (currentPet.kadirPoints || 0) + 5;
            currentPet.bravura = (currentPet.bravura || 0) + 1;
            increaseAttributesOnLevelUp(currentPet);
            requiredXp = getRequiredXpForNextLevel(currentPet.level);
        }
    }

    try {
        currentPet.coins = getCoins();
        await petManager.updatePet(currentPet.petId, {
            kadirPoints: currentPet.kadirPoints,
            level: currentPet.level,
            experience: currentPet.experience,
            attributes: currentPet.attributes,
            maxHealth: currentPet.maxHealth,
            currentHealth: currentPet.currentHealth,
            energy: currentPet.energy,
            bravura: currentPet.bravura
        });
        BrowserWindow.getAllWindows().forEach(w => {
            if (w.webContents) w.webContents.send('pet-data', currentPet);
        });
    } catch (err) {
        console.error('Erro ao aplicar recompensa:', err);
    }
});

const giftCodes = {
    'KADIR5': { type: 'kadirPoints', amount: 5, name: '5 Kadir Points', icon: 'Assets/Icons/dna-kadir.png' },
    'KADIR2025': { type: 'kadirPoints', amount: 50, name: '50 Kadir Points', icon: 'Assets/Icons/dna-kadir.png' },
    'WELCOME': { type: 'coins', amount: 100, name: '100 Moedas', icon: 'Assets/Icons/coin.png' },
    'STARTER': { type: 'item', item: 'healthPotion', qty: 5, name: '5x Poção de Vida', icon: 'Assets/Shop/health-potion.png' },
    'ENERGY': { type: 'item', item: 'staminaPotion', qty: 3, name: '3x Poção de Energia', icon: 'Assets/Shop/stamina-potion.png' },
    'RARE': { type: 'item', item: 'finger', qty: 1, name: 'Garra do Predador', icon: 'Assets/Shop/finger.png' },
    'NEWPET': { type: 'pet', egg: 'eggFera', name: 'Ovo de Fera', icon: 'Assets/Shop/eggFera.png' },
    'STARTERPACK': { 
        type: 'multi', 
        name: 'Starter Pack',
        icon: 'Assets/Shop/health-potion.png',
        items: [
            { item: 'healthPotion', qty: 2 },
            { item: 'staminaPotion', qty: 2 },
            { item: 'meat', qty: 2 }
        ]
    }
};

ipcMain.on('redeem-gift-code', async (event, code) => {
    console.log('Recebido redeem-gift-code:', code);
    
    const giftWindow = windowManager.getGiftWindow();
    
    if (!code || typeof code !== 'string') {
        if (giftWindow) giftWindow.webContents.send('gift-error', 'Código inválido.');
        return;
    }

    const upperCode = code.toUpperCase().trim();
    const usedCodes = store.get('usedGiftCodes', []);
    
    if (usedCodes.includes(upperCode)) {
        if (giftWindow) giftWindow.webContents.send('gift-error', 'Este código já foi usado.');
        return;
    }

    const gift = giftCodes[upperCode];
    if (!gift) {
        if (giftWindow) giftWindow.webContents.send('gift-error', 'Código não encontrado.');
        return;
    }

    try {
        if (gift.type === 'kadirPoints' && currentPet) {
            currentPet.kadirPoints = (currentPet.kadirPoints || 0) + gift.amount;
            await petManager.updatePet(currentPet.petId, { kadirPoints: currentPet.kadirPoints });
            BrowserWindow.getAllWindows().forEach(w => {
                if (w.webContents) w.webContents.send('pet-data', currentPet);
            });
        } else if (gift.type === 'coins') {
            setCoins(getCoins() + gift.amount);
            if (currentPet) {
                currentPet.coins = getCoins();
                BrowserWindow.getAllWindows().forEach(w => {
                    if (w.webContents) w.webContents.send('pet-data', currentPet);
                });
            }
        } else if (gift.type === 'item') {
            const items = getItems();
            items[gift.item] = (items[gift.item] || 0) + gift.qty;
            setItems(items);
            if (currentPet) {
                currentPet.items = items;
                BrowserWindow.getAllWindows().forEach(w => {
                    if (w.webContents) w.webContents.send('pet-data', currentPet);
                });
            }
        } else if (gift.type === 'pet') {
            const items = getItems();
            items[gift.egg] = (items[gift.egg] || 0) + 1;
            setItems(items);
            if (currentPet) {
                currentPet.items = items;
                BrowserWindow.getAllWindows().forEach(w => {
                    if (w.webContents) w.webContents.send('pet-data', currentPet);
                });
            }
        } else if (gift.type === 'multi') {
            const items = getItems();
            gift.items.forEach(itemData => {
                items[itemData.item] = (items[itemData.item] || 0) + itemData.qty;
            });
            setItems(items);
            if (currentPet) {
                currentPet.items = items;
                BrowserWindow.getAllWindows().forEach(w => {
                    if (w.webContents) w.webContents.send('pet-data', currentPet);
                });
            }
        }

        // Salvar no histórico
        const history = store.get('giftHistory', []);
        history.unshift({
            code: upperCode,
            name: gift.name,
            icon: gift.icon,
            date: new Date().toISOString(),
            description: gift.type === 'multi' 
                ? gift.items.map(i => `${i.qty}x ${i.item}`).join(', ')
                : gift.name
        });
        if (history.length > 20) history.pop();
        store.set('giftHistory', history);

        usedCodes.push(upperCode);
        store.set('usedGiftCodes', usedCodes);

        if (giftWindow) giftWindow.webContents.send('gift-redeemed', gift.name);
    } catch (err) {
        console.error('Erro ao processar presente:', err);
        if (giftWindow) giftWindow.webContents.send('gift-error', 'Erro ao processar presente.');
    }
});

ipcMain.on('journey-complete', async () => {
    if (!currentPet) return;
    const specieEggMap = {
        'Ave': 'eggAve',
        'Criatura Mística': 'eggCriaturaMistica',
        'Criatura Sombria': 'eggCriaturaSombria',
        'Draconídeo': 'eggDraconideo',
        'Drazraq': 'eggDraconideo',
        'Fera': 'eggFera',
        'Monstro': 'eggMonstro',
        'Reptiloide': 'eggReptiloide'
    };
    const eggId = specieEggMap[currentPet.specie] || 'eggAve';
    const items = getItems();
    items[eggId] = (items[eggId] || 0) + 1;
    setItems(items);
    currentPet.items = items;
    setCoins(getCoins() + 50);
    currentPet.coins = getCoins();
    currentPet.kadirPoints = (currentPet.kadirPoints || 0) + 100;
    try {
        await petManager.updatePet(currentPet.petId, {
            kadirPoints: currentPet.kadirPoints
        });
        BrowserWindow.getAllWindows().forEach(w => {
            if (w.webContents) w.webContents.send('pet-data', currentPet);
        });
    } catch (err) {
        console.error('Erro ao aplicar recompensa final da jornada:', err);
    }
});

ipcMain.on('battle-result', async (event, result) => {
    if (!currentPet || !result) return;
    const win = !!result.win;
    let delta = win ? 5 : -10;

    if (win) {
        currentPet.winStreak = (currentPet.winStreak || 0) + 1;
        currentPet.lossStreak = 0;
        if (currentPet.winStreak >= 5) {
            delta += 15;
            currentPet.winStreak = 0;
        }
    } else {
        currentPet.lossStreak = (currentPet.lossStreak || 0) + 1;
        currentPet.winStreak = 0;
        if (currentPet.lossStreak >= 5) {
            delta -= 30;
            currentPet.lossStreak = 0;
        }
    }

    currentPet.happiness = Math.max(0, Math.min(100, (currentPet.happiness || 0) + delta));

    try {
        await petManager.updatePet(currentPet.petId, {
            happiness: currentPet.happiness,
            winStreak: currentPet.winStreak,
            lossStreak: currentPet.lossStreak
        });
        BrowserWindow.getAllWindows().forEach(w => {
            if (w.webContents) w.webContents.send('pet-data', currentPet);
        });
    } catch (err) {
        console.error('Erro ao atualizar felicidade após batalha:', err);
    }
});

ipcMain.on('learn-move', async (event, move) => {
    if (!currentPet) return;
    if (!currentPet.moves) currentPet.moves = [];
    if (!currentPet.knownMoves) currentPet.knownMoves = currentPet.moves.slice();

    const learnedBefore = currentPet.knownMoves.some(m => m.name === move.name);
    const cost = learnedBefore ? Math.ceil(move.cost / 2) : move.cost;

    if ((currentPet.kadirPoints || 0) < cost) {
        BrowserWindow.getAllWindows().forEach(w => {
            if (w.webContents) w.webContents.send('show-train-error', 'Pontos Kadir insuficientes!');
        });
        return;
    }

    currentPet.kadirPoints = (currentPet.kadirPoints || 0) - cost;

    const knownIdx = currentPet.knownMoves.findIndex(m => m.name === move.name);
    if (knownIdx < 0) {
        currentPet.knownMoves.push(move);
    } else {
        currentPet.knownMoves[knownIdx] = move;
    }

    const idx = currentPet.moves.findIndex(m => m.name === move.name);
    if (idx >= 0) {
        currentPet.moves[idx] = move;
    } else if (currentPet.moves.length >= 4) {
        currentPet.moves[0] = move;
    } else {
        currentPet.moves.push(move);
    }
    try {
        await petManager.updatePet(currentPet.petId, { moves: currentPet.moves, knownMoves: currentPet.knownMoves, kadirPoints: currentPet.kadirPoints });
        BrowserWindow.getAllWindows().forEach(w => {
            if (w.webContents) w.webContents.send('pet-data', currentPet);
        });
    } catch (err) {
        console.error('Erro ao aprender golpe:', err);
    }
});

// Novos handlers IPC para o electron-store
ipcMain.handle('get-mute-state', async () => {
    console.log('Recebido get-mute-state');
    const isMuted = store.get('isMuted', false);
    console.log('Estado de mute retornado:', isMuted);
    return isMuted;
});

ipcMain.handle('get-pen-info', async () => {
    return getPenInfo();
});

ipcMain.handle('get-nest-count', async () => {
    return getNestCount();
});

ipcMain.handle('get-nests-data', async () => {
    return getNestsData();
});

ipcMain.handle('get-nest-price', async () => {
    return getNestPrice();
});

ipcMain.handle('get-difficulty', async () => {
    return getDifficulty();
});

ipcMain.handle('set-difficulty', async (event, value) => {
    setDifficulty(value);
    return true;
});

ipcMain.handle('get-gift-history', async () => {
    return store.get('giftHistory', []);
});

ipcMain.handle('get-species-info', async () => {
    await loadSpeciesData(__dirname);
    return { specieData, specieBioImages, specieImages };
});

ipcMain.on('set-mute-state', (event, isMuted) => {
    console.log('Recebido set-mute-state:', isMuted);
    store.set('isMuted', isMuted);
    console.log('Estado de mute salvo:', isMuted);
});

ipcMain.handle('get-journey-images', async () => {
    if (journeyImagesCache) {
        return journeyImagesCache;
    }
    try {
        const dir = path.join(__dirname, 'Assets', 'Modes', 'Journeys');
        const files = await fs.promises.readdir(dir);
        journeyImagesCache = files.filter(f => /\.(png|jpg|jpeg|gif)$/i.test(f))
            .map(f => path.join('Assets', 'Modes', 'Journeys', f).replace(/\\/g, '/'));
        return journeyImagesCache;
    } catch (err) {
        console.error('Erro ao listar imagens de jornada:', err);
        return [];
    }
});

let idleGifsCache = null;

async function loadIdleGifs() {
    if (idleGifsCache) return idleGifsCache;
    const dir = path.join(__dirname, 'Assets', 'Mons');
    const result = [];
    async function walk(folder) {
        const entries = await fs.promises.readdir(folder, { withFileTypes: true });
        for (const entry of entries) {
            const full = path.join(folder, entry.name);
            if (entry.isDirectory()) {
                await walk(full);
            } else if (entry.isFile()) {
                const name = entry.name.toLowerCase();
                if (name === 'idle.gif' || name === 'idle.png') {
                    result.push(full.replace(/\\/g, '/'));
                }
            }
        }
    }
    await walk(dir);
    idleGifsCache = result;
    return idleGifsCache;
}

function resolveIdleGif(relativePath) {
    if (!relativePath) return null;
    const cleaned = relativePath
        .replace(/^[Aa]ssets[\\/][Mm]ons[\\/]/, '')
        .replace(/\\/g, '/');
    const baseDir = path.join(__dirname, 'Assets', 'Mons');
    const directGif = cleaned.replace(/front\.(gif|png)$/i, 'idle.gif');
    if (fs.existsSync(path.join(baseDir, directGif))) {
        return directGif;
    }
    const altGif = path.posix.join(path.posix.dirname(cleaned), 'idle.gif');
    if (fs.existsSync(path.join(baseDir, altGif))) {
        return altGif;
    }
    const directPng = cleaned.replace(/front\.(gif|png)$/i, 'idle.png');
    if (fs.existsSync(path.join(baseDir, directPng))) {
        return directPng;
    }
    const altPng = path.posix.join(path.posix.dirname(cleaned), 'idle.png');
    if (fs.existsSync(path.join(baseDir, altPng))) {
        return altPng;
    }
    return cleaned;
}

async function getRandomEnemyIdle(exclude) {
    const list = await loadIdleGifs();
    let filtered = list;
    if (exclude) {
        const normalized = exclude.replace(/\\/g, '/');
        filtered = list.filter(p => !p.endsWith(normalized));
    }
    if (filtered.length === 0) filtered = list;
    if (filtered.length === 0) return null;
    const choice = filtered[Math.floor(Math.random() * filtered.length)];
    return path.relative(__dirname, choice).replace(/\\/g, '/');
}

function extractElementFromPath(p) {
    if (!p) return null;
    const parts = p.replace(/\\/g, '/').split('/');
    const monsIdx = parts.indexOf('Mons');
    if (monsIdx >= 0 && parts.length > monsIdx + 2) {
        return parts[monsIdx + 2].toLowerCase();
    }
    return null;
}

module.exports = { app, ipcMain, globalShortcut, windowManager, petManager };