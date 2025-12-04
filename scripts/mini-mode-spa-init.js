/**
 * Mini-Mode SPA Initialization
 * Integra SPABridge ao mini-mode para sincronização de dados
 */

// Mini-mode data sync with main app
class MiniModeBridge {
  constructor() {
    this.ready = false;
    this.petData = null;
    this.coins = 0;
    this.items = {};
  }

  /**
   * Inicializar bridge no mini-mode
   */
  async init() {
    try {
      console.log('[MiniModeBridge] Inicializando...');

      // Aguardar um pouco para garantir que o preload.js está pronto
      await new Promise(resolve => setTimeout(resolve, 100));

      if (!window.electronAPI) {
        throw new Error('window.electronAPI não disponível');
      }

      // Carregar dados iniciais
      await this.loadInitialData();

      // Setup listeners de broadcast
      this.setupListeners();

      this.ready = true;
      console.log('[MiniModeBridge] ✅ Conectado e pronto');
      return true;
    } catch (error) {
      console.error('[MiniModeBridge] Erro ao inicializar:', error);
      this.ready = false;
      return false;
    }
  }

  /**
   * Carregar dados iniciais do pet e moedas
   */
  async loadInitialData() {
    try {
      // Carregar pet atual
      const petResponse = await window.electronAPI.invoke('get-current-pet');
      if (petResponse) {
        this.petData = petResponse;
        console.log('[MiniModeBridge] Pet carregado:', petResponse.name);
      }

      // Carregar store data (moedas)
      const storeResponse = await window.electronAPI.invoke('get-store-data');
      if (storeResponse) {
        this.coins = storeResponse.coins || 0;
        console.log('[MiniModeBridge] Store carregada: moedas =', this.coins);
      }
    } catch (error) {
      console.error('[MiniModeBridge] Erro ao carregar dados iniciais:', error);
      throw error;
    }
  }

  /**
   * Setup listeners de broadcast para sincronização em tempo real
   */
  setupListeners() {
    // Listener: Pet atualizado (em qualquer janela)
    window.electronAPI.on('pet-data', (event, pet) => {
      this.petData = pet;
      console.log('[MiniModeBridge] Pet atualizado via broadcast:', pet.name);
      // Callback para UI update
      if (window.updateMiniModeUI) {
        window.updateMiniModeUI(pet);
      }
    });

    // Listener: Moedas atualizadas
    window.electronAPI.on('coins-updated', (event, coins) => {
      this.coins = coins;
      console.log('[MiniModeBridge] Moedas atualizadas via broadcast:', coins);
    });

    // Listener: Lista de pets atualizada
    window.electronAPI.on('pets-list-updated', (event, pets) => {
      console.log('[MiniModeBridge] Lista de pets atualizada:', pets.length, 'pets');
    });

    // Listener: Inventário atualizado
    window.electronAPI.on('inventory-updated', (event, items) => {
      this.items = items;
      console.log('[MiniModeBridge] Inventário atualizado');
    });
  }

  /**
   * Atualizar pet (chamado do mini-mode menu)
   */
  async updatePet(petData) {
    try {
      if (!this.ready) {
        console.warn('[MiniModeBridge] Bridge não pronto, usando IPC direto');
        return await window.electronAPI.invoke('update-pet-spa', petData);
      }

      const result = await window.electronAPI.invoke('update-pet-spa', petData);
      console.log('[MiniModeBridge] Pet atualizado:', result.name);
      return result;
    } catch (error) {
      console.error('[MiniModeBridge] Erro ao atualizar pet:', error);
      return null;
    }
  }

  /**
   * Selecionar novo pet ativo
   */
  async selectPet(petId) {
    try {
      if (!this.ready) {
        console.warn('[MiniModeBridge] Bridge não pronto');
        return null;
      }

      const result = await window.electronAPI.invoke('select-pet-spa', petId);
      console.log('[MiniModeBridge] Pet selecionado:', result.name);
      return result;
    } catch (error) {
      console.error('[MiniModeBridge] Erro ao selecionar pet:', error);
      return null;
    }
  }

  /**
   * Obter status do bridge
   */
  getStatus() {
    return {
      ready: this.ready,
      hasElectronAPI: !!window.electronAPI,
      petData: this.petData,
      coins: this.coins,
      itemsCount: Object.keys(this.items).length,
    };
  }
}

// Expor globalmente
window.MiniModeBridge = MiniModeBridge;

// Auto-inicializar ao carregar
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    // Será inicializado pelo mini-mode.js
  });
}
