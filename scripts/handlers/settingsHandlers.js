/**
 * Handlers IPC para configurações globais (difficulty, pen, nests, mute).
 */
const { ipcMain } = require('electron');
const { createLogger } = require('../utils/logger');

const logger = createLogger('SettingsHandlers');

function registerSettingsHandlers({
  getPenInfo,
  getNestCount,
  getNestPrice,
  getNestsData,
  getDifficulty,
  setDifficulty,
}) {
  logger.info('Registrando Settings Handlers');

  ipcMain.handle('get-pen-info', async () => {
    return getPenInfo();
  });

  ipcMain.handle('get-nest-count', async () => {
    return getNestCount();
  });

  ipcMain.handle('get-nests-data', async () => {
    return getNestsData();
  });

  ipcMain.handle('get-nest-price', async () => {
    return getNestPrice();
  });

  ipcMain.handle('get-difficulty', async () => {
    return getDifficulty();
  });

  ipcMain.handle('set-difficulty', async (event, value) => {
    setDifficulty(value);
    return true;
  });

  logger.info('Settings Handlers registrados com sucesso');
}

module.exports = { registerSettingsHandlers };
