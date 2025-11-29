/**
 * Handlers IPC para operações de jogo (batalha, treino, jornada, lair)
 * @module handlers/gameHandlers
 */

const { ipcMain, BrowserWindow } = require('electron');
const { createLogger } = require('../utils/logger');

const logger = createLogger('GameHandlers');

/**
 * Registra todos os handlers relacionados ao fluxo de jogo.
 * @param {Object} deps - Dependências injetadas.
 * getCurrentPet: () => pet atual
 * petManager: objeto para updatePersistente
 * windowManager: gerenciador de janelas (status + posicionamento)
 * createBattleModeWindow, createJourneyModeWindow, createLairModeWindow,
 * createTrainWindow, createTrainMenuWindow, createTrainAttributesWindow,
 * createTrainForceWindow, createTrainDefenseWindow
 * xpUtils: { calculateXpGain, getRequiredXpForNextLevel, increaseAttributesOnLevelUp }
 * storeFns: { getItems, setItems, getCoins, setCoins }
 */
function registerGameHandlers(deps) {
    const {
        getCurrentPet,
        petManager,
        windowManager,
        createBattleModeWindow,
        createJourneyModeWindow,
        createLairModeWindow,
        createTrainWindow,
        createTrainMenuWindow,
        createTrainAttributesWindow,
        createTrainForceWindow,
        createTrainDefenseWindow,
        xpUtils: { calculateXpGain, getRequiredXpForNextLevel, increaseAttributesOnLevelUp },
        storeFns: { getItems, setItems, getCoins, setCoins }
    } = deps;

    logger.info('Registrando Game Handlers');

    function broadcastPet(pet) {
        BrowserWindow.getAllWindows().forEach(w => { if (w.webContents) w.webContents.send('pet-data', pet); });
    }

    const { applyBattleProgress, applyJourneyRewards } = require('../logic/progression');

    // Batalha (ação que consome energia e dá XP)
    ipcMain.on('battle-pet', async () => {
        const pet = getCurrentPet();
        if (!pet) {
            BrowserWindow.getAllWindows().forEach(w => { if (w.webContents) w.webContents.send('show-battle-error', 'Nenhum pet selecionado para batalhar!'); });
            return;
        }
        if (pet.energy < 5) {
            BrowserWindow.getAllWindows().forEach(w => { if (w.webContents) w.webContents.send('show-battle-error', 'Descanse um pouco até sua próxima batalha! Energia insuficiente.'); });
            return;
        }
        const minHealth = pet.maxHealth * 0.3;
        if (pet.currentHealth < minHealth) {
            BrowserWindow.getAllWindows().forEach(w => { if (w.webContents) w.webContents.send('show-battle-error', 'Seu pet precisa de pelo menos 30% de vida para batalhar.'); });
            return;
        }
        pet.energy = Math.max(pet.energy - 5, 0);
        const damageTaken = Math.floor(Math.random() * 11) + 5;
        pet.currentHealth = Math.max(pet.currentHealth - damageTaken, 0);
        const { xpGain, levelsGained, kadirGained } = applyBattleProgress(pet, { baseXp: 10 }, { calculateXpGain, getRequiredXpForNextLevel, increaseAttributesOnLevelUp });
        try {
            await petManager.updatePet(pet.petId, {
                level: pet.level,
                experience: pet.experience,
                attributes: pet.attributes,
                maxHealth: pet.maxHealth,
                currentHealth: pet.currentHealth,
                energy: pet.energy,
                kadirPoints: pet.kadirPoints
            });
        } catch (err) {
            logger.error('Erro ao atualizar pet após batalha', err);
        }
        broadcastPet(pet);
    });

    // Abre a janela de batalha (validações de vida/energia)
    ipcMain.on('open-battle-mode-window', () => {
        const pet = getCurrentPet();
        if (!pet) {
            BrowserWindow.getAllWindows().forEach(w => { if (w.webContents) w.webContents.send('show-battle-error', 'Nenhum pet selecionado para batalhar!'); });
            return;
        }
        const minHealth = pet.maxHealth * 0.3;
        if (pet.currentHealth < minHealth) {
            BrowserWindow.getAllWindows().forEach(w => { if (w.webContents) w.webContents.send('show-battle-error', 'Seu pet precisa de pelo menos 30% de vida para batalhar.'); });
            return;
        }
        createBattleModeWindow();
    });

    // Resultado de batalha (felicidade / streaks)
    ipcMain.on('battle-result', async (event, result) => {
        const pet = getCurrentPet();
        if (!pet || !result) return;
        const win = !!result.win;
        let delta = win ? 5 : -10;
        if (win) {
            pet.winStreak = (pet.winStreak || 0) + 1;
            pet.lossStreak = 0;
            if (pet.winStreak >= 5) { delta += 15; pet.winStreak = 0; }
        } else {
            pet.lossStreak = (pet.lossStreak || 0) + 1;
            pet.winStreak = 0;
            if (pet.lossStreak >= 5) { delta -= 30; pet.lossStreak = 0; }
        }
        pet.happiness = Math.max(0, Math.min(100, (pet.happiness || 0) + delta));
        try {
            await petManager.updatePet(pet.petId, {
                happiness: pet.happiness,
                winStreak: pet.winStreak,
                lossStreak: pet.lossStreak
            });
        } catch (err) {
            logger.error('Erro ao atualizar felicidade após batalha', err);
        }
        broadcastPet(pet);
    });

    // Jornada completa (recompensas)
    ipcMain.on('journey-complete', async () => {
        const pet = getCurrentPet();
        if (!pet) return;
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
        const eggId = specieEggMap[pet.specie] || 'eggAve';
        applyJourneyRewards(pet, { eggId, coins: 50, kadirPoints: 100 }, { getItems, setItems, getCoins, setCoins });
        try {
            await petManager.updatePet(pet.petId, { kadirPoints: pet.kadirPoints });
        } catch (err) {
            logger.error('Erro ao aplicar recompensa final da jornada', err);
        }
        broadcastPet(pet);
    });

    // Abrir jornada
    ipcMain.on('open-journey-mode-window', () => {
        const pet = getCurrentPet();
        const win = createJourneyModeWindow();
        if (pet && win) {
            win.webContents.on('did-finish-load', () => {
                pet.items = getItems();
                win.webContents.send('pet-data', pet);
            });
        }
    });

    // Abrir lair
    ipcMain.on('open-lair-mode-window', () => {
        const pet = getCurrentPet();
        const win = createLairModeWindow();
        if (pet && win) {
            win.webContents.on('did-finish-load', () => {
                pet.items = getItems();
                win.webContents.send('pet-data', pet);
            });
        }
    });

    // Treino principal (status + janela de treino lado a lado)
    ipcMain.on('train-pet', () => {
        const pet = getCurrentPet();
        if (!pet) return;
        const statusWin = windowManager.createStatusWindow();
        const trainWin = createTrainWindow({
            centerOnShow: false,
            onReadyToShow: () => {
                if (statusWin) windowManager.centerWindowsSideBySide(statusWin, trainWin);
            }
        });
        if (trainWin) {
            trainWin.webContents.on('did-finish-load', () => {
                pet.coins = getCoins();
                pet.items = getItems();
                trainWin.webContents.send('pet-data', pet);
            });
        }
        if (statusWin) {
            statusWin.webContents.on('did-finish-load', () => {
                pet.items = getItems();
                statusWin.webContents.send('pet-data', pet);
                statusWin.webContents.send('activate-status-tab', 'tab-moves');
            });
        }
    });

    ipcMain.on('open-train-menu-window', () => { if (getCurrentPet()) createTrainMenuWindow(); });
    ipcMain.on('open-train-attributes-window', () => { if (getCurrentPet()) createTrainAttributesWindow(); });
    ipcMain.on('open-train-force-window', () => { const pet = getCurrentPet(); if (!pet) return; const win = createTrainForceWindow(); if (win) win.webContents.on('did-finish-load', () => win.webContents.send('pet-data', pet)); });
    ipcMain.on('open-train-defense-window', () => { const pet = getCurrentPet(); if (!pet) return; const win = createTrainDefenseWindow(); if (win) win.webContents.on('did-finish-load', () => win.webContents.send('pet-data', pet)); });

    logger.info('Game Handlers registrados com sucesso');
}

module.exports = { registerGameHandlers };
