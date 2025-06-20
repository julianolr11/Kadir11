const { app, ipcMain, globalShortcut, BrowserWindow } = require('electron');
const windowManager = require('./scripts/windowManager');
const petManager = require('./scripts/petManager');
const { getRequiredXpForNextLevel, calculateXpGain, increaseAttributesOnLevelUp } = require('./scripts/petExperience');
const { startPetUpdater, resetTimers } = require('./scripts/petUpdater');
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
let trainWindow = null;
let itemsWindow = null;
let storeWindow = null;
let journeyImagesCache = null;
let journeySceneWindow = null;

app.whenReady().then(() => {
    console.log('Aplicativo iniciado');
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

// Handlers de IPC
ipcMain.on('exit-app', () => {
    console.log('Recebido exit-app');
    app.quit();
});

ipcMain.on('open-create-pet-window', () => {
    console.log('Recebido open-create-pet-window');
    windowManager.createCreatePetWindow();
});

ipcMain.on('open-load-pet-window', () => {
    console.log('Recebido open-load-pet-window');
    // Não fechar todas as janelas para permitir voltar
    // à tela anterior (start ou index) ao sair da seleção
    windowManager.createLoadPetWindow();
});

ipcMain.on('close-create-pet-window', () => {
    console.log('Recebido close-create-pet-window');
    windowManager.closeCreatePetWindow();
});

ipcMain.on('close-load-pet-window', () => {
    console.log('Recebido close-load-pet-window');
    windowManager.closeLoadPetWindow();
});

ipcMain.on('close-start-window', () => {
    console.log('Recebido close-start-window');
    windowManager.closeStartWindow();
});

ipcMain.on('create-pet', async (event, petData) => {
    console.log('Recebido create-pet com dados:', petData);
    try {
        const newPet = await petManager.createPet(petData);
        console.log('Novo pet criado:', newPet);
        currentPet = newPet;
        lastUpdate = Date.now();
        resetTimers();

        // Notificar o renderer que o pet foi criado, mas não fechar a janela ainda
        event.reply('pet-created', newPet);
    } catch (err) {
        console.error('Erro ao criar pet no main.js:', err);
        event.reply('create-pet-error', err.message);
    }
});

ipcMain.on('animation-finished', () => {
    console.log('Animação finalizada, prosseguindo com o redirecionamento');
    windowManager.closeCreatePetWindow();
    const startWin = windowManager.getStartWindow();
    if (startWin && !startWin.isDestroyed()) {
        console.log('Solicitando fade-out da música da startWindow');
        startWin.webContents.send('fade-out-start-music');
    }
    const trayWindow = windowManager.createTrayWindow();
    trayWindow.webContents.on('did-finish-load', () => {
        console.log('Enviando pet-data para trayWindow:', currentPet);
        trayWindow.webContents.send('pet-data', currentPet);
    });
});

ipcMain.handle('list-pets', async () => {
    console.log('Recebido list-pets');
    const pets = await petManager.listPets();
    console.log('Pets retornados:', pets);
    return pets;
});

ipcMain.on('select-pet', async (event, petId) => {
    console.log('Recebido select-pet com petId:', petId);
    try {
        // Usar loadPet pra carregar o pet e atualizar o lastAccessed
        const pet = await petManager.loadPet(petId);
        if (!pet) {
            throw new Error(`Pet com ID ${petId} não encontrado`);
        }
        console.log('Pet selecionado:', pet);

        if (!pet.items) {
            pet.items = {};
            try {
                await petManager.updatePet(pet.petId, { items: pet.items });
            } catch (err) {
                console.error('Erro ao inicializar inventário do pet:', err);
            }
        }

        // Definir o pet atual e atualizar os timestamps
        currentPet = pet;
        lastUpdate = Date.now();
        resetTimers();

        // Fechar a janela de load-pet
        console.log('Fechando a janela de load-pet');
        windowManager.closeLoadPetWindow();

        // Verificar se a startWindow existe antes de tentar fechá-la
        const startWindow = windowManager.getStartWindow();
        if (startWindow && !startWindow.isDestroyed()) {
            console.log('Fechando a startWindow');
            windowManager.closeStartWindow();
        } else {
            console.log('Nenhuma startWindow encontrada para fechar ou já está destruída');
        }

        // Garantir que todas as janelas extras estejam fechadas
        closeAllGameWindows();

        // Sempre criar uma nova trayWindow para garantir que a janela
        // de índice seja exibida com o pet selecionado
        const trayWindow = windowManager.createTrayWindow();
        trayWindow.webContents.on('did-finish-load', () => {
            console.log('TrayWindow carregada, enviando pet-data:', pet);
            trayWindow.webContents.send('pet-data', pet);
        });
    } catch (err) {
        console.error('Erro ao selecionar pet no main.js:', err);
        event.reply('select-pet-error', err.message);
    }
});

ipcMain.handle('delete-pet', async (event, petId) => {
    console.log('Recebido delete-pet com petId:', petId);
    const result = await petManager.deletePet(petId);
    console.log('Pet excluído:', result);
    return result;
});

ipcMain.on('rename-pet', async (event, data) => {
    if (!currentPet || !data || currentPet.petId !== data.petId) {
        console.error('Pet para renomear não encontrado');
        return;
    }
    const newName = typeof data.newName === 'string' ? data.newName.trim() : '';
    if (!newName || newName.length > 15) {
        console.error('Nome inválido para renomear o pet');
        return;
    }
    try {
        currentPet = await petManager.updatePet(currentPet.petId, { name: newName });
        BrowserWindow.getAllWindows().forEach(w => {
            if (w.webContents) w.webContents.send('pet-data', currentPet);
        });
    } catch (err) {
        console.error('Erro ao renomear pet:', err);
    }
});

ipcMain.on('open-status-window', () => {
    console.log('Recebido open-status-window');
    if (currentPet) {
        const statusWindow = windowManager.createStatusWindow();
        statusWindow.webContents.on('did-finish-load', () => {
            console.log('Enviando pet-data para statusWindow:', currentPet);
            statusWindow.webContents.send('pet-data', currentPet);
        });
    } else {
        console.error('Nenhum pet selecionado para abrir a janela de status');
    }
});

ipcMain.on('train-pet', async () => {
    if (currentPet) {
        console.log('Abrindo janela de treinamento para:', currentPet.name);
        const win = createTrainWindow();
        if (win) {
            win.webContents.on('did-finish-load', () => {
                win.webContents.send('pet-data', currentPet);
            });
        }
    } else {
        console.error('Nenhum pet selecionado para treinar');
    }
});

ipcMain.on('itens-pet', () => {
    if (currentPet) {
        console.log('Abrindo janela de itens para:', currentPet.name);
        const win = createItemsWindow();
        if (win) {
            win.webContents.on('did-finish-load', () => {
                win.webContents.send('pet-data', currentPet);
            });
        }
    } else {
        console.error('Nenhum pet selecionado para abrir itens');
    }
});

ipcMain.on('store-pet', () => {
    if (currentPet) {
        console.log('Abrindo janela de loja para:', currentPet.name);
        const win = createStoreWindow();
        if (win) {
            win.webContents.on('did-finish-load', () => {
                win.webContents.send('pet-data', currentPet);
            });
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

        if (currentPet.currentHealth <= 0) {
            console.log(`Vida insuficiente para batalhar: ${currentPet.currentHealth}/${currentPet.maxHealth}`);
            BrowserWindow.getAllWindows().forEach(window => {
                if (window.webContents) {
                    window.webContents.send('show-battle-error', 'Descanse um pouco até sua próxima batalha! Vida insuficiente.');
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
            currentPet.kadirPoints = (currentPet.kadirPoints || 0) + 1;
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

    battleModeWindow.loadFile('battle-mode.html');
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

    journeyModeWindow.loadFile('journey-mode.html');
    windowManager.attachFadeHandlers(journeyModeWindow);
    journeyModeWindow.on('closed', () => {
        console.log('journeyModeWindow fechada');
        journeyModeWindow = null;
    });

    return journeyModeWindow;
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

    journeySceneWindow.loadFile('journey-scene.html');
    windowManager.attachFadeHandlers(journeySceneWindow);
    journeySceneWindow.on('closed', () => {
        journeySceneWindow = null;
    });

    return journeySceneWindow;
}

function createTrainWindow() {
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

    trainWindow.loadFile('train.html');
    windowManager.attachFadeHandlers(trainWindow);
    trainWindow.on('closed', () => {
        trainWindow = null;
    });

    return trainWindow;
}

function createItemsWindow() {
    if (itemsWindow) {
        itemsWindow.show();
        itemsWindow.focus();
        return itemsWindow;
    }

    const preloadPath = require('path').join(__dirname, 'preload.js');

    itemsWindow = new BrowserWindow({
        width: 300,
        height: 230,
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

    itemsWindow.loadFile('items.html');
    windowManager.attachFadeHandlers(itemsWindow);
    itemsWindow.on('closed', () => {
        itemsWindow = null;
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
        width: 300,
        height: 200,
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

    storeWindow.loadFile('store.html');
    windowManager.attachFadeHandlers(storeWindow);
    storeWindow.on('closed', () => {
        storeWindow = null;
    });

    return storeWindow;
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

function closeAllGameWindows() {
    windowManager.closeTrayWindow();
    windowManager.closeStatusWindow();
    windowManager.closeCreatePetWindow();
    windowManager.closeStartWindow();
    closeBattleModeWindow();
    closeJourneyModeWindow();
    closeJourneySceneWindow();
    closeTrainWindow();
    closeItemsWindow();
    closeStoreWindow();
}

ipcMain.on('open-battle-mode-window', () => {
    console.log('Recebido open-battle-mode-window');
    createBattleModeWindow();
});

ipcMain.on('open-journey-mode-window', () => {
    console.log('Recebido open-journey-mode-window');
    const win = createJourneyModeWindow();
    if (currentPet && win) {
        win.webContents.on('did-finish-load', () => {
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
    win.webContents.on('did-finish-load', () => {
        win.webContents.send('scene-data', {
            background: data.background,
            playerPet: currentPet ? resolveIdleGif(currentPet.statusImage || currentPet.image) : null,
            enemyPet: enemy,
            enemyName
        });
    });
});

ipcMain.on('resize-journey-window', (event, size) => {
    if (journeyModeWindow && size && size.width && size.height) {
        journeyModeWindow.setSize(Math.round(size.width), Math.round(size.height));
    }
});

ipcMain.on('buy-item', async (event, item) => {
    if (!currentPet) return;
    const prices = { healthPotion: 10, meat: 5, staminaPotion: 8 };
    const price = prices[item];
    if (price === undefined) return;
    if ((currentPet.coins || 0) < price) {
        BrowserWindow.getAllWindows().forEach(w => {
            if (w.webContents) w.webContents.send('show-store-error', 'Moedas insuficientes!');
        });
        return;
    }

    currentPet.coins -= price;
    if (!currentPet.items) currentPet.items = {};
    currentPet.items[item] = (currentPet.items[item] || 0) + 1;

    try {
        await petManager.updatePet(currentPet.petId, {
            coins: currentPet.coins,
            items: currentPet.items
        });
        BrowserWindow.getAllWindows().forEach(w => {
            if (w.webContents) w.webContents.send('pet-data', currentPet);
        });
    } catch (err) {
        console.error('Erro ao comprar item:', err);
    }
});

ipcMain.on('use-item', async (event, item) => {
    if (!currentPet) return;
    if (!currentPet.items || !currentPet.items[item]) return;
    if (currentPet.items[item] <= 0) return;

    switch (item) {
        case 'healthPotion':
            currentPet.currentHealth = Math.min(currentPet.currentHealth + 20, currentPet.maxHealth);
            break;
        case 'meat':
            currentPet.hunger = Math.min((currentPet.hunger || 0) + 20, 100);
            break;
        case 'staminaPotion':
            currentPet.energy = Math.min((currentPet.energy || 0) + 20, 100);
            break;
    }

    currentPet.items[item] -= 1;

    try {
        await petManager.updatePet(currentPet.petId, {
            currentHealth: currentPet.currentHealth,
            hunger: currentPet.hunger,
            energy: currentPet.energy,
            items: currentPet.items
        });
        BrowserWindow.getAllWindows().forEach(w => {
            if (w.webContents) w.webContents.send('pet-data', currentPet);
        });
    } catch (err) {
        console.error('Erro ao usar item:', err);
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
            } else if (entry.isFile() && entry.name.toLowerCase() === 'idle.gif') {
                result.push(full.replace(/\\/g, '/'));
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
    const direct = cleaned.replace(/front\.(gif|png)$/i, 'idle.gif');
    if (fs.existsSync(path.join(baseDir, direct))) {
        return direct;
    }
    const alt = path.posix.join(path.posix.dirname(cleaned), 'idle.gif');
    if (fs.existsSync(path.join(baseDir, alt))) {
        return alt;
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

module.exports = { app, ipcMain, globalShortcut, windowManager, petManager };