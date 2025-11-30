/**
 * Handlers IPC para operações relacionadas a pets
 * @module handlers/petHandlers
 */

const { ipcMain, BrowserWindow } = require('electron');
const petManager = require('../petManager');
const state = require('../managers/stateManager');
const { createLogger } = require('../utils/logger');

const logger = createLogger('PetHandlers');

/**
 * Helper para resolver idle.gif baseado no statusImage
 */
function resolveIdleGif(basePath) {
  if (!basePath) return null;
  const parts = basePath.split('/');
  if (parts.length < 3) return null;
  return `${parts[0]}/${parts[1]}/${parts[2]}/idle.png`;
}

/**
 * Handler para criar novo pet
 */
function setupCreatePetHandler(windowManager, getItems, getCoins, broadcastPenUpdate) {
  ipcMain.on('create-pet', async (event, petData) => {
    const endTimer = logger.time('create-pet');
    logger.info('Criando pet:', petData.name);

    try {
      // Criar pet
      const newPet = await petManager.createPet(petData);
      logger.info(`Pet criado com sucesso: ${newPet.name} (${newPet.petId})`);

      // Atualizar estado
      state.currentPet = newPet;
      state.updateTimestamp();
      if (global.resetTimers) global.resetTimers();

      // Notificar renderer
      const createPetWindow = windowManager.getCreatePetWindow();
      if (createPetWindow) {
        createPetWindow.webContents.send('pet-created', newPet);
      }

      broadcastPenUpdate();
      endTimer();
    } catch (err) {
      logger.error('Erro ao criar pet:', err);
      const createPetWindow = windowManager.getCreatePetWindow();
      if (createPetWindow) {
        createPetWindow.webContents.send('create-pet-error', err.message);
      }
    }
  });
}

/**
 * Handler para listar pets
 */
function setupListPetsHandler() {
  ipcMain.handle('list-pets', async () => {
    logger.debug('Listando pets');

    try {
      const pets = await petManager.listPets();

      // Adicionar idleImage para cada pet
      pets.forEach((pet) => {
        const basePath = pet.statusImage || pet.image;
        pet.idleImage = resolveIdleGif(basePath);
      });

      logger.debug(`${pets.length} pets encontrados`);
      return pets;
    } catch (err) {
      logger.error('Erro ao listar pets:', err);
      throw err;
    }
  });
}

/**
 * Handler para selecionar pet
 */
function setupSelectPetHandler(windowManager, getItems, getCoins, closeAllGameWindows) {
  ipcMain.on('select-pet', async (event, petId) => {
    const endTimer = logger.time('select-pet');
    logger.info('Selecionando pet:', petId);

    try {
      // Carregar pet
      const pet = await petManager.loadPet(petId);
      if (!pet) {
        throw new Error(`Pet com ID ${petId} não encontrado`);
      }

      logger.info(`Pet carregado: ${pet.name}`);

      // Adicionar dados de inventário
      pet.items = getItems();
      pet.coins = getCoins();

      // Atualizar estado global
      state.currentPet = pet;
      state.updateTimestamp();
      if (global.resetTimers) {
        global.resetTimers();
      }

      // Criar tray window ANTES de fechar outras janelas
      const trayWindow = windowManager.createTrayWindow();
      const sendPetData = () => {
        logger.debug('Enviando pet-data para tray');
        trayWindow.webContents.send('pet-data', pet);
      };

      if (trayWindow.webContents.isLoading()) {
        trayWindow.webContents.once('did-finish-load', sendPetData);
      } else {
        sendPetData();
      }

      // Fechar janelas de setup
      windowManager.closeLoadPetWindow();
      windowManager.closeStartWindow();

      // Fechar janelas de jogo
      closeAllGameWindows();

      endTimer();
    } catch (err) {
      logger.error('Erro ao selecionar pet:', err);
      event.reply('select-pet-error', err.message);
    }
  });
}

/**
 * Handler para deletar pet
 */
function setupDeletePetHandler(windowManager, broadcastPenUpdate) {
  ipcMain.handle('delete-pet', async (event, petId) => {
    logger.info('Deletando pet:', petId);

    try {
      const result = await petManager.deletePet(petId);
      logger.info('Pet deletado com sucesso');

      broadcastPenUpdate();

      // Verificar se ainda existem pets
      const remaining = await petManager.listPets();
      if (remaining.length === 0) {
        logger.warn('Nenhum pet restante. Voltando ao menu inicial.');
        state.currentPet = null;

        // Cria a start window ANTES de fechar as demais para evitar window-all-closed -> app.quit()
        const startWin = windowManager.createStartWindow();
        const keepId = startWin ? startWin.id : null;

        // Fechar todas as outras janelas, mantendo a Start aberta
        BrowserWindow.getAllWindows().forEach((win) => {
          if (win && !win.isDestroyed() && win.id !== keepId) {
            win.close();
          }
        });
      }

      return result;
    } catch (err) {
      logger.error('Erro ao deletar pet:', err);

      // Tentar enviar erro para o renderer
      try {
        if (typeof event.reply === 'function') {
          event.reply('delete-pet-error', err.message);
        } else {
          event.sender.send('delete-pet-error', err.message);
        }
      } catch (e) {
        logger.error('Falha ao enviar mensagem de erro:', e);
      }

      throw err;
    }
  });
}

/**
 * Handler para renomear pet
 */
function setupRenamePetHandler() {
  ipcMain.on('rename-pet', async (event, data) => {
    const petId = data?.petId;
    const newName = typeof data?.newName === 'string' ? data.newName.trim() : '';

    if (!petId) {
      logger.error('ID do pet não fornecido para renomear');
      return;
    }

    if (!newName || newName.length < 3 || newName.length > 15) {
      logger.error('Nome inválido para renomear (deve ter 3-15 caracteres)');
      return;
    }

    logger.info(`Renomeando pet ${petId} para "${newName}"`);

    try {
      const updatedPet = await petManager.updatePet(petId, { name: newName });

      // Atualizar pet atual se for o mesmo
      if (state.currentPet && state.currentPet.petId === petId) {
        state.currentPet = updatedPet;
      }

      // Broadcast para todas as janelas
      state.broadcast('pet-data', updatedPet);

      logger.info('Pet renomeado com sucesso');
    } catch (err) {
      logger.error('Erro ao renomear pet:', err);
    }
  });
}

/**
 * Handler para animação finalizada (após criar pet)
 */
function setupAnimationFinishedHandler(windowManager) {
  ipcMain.on('animation-finished', () => {
    logger.debug('Animação de criação finalizada');

    windowManager.closeCreatePetWindow();

    const startWin = windowManager.getStartWindow();
    if (startWin && !startWin.isDestroyed()) {
      logger.debug('Fade-out da música inicial');
      startWin.webContents.send('fade-out-start-music');
    }

    const trayWindow = windowManager.createTrayWindow();
    trayWindow.webContents.on('did-finish-load', () => {
      logger.debug('Enviando pet-data para tray (após animação)');
      trayWindow.webContents.send('pet-data', state.currentPet);
    });
  });
}

/**
 * Registra todos os handlers de pet
 */
function registerPetHandlers(
  windowManager,
  getItems,
  getCoins,
  broadcastPenUpdate,
  closeAllGameWindows
) {
  logger.info('Registrando Pet Handlers');

  setupCreatePetHandler(windowManager, getItems, getCoins, broadcastPenUpdate);
  setupListPetsHandler();
  setupSelectPetHandler(windowManager, getItems, getCoins, closeAllGameWindows);
  setupDeletePetHandler(windowManager, broadcastPenUpdate);
  setupRenamePetHandler();
  setupAnimationFinishedHandler(windowManager);
  // Handler: kadirfull (cheat para restaurar estado do pet)
  ipcMain.on('kadirfull', async () => {
    const pet = state.currentPet;
    if (!pet) {
      logger.error('Nenhum pet selecionado para kadirfull');
      return;
    }
    const prev = {
      currentHealth: pet.currentHealth,
      hunger: pet.hunger,
      happiness: pet.happiness,
      energy: pet.energy,
    };
    pet.currentHealth = pet.maxHealth;
    pet.hunger = 100;
    pet.happiness = 100;
    pet.energy = 100;
    try {
      await petManager.updatePet(pet.petId, {
        currentHealth: pet.currentHealth,
        hunger: pet.hunger,
        happiness: pet.happiness,
        energy: pet.energy,
      });
      BrowserWindow.getAllWindows().forEach((w) => {
        if (w.webContents) w.webContents.send('pet-data', pet);
      });
      logger.info('kadirfull aplicado com sucesso');
    } catch (err) {
      logger.error('Erro ao aplicar kadirfull:', err);
      pet.currentHealth = prev.currentHealth;
      pet.hunger = prev.hunger;
      pet.happiness = prev.happiness;
      pet.energy = prev.energy;
    }
  });

  // Handler: add-coins (cheat para adicionar moedas)
  ipcMain.on('add-coins', async (event, amount) => {
    const pet = state.currentPet;
    if (!pet) {
      logger.error('Nenhum pet selecionado para add-coins');
      return;
    }
    const coinsToAdd = typeof amount === 'number' ? amount : 1000;
    const prevCoins = pet.coins || 0;
    pet.coins = prevCoins + coinsToAdd;
    try {
      await petManager.updatePet(pet.petId, { coins: pet.coins });
      BrowserWindow.getAllWindows().forEach((w) => {
        if (w.webContents) w.webContents.send('pet-data', pet);
      });
      logger.info(`add-coins: +${coinsToAdd} moedas (${prevCoins} → ${pet.coins})`);
    } catch (err) {
      logger.error('Erro ao adicionar moedas:', err);
      pet.coins = prevCoins;
    }
  });

  logger.info('Pet Handlers registrados com sucesso');
}

module.exports = { registerPetHandlers };
