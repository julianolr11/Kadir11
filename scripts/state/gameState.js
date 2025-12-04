/**
 * Estado Global - GameState
 * Centro único de verdade para todos os dados da aplicação
 */

class GameStateManager {
  constructor() {
    this.state = {
      // Dados do pet
      currentPet: null,
      pets: [],
      
      // UI
      currentPage: 'home',
      isMiniMode: false,
      
      // Game data
      coins: 0,
      inventory: [],
      
      // Page states
      battleState: {
        inProgress: false,
        enemy: null,
        currentTurn: 0
      },
      journeyState: {
        currentLocation: 'start',
        encounteredPets: []
      },
      trainingState: {
        currentType: null,
        sessionsCompleted: 0
      },
      
      // Settings
      settings: {
        soundEnabled: true,
        musicEnabled: true,
        language: 'pt-br'
      }
    }

    this.listeners = []
  }

  /**
   * Obtém valor do estado
   * @param {string} path - Caminho no estado (ex: 'currentPet.name', 'coins')
   * @returns {*} Valor
   */
  get(path) {
    const keys = path.split('.')
    let value = this.state
    
    for (const key of keys) {
      if (value && typeof value === 'object' && key in value) {
        value = value[key]
      } else {
        return undefined
      }
    }
    
    return value
  }

  /**
   * Define valor no estado e notifica listeners
   * @param {string} path - Caminho no estado
   * @param {*} value - Novo valor
   */
  set(path, value) {
    const keys = path.split('.')
    const lastKey = keys.pop()
    let target = this.state
    
    // Navega até o objeto pai
    for (const key of keys) {
      if (!(key in target)) {
        target[key] = {}
      }
      target = target[key]
    }
    
    const oldValue = target[lastKey]
    target[lastKey] = value
    
    console.log(`[GameState] ${path}: ${JSON.stringify(oldValue)} → ${JSON.stringify(value)}`)
    
    // Notifica listeners
    this.notifyListeners(path, value, oldValue)
  }

  /**
   * Atualiza múltiplas valores de uma vez
   * @param {Object} updates - { path: value, ... }
   */
  setMultiple(updates) {
    Object.entries(updates).forEach(([path, value]) => {
      this.set(path, value)
    })
  }

  /**
   * Registra listener para mudanças
   * @param {string} path - Caminho a observar (ou '*' para tudo)
   * @param {Function} callback - Função chamada ao mudar
   */
  onChange(path, callback) {
    this.listeners.push({ path, callback })
  }

  /**
   * Notifica listeners relevantes
   */
  notifyListeners(path, newValue, oldValue) {
    this.listeners.forEach(({ path: listenerPath, callback }) => {
      // Notifica se listener está para '*' ou o path começa com listener path
      if (listenerPath === '*' || path.startsWith(listenerPath)) {
        try {
          callback(newValue, oldValue, path)
        } catch (error) {
          console.error('[GameState] Erro em listener:', error)
        }
      }
    })
  }

  /**
   * Retorna toda estado (para debug)
   */
  getState() {
    return JSON.parse(JSON.stringify(this.state))
  }

  /**
   * Reseta estado para padrão
   */
  reset() {
    this.state = {
      currentPet: null,
      pets: [],
      currentPage: 'home',
      isMiniMode: false,
      coins: 0,
      inventory: [],
      battleState: { inProgress: false, enemy: null, currentTurn: 0 },
      journeyState: { currentLocation: 'start', encounteredPets: [] },
      trainingState: { currentType: null, sessionsCompleted: 0 },
      settings: { soundEnabled: true, musicEnabled: true, language: 'pt-br' }
    }
    console.log('[GameState] Estado resetado')
  }

  /**
   * Salva estado em localStorage (para persistência)
   */
  save() {
    try {
      localStorage.setItem('kadir11_state', JSON.stringify(this.state))
      console.log('[GameState] Estado salvo em localStorage')
    } catch (error) {
      console.error('[GameState] Erro ao salvar:', error)
    }
  }

  /**
   * Carrega estado de localStorage
   */
  load() {
    try {
      const saved = localStorage.getItem('kadir11_state')
      if (saved) {
        this.state = { ...this.state, ...JSON.parse(saved) }
        console.log('[GameState] Estado carregado de localStorage')
      }
    } catch (error) {
      console.error('[GameState] Erro ao carregar:', error)
    }
  }

  /**
   * Debug: mostra estado atual
   */
  debug() {
    console.log('[GameState] Estado atual:', this.getState())
  }
}

// Exporta instância única (singleton)
const gameState = new GameStateManager()

// Expõe globalmente
window.gameState = gameState