/**
 * Handlers IPC para operações de jogo (batalha, treino, jornada)
 * @module handlers/gameHandlers
 */

const { ipcMain, BrowserWindow } = require('electron');
const state = require('../managers/stateManager');
const { createLogger } = require('../utils/logger');

const logger = createLogger('GameHandlers');

/**
 * Registra handlers de jogo
 * Nota: A lógica completa será mantida no main.js por enquanto
 * para evitar quebrar funcionalidades críticas. Esta é uma estrutura
 * preparatória para futuras extrações.
 */
function registerGameHandlers(
    openBattleModeWindow,
    openTrainWindow,
    openJourneyModeWindow,
    handleBattleResult,
    handleJourneyComplete
) {
    logger.info('Registrando Game Handlers');
    
    // Handler para abrir modo batalha
    ipcMain.on('battle-pet', async () => {
        logger.debug('Abrindo modo batalha');
        if (!state.hasPet()) {
            logger.error('Nenhum pet selecionado para batalhar');
            return;
        }
        openBattleModeWindow();
    });
    
    // Handler para abrir treino
    ipcMain.on('train-pet', async () => {
        logger.debug('Abrindo treino');
        if (!state.hasPet()) {
            logger.error('Nenhum pet selecionado para treinar');
            return;
        }
        openTrainWindow();
    });
    
    // Handler para abrir jornada
    ipcMain.on('journey-pet', async () => {
        logger.debug('Abrindo modo jornada');
        if (!state.hasPet()) {
            logger.error('Nenhum pet selecionado para jornada');
            return;
        }
        openJourneyModeWindow();
    });
    
    // Handler para resultado de batalha
    ipcMain.on('battle-result', async (event, result) => {
        logger.info(`Resultado de batalha: ${result.victory ? 'Vitória' : 'Derrota'}`);
        handleBattleResult(event, result);
    });
    
    // Handler para conclusão de jornada
    ipcMain.on('journey-complete', async () => {
        logger.info('Jornada completada');
        handleJourneyComplete();
    });
    
    logger.info('Game Handlers registrados com sucesso');
}

module.exports = { registerGameHandlers };
