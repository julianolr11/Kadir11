/**
 * SPA IPC Handler - Expõe métodos de IPC para o renderer
 * Registra apenas handlers novos (não duplica os existentes)
 */

// Exportar para uso em main.js
function setupSPAIpcHandlers(ipcMain, petManager, store) {
  console.log('[SPA IPC] Configurando handlers novos...');

  /**
   * get-store-data
   * Retorna dados da store (moedas, settings)
   * NOVO - não existe no sistema antigo
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
   * update-coins-spa
   * Atualiza moedas na store (versão SPA)
   * NOVO - método separado do sistema antigo
   */
  ipcMain.handle('update-coins-spa', (event, coins) => {
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
      console.error('[SPA IPC] Erro em update-coins-spa:', error);
      return 0;
    }
  });

  /**
   * update-pet-spa
   * Atualiza dados do pet atual (versão SPA)
   * NOVO - método separado do sistema antigo
   */
  ipcMain.handle('update-pet-spa', (event, petData) => {
    try {
      const updated = petManager.updatePet(petData);
      
      // Broadcast para todas as windows
      const { BrowserWindow } = require('electron');
      BrowserWindow.getAllWindows().forEach(win => {
        win.webContents.send('pet-data', updated);
      });

      return updated;
    } catch (error) {
      console.error('[SPA IPC] Erro em update-pet-spa:', error);
      return null;
    }
  });

  /**
   * create-pet-spa
   * Cria novo pet (versão SPA)
   * NOVO - método separado do sistema antigo
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
   * select-pet-spa
   * Seleciona um pet como atual (versão SPA)
   * NOVO - método separado do sistema antigo
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

  console.log('[SPA IPC] ✅ 5 handlers novos registrados');
}

module.exports = { setupSPAIpcHandlers };
