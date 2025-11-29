/**
 * Handlers IPC para operações de loja, moedas e itens
 * @module handlers/storeHandlers
 */

const { ipcMain } = require('electron');
const state = require('../managers/stateManager');
const { createLogger } = require('../utils/logger');

const logger = createLogger('StoreHandlers');

/**
 * Registra handlers de loja
 */
function registerStoreHandlers(
    getCoins,
    setCoins,
    getItems,
    setItems,
    handleBuyItem,
    handleUseItem,
    handleRedeemGift,
    getGiftHistory
) {
    logger.info('Registrando Store Handlers');
    
    // Handler para obter moedas
    ipcMain.handle('get-coins', async () => {
        const coins = getCoins();
        logger.debug(`Moedas atuais: ${coins}`);
        return coins;
    });
    
    // Handler para obter itens
    ipcMain.handle('get-items', async () => {
        const items = getItems();
        logger.debug('Itens recuperados');
        return items;
    });
    
    // Handler para comprar item
    ipcMain.on('buy-item', async (event, item) => {
        logger.info(`Comprando item: ${item.name}`);
        handleBuyItem(event, item);
    });
    
    // Handler para usar item
    ipcMain.handle('use-item', async (event, item) => {
        logger.info(`Usando item: ${item.name || item.type}`);
        return handleUseItem(event, item);
    });
    
    // Handler para resgatar código de presente
    ipcMain.on('redeem-gift-code', async (event, code) => {
        logger.info(`Tentando resgatar código: ${code}`);
        handleRedeemGift(event, code);
    });
    
    // Handler para obter histórico de presentes
    ipcMain.handle('get-gift-history', async () => {
        logger.debug('Recuperando histórico de presentes');
        return getGiftHistory();
    });
    
    // Handler para obter estado de mute
    ipcMain.handle('get-mute-state', async () => {
        const store = require('electron-store');
        const storeInstance = new store();
        const isMuted = storeInstance.get('isMuted', false);
        logger.debug(`Estado de mute: ${isMuted}`);
        return isMuted;
    });
    
    // Handler para definir estado de mute
    ipcMain.on('set-mute-state', (event, isMuted) => {
        const store = require('electron-store');
        const storeInstance = new store();
        storeInstance.set('isMuted', isMuted);
        logger.debug(`Mute atualizado para: ${isMuted}`);
    });
    
    logger.info('Store Handlers registrados com sucesso');
}

module.exports = { registerStoreHandlers };
