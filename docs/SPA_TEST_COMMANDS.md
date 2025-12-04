/**
 * SPA Test Helper
 * Script para testar e validar infraestrutura base
 * 
 * Use no console do DevTools:
 * - initSPA() para ativar SPA
 * - closeSPA() para desativar
 * - router.navigate('/test') para navegar
 * - gameState.debug() para ver estado
 */

console.log(`
╔═══════════════════════════════════════╗
║  KADIR11 SPA - PHASE 1 TEST HELPER   ║
╚═══════════════════════════════════════╝

Comandos disponíveis:

1. ATIVAR/DESATIVAR SPA:
   initSPA()    - Ativa modo SPA
   closeSPA()   - Volta ao tray

2. NAVEGAR:
   router.navigate('/home')   - Ir para home
   router.navigate('/test')   - Ir para test
   router.navigate('/debug')  - Ir para debug
   router.back()              - Voltar

3. ESTADO:
   gameState.debug()          - Mostra estado completo
   gameState.get('coins')     - Obtém valor
   gameState.set('coins', 100) - Define valor
   gameState.getState()       - Estado em JSON

4. ROTEADOR:
   router.listRoutes()        - Lista rotas registradas
   router.getHistory()        - Histórico de navegação
   router.getCurrentPage()    - Página atual

5. EXEMPLOS:
   initSPA()
   router.navigate('/test')
   gameState.set('coins', 500)
   router.back()
   closeSPA()

Pressione F12 para abrir DevTools
`)
