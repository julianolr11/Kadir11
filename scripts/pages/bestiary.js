/**
 * Bestiary Page - SPA
 * Enciclopédia de criaturas descobertas
 */

function bestiaryPage() {
  const gameState = window.gameState;
  const bestiary = gameState.get('bestiary') || [];

  // Dados de exemplo de espécies
  const availableSpecies = [
    { name: 'Pidgly', element: 'terra', rarity: 'comum' },
    { name: 'Ignis', element: 'fogo', rarity: 'incomum' },
    { name: 'Aqua', element: 'agua', rarity: 'raro' },
    { name: 'Terrox', element: 'terra', rarity: 'raro' },
    { name: 'Zephyr', element: 'ar', rarity: 'muito_raro' },
    { name: 'Spectral', element: 'puro', rarity: 'epico' },
  ];

  const rarityColors = {
    'comum': '#b0b0b0',
    'incomum': '#4cb74c',
    'raro': '#0066ff',
    'muito_raro': '#9933ff',
    'epico': '#ff8800',
    'lendario': '#ffcc00'
  };

  const elementColors = {
    'fogo': '#ff6b6b',
    'agua': '#4dabf7',
    'terra': '#82c91e',
    'ar': '#8b5cf6',
    'puro': '#ffd60a'
  };

  const speciesHTML = availableSpecies.map(species => {
    const discovered = bestiary.includes(species.name);
    return `
      <div style="
        display: grid;
        grid-template-columns: 80px 1fr 1fr 1fr 1fr;
        gap: 12px;
        align-items: center;
        padding: 16px;
        background: rgba(255, 255, 255, ${discovered ? '0.08' : '0.03'});
        border-radius: 8px;
        margin-bottom: 8px;
        border-left: 4px solid ${discovered ? elementColors[species.element] : '#333'};
        opacity: ${discovered ? '1' : '0.6'};
      ">
        <div style="
          width: 80px;
          height: 80px;
          background: rgba(100, 100, 100, 0.3);
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 2em;
        ">
          ${discovered ? '✓' : '?'}
        </div>
        <div>
          <div style="color: #999; font-size: 0.85em; text-transform: uppercase;">Espécie</div>
          <div style="font-weight: bold; color: #fff; margin-top: 4px;">${species.name}</div>
        </div>
        <div>
          <div style="color: #999; font-size: 0.85em; text-transform: uppercase;">Elemento</div>
          <div style="font-weight: bold; color: ${elementColors[species.element]}; margin-top: 4px; text-transform: capitalize;">${species.element}</div>
        </div>
        <div>
          <div style="color: #999; font-size: 0.85em; text-transform: uppercase;">Raridade</div>
          <div style="font-weight: bold; color: ${rarityColors[species.rarity]}; margin-top: 4px; text-transform: capitalize;">${species.rarity}</div>
        </div>
        <button onclick="
          const current = window.gameState.get('bestiary') || [];
          if (!current.includes('${species.name}')) {
            current.push('${species.name}');
            window.gameState.set('bestiary', current);
            window.location.hash = '#/bestiary';
          }
        " style="
          padding: 8px 16px;
          background: ${discovered ? 'rgba(76, 183, 76, 0.3)' : 'rgba(108, 99, 255, 0.2)'};
          border: 1px solid ${discovered ? '#4cb74c' : '#6c63ff'};
          color: ${discovered ? '#4cb74c' : '#6c63ff'};
          border-radius: 6px;
          cursor: ${discovered ? 'default' : 'pointer'};
          font-weight: bold;
          font-family: 'Courier New', monospace;
          transition: all 0.3s ease;
        " ${discovered ? 'disabled' : ''}>
          ${discovered ? '✓ Descoberto' : 'Descobrir'}
        </button>
      </div>
    `;
  }).join('');

  const discoveredCount = bestiary.length;
  const totalCount = availableSpecies.length;
  const percentage = Math.round((discoveredCount / totalCount) * 100);

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
        <h1 style="margin: 0; font-size: 2em;">Bestiário</h1>
        <div style="
          background: rgba(108, 99, 255, 0.2);
          padding: 8px 16px;
          border-radius: 8px;
          border: 1px solid #6c63ff;
          font-size: 0.9em;
        ">
          📖 <strong>${discoveredCount}/${totalCount}</strong> descobertos
        </div>
      </div>

      <div style="
        background: rgba(108, 99, 255, 0.1);
        border: 1px solid rgba(108, 99, 255, 0.3);
        padding: 16px;
        border-radius: 8px;
        margin-bottom: 24px;
      ">
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px;">
          <div>
            <div style="color: #999; font-size: 0.85em; text-transform: uppercase;">Progresso</div>
            <div style="font-size: 0.9em; margin-top: 8px;">
              <div style="
                background: rgba(100, 100, 100, 0.3);
                height: 8px;
                border-radius: 4px;
                overflow: hidden;
              ">
                <div style="
                  background: linear-gradient(90deg, #6c63ff, #00d4ff);
                  width: ${percentage}%;
                  height: 100%;
                  transition: width 0.3s ease;
                "></div>
              </div>
              <div style="margin-top: 8px; color: #6c63ff; font-weight: bold;">${percentage}% Completado</div>
            </div>
          </div>
          <div>
            <div style="color: #999; font-size: 0.85em; text-transform: uppercase;">Estatísticas</div>
            <div style="color: #ccc; font-size: 0.9em; margin-top: 8px; line-height: 1.6;">
              Espécies descobertas: <strong>${discoveredCount}</strong><br>
              Faltam descobrir: <strong>${totalCount - discoveredCount}</strong>
            </div>
          </div>
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
          Enciclopédia de Criaturas
        </div>
        ${speciesHTML}
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
