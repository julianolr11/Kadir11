/**
 * SPA Router - Sistema de roteamento vanilla para Kadir11
 * Controla navegação entre páginas sem criar/destruir windows
 */

class Router {
  constructor() {
    this.currentPage = 'home'
    this.routes = new Map()
    this.pageContainer = null
    this.history = ['home']
    this.listeners = []
    
    // Listener para mudanças de hash (para voltar/avançar do navegador)
    window.addEventListener('hashchange', () => this.handleHashChange())
    
    // Initial hash setup
    if (!location.hash) {
      location.hash = '#/home'
    }
  }

  /**
   * Registra uma rota e seu componente
   * @param {string} path - Caminho da rota (ex: '/home', '/status')
   * @param {Function} pageComponent - Função que renderiza a página
   */
  register(path, pageComponent) {
    if (!path.startsWith('/')) {
      path = '/' + path
    }
    this.routes.set(path, pageComponent)
    console.log(`[Router] Rota registrada: ${path}`)
  }

  /**
   * Registra múltiplas rotas de uma vez
   * @param {Object} routes - Objeto com { path: component, ... }
   */
  registerAll(routes) {
    Object.entries(routes).forEach(([path, component]) => {
      this.register(path, component)
    })
  }

  /**
   * Navega para uma página
   * @param {string} path - Caminho da rota (ex: '/status')
   * @param {Object} state - Dados opcionais para passar à página
   */
  navigate(path, state = {}) {
    if (!path.startsWith('/')) {
      path = '/' + path
    }

    if (!this.routes.has(path)) {
      console.warn(`[Router] Rota não encontrada: ${path}`)
      return false
    }

    this.currentPage = path
    this.history.push(path)
    
    // Atualiza URL sem recarregar
    window.history.pushState({ path, state }, '', `#${path}`)
    
    // Renderiza página
    this.render(path, state)
    
    // Notifica listeners
    this.notifyListeners(path, state)
    
    console.log(`[Router] Navegou para: ${path}`)
    return true
  }

  /**
   * Volta à página anterior
   */
  back() {
    if (this.history.length > 1) {
      this.history.pop() // Remove página atual
      const previousPage = this.history[this.history.length - 1]
      window.history.back()
      this.render(previousPage)
      this.notifyListeners(previousPage)
    }
  }

  /**
   * Avança à próxima página
   */
  forward() {
    window.history.forward()
  }

  /**
   * Renderiza uma página
   * @param {string} path - Caminho da rota
   * @param {Object} state - Dados da página
   */
  render(path, state = {}) {
    const pageComponent = this.routes.get(path)
    
    if (!pageComponent) {
      console.error(`[Router] Componente não encontrado para: ${path}`)
      return
    }

    // Limpa container anterior
    if (this.pageContainer) {
      this.pageContainer.innerHTML = ''
    }

    try {
      // Executa componente (deve retornar HTML string ou elemento)
      const result = pageComponent(state)
      
      if (typeof result === 'string') {
        this.pageContainer.innerHTML = result
      } else if (result instanceof HTMLElement) {
        this.pageContainer.appendChild(result)
      }

      // Scroll para topo
      window.scrollTo(0, 0)
      
      console.log(`[Router] Página renderizada: ${path}`)
    } catch (error) {
      console.error(`[Router] Erro ao renderizar ${path}:`, error)
      this.pageContainer.innerHTML = `<div class="error"><p>Erro ao carregar página: ${error.message}</p></div>`
    }
  }

  /**
   * Handler para mudanças de hash
   */
  handleHashChange() {
    const path = location.hash.replace('#', '') || '/home'
    if (!path.startsWith('/')) {
      location.hash = '#' + path
      return
    }
    this.currentPage = path
    this.render(path)
    this.notifyListeners(path)
  }

  /**
   * Registra listener para mudanças de rota
   * @param {Function} callback - Função chamada ao mudar página
   */
  onChange(callback) {
    this.listeners.push(callback)
  }

  /**
   * Notifica todos listeners de mudança
   */
  notifyListeners(path, state = {}) {
    this.listeners.forEach(callback => {
      try {
        callback(path, state)
      } catch (error) {
        console.error('[Router] Erro em listener:', error)
      }
    })
  }

  /**
   * Retorna página atual
   */
  getCurrentPage() {
    return this.currentPage
  }

  /**
   * Define container onde páginas serão renderizadas
   * @param {Element|string} selector - Elemento ou seletor CSS
   */
  setContainer(selector) {
    if (typeof selector === 'string') {
      this.pageContainer = document.querySelector(selector)
    } else {
      this.pageContainer = selector
    }

    if (!this.pageContainer) {
      throw new Error(`[Router] Container não encontrado: ${selector}`)
    }

    console.log('[Router] Container definido:', this.pageContainer)
  }

  /**
   * Debug: lista todas rotas registradas
   */
  listRoutes() {
    console.log('[Router] Rotas registradas:')
    this.routes.forEach((_, path) => {
      console.log(`  - ${path}`)
    })
  }

  /**
   * Debug: retorna histórico de navegação
   */
  getHistory() {
    return [...this.history]
  }

  /**
   * Debug: retorna lista de rotas registradas
   */
  getRoutes() {
    return Array.from(this.routes.keys())
  }
}

// Exporta instância única (singleton)
const router = new Router()

// Expõe globalmente
window.router = router