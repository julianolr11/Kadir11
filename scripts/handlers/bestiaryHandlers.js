/**
 * Handlers IPC para o Bestiário
 * @module handlers/bestiaryHandlers
 */

const { ipcMain } = require('electron');
const bestiaryManager = require('../managers/bestiaryManager');
const { createLogger } = require('../utils/logger');

const logger = createLogger('BestiaryHandlers');

/**
 * Registra todos os handlers do bestiário
 */
function registerBestiaryHandlers(windowManager) {
  logger.info('Registrando Bestiary Handlers');

  // Handler: get-bestiary (retorna dados completos)
  ipcMain.handle('get-bestiary', async () => {
    logger.debug('Recuperando dados do bestiário');
    return bestiaryManager.getAllData();
  });

  // Handler: mark-creature-seen (marca como visto em batalha)
  ipcMain.on('mark-creature-seen', (event, specieName) => {
    if (!specieName) {
      logger.error('Nome da criatura não fornecido para mark-creature-seen');
      return;
    }
    
    logger.debug(`Marcando criatura como vista: ${specieName}`);
    bestiaryManager.markAsSeen(specieName);
    
    // Broadcast para atualizar UI do bestiário se estiver aberta
    const bestiaryWindow = windowManager.getBestiaryWindow?.();
    if (bestiaryWindow && !bestiaryWindow.isDestroyed()) {
      bestiaryWindow.webContents.send('bestiary-updated');
    }
  });

  // Handler: mark-creature-owned (marca como capturado/criado)
  ipcMain.on('mark-creature-owned', (event, specieName) => {
    if (!specieName) {
      logger.error('Nome da criatura não fornecido para mark-creature-owned');
      return;
    }
    
    logger.debug(`Marcando criatura como capturada: ${specieName}`);
    bestiaryManager.markAsOwned(specieName);
    
    // Broadcast
    const bestiaryWindow = windowManager.getBestiaryWindow?.();
    if (bestiaryWindow && !bestiaryWindow.isDestroyed()) {
      bestiaryWindow.webContents.send('bestiary-updated');
    }
  });

  // Handler: reset-bestiary (debug/cheat)
  ipcMain.on('reset-bestiary', () => {
    logger.warn('Resetando bestiário');
    bestiaryManager.reset();
    
    const bestiaryWindow = windowManager.getBestiaryWindow?.();
    if (bestiaryWindow && !bestiaryWindow.isDestroyed()) {
      bestiaryWindow.webContents.send('bestiary-updated');
    }
  });

  logger.info('Bestiary Handlers registrados com sucesso');
}

module.exports = { registerBestiaryHandlers };
