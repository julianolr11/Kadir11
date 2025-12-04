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
    '/status': statusPage
  })
  
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
  
  container.style.display = 'none'
  if (trayContainer) trayContainer.style.display = 'flex'
  
  console.log('[SPA] Fechado')
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
