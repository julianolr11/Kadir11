/**
 * Nests Page - SPA
 * Sistema de ninhos e breeding de pets
 */

function nestsPage() {
  const gameState = window.gameState;
  const coins = gameState.get('coins') || 0;

  const nests = [
    { id: 1, name: 'Ninho de Fogo', type: 'fogo', status: 'vazio', nextHatch: null },
    { id: 2, name: 'Ninho de Água', type: 'agua', status: 'vazio', nextHatch: null },
    { id: 3, name: 'Ninho de Terra', type: 'terra', status: 'vazio', nextHatch: null },
  ];

  const typeColors = {
    'fogo': '#ff6b6b',
    'agua': '#4dabf7',
    'terra': '#82c91e',
    'ar': '#8b5cf6',
    'puro': '#ffd60a'
  };

  const statusColors = {
    'vazio': '#999',
    'incubando': '#4dabf7',
    'pronto': '#82c91e'
  };

  const nestsHTML = nests.map(nest => `
    <div style="
      display: grid;
      grid-template-columns: 1fr 1fr 1fr 1fr 1fr;
      gap: 12px;
      align-items: center;
      padding: 16px;
      background: rgba(255, 255, 255, 0.05);
      border-radius: 8px;
      margin-bottom: 8px;
      border-left: 4px solid ${typeColors[nest.type] || '#6c63ff'};
    ">
      <div>
        <div style="color: #999; font-size: 0.85em; text-transform: uppercase;">Ninho</div>
        <div style="font-weight: bold; color: #fff; margin-top: 4px;">${nest.name}</div>
      </div>
      <div>
        <div style="color: #999; font-size: 0.85em; text-transform: uppercase;">Tipo</div>
        <div style="font-weight: bold; color: ${typeColors[nest.type]}; margin-top: 4px; text-transform: capitalize;">${nest.type}</div>
      </div>
      <div>
        <div style="color: #999; font-size: 0.85em; text-transform: uppercase;">Status</div>
        <div style="font-weight: bold; color: ${statusColors[nest.status]}; margin-top: 4px; text-transform: capitalize;">${nest.status}</div>
      </div>
      <div>
        <div style="color: #999; font-size: 0.85em; text-transform: uppercase;">Próxima Eclosão</div>
        <div style="font-weight: bold; color: #00d4ff; margin-top: 4px;">${nest.nextHatch || '—'}</div>
      </div>
      <button onclick="alert('Ação no ninho: ${nest.name}')" style="
        padding: 8px 16px;
        background: rgba(108, 99, 255, 0.2);
        border: 1px solid #6c63ff;
        color: #6c63ff;
        border-radius: 6px;
        cursor: pointer;
        font-weight: bold;
        font-family: 'Courier New', monospace;
        transition: all 0.3s ease;
      " onmouseover="this.style.background = 'rgba(108, 99, 255, 0.4)'" onmouseout="this.style.background = 'rgba(108, 99, 255, 0.2)'">
        Interagir
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
        <h1 style="margin: 0; font-size: 2em;">Ninhos de Reprodução</h1>
        <div style="
          background: rgba(108, 99, 255, 0.2);
          padding: 8px 16px;
          border-radius: 8px;
          border: 1px solid #6c63ff;
          font-size: 0.9em;
        ">
          🥚 ${nests.length} ninhos
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
          Gerenciador de ninhos e criação
        </div>
        ${nestsHTML}
      </div>

      <div style="
        background: rgba(108, 99, 255, 0.1);
        border: 1px solid rgba(108, 99, 255, 0.3);
        padding: 16px;
        border-radius: 8px;
        margin-top: 32px;
        max-width: 1200px;
      ">
        <div style="color: #6c63ff; font-weight: bold; margin-bottom: 8px;">ℹ️ Informações</div>
        <div style="color: #ccc; font-size: 0.9em; line-height: 1.6;">
          Use os ninhos para incubar ovos e obter novos pets.<br>
          Cada ninho tem afinidade com um elemento específico.<br>
          O tempo de incubação varia conforme a raridade do ovo.
        </div>
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
