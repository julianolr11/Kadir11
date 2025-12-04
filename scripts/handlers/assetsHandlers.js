/**
 * Handlers IPC para informações de espécies, assets e imagens.
 */
const { ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
const { createLogger } = require('../utils/logger');

const logger = createLogger('AssetsHandlers');

function registerAssetsHandlers({
  loadSpeciesData,
  getSpeciesData,
  getJourneyImagesCache,
  setJourneyImagesCache,
  baseDir,
}) {
  logger.info('Registrando Assets Handlers');

  ipcMain.handle('get-species-info', async () => {
    // Força recarregar dados sempre, evitando cache do módulo
    if (typeof require !== 'undefined') {
      try {
        const constantsPath = require.resolve('../constants.mjs');
        if (require.cache[constantsPath]) {
          delete require.cache[constantsPath];
        }
      } catch {}
    }
    await loadSpeciesData(baseDir);
    return getSpeciesData();
  });

  ipcMain.handle('get-journey-images', async () => {
    const cached = getJourneyImagesCache();
    if (cached) return cached;
    try {
      const dir = path.join(baseDir, 'Assets', 'Modes', 'Journeys');
      const files = await fs.promises.readdir(dir);
      const images = files
        .filter((f) => /\.(png|jpg|jpeg|gif)$/i.test(f))
        .map((f) => path.join('Assets', 'Modes', 'Journeys', f).replace(/\\/g, '/'));
      setJourneyImagesCache(images);
      return images;
    } catch (err) {
      logger.error('Erro ao listar imagens de jornada', err);
      return [];
    }
  });

  logger.info('Assets Handlers registrados com sucesso');
}

module.exports = { registerAssetsHandlers };
