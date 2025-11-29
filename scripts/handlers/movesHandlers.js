const { ipcMain, BrowserWindow } = require('electron');
const { learnMove } = require('../logic/moveLearning');
const { createLogger } = require('../utils/logger');

const logger = createLogger('MovesHandlers');

function registerMovesHandlers({ getCurrentPet, petManager }) {
  logger.info('Registrando Moves Handlers');
  ipcMain.on('learn-move', async (event, move) => {
    const pet = getCurrentPet();
    if (!pet) return;
    const result = learnMove(pet, move);
    if (result.error) {
      BrowserWindow.getAllWindows().forEach(w => { if (w.webContents) w.webContents.send('show-train-error', result.error); });
      return;
    }
    try {
      await petManager.updatePet(pet.petId, {
        moves: pet.moves,
        knownMoves: pet.knownMoves,
        kadirPoints: pet.kadirPoints
      });
    } catch (err) {
      logger.error('Erro ao persistir aprendizado de golpe', err);
    }
    BrowserWindow.getAllWindows().forEach(w => { if (w.webContents) w.webContents.send('pet-data', pet); });
  });
  logger.info('Moves Handlers registrados com sucesso');
}

module.exports = { registerMovesHandlers };
