const { ipcMain, BrowserWindow } = require('electron');
const { createLogger } = require('../utils/logger');

const logger = createLogger('NestHandlers');

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
        getHatchWindow
    } = options;

    logger.info('Setting up nest handlers...');

    // Handler: place-egg-in-nest
    ipcMain.on('place-egg-in-nest', async (event, eggId) => {
        const currentPet = getCurrentPet();
        if (!currentPet) {
            logger.error('No pet selected for placing egg in nest');
            return;
        }

        const items = getItems();
        if (!items[eggId] || items[eggId] <= 0) {
            logger.error(`Insufficient eggs: ${eggId}`);
            return;
        }

        const nestCount = getNestCount();
        let nests = getNestsData();
        
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
            BrowserWindow.getAllWindows().forEach(w => {
                if (w.webContents) {
                    w.webContents.send('pet-data', currentPet);
                    w.webContents.send('nests-data-updated', nests);
                }
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
            BrowserWindow.getAllWindows().forEach(w => {
                if (w.webContents) {
                    w.webContents.send('nests-data-updated', nests);
                    
                    // Don't send pet-created to hatch window (handled separately)
                    if (w !== hatchWindow) {
                        w.webContents.send('pet-created', newPet);
                    }
                }
            });

            // Send new pet to hatch window (may be loading)
            if (hatchWindow && hatchWindow.webContents) {
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
            
            BrowserWindow.getAllWindows().forEach(w => {
                if (w.webContents) {
                    w.webContents.send('nests-data-updated', nests);
                }
            });
        }
    });

    logger.info('Nest handlers registered successfully');
}

module.exports = { setupNestHandlers };
