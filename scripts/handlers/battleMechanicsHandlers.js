const { ipcMain, BrowserWindow } = require('electron');
const { createLogger } = require('../utils/logger');

const logger = createLogger('BattleMechanicsHandlers');

function setupBattleMechanicsHandlers(options = {}) {
    const {
        getCurrentPet,
        petManager
    } = options;

    logger.info('Setting up battle mechanics handlers...');

    // Handler: use-move
    ipcMain.on('use-move', async (event, move) => {
        const currentPet = getCurrentPet();
        
        if (!currentPet) {
            logger.error('No pet selected for using move');
            return;
        }

        if (!move) {
            logger.error('No move provided');
            return;
        }

        const cost = move.cost || 0;
        const previousEnergy = currentPet.energy || 0;
        currentPet.energy = Math.max(previousEnergy - cost, 0);

        logger.debug(`Move ${move.name || 'unknown'} used. Energy: ${previousEnergy} → ${currentPet.energy} (cost: ${cost})`);

        try {
            await petManager.updatePet(currentPet.petId, {
                energy: currentPet.energy
            });

            // Broadcast updated pet data to all windows
            BrowserWindow.getAllWindows().forEach(w => {
                if (w.webContents) {
                    w.webContents.send('pet-data', currentPet);
                }
            });

            logger.info(`Move cost applied successfully for pet ${currentPet.name}`);
        } catch (err) {
            logger.error('Error applying move cost:', err);
            // Rollback on error
            currentPet.energy = previousEnergy;
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

        logger.debug(`Bravura used. Bravura: ${previousBravura} → ${currentPet.bravura} (cost: ${cost})`);

        try {
            await petManager.updatePet(currentPet.petId, {
                bravura: currentPet.bravura
            });

            // Broadcast updated pet data to all windows
            BrowserWindow.getAllWindows().forEach(w => {
                if (w.webContents) {
                    w.webContents.send('pet-data', currentPet);
                }
            });

            logger.info(`Bravura cost applied successfully for pet ${currentPet.name}`);
        } catch (err) {
            logger.error('Error updating bravura:', err);
            // Rollback on error
            currentPet.bravura = previousBravura;
        }
    });

    logger.info('Battle mechanics handlers registered successfully');
}

module.exports = { setupBattleMechanicsHandlers };
