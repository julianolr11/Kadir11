/**
 * SPA Bridge - Integração IPC com Main Process
 * Sincroniza dados entre SPA e petManager do Electron
 */

class SPABridge {
  constructor() {
    this.ready = false;
    this.listeners = new Map();
  }

  /**
   * Inicializa o bridge IPC
   * Deve ser chamado após initSPA()
   */
  async init() {
    if (!window.electronAPI) {
      console.error('[SPABridge] electronAPI não disponível');
      return false;
    }

    try {
      // Carregar dados iniciais
      await this.loadInitialData();

      // Registrar listeners de sincronização
      this.setupListeners();

      this.ready = true;
      console.log('[SPABridge] Inicializado com sucesso');
      return true;
    } catch (error) {
      console.error('[SPABridge] Erro na inicialização:', error);
      return false;
    }
  }

  /**
   * Carrega dados iniciais do main process
   */
  async loadInitialData() {
    const gameState = window.gameState;

    try {
      // Carregar pet atual
      const currentPetResponse = await window.electronAPI.invoke('get-current-pet');
      if (currentPetResponse) {
        gameState.set('currentPet', currentPetResponse);
      }

      // Carregar lista de pets
      const petsResponse = await window.electronAPI.invoke('get-all-pets');
      if (petsResponse && Array.isArray(petsResponse)) {
        gameState.set('pets', petsResponse);
      }

      // Carregar dados da store (moedas, settings)
      const storeResponse = await window.electronAPI.invoke('get-store-data');
      if (storeResponse) {
        if (storeResponse.coins !== undefined) {
          gameState.set('coins', storeResponse.coins);
        }
        if (storeResponse.isMiniMode !== undefined) {
          gameState.set('isMiniMode', storeResponse.isMiniMode);
        }
      }

      console.log('[SPABridge] Dados iniciais carregados');
    } catch (error) {
      console.error('[SPABridge] Erro ao carregar dados iniciais:', error);
    }
  }

  /**
   * Configura listeners para sincronização
   */
  setupListeners() {
    const gameState = window.gameState;

    // Listener: pet-data (vindo do main process)
    window.electronAPI.on('pet-data', (event, newPetData) => {
      gameState.set('currentPet', newPetData);
      console.log('[SPABridge] Pet atualizado via IPC:', newPetData.name);
    });

    // Listener: moedas atualizadas
    window.electronAPI.on('coins-updated', (event, coins) => {
      gameState.set('coins', coins);
      console.log('[SPABridge] Moedas atualizadas:', coins);
    });

    // Listener: inventário atualizado
    window.electronAPI.on('inventory-updated', (event, inventory) => {
      gameState.set('inventory', inventory);
      console.log('[SPABridge] Inventário atualizado');
    });

    // Listener: lista de pets atualizada
    window.electronAPI.on('pets-list-updated', (event, pets) => {
      gameState.set('pets', pets);
      console.log('[SPABridge] Lista de pets atualizada');
    });
  }

  /**
   * Atualiza pet no main process
   * @param {Object} petData - Dados do pet
   */
  async updatePet(petData) {
    if (!this.ready) {
      console.warn('[SPABridge] Bridge não está pronto');
      return false;
    }

    try {
      const result = await window.electronAPI.invoke('update-pet', petData);
      console.log('[SPABridge] Pet atualizado no main process:', result);
      return result;
    } catch (error) {
      console.error('[SPABridge] Erro ao atualizar pet:', error);
      return false;
    }
  }

  /**
   * Atualiza moedas no main process
   * @param {number} coins - Quantidade de moedas
   */
  async updateCoins(coins) {
    if (!this.ready) {
      console.warn('[SPABridge] Bridge não está pronto');
      return false;
    }

    try {
      const result = await window.electronAPI.invoke('update-coins', coins);
      console.log('[SPABridge] Moedas atualizadas:', result);
      return result;
    } catch (error) {
      console.error('[SPABridge] Erro ao atualizar moedas:', error);
      return false;
    }
  }

  /**
   * Cria novo pet via main process
   * @param {Object} petData - Dados do novo pet
   */
  async createPet(petData) {
    if (!this.ready) {
      console.warn('[SPABridge] Bridge não está pronto');
      return null;
    }

    try {
      const newPet = await window.electronAPI.invoke('create-pet-spa', petData);
      console.log('[SPABridge] Pet criado:', newPet.name);
      return newPet;
    } catch (error) {
      console.error('[SPABridge] Erro ao criar pet:', error);
      return null;
    }
  }

  /**
   * Seleciona um pet como atual
   * @param {string} petId - ID do pet
   */
  async selectPet(petId) {
    if (!this.ready) {
      console.warn('[SPABridge] Bridge não está pronto');
      return false;
    }

    try {
      const result = await window.electronAPI.invoke('select-pet-spa', petId);
      console.log('[SPABridge] Pet selecionado:', result);
      return result;
    } catch (error) {
      console.error('[SPABridge] Erro ao selecionar pet:', error);
      return false;
    }
  }

  /**
   * Sincroniza estado completo com localStorage (fallback)
   */
  syncToLocalStorage() {
    const gameState = window.gameState;
    const state = {
      currentPet: gameState.get('currentPet'),
      pets: gameState.get('pets'),
      coins: gameState.get('coins'),
      inventory: gameState.get('inventory'),
      battlesWon: gameState.get('battlesWon'),
      timestamp: Date.now(),
    };

    try {
      localStorage.setItem('spa-state-backup', JSON.stringify(state));
      console.log('[SPABridge] Estado sincronizado com localStorage');
      return true;
    } catch (error) {
      console.error('[SPABridge] Erro ao sincronizar localStorage:', error);
      return false;
    }
  }

  /**
   * Restaura estado do localStorage (fallback)
   */
  restoreFromLocalStorage() {
    try {
      const backup = localStorage.getItem('spa-state-backup');
      if (!backup) return false;

      const state = JSON.parse(backup);
      const gameState = window.gameState;

      gameState.setMultiple(state);
      console.log('[SPABridge] Estado restaurado do localStorage');
      return true;
    } catch (error) {
      console.error('[SPABridge] Erro ao restaurar localStorage:', error);
      return false;
    }
  }

  /**
   * Status do bridge
   */
  getStatus() {
    return {
      ready: this.ready,
      hasElectronAPI: !!window.electronAPI,
      gameState: {
        currentPet: window.gameState?.get('currentPet')?.name || 'Nenhum',
        coins: window.gameState?.get('coins') || 0,
        pets: (window.gameState?.get('pets') || []).length,
      },
      timestamp: new Date().toLocaleString('pt-BR'),
    };
  }
}

// Exportar globalmente
if (typeof window !== 'undefined') {
  window.SPABridge = SPABridge;
  window.spaBridge = null; // Será inicializado em spa-init.js
}
