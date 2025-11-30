const { ipcMain: electronIpcMain, BrowserWindow: ElectronBrowserWindow } = require('electron');
const { createLogger } = require('../utils/logger');

const logger = createLogger('NestHandlers');

/**
 * Sets up IPC handlers for nest management (placing eggs, hatching)
 * @param {Object} options - Configuration options
 * @param {Function} options.getCurrentPet - Returns the currently selected pet
 * @param {Function} options.getItems - Returns current items inventory
 * @param {Function} options.setItems - Sets items inventory
 * @param {Function} options.getNestCount - Returns maximum nest capacity
 * @param {Function} options.getNestsData - Returns array of current nests
 * @param {Function} options.setNestsData - Sets nests array
 * @param {Function} options.generateRarity - Generates random rarity for egg
 * @param {Function} options.generatePetFromEgg - Creates pet data from egg and rarity
 * @param {Object} options.petManager - Pet manager instance with createPet method
 * @param {Function} options.broadcastPenUpdate - Updates pen display
 * @param {Function} options.getHatchWindow - Returns hatch window instance
 * @param {Object} [options.ipcMain] - Electron IPC main instance
 * @param {Object} [options.BrowserWindow] - Electron BrowserWindow class
 */
function setupNestHandlers(options = {}) {
  const {
    getCurrentPet,
    getItems,
    setItems,
    getNestCount,
    getNestsData,
    setNestsData,
    generateRarity,
    generatePetFromEgg,
    petManager,
    broadcastPenUpdate,
    getHatchWindow,
    ipcMain = electronIpcMain,
    BrowserWindow = ElectronBrowserWindow,
  } = options;

  logger.info('Setting up nest handlers...');

  /**
   * Executes a callback for all windows with valid webContents
   * @param {Function} callback - Function receiving webContents as argument
   * @example
   * broadcastToWindows(wc => wc.send('event', data));
   * @private
   */
  const broadcastToWindows = (callback) => {
    BrowserWindow.getAllWindows().forEach((w) => {
      if (w.webContents) callback(w.webContents);
    });
  };

  // Handler: place-egg-in-nest
  ipcMain.on('place-egg-in-nest', async (event, eggId) => {
    const currentPet = getCurrentPet();
    const items = getItems();
    const nestCount = getNestCount();
    let nests = getNestsData();

    // Consolidated validation guards
    if (!currentPet) {
      logger.error('No pet selected for placing egg in nest');
      return;
    }
    if (!items[eggId] || items[eggId] <= 0) {
      logger.error(`Insufficient eggs: ${eggId}`);
      return;
    }
    if (nests.length >= nestCount) {
      logger.error(`Maximum nest capacity reached: ${nestCount}`);
      return;
    }

    try {
      // Remove egg from inventory
      items[eggId] -= 1;
      setItems(items);
      currentPet.items = items;

      // Add egg to nest
      const rarity = generateRarity();
      nests.push({ eggId, start: Date.now(), rarity });
      setNestsData(nests);

      logger.info(`Egg ${eggId} placed in nest with rarity ${rarity}`);

      // Broadcast updates to all windows
      broadcastToWindows((wc) => {
        wc.send('pet-data', currentPet);
        wc.send('nests-data-updated', nests);
      });
    } catch (err) {
      logger.error('Error placing egg in nest:', err);
    }
  });

  // Handler: hatch-egg
  ipcMain.on('hatch-egg', async (event, index) => {
    const nests = getNestsData();
    const egg = nests[index];

    if (!egg) {
      logger.error(`Invalid nest index: ${index}`);
      return;
    }

    // Remove egg from nest
    nests.splice(index, 1);
    setNestsData(nests);

    try {
      // Generate pet from egg
      const petData = generatePetFromEgg(egg.eggId, egg.rarity);
      const newPet = await petManager.createPet(petData);

      logger.info(`Egg hatched: ${newPet.name} (ID: ${newPet.petId}) with rarity ${egg.rarity}`);

      const hatchWindow = getHatchWindow();

      // Broadcast nest update and new pet to all windows
      broadcastToWindows((wc) => {
        wc.send('nests-data-updated', nests);
        // Don't send pet-created to hatch window (handled separately)
        if (wc !== hatchWindow?.webContents) {
          wc.send('pet-created', newPet);
        }
      });

      // Send new pet to hatch window (may be loading)
      if (hatchWindow?.webContents) {
        const sendPet = () => {
          hatchWindow.webContents.send('pet-created', newPet);
          logger.debug('New pet sent to hatch window');
        };

        if (hatchWindow.webContents.isLoading()) {
          hatchWindow.webContents.once('did-finish-load', sendPet);
        } else {
          sendPet();
        }
      }

      // Update pen display
      broadcastPenUpdate();
    } catch (err) {
      logger.error('Error hatching egg:', err);

      // Re-add egg to nest on error
      nests.splice(index, 0, egg);
      setNestsData(nests);

      broadcastToWindows((wc) => wc.send('nests-data-updated', nests));
    }
  });

  logger.info('Nest handlers registered successfully');
}

module.exports = { setupNestHandlers };
