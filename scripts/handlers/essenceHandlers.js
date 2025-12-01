/**
 * Essence Handlers
 * IPC handlers para o sistema de essências
 */

const essenceManager = require('../essenceManager');
const path = require('path');

let essenceWindow = null;

/**
 * Cria a janela de inventário de essências
 */
function createEssenceWindow(windowManager) {
  if (essenceWindow && !essenceWindow.isDestroyed()) {
    essenceWindow.focus();
    return essenceWindow;
  }

  const { BrowserWindow } = require('electron');
  
  essenceWindow = new BrowserWindow({
    width: 700,
    height: 600,
    show: false,
    resizable: false,
    frame: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, '../../preload.js')
    }
  });

  windowManager.attachFadeHandlers(essenceWindow);
  essenceWindow.loadFile(path.join(__dirname, '../../views/essence-inventory.html'));

  essenceWindow.on('closed', () => {
    essenceWindow = null;
  });

  return essenceWindow;
}

/**
 * Registra todos os handlers de essência
 */
function registerEssenceHandlers({ electron, managers, store }) {
  const { ipcMain, BrowserWindow } = electron;
  const { appState, petManager, windowManager } = managers;
  const { store: electronStore } = store;

  // Inicializar inventário de essências
  essenceManager.initEssenceInventory(electronStore);

  /**
   * Abrir janela de inventário de essências
   */
  ipcMain.on('open-essence-window', () => {
    createEssenceWindow(windowManager);
  });

  /**
   * Fechar janela de inventário de essências
   */
  ipcMain.on('close-essence-window', () => {
    if (essenceWindow && !essenceWindow.isDestroyed()) {
      essenceWindow.close();
    }
  });

  /**
   * Gerar essência de um pet
   */
  ipcMain.on('generate-essence', async (event, petId) => {
    try {
      const pet = await petManager.loadPet(petId);
      if (!pet) {
        console.error('Pet não encontrado:', petId);
        return;
      }

      const beforeAmount = electronStore.get(`essences.${pet.rarity}`, 0);
      const result = essenceManager.generateEssencesFromPet(electronStore, pet);
      const afterAmount = result[pet.rarity];
      const amount = afterAmount - beforeAmount;
      
      console.log(`Geradas ${amount} essências ${pet.rarity} do pet ${pet.name}`);

      // Broadcast para todas as janelas
      BrowserWindow.getAllWindows().forEach(win => {
        if (win && win.webContents) {
          win.webContents.send('essence-generated', {
            petId,
            rarity: pet.rarity,
            amount,
            inventory: result
          });
        }
      });

    } catch (err) {
      console.error('Erro ao gerar essência:', err);
    }
  });

  /**
   * Usar essência em um pet (evoluir raridade)
   */
  ipcMain.on('use-essence-on-pet', async (event, { petId, essenceRarity }) => {
    try {
      const pet = await petManager.loadPet(petId);
      if (!pet) {
        console.error('Pet não encontrado:', petId);
        return;
      }

      const result = essenceManager.useEssenceOnPet(electronStore, pet, essenceRarity);
      
      if (!result.success) {
        console.error('Erro ao usar essência:', result.error);
        // Poderia enviar um evento de erro para o renderer
        return;
      }

      // Atualizar raridade do pet
      pet.rarity = result.newRarity;
      await petManager.updatePet(pet);

      console.log(`Pet ${pet.name} evoluiu de ${result.oldRarity} para ${result.newRarity}`);

      // Broadcast para todas as janelas
      BrowserWindow.getAllWindows().forEach(win => {
        if (win && win.webContents) {
          win.webContents.send('essence-used', {
            petId,
            oldRarity: result.oldRarity,
            newRarity: result.newRarity,
            inventory: result.inventory
          });
          
          // Se for o pet atual, atualizar dados completos
          const currentPet = appState.getCurrentPet();
          if (currentPet && currentPet.petId === petId) {
            win.webContents.send('pet-data', pet);
          }
        }
      });

    } catch (err) {
      console.error('Erro ao usar essência:', err);
    }
  });

  /**
   * Fazer craft de essências
   */
  ipcMain.on('craft-essence', async (event, fromRarity) => {
    try {
      const result = essenceManager.craftEssence(electronStore, fromRarity);
      
      if (!result.success) {
        console.error('Erro ao fazer craft:', result.error);
        event.reply('craft-essence-error', result.error);
        return;
      }

      console.log(`Crafted: 10x ${result.from} → 1x ${result.to}`);

      // Broadcast para todas as janelas
      BrowserWindow.getAllWindows().forEach(win => {
        if (win && win.webContents) {
          win.webContents.send('essence-crafted', {
            from: result.from,
            to: result.to,
            inventory: result.inventory
          });
        }
      });

    } catch (err) {
      console.error('Erro ao fazer craft de essência:', err);
    }
  });

  /**
   * Obter inventário de essências
   */
  ipcMain.handle('get-essence-inventory', async () => {
    return essenceManager.getEssenceInventory(electronStore);
  });

  /**
   * Verificar essência válida para pet (síncrono via handle)
   */
  ipcMain.handle('get-valid-essence-for-pet', async (event, pet) => {
    return essenceManager.getValidEssenceForPet(electronStore, pet);
  });

  console.log('✓ Essence handlers registrados');
}

/**
 * Handler modificado para deletePet incluir recompensa de essência
 */
function enhanceDeletePetHandler({ electron, managers, store }) {
  const { ipcMain, BrowserWindow } = electron;
  const { appState, petManager } = managers;
  const { store: electronStore } = store;

  // Sobrescrever o handler de delete-pet
  ipcMain.removeHandler('delete-pet');
  
  ipcMain.handle('delete-pet', async (event, petId) => {
    try {
      const pet = await petManager.loadPet(petId);
      if (!pet) {
        throw new Error('Pet não encontrado');
      }

      // Gerar essências antes de deletar (1-3 baseado na raridade)
      const amount = Math.floor(Math.random() * 3) + 1; // 1 a 3
      const beforeAmount = electronStore.get(`essences.${pet.rarity}`, 0);
      essenceManager.addEssences(electronStore, pet.rarity, amount);
      const essenceInventory = essenceManager.getEssenceInventory(electronStore);
      
      // Deletar o pet
      await petManager.deletePet(petId);

      const currentPet = appState.getCurrentPet();
      if (currentPet && currentPet.petId === petId) {
        appState.setCurrentPet(null);
      }

      console.log(`Pet ${pet.name} deletado. Recompensa: ${amount}x Essência ${pet.rarity}`);

      // Enviar recompensa para a janela que solicitou
      event.sender.send('essence-reward', {
        rarity: pet.rarity,
        amount,
        inventory: essenceInventory
      });

      // Broadcast para outras janelas
      BrowserWindow.getAllWindows().forEach(win => {
        if (win && win.webContents && win.webContents !== event.sender) {
          win.webContents.send('pet-deleted', petId);
        }
      });

      return { success: true };

    } catch (err) {
      console.error('Erro ao deletar pet:', err);
      throw err;
    }
  });

  console.log('✓ Delete pet handler aprimorado com sistema de essências');
}

module.exports = {
  registerEssenceHandlers,
  enhanceDeletePetHandler
};
