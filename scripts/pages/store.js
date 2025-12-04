/**
 * Store Page - SPA
 * Loja de items e equipamentos
 */

function storePage() {
  const gameState = window.gameState;
  const coins = gameState.get('coins') || 0;

  const storeItems = [
    { id: 1, name: 'Poção de Vida', price: 50, type: 'consumível', rarity: 'comum' },
    { id: 2, name: 'Poção de Felicidade', price: 75, type: 'consumível', rarity: 'incomum' },
    { id: 3, name: 'Ração Premium', price: 100, type: 'consumível', rarity: 'raro' },
    { id: 4, name: 'Elixir da Sabedoria', price: 200, type: 'consumível', rarity: 'muito_raro' },
    { id: 5, name: 'Expansão de Pen (Small)', price: 500, type: 'upgrade', rarity: 'raro' },
    { id: 6, name: 'Expansão de Pen (Medium)', price: 1500, type: 'upgrade', rarity: 'muito_raro' },
  ];

  const rarityColors = {
    'comum': '#b0b0b0',
    'incomum': '#4cb74c',
    'raro': '#0066ff',
    'muito_raro': '#9933ff',
    'epico': '#ff8800',
    'lendario': '#ffcc00'
  };

  const storeHTML = storeItems.map(item => `
    <div style="
      display: grid;
      grid-template-columns: 1fr 1fr 1fr 1fr;
      gap: 12px;
      align-items: center;
      padding: 16px;
      background: rgba(255, 255, 255, 0.05);
      border-radius: 8px;
      margin-bottom: 8px;
      border-left: 4px solid ${rarityColors[item.rarity] || '#6c63ff'};
    ">
      <div>
        <div style="color: #999; font-size: 0.85em; text-transform: uppercase;">Produto</div>
        <div style="font-weight: bold; color: #fff; margin-top: 4px;">${item.name}</div>
      </div>
      <div>
        <div style="color: #999; font-size: 0.85em; text-transform: uppercase;">Tipo</div>
        <div style="font-weight: bold; color: #00d4ff; margin-top: 4px; text-transform: capitalize;">${item.type}</div>
      </div>
      <div>
        <div style="color: #999; font-size: 0.85em; text-transform: uppercase;">Preço</div>
        <div style="font-weight: bold; color: #6c63ff; margin-top: 4px;">💰 ${item.price}</div>
      </div>
      <button onclick="alert('Comprado: ${item.name}'); window.gameState.set('coins', Math.max(0, window.gameState.get('coins') - ${item.price}))" style="
        padding: 8px 16px;
        background: ${coins >= item.price ? 'rgba(76, 183, 76, 0.3)' : 'rgba(100, 100, 100, 0.3)'};
        border: 1px solid ${coins >= item.price ? '#4cb74c' : '#666'};
        color: ${coins >= item.price ? '#4cb74c' : '#999'};
        border-radius: 6px;
        cursor: ${coins >= item.price ? 'pointer' : 'not-allowed'};
        font-weight: bold;
        font-family: 'Courier New', monospace;
        transition: all 0.3s ease;
        ${coins >= item.price ? 'opacity: 1;' : 'opacity: 0.6;'}
      " ${coins >= item.price ? '' : 'disabled'}>
        ${coins >= item.price ? 'Comprar' : 'Sem coins'}
      </button>
    </div>
  `).join('');

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
        <h1 style="margin: 0; font-size: 2em;">Loja Kadir</h1>
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

      <div style="max-width: 1200px;">
        <div style="
          font-size: 0.9em;
          color: #999;
          margin-bottom: 16px;
          text-transform: uppercase;
          letter-spacing: 1px;
        ">
          ${storeItems.length} produtos disponíveis
        </div>
        ${storeHTML}
      </div>

      <div style="
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 12px;
        margin-top: 32px;
        max-width: 1200px;
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
