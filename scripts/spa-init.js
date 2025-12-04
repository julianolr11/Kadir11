/**
 * SPA Initializer
 * Script de inicialização SPA
 * Separa a lógica de inline scripts para respeitar CSP
 */

// Expõe funções globalmente
window.initSPA = function() {
  const container = document.getElementById('spa-app-container')
  const trayContainer = document.querySelector('.tray-container')
  
  if (!container) {
    console.error('[SPA] Container não encontrado: #spa-app-container')
    return
  }
  
  // Esconde tray e mostra SPA
  if (trayContainer) trayContainer.style.display = 'none'
  container.style.display = 'block'
  
  // Configura container do roteador
  router.setContainer(container)
  
  // Registra páginas
  router.registerAll({
    '/home': homePage,
    '/test': testPage,
    '/debug': debugPage,
    '/status': statusPage,
    '/items': itemsPage,
    '/store': storePage,
    '/nests': nestsPage,
    '/pen': penPage,
    '/bestiary': bestiaryPage,
    '/training-menu': trainingMenuPage,
    '/training-force': trainingForcePage,
    '/training-defense': trainingDefensePage,
    '/training-attributes': trainingAttributesPage,
    '/battle-menu': battleMenuPage,
    '/battle-arena': battleArenaPage,
    '/journey-menu': journeyMenuPage,
    '/journey-progress': journeyProgressPage,
    '/hatch-egg': hatchEggPage,
    '/settings': settingsPage,
  })
  
  // Inicializar SPA Bridge (integração IPC)
  if (window.SPABridge && !window.spaBridge) {
    window.spaBridge = new SPABridge()
    window.spaBridge.init().then(success => {
      if (success) {
        console.log('[SPA] Bridge IPC conectado ✅')
      } else {
        console.warn('[SPA] Bridge IPC falhou, usando localStorage')
        window.spaBridge.restoreFromLocalStorage()
      }
    })
  }
  
  // Navega para home
  router.navigate('/home')
  
  console.log('[SPA] Inicializado com sucesso')
}

window.closeSPA = function() {
  const container = document.getElementById('spa-app-container')
  const trayContainer = document.querySelector('.tray-container')
  
  if (!container) {
    console.error('[SPA] Container não encontrado')
    return
  }

  // Sincronizar estado antes de fechar
  if (window.spaBridge) {
    window.spaBridge.syncToLocalStorage()
  }
  
  container.style.display = 'none'
  if (trayContainer) trayContainer.style.display = 'flex'
  
  console.log('[SPA] Fechado e estado sincronizado')
}

// Auto-debug no console
console.log(`
╔════════════════════════════════════════╗
║   KADIR11 SPA - PHASE 1 READY         ║
╚════════════════════════════════════════╝

✅ Router disponível
✅ GameState disponível
✅ Páginas carregadas

Para ativar SPA no console, execute:
  initSPA()
  
Para desativar:
  closeSPA()
`)
