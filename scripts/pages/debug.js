/**
 * Debug Page - Para debugging
 */

function debugPage(state = {}) {
  const gameStateCopy = gameState.getState()
  const routerHistory = router.getHistory()
  
  return `
    <div class="page debug-page">
      <div class="page-header">
        <h1>🐛 Debug Console</h1>
        <p>Informações técnicas do SPA</p>
      </div>

      <div class="page-content">
        <div class="nav-buttons">
          <button class="btn back-btn" onclick="router.back()">⬅️ Voltar</button>
          <button class="btn home-btn" onclick="router.navigate('/home')">🏠 Home</button>
          <button class="btn refresh-btn" onclick="location.reload()">🔄 Recarregar</button>
        </div>

        <div class="debug-section">
          <h3>📊 Router Info</h3>
          <div class="debug-box">
            <p><strong>Página Atual:</strong> <code>${router.getCurrentPage()}</code></p>
            <p><strong>Histórico:</strong></p>
            <div class="history-list">
              ${routerHistory.map(page => `<span class="history-item">${page}</span>`).join(' → ')}
            </div>
            <p><strong>Rotas Registradas:</strong> ${router.routes.size}</p>
          </div>
        </div>

        <div class="debug-section">
          <h3>🎮 Game State</h3>
          <div class="debug-box">
            <details>
              <summary>Ver todo estado (JSON)</summary>
              <pre><code>${JSON.stringify(gameStateCopy, null, 2)}</code></pre>
            </details>
          </div>
        </div>

        <div class="debug-section">
          <h3>🌍 Window Info</h3>
          <div class="debug-box">
            <p><strong>URL:</strong> <code>${window.location.href}</code></p>
            <p><strong>Hash:</strong> <code>${window.location.hash}</code></p>
            <p><strong>User Agent:</strong> <code>${navigator.userAgent.substring(0, 50)}...</code></p>
            <p><strong>Plataforma:</strong> <code>${navigator.platform}</code></p>
          </div>
        </div>

        <div class="debug-section">
          <h3>⚙️ Ações de Debug</h3>
          <div class="action-buttons">
            <button class="action-btn" onclick="
              router.listRoutes();
              alert('Verifique o console (F12)');
            ">
              📋 Listar rotas
            </button>
            <button class="action-btn" onclick="
              console.log('Estado atual:', gameState.getState());
              console.log('Histórico:', router.getHistory());
              alert('Informações no console (F12)');
            ">
              📢 Log dados
            </button>
            <button class="action-btn" onclick="
              gameState.debug();
              alert('Estado no console (F12)');
            ">
              🔍 Debug estado
            </button>
            <button class="action-btn danger" onclick="
              if (confirm('Resetar estado?')) {
                gameState.reset();
                alert('Estado resetado');
              }
            ">
              ⚠️ Resetar estado
            </button>
          </div>
        </div>

        <div class="debug-section">
          <h3>📝 Console Output</h3>
          <div class="debug-box">
            <p style="color: #aaa; font-size: 0.85em;">Abra o Developer Tools (F12) para ver logs detalhados</p>
          </div>
        </div>
      </div>
    </div>

    <style>
      .debug-page {
        padding: 20px;
        background: #1a2a3a;
        color: #ccc;
      }

      .page-header {
        text-align: center;
        margin-bottom: 30px;
        border-bottom: 2px solid #3a3a4a;
        padding-bottom: 20px;
      }

      .page-header h1 {
        font-size: 2em;
        margin: 0;
        color: #fff;
      }

      .page-header p {
        color: #888;
        margin: 5px 0 0 0;
      }

      .nav-buttons {
        display: flex;
        gap: 10px;
        margin-bottom: 20px;
        flex-wrap: wrap;
      }

      .btn {
        padding: 10px 15px;
        border: none;
        border-radius: 6px;
        cursor: pointer;
        font-size: 0.95em;
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

      .refresh-btn {
        background: #5a7a4a;
        color: white;
      }

      .refresh-btn:hover {
        background: #6a8a5a;
      }

      .debug-section {
        background: #2a3a4a;
        padding: 15px;
        border-radius: 8px;
        margin: 15px 0;
        border-left: 4px solid #5a6a7a;
      }

      .debug-section h3 {
        margin-top: 0;
        color: #fff;
      }

      .debug-box {
        background: #1a2a3a;
        padding: 12px;
        border-radius: 4px;
        font-family: monospace;
        font-size: 0.85em;
        overflow-x: auto;
      }

      .debug-box p {
        margin: 8px 0;
      }

      .debug-box code {
        background: #0a1a2a;
        padding: 2px 6px;
        border-radius: 3px;
        color: #8f8;
      }

      .history-list {
        background: #0a1a2a;
        padding: 8px;
        border-radius: 4px;
        display: flex;
        flex-wrap: wrap;
        gap: 5px;
      }

      .history-item {
        background: #3a4a5a;
        padding: 4px 8px;
        border-radius: 3px;
        font-size: 0.8em;
      }

      .debug-box pre {
        background: #0a1a2a;
        padding: 10px;
        border-radius: 4px;
        overflow-x: auto;
        max-height: 300px;
        overflow-y: auto;
      }

      .debug-box code {
        color: #8f8;
      }

      .action-buttons {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
        gap: 10px;
      }

      .action-btn {
        padding: 10px;
        background: #3a5a7a;
        color: white;
        border: none;
        border-radius: 6px;
        cursor: pointer;
        transition: all 0.3s;
        font-size: 0.9em;
      }

      .action-btn:hover {
        background: #4a6a8a;
      }

      .action-btn.danger {
        background: #7a4a4a;
      }

      .action-btn.danger:hover {
        background: #8a5a5a;
      }

      .action-btn:active {
        transform: scale(0.98);
      }

      details {
        cursor: pointer;
      }

      details summary {
        color: #8f8;
        margin-bottom: 10px;
      }
    </style>
  `
}
