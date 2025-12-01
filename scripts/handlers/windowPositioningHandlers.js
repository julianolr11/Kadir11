const {
  ipcMain: electronIpcMain,
  screen: electronScreen,
  BrowserWindow: ElectronBrowserWindow,
} = require('electron');
const { createLogger } = require('../utils/logger');

const logger = createLogger('WindowPositioningHandlers');

/**
 * Sets up IPC handlers for window creation, positioning, and resizing
 * @param {Object} options - Configuration options
 * @param {Function} options.createItemsWindow - Creates items window
 * @param {Function} options.createStoreWindow - Creates store window
 * @param {Function} options.getStoreWindow - Returns store window instance
 * @param {Function} options.getItemsWindow - Returns items window instance
 * @param {Function} options.getCurrentPet - Returns currently selected pet
 * @param {Function} options.getCoins - Returns current coin count
 * @param {Function} options.getItems - Returns items inventory
 * @param {Object} [options.ipcMain] - Electron IPC main instance
 * @param {Object} [options.BrowserWindow] - Electron BrowserWindow class
 * @param {Object} [options.screen] - Electron screen module
 */
function setupWindowPositioningHandlers(options = {}) {
  const {
    createItemsWindow,
    createStoreWindow,
    getStoreWindow,
    getItemsWindow,
    getCurrentPet,
    getCoins,
    getItems,
    ipcMain = electronIpcMain,
    BrowserWindow = ElectronBrowserWindow,
    screen = electronScreen,
  } = options;

  logger.info('Setting up window positioning handlers...');

  /**
   * Creates a window and sets up its event handlers with optional alignment
   * @param {Function} createFn - Function that creates and returns a BrowserWindow
   * @param {string} failMsg - Error message if window creation fails
   * @param {Function} sendDataFn - Callback invoked on did-finish-load to send initial data
   * @param {Object} [alignOptions] - Optional alignment configuration
   * @param {boolean} alignOptions.enabled - Whether to align the window
   * @param {BrowserWindow} alignOptions.otherWindow - Window to align with
   * @param {BrowserWindow} alignOptions.win1 - First window for alignment
   * @param {BrowserWindow} alignOptions.win2 - Second window for alignment
   * @param {string} alignOptions.side - Which side to align ('left' or 'right')
   * @param {string} alignOptions.logMsg - Success log message
   * @param {string} alignOptions.errMsg - Error log message
   * @returns {BrowserWindow|null} The created window or null if creation failed
   * @private
   */
  const setupWindow = (createFn, failMsg, sendDataFn, alignOptions = null) => {
    const win = createFn();
    if (!win) {
      logger.error(failMsg);
      return null;
    }
    win.webContents.on('did-finish-load', sendDataFn);
    if (alignOptions?.enabled && alignOptions.otherWindow) {
      try {
        alignWindowsSideBySide(alignOptions.win1, alignOptions.win2);
        logger.debug(alignOptions.logMsg);
      } catch (err) {
        logger.error(alignOptions.errMsg, err);
      }
    }
    return win;
  };

  // Handler: itens-pet (menu principal) e alias: open-items-window (compatibilidade)
  const openItems = (openOptions) => {
    const currentPet = getCurrentPet();
    if (!currentPet) {
      logger.error('No pet selected to open items window');
      return;
    }

    logger.debug(`Opening items window for pet: ${currentPet.name}`);
    const storeWindow = openOptions?.fromStore ? getStoreWindow() : null;

    const win = setupWindow(
      createItemsWindow,
      'Failed to create items window',
      () => {
        currentPet.coins = getCoins();
        currentPet.items = getItems();
        const win = getItemsWindow();
        if (win) win.webContents.send('pet-data', currentPet);

        // Posicionar após carregar os dados
        if (storeWindow && !storeWindow.isDestroyed()) {
          setTimeout(() => {
            try {
              alignWindowsSideBySide(win, storeWindow);
              logger.debug('Items window aligned with store window after load');
            } catch (err) {
              logger.error('Error positioning items window after load:', err);
            }
          }, 100);
        }
      },
      null // Remover alinhamento inicial, será feito no callback
    );
  };
  ipcMain.on('itens-pet', (e, opts) => openItems(opts));
  ipcMain.on('open-items-window', (e, opts) => openItems(opts));

  // Handler: store-pet
  ipcMain.on('store-pet', (event, openOptions) => {
    const currentPet = getCurrentPet();
    if (!currentPet) {
      logger.error('No pet selected to open store window');
      return;
    }

    logger.debug(`Opening store window for pet: ${currentPet.name}`);
    const itemsWindow = openOptions?.fromItems ? getItemsWindow() : null;

    const win = setupWindow(
      createStoreWindow,
      'Failed to create store window',
      () => {
        currentPet.items = getItems();
        const win = getStoreWindow();
        if (win) win.webContents.send('pet-data', currentPet);

        // Posicionar após carregar os dados
        if (itemsWindow && !itemsWindow.isDestroyed()) {
          setTimeout(() => {
            try {
              alignWindowsSideBySide(itemsWindow, win);
              logger.debug('Store window aligned with items window after load');
            } catch (err) {
              logger.error('Error positioning store window after load:', err);
            }
          }, 100);
        }
      },
      null // Remover alinhamento inicial, será feito no callback
    );
  });

  // Handler: resize-journey-window
  ipcMain.on('resize-journey-window', (event, size) => {
    const journeyWindow = BrowserWindow.getAllWindows().find((w) =>
      w.getTitle().includes('Journey')
    );
    if (journeyWindow && size && size.width && size.height) {
      journeyWindow.setSize(Math.round(size.width), Math.round(size.height));
      logger.debug(`Journey window resized to ${size.width}x${size.height}`);
    }
  });

  // Handler: resize-pen-window
  ipcMain.on('resize-pen-window', (event, size) => {
    const penWindow = BrowserWindow.getAllWindows().find((w) => w.getTitle().includes('Pen'));
    if (penWindow && size && size.width && size.height) {
      penWindow.setSize(Math.round(size.width), Math.round(size.height));
      logger.debug(`Pen window resized to ${size.width}x${size.height}`);
      // Notify pen script to update nests position
      penWindow.webContents.send('update-nests-position');
    }
  });

  // Handler: resize-lair-window
  ipcMain.on('resize-lair-window', (event, size) => {
    const lairWindow = BrowserWindow.getAllWindows().find((w) => w.getTitle().includes('Lair'));
    if (lairWindow && size && size.width && size.height) {
      lairWindow.setSize(Math.round(size.width), Math.round(size.height));
      logger.debug(`Lair window resized to ${size.width}x${size.height}`);
    }
  });

  logger.info('Window positioning handlers registered successfully');
}

/**
 * Aligns two windows side by side, centered on screen
 * @param {BrowserWindow} leftWindow - Window to place on the left
 * @param {BrowserWindow} rightWindow - Window to place on the right
 * (anchorPosition removido - não utilizado)
 */
function alignWindowsSideBySide(leftWindow, rightWindow) {
  const display = electronScreen.getPrimaryDisplay();
  const screenWidth = display.workAreaSize.width;
  const screenHeight = display.workAreaSize.height;

  const leftBounds = leftWindow.getBounds();
  const rightBounds = rightWindow.getBounds();

  const totalWidth = leftBounds.width + rightBounds.width;
  const maxHeight = Math.max(leftBounds.height, rightBounds.height);

  const startX = Math.round((screenWidth - totalWidth) / 2);
  const startY = Math.round((screenHeight - maxHeight) / 2);

  leftWindow.setPosition(startX, startY);
  rightWindow.setPosition(startX + leftBounds.width, startY);
}

module.exports = { setupWindowPositioningHandlers };
