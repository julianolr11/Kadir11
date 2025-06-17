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

        // Verificar se já existe uma trayWindow aberta
        const allWindows = BrowserWindow.getAllWindows();
        const trayWindowExists = allWindows.some(window => {
            try {
                const url = window.webContents.getURL();
                console.log('Verificando janela com URL:', url);
                return url.includes('index.html');
            } catch (err) {
                console.error('Erro ao verificar URL da janela:', err);
                return false;
            }
        });

        if (!trayWindowExists) {
            // Se não existe uma trayWindow, criar uma nova
            console.log('Nenhuma trayWindow encontrada, criando uma nova');
            const trayWindow = windowManager.createTrayWindow();
            trayWindow.webContents.on('did-finish-load', () => {
                console.log('Nova trayWindow carregada, enviando pet-data:', pet);
                trayWindow.webContents.send('pet-data', pet);
            });
        } else {
            // Se já existe, enviar os dados pras janelas existentes
            console.log('TrayWindow já existe, enviando pet-data para janelas existentes');
            allWindows.forEach(window => {
                if (window.webContents && !window.isDestroyed()) {
                    console.log('Enviando pet-data para janela existente:', pet);
                    window.webContents.send('pet-data', pet);
                }
            });
        }
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
                energy: currentPet.energy
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
    if (battleModeWindow) return battleModeWindow;

    // Usar o diretório atual pois main.js está na raiz do projeto
    const preloadPath = require('path').join(__dirname, 'preload.js');
    console.log('Caminho do preload.js para battleModeWindow:', preloadPath);

    battleModeWindow = new BrowserWindow({
        width: 850,
        height: 450,
        frame: false,
        transparent: true,
        resizable: false,
        webPreferences: {
            preload: preloadPath,
            nodeIntegration: false,
            contextIsolation: true,
        },
    });

    battleModeWindow.loadFile('battle-mode.html');
    battleModeWindow.on('closed', () => {
        console.log('battleModeWindow fechada');
        battleModeWindow = null;
    });

    return battleModeWindow;
}

function createJourneyModeWindow() {
    if (journeyModeWindow) return journeyModeWindow;

    const preloadPath = require('path').join(__dirname, 'preload.js');
    console.log('Caminho do preload.js para journeyModeWindow:', preloadPath);

    journeyModeWindow = new BrowserWindow({
      width: 1100,
        height: 700,

        frame: false,
        transparent: true,
        resizable: false,
        webPreferences: {
            preload: preloadPath,
            nodeIntegration: false,
            contextIsolation: true,
        },
    });

    journeyModeWindow.loadFile('journey-mode.html');
    journeyModeWindow.on('closed', () => {
        console.log('journeyModeWindow fechada');
        journeyModeWindow = null;
    });

    return journeyModeWindow;
}

function createJourneySceneWindow() {
    if (journeySceneWindow) return journeySceneWindow;

    const preloadPath = require('path').join(__dirname, 'preload.js');

    journeySceneWindow = new BrowserWindow({
        width: 1078,
        height: 719,
        frame: false,
        transparent: true,
        resizable: false,
        webPreferences: {
            preload: preloadPath,
            nodeIntegration: false,
            contextIsolation: true,
        },
    });

    journeySceneWindow.loadFile('journey-scene.html');
    journeySceneWindow.on('closed', () => {
        journeySceneWindow = null;
    });

    return journeySceneWindow;
}

function createTrainWindow() {
    if (trainWindow) return trainWindow;

    const preloadPath = require('path').join(__dirname, 'preload.js');

    trainWindow = new BrowserWindow({
        width: 800,
        height: 500,
        frame: false,
        transparent: true,
        resizable: false,
        webPreferences: {
            preload: preloadPath,
            nodeIntegration: false,
            contextIsolation: true,
        },
    });

    trainWindow.loadFile('train.html');
    trainWindow.on('closed', () => {
        trainWindow = null;
    });

    return trainWindow;
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
    const enemyIdle = await getRandomEnemyIdle(currentPet ? currentPet.statusImage : null);
    const enemyFront = enemyIdle ? enemyIdle.replace(/idle\.gif$/i, 'front.gif') : null;
    win.webContents.on('did-finish-load', () => {
        win.webContents.send('scene-data', {
            background: data.background,
            playerPet: currentPet ? (currentPet.statusImage || currentPet.image) : null,
            playerFront: currentPet ? (currentPet.statusImage || currentPet.image) : null,
            enemyPet: enemyIdle,
            enemyFront: enemyFront
        });
    });
});

ipcMain.on('resize-journey-window', (event, size) => {
    if (journeyModeWindow && size && size.width && size.height) {
        journeyModeWindow.setSize(Math.round(size.width), Math.round(size.height));
    }
});

ipcMain.on('learn-move', async (event, move) => {
    if (!currentPet) return;
    if (!currentPet.moves) currentPet.moves = [];
    const idx = currentPet.moves.findIndex(m => m.name === move.name);
    if (idx >= 0) {
        currentPet.moves[idx] = move;
    } else if (currentPet.moves.length >= 4) {
        currentPet.moves[0] = move;
    } else {
        currentPet.moves.push(move);
    }
    try {
        await petManager.updatePet(currentPet.petId, { moves: currentPet.moves });
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