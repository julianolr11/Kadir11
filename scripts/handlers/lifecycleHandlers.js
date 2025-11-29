/**
 * Handler para inicializar serviços em background (timers, battle handler).
 */
const { createLogger } = require('../utils/logger');
const { startPetUpdater, resetTimers } = require('../petUpdater');
const { setupBattleHandler } = require('../battleHandler');

const logger = createLogger('LifecycleHandlers');

function registerLifecycleHandlers({ ipcMain, getCurrentPet, petManager, BrowserWindow }) {
  logger.info('Registrando Lifecycle Handlers (timers & background services)');

  // Iniciar timer de atualização do pet (decay de fome/felicidade, recuperação HP/energia)
  startPetUpdater(getCurrentPet);
  logger.info('Pet updater timer iniciado');

  // Configurar battle handler (processamento de resultados de batalha)
  setupBattleHandler(ipcMain, getCurrentPet, petManager, BrowserWindow);
  logger.info('Battle handler configurado');

  // Expor resetTimers para ser chamado ao trocar de pet
  return { resetTimers };
}

module.exports = { registerLifecycleHandlers };
