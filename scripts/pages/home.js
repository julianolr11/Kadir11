/**
 * Home Page - Primeira página SPA
 * Página simples de teste do roteador
 */

function homePage(state = {}) {
  return `
    <div class="page home-page">
      <div class="page-header">
        <h1>🏠 Kadir11 SPA</h1>
        <p>Versão Single Page Application</p>
      </div>

      <div class="page-content">
        <div class="welcome-card">
          <h2>Bem-vindo!</h2>
          <p>Esta é a infraestrutura base da aplicação SPA.</p>
          <p>Use os botões abaixo para testar a navegação.</p>
        </div>

        <div class="navigation-grid">
          <button class="nav-btn" onclick="router.navigate('/home')">
            🏠 Home
          </button>
          
          <button class="nav-btn" onclick="router.navigate('/test')">
            🧪 Test Page
          </button>
          
          <button class="nav-btn" onclick="router.navigate('/debug')">
            🐛 Debug
          </button>
        </div>

        <div class="info-box">
          <h3>Estado Atual</h3>
          <div class="state-display">
            <p><strong>Página:</strong> ${gameState.get('currentPage')}</p>
            <p><strong>Mini-mode:</strong> ${gameState.get('isMiniMode') ? 'Ativo' : 'Inativo'}</p>
            <p><strong>Pet ativo:</strong> ${gameState.get('currentPet') ? gameState.get('currentPet').name : 'Nenhum'}</p>
            <p><strong>Moedas:</strong> ${gameState.get('coins')}</p>
          </div>
        </div>

        <div class="router-info">
          <h3>Informações do Router</h3>
          <div class="router-display">
            <p><strong>Página atual:</strong> ${router.getCurrentPage()}</p>
            <p><strong>Histórico:</strong> ${router.getHistory().join(' → ')}</p>
          </div>
        </div>

        <div class="test-actions">
          <h3>Ações de Teste</h3>
          <button class="test-btn" onclick="
            gameState.set('coins', gameState.get('coins') + 10);
          ">
            ➕ Adicionar 10 moedas
          </button>
          <button class="test-btn" onclick="
            gameState.set('isMiniMode', !gameState.get('isMiniMode'));
          ">
            🎛️ Toggle Mini-mode
          </button>
          <button class="test-btn" onclick="
            gameState.set('currentPet', { 
              id: '000001', 
              name: 'Teste Pet',
              level: 5
            });
          ">
            🐾 Simular pet
          </button>
          <button class="test-btn" onclick="router.back()">
            ⬅️ Voltar
          </button>
        </div>
      </div>
    </div>

    <style>
      .home-page {
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

      .welcome-card {
        background: linear-gradient(135deg, #2a3a4a 0%, #3a4a5a 100%);
        padding: 20px;
        border-radius: 10px;
        margin-bottom: 20px;
        text-align: center;
      }

      .navigation-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
        gap: 10px;
        margin: 20px 0;
      }

      .nav-btn {
        background: #4a6a8a;
        color: white;
        border: none;
        padding: 15px;
        border-radius: 8px;
        cursor: pointer;
        font-size: 1em;
        transition: all 0.3s;
      }

      .nav-btn:hover {
        background: #5a7aaa;
        transform: translateY(-2px);
      }

      .info-box {
        background: #2a3a4a;
        padding: 15px;
        border-radius: 8px;
        margin: 15px 0;
      }

      .state-display {
        display: grid;
        gap: 8px;
      }

      .state-display p {
        margin: 0;
        font-family: monospace;
        font-size: 0.9em;
      }

      .router-info {
        background: #1a2a3a;
        padding: 15px;
        border-radius: 8px;
        margin: 15px 0;
      }

      .router-display {
        display: grid;
        gap: 8px;
      }

      .router-display p {
        margin: 0;
        font-family: monospace;
        font-size: 0.85em;
        word-break: break-all;
      }

      .test-actions {
        background: #3a4a5a;
        padding: 15px;
        border-radius: 8px;
        margin-top: 15px;
      }

      .test-btn {
        display: block;
        width: 100%;
        padding: 12px;
        margin: 8px 0;
        background: #2a5a7a;
        color: white;
        border: none;
        border-radius: 6px;
        cursor: pointer;
        font-size: 0.9em;
        transition: all 0.3s;
      }

      .test-btn:hover {
        background: #3a6a8a;
      }

      .test-btn:active {
        transform: scale(0.98);
      }
    </style>
  `
}
