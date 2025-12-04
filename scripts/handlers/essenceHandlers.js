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
   * Usar essência em um pet (evoluir raridade)
   */
  ipcMain.handle('use-essence-on-pet', async (event, { petId, essenceRarity }) => {
    try {
      const pet = await petManager.loadPet(petId);
      if (!pet) {
        console.error('Pet não encontrado:', petId);
        return { success: false, error: 'Pet não encontrado' };
      }

      const result = essenceManager.useEssenceOnPet(electronStore, pet, essenceRarity);
      
      if (!result.success) {
        console.error('Erro ao usar essência:', result.error);
        return result;
      }

      // Atualizar raridade do pet
      pet.rarity = result.newRarity;
      await petManager.updatePet(pet.petId, pet);

      console.log(`Pet ${pet.name} evoluiu de ${result.oldRarity} para ${result.newRarity}`);

      // Broadcast para todas as janelas
      BrowserWindow.getAllWindows().forEach(win => {
        if (win && win.webContents) {
          win.webContents.send('essence-used', {
            petId: pet.petId,
            oldRarity: result.oldRarity,
            newRarity: result.newRarity,
            inventory: result.inventory
          });
        }
      });

      // Se for o pet atual, atualizar o estado
      if (appState.currentPet && appState.currentPet.petId === petId) {
        appState.currentPet = pet;
        BrowserWindow.getAllWindows().forEach(win => {
          if (win && win.webContents) {
            win.webContents.send('pet-data', pet);
          }
        });
      }

      return { success: true, oldRarity: result.oldRarity, newRarity: result.newRarity };
    } catch (error) {
      console.error('Erro ao usar essência:', error);
      return { success: false, error: error.message };
    }
  });

  /**
   * Fazer craft de essências (MANUAL - atualmente o craft é automático)
   * Este handler está mantido para compatibilidade futura
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
   * Normaliza automaticamente para garantir auto-craft
   */
  ipcMain.handle('get-essence-inventory', async () => {
    return essenceManager.normalizeEssences(electronStore);
  });

  /**
   * CHEAT: Adiciona essências de todas as raridades
   * Uso: ipcRenderer.invoke('cheat-add-essences', { each: 1 })
   */
  ipcMain.handle('cheat-add-essences', async (event, { each = 1 } = {}) => {
    try {
      const rarities = essenceManager.ESSENCE_NAMES;
      let craftResults = [];
      let inventory = essenceManager.getEssenceInventory(electronStore);
      for (const r of rarities) {
        const res = essenceManager.addEssences(electronStore, r, each);
        inventory = res.inventory;
        if (res.craftResults && res.craftResults.length) {
          craftResults = craftResults.concat(res.craftResults);
        }
      }
      // Broadcast para todas as janelas interessadas
      BrowserWindow.getAllWindows().forEach(win => {
        if (win && win.webContents) {
          win.webContents.send('essence-generated', { inventory, craftResults });
        }
      });
      return { success: true, inventory, craftResults };
    } catch (error) {
      console.error('Erro no cheat de essências:', error);
      return { success: false, error: String(error) };
    }
  });

  /**
   * Verificar essência válida para pet (síncrono via handle)
   */
  ipcMain.handle('get-valid-essence-for-pet', async (event, pet) => {
    return essenceManager.getValidEssenceForPet(electronStore, pet);
  });

  /**
   * Obter todos os pets disponíveis
   */
  ipcMain.handle('get-all-pets', async () => {
    try {
      return await petManager.getAllPets();
    } catch (error) {
      console.error('Erro ao buscar todos os pets:', error);
      return [];
    }
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
      const result = essenceManager.addEssences(electronStore, pet.rarity, amount);
      
      // Deletar o pet
      await petManager.deletePet(petId);

      const currentPet = appState.currentPet;
      if (currentPet && currentPet.petId === petId) {
        appState.currentPet = null;
      }

      console.log(`Pet ${pet.name} deletado. Recompensa: ${amount}x Essência ${pet.rarity}`);
      
      // Log de auto-crafts
      if (result.craftResults && result.craftResults.length > 0) {
        result.craftResults.forEach(craft => {
          console.log(`Auto-craft: ${craft.amount}x Essência ${craft.to} (de ${craft.from})`);
        });
      }

      // Enviar recompensa para a janela que solicitou
      event.sender.send('essence-reward', {
        rarity: pet.rarity,
        amount,
        inventory: result.inventory,
        craftResults: result.craftResults || []
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
