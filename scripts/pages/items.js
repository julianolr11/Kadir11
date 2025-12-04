/**
 * Items Page - SPA
 * Mostra inventário do jogador
 */

function itemsPage() {
  const gameState = window.gameState;
  const inventory = gameState.get('inventory') || [];
  const coins = gameState.get('coins') || 0;

  const itemsHTML = inventory.length > 0 
    ? inventory.map((item, index) => `
        <div style="
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 12px;
          padding: 12px;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 8px;
          margin-bottom: 8px;
          border-left: 4px solid #6c63ff;
        ">
          <div>
            <div style="color: #999; font-size: 0.85em; text-transform: uppercase;">Nome</div>
            <div style="font-weight: bold; color: #fff; margin-top: 4px;">${item.name || 'Item'}</div>
          </div>
          <div>
            <div style="color: #999; font-size: 0.85em; text-transform: uppercase;">Quantidade</div>
            <div style="font-weight: bold; color: #6c63ff; margin-top: 4px;">${item.quantity || 1}</div>
          </div>
          <div>
            <div style="color: #999; font-size: 0.85em; text-transform: uppercase;">Tipo</div>
            <div style="font-weight: bold; color: #00d4ff; margin-top: 4px; text-transform: capitalize;">${item.type || 'consumível'}</div>
          </div>
        </div>
      `).join('')
    : '<div style="text-align: center; color: #999; padding: 32px;">Inventário vazio</div>';

  return `
    <div style="
      width: 100%;
      height: 100%;
      background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
      padding: 24px;
      overflow-y: auto;
      color: #fff;
      font-family: 'Courier New', monospace;
    ">
      <div style="
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 32px;
        padding-bottom: 16px;
        border-bottom: 2px solid #6c63ff;
      ">
        <h1 style="margin: 0; font-size: 2em;">Inventário</h1>
        <div style="
          background: rgba(108, 99, 255, 0.2);
          padding: 8px 16px;
          border-radius: 8px;
          border: 1px solid #6c63ff;
          font-size: 0.9em;
        ">
          💰 <strong>${coins}</strong> coins
        </div>
      </div>

      <div style="max-width: 900px;">
        <div style="
          font-size: 0.9em;
          color: #999;
          margin-bottom: 16px;
          text-transform: uppercase;
          letter-spacing: 1px;
        ">
          ${inventory.length} item(ns) no inventário
        </div>
        ${itemsHTML}
      </div>

      <div style="
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 12px;
        margin-top: 32px;
        max-width: 900px;
      ">
        <button onclick="window.router.navigate('/home')" style="
          padding: 12px 24px;
          background: rgba(108, 99, 255, 0.2);
          border: 1px solid #6c63ff;
          color: #6c63ff;
          border-radius: 8px;
          cursor: pointer;
          font-weight: bold;
          font-family: 'Courier New', monospace;
          transition: all 0.3s ease;
        " onmouseover="this.style.background = 'rgba(108, 99, 255, 0.4)'" onmouseout="this.style.background = 'rgba(108, 99, 255, 0.2)'">
          ← Voltar
        </button>
        <button onclick="window.closeSPA()" style="
          padding: 12px 24px;
          background: rgba(255, 107, 107, 0.2);
          border: 1px solid #ff6b6b;
          color: #ff6b6b;
          border-radius: 8px;
          cursor: pointer;
          font-weight: bold;
          font-family: 'Courier New', monospace;
          transition: all 0.3s ease;
        " onmouseover="this.style.background = 'rgba(255, 107, 107, 0.4)'" onmouseout="this.style.background = 'rgba(255, 107, 107, 0.2)'">
          ✕ Fechar SPA
        </button>
      </div>
    </div>
  `;
}
