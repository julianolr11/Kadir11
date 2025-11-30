const { ipcMain: electronIpcMain, BrowserWindow: ElectronBrowserWindow } = require('electron');
const { createLogger } = require('../utils/logger');

const logger = createLogger('BattleMechanicsHandlers');

/**
 * Sets up IPC handlers for battle mechanics (energy, health, bravura)
 * @param {Object} options - Configuration options
 * @param {Function} options.getCurrentPet - Returns the currently selected pet
 * @param {Object} options.petManager - Pet manager instance with updatePet method
 * @param {Object} [options.ipcMain] - Electron IPC main instance (defaults to electron.ipcMain)
 * @param {Object} [options.BrowserWindow] - Electron BrowserWindow class (defaults to electron.BrowserWindow)
 * @example
 * setupBattleMechanicsHandlers({
 *   getCurrentPet: () => currentPet,
 *   petManager: petManagerInstance
 * });
 */
function setupBattleMechanicsHandlers(options = {}) {
  const {
    getCurrentPet,
    petManager,
    ipcMain = electronIpcMain,
    BrowserWindow = ElectronBrowserWindow,
  } = options;

  logger.info('Setting up battle mechanics handlers...');

  /**
   * Broadcasts pet data to all open BrowserWindows
   * @param {Object} pet - The pet object with updated stats
   * @private
   */
  const broadcastPetData = (pet) => {
    BrowserWindow.getAllWindows().forEach((w) => {
      if (w.webContents) w.webContents.send('pet-data', pet);
    });
  };

  // Handler: use-move
  ipcMain.on('use-move', async (event, move) => {
    const currentPet = getCurrentPet();
    if (!currentPet || !move) {
      logger.error(currentPet ? 'No move provided' : 'No pet selected for using move');
      return;
    }

    const cost = move.cost || 0;
    const previousEnergy = currentPet.energy || 0;
    currentPet.energy = Math.max(previousEnergy - cost, 0);
    logger.debug(
      `Move ${move.name || 'unknown'} used. Energy: ${previousEnergy} → ${currentPet.energy} (cost: ${cost})`
    );
    try {
      await petManager.updatePet(currentPet.petId, { energy: currentPet.energy });
      broadcastPetData(currentPet);
      logger.info(`Move cost applied successfully for pet ${currentPet.name}`);
    } catch (err) {
      logger.error('Error applying move cost:', err);
      currentPet.energy = previousEnergy; // rollback
    }
  });

  // Handler: update-health
  ipcMain.on('update-health', async (event, newHealth) => {
    const currentPet = getCurrentPet();
    if (!currentPet) {
      logger.error('No pet selected for updating health');
      return;
    }
    const previousHealth = currentPet.currentHealth;
    currentPet.currentHealth = Math.max(0, Math.min(currentPet.maxHealth, newHealth));
    logger.debug(
      `Health updated: ${previousHealth} → ${currentPet.currentHealth} (max: ${currentPet.maxHealth})`
    );
    try {
      await petManager.updatePet(currentPet.petId, { currentHealth: currentPet.currentHealth });
      broadcastPetData(currentPet);
      logger.info(`Health updated successfully for pet ${currentPet.name}`);
    } catch (err) {
      logger.error('Error updating health:', err);
      currentPet.currentHealth = previousHealth; // rollback
    }
  });

  // Handler: use-bravura
  ipcMain.on('use-bravura', async (event, amount) => {
    const currentPet = getCurrentPet();
    if (!currentPet) {
      logger.error('No pet selected for using bravura');
      return;
    }

    const cost = amount || 1;
    const previousBravura = currentPet.bravura || 0;
    currentPet.bravura = Math.max(previousBravura - cost, 0);

    logger.debug(
      `Bravura used. Bravura: ${previousBravura} → ${currentPet.bravura} (cost: ${cost})`
    );

    try {
      await petManager.updatePet(currentPet.petId, { bravura: currentPet.bravura });
      broadcastPetData(currentPet);
      logger.info(`Bravura cost applied successfully for pet ${currentPet.name}`);
    } catch (err) {
      logger.error('Error updating bravura:', err);
      currentPet.bravura = previousBravura; // rollback
    }
  });

  logger.info('Battle mechanics handlers registered successfully');
}

module.exports = { setupBattleMechanicsHandlers };
