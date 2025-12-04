/**
 * Test Page - Segunda página para testar roteador
 */

function testPage(state = {}) {
  return `
    <div class="page test-page">
      <div class="page-header">
        <h1>🧪 Test Page</h1>
        <p>Testando o roteador SPA</p>
      </div>

      <div class="page-content">
        <div class="info-card">
          <h2>Página de Teste</h2>
          <p>Esta página demonstra que o roteador está funcionando corretamente.</p>
          <p>Navegação entre páginas sem recarregar a aplicação!</p>
        </div>

        <div class="navigation-buttons">
          <button class="nav-btn back-btn" onclick="router.back()">
            ⬅️ Voltar
          </button>
          
          <button class="nav-btn home-btn" onclick="router.navigate('/home')">
            🏠 Home
          </button>
          
          <button class="nav-btn debug-btn" onclick="router.navigate('/debug')">
            🐛 Debug
          </button>
        </div>

        <div class="test-section">
          <h3>Estado Compartilhado</h3>
          <p>Os valores abaixo são compartilhados com todas as páginas:</p>
          <div class="state-box">
            <p>Moedas: <strong>${gameState.get('coins')}</strong></p>
            <p>Mini-mode: <strong>${gameState.get('isMiniMode') ? 'On' : 'Off'}</strong></p>
            <p>Pet: <strong>${gameState.get('currentPet')?.name || 'Nenhum'}</strong></p>
          </div>
        </div>

        <div class="test-section">
          <h3>Teste de Navegação</h3>
          <p>Histórico de páginas visitadas:</p>
          <div class="history-box">
            <code>${router.getHistory().join(' → ')}</code>
          </div>
        </div>

        <div class="test-section">
          <h3>Testar Mudanças de Estado</h3>
          <button class="action-btn" onclick="
            gameState.set('coins', Math.floor(Math.random() * 1000));
          ">
            🎲 Sorteiar moedas
          </button>
          <button class="action-btn" onclick="
            gameState.setMultiple({
              'currentPet': { id: '000' + Math.floor(Math.random() * 999), name: 'Pet #' + Math.random().toString(36).substr(2, 5), level: Math.floor(Math.random() * 50) + 1 },
              'coins': Math.floor(Math.random() * 500)
            });
          ">
            🎪 Sorteiar tudo
          </button>
        </div>
      </div>
    </div>

    <style>
      .test-page {
        padding: 20px;
      }

      .page-header {
        text-align: center;
        margin-bottom: 30px;
        border-bottom: 2px solid #3a3a4a;
        padding-bottom: 20px;
      }

      .page-header h1 {
        font-size: 2.5em;
        margin: 0;
      }

      .page-header p {
        color: #999;
        margin: 5px 0 0 0;
      }

      .info-card {
        background: linear-gradient(135deg, #4a4a5a 0%, #3a3a4a 100%);
        padding: 20px;
        border-radius: 10px;
        margin-bottom: 20px;
        text-align: center;
      }

      .navigation-buttons {
        display: flex;
        gap: 10px;
        margin-bottom: 20px;
        flex-wrap: wrap;
        justify-content: center;
      }

      .nav-btn {
        padding: 12px 20px;
        border: none;
        border-radius: 6px;
        cursor: pointer;
        font-size: 1em;
        transition: all 0.3s;
      }

      .back-btn {
        background: #5a4a7a;
        color: white;
      }

      .back-btn:hover {
        background: #6a5a8a;
      }

      .home-btn {
        background: #4a6a8a;
        color: white;
      }

      .home-btn:hover {
        background: #5a7aaa;
      }

      .debug-btn {
        background: #6a5a4a;
        color: white;
      }

      .debug-btn:hover {
        background: #7a6a5a;
      }

      .test-section {
        background: #2a3a4a;
        padding: 15px;
        border-radius: 8px;
        margin: 15px 0;
      }

      .test-section h3 {
        margin-top: 0;
      }

      .state-box {
        background: #1a2a3a;
        padding: 10px;
        border-radius: 4px;
        font-family: monospace;
        font-size: 0.9em;
      }

      .state-box p {
        margin: 5px 0;
      }

      .history-box {
        background: #1a2a3a;
        padding: 10px;
        border-radius: 4px;
        overflow-x: auto;
      }

      .history-box code {
        color: #8a8;
        font-size: 0.8em;
      }

      .action-btn {
        display: inline-block;
        padding: 10px 15px;
        margin: 5px;
        background: #3a5a7a;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        transition: all 0.3s;
      }

      .action-btn:hover {
        background: #4a6a8a;
      }

      .action-btn:active {
        transform: scale(0.98);
      }
    </style>
  `
}
