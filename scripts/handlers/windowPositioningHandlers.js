const { ipcMain: electronIpcMain, screen: electronScreen, BrowserWindow: ElectronBrowserWindow } = require('electron');
const { createLogger } = require('../utils/logger');

const logger = createLogger('WindowPositioningHandlers');

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
        screen = electronScreen
    } = options;

    logger.info('Setting up window positioning handlers...');

    // Helper: validate and setup window with alignment
    const setupWindow = (createFn, failMsg, sendDataFn, alignOptions = null) => {
        const win = createFn();
        if (!win) {
            logger.error(failMsg);
            return null;
        }
        win.webContents.on('did-finish-load', sendDataFn);
        if (alignOptions?.enabled && alignOptions.otherWindow) {
            try {
                alignWindowsSideBySide(alignOptions.win1, alignOptions.win2, alignOptions.side, screen);
                logger.debug(alignOptions.logMsg);
            } catch (err) {
                logger.error(alignOptions.errMsg, err);
            }
        }
        return win;
    };

    // Handler: itens-pet
    ipcMain.on('itens-pet', (event, openOptions) => {
        const currentPet = getCurrentPet();
        if (!currentPet) {
            logger.error('No pet selected to open items window');
            return;
        }

        logger.debug(`Opening items window for pet: ${currentPet.name}`);
        const storeWindow = openOptions?.fromStore ? getStoreWindow() : null;
        
        setupWindow(
            createItemsWindow,
            'Failed to create items window',
            () => {
                currentPet.coins = getCoins();
                currentPet.items = getItems();
                const win = getItemsWindow();
                if (win) win.webContents.send('pet-data', currentPet);
            },
            storeWindow ? {
                enabled: true,
                otherWindow: storeWindow,
                win1: getItemsWindow(),
                win2: storeWindow,
                side: 'left',
                logMsg: 'Items window aligned with store window',
                errMsg: 'Error positioning items window:'
            } : null
        );
    });

    // Handler: store-pet
    ipcMain.on('store-pet', (event, openOptions) => {
        const currentPet = getCurrentPet();
        if (!currentPet) {
            logger.error('No pet selected to open store window');
            return;
        }

        logger.debug(`Opening store window for pet: ${currentPet.name}`);
        const itemsWindow = openOptions?.fromItems ? getItemsWindow() : null;
        
        setupWindow(
            createStoreWindow,
            'Failed to create store window',
            () => {
                currentPet.items = getItems();
                const win = getStoreWindow();
                if (win) win.webContents.send('pet-data', currentPet);
            },
            itemsWindow ? {
                enabled: true,
                otherWindow: itemsWindow,
                win1: itemsWindow,
                win2: getStoreWindow(),
                side: 'left',
                logMsg: 'Store window aligned with items window',
                errMsg: 'Error positioning store window:'
            } : null
        );
    });

    // Handler: resize-journey-window
    ipcMain.on('resize-journey-window', (event, size) => {
        const journeyWindow = BrowserWindow.getAllWindows().find(w => w.getTitle().includes('Journey'));
        if (journeyWindow && size && size.width && size.height) {
            journeyWindow.setSize(Math.round(size.width), Math.round(size.height));
            logger.debug(`Journey window resized to ${size.width}x${size.height}`);
        }
    });

    // Handler: resize-pen-window
    ipcMain.on('resize-pen-window', (event, size) => {
        const penWindow = BrowserWindow.getAllWindows().find(w => w.getTitle().includes('Pen'));
        if (penWindow && size && size.width && size.height) {
            penWindow.setSize(Math.round(size.width), Math.round(size.height));
            logger.debug(`Pen window resized to ${size.width}x${size.height}`);
            // Notify pen script to update nests position
            penWindow.webContents.send('update-nests-position');
        }
    });

    // Handler: resize-lair-window
    ipcMain.on('resize-lair-window', (event, size) => {
        const lairWindow = BrowserWindow.getAllWindows().find(w => w.getTitle().includes('Lair'));
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
 * @param {string} anchorPosition - Which window is the anchor ('left' or 'right')
 */
function alignWindowsSideBySide(leftWindow, rightWindow, anchorPosition = 'left', screen = electronScreen) {
    const display = screen.getPrimaryDisplay();
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
