/**
 * SPA IPC Handler - Expõe métodos de IPC para o renderer
 * Deve ser registrado no main.js como handlers
 */

// Exportar para uso em main.js
function setupSPAIpcHandlers(ipcMain, petManager, store) {
  console.log('[SPA IPC] Configurando handlers...');

  /**
   * get-current-pet
   * Retorna o pet atualmente selecionado
   */
  ipcMain.handle('get-current-pet', () => {
    try {
      const petId = store.get('currentPet');
      if (!petId) return null;

      const pet = petManager.getPet(petId);
      return pet || null;
    } catch (error) {
      console.error('[SPA IPC] Erro em get-current-pet:', error);
      return null;
    }
  });

  /**
   * get-all-pets
   * Retorna lista de todos os pets
   */
  ipcMain.handle('get-all-pets', () => {
    try {
      const pets = petManager.getAllPets();
      return pets || [];
    } catch (error) {
      console.error('[SPA IPC] Erro em get-all-pets:', error);
      return [];
    }
  });

  /**
   * get-store-data
   * Retorna dados da store (moedas, settings)
   */
  ipcMain.handle('get-store-data', () => {
    try {
      return {
        coins: store.get('coins') || 0,
        isMiniMode: store.get('isMiniMode') || false,
      };
    } catch (error) {
      console.error('[SPA IPC] Erro em get-store-data:', error);
      return { coins: 0, isMiniMode: false };
    }
  });

  /**
   * update-pet
   * Atualiza dados do pet atual
   */
  ipcMain.handle('update-pet', (event, petData) => {
    try {
      const updated = petManager.updatePet(petData);
      
      // Broadcast para todas as windows
      const { BrowserWindow } = require('electron');
      BrowserWindow.getAllWindows().forEach(win => {
        win.webContents.send('pet-data', updated);
      });

      return updated;
    } catch (error) {
      console.error('[SPA IPC] Erro em update-pet:', error);
      return null;
    }
  });

  /**
   * update-coins
   * Atualiza moedas na store
   */
  ipcMain.handle('update-coins', (event, coins) => {
    try {
      store.set('coins', Math.max(0, coins));
      const updated = store.get('coins');

      // Broadcast
      const { BrowserWindow } = require('electron');
      BrowserWindow.getAllWindows().forEach(win => {
        win.webContents.send('coins-updated', updated);
      });

      return updated;
    } catch (error) {
      console.error('[SPA IPC] Erro em update-coins:', error);
      return 0;
    }
  });

  /**
   * create-pet
   * Cria novo pet
   */
  ipcMain.handle('create-pet-spa', (event, petData) => {
    try {
      const newPet = petManager.createPet(petData);
      
      // Broadcast lista atualizada
      const { BrowserWindow } = require('electron');
      const pets = petManager.getAllPets();
      BrowserWindow.getAllWindows().forEach(win => {
        win.webContents.send('pets-list-updated', pets);
      });

      return newPet;
    } catch (error) {
      console.error('[SPA IPC] Erro em create-pet-spa:', error);
      return null;
    }
  });

  /**
   * select-pet
   * Seleciona um pet como atual
   */
  ipcMain.handle('select-pet-spa', (event, petId) => {
    try {
      const pet = petManager.getPet(petId);
      if (!pet) throw new Error('Pet não encontrado');

      store.set('currentPet', petId);

      // Broadcast
      const { BrowserWindow } = require('electron');
      BrowserWindow.getAllWindows().forEach(win => {
        win.webContents.send('pet-data', pet);
      });

      return pet;
    } catch (error) {
      console.error('[SPA IPC] Erro em select-pet-spa:', error);
      return null;
    }
  });

  console.log('[SPA IPC] ✅ 7 handlers registrados');
}

module.exports = { setupSPAIpcHandlers };
