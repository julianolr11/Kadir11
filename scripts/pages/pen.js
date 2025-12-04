/**
 * Pen Page - SPA
 * Gerenciamento do pen (habitat de pets)
 */

function penPage() {
  const gameState = window.gameState;
  const pets = gameState.get('pets') || [];
  const currentPet = gameState.get('currentPet');

  const petsList = pets.length > 0 
    ? pets.map((pet, index) => `
        <div style="
          display: grid;
          grid-template-columns: 80px 1fr 1fr 1fr 1fr;
          gap: 12px;
          align-items: center;
          padding: 16px;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 8px;
          margin-bottom: 8px;
          border-left: 4px solid ${
            currentPet && currentPet.id === pet.id 
              ? '#4cb74c' 
              : '#6c63ff'
          };
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
            🐾
          </div>
          <div>
            <div style="color: #999; font-size: 0.85em; text-transform: uppercase;">Nome</div>
            <div style="font-weight: bold; color: #fff; margin-top: 4px;">${pet.name || 'Pet'}</div>
          </div>
          <div>
            <div style="color: #999; font-size: 0.85em; text-transform: uppercase;">ID</div>
            <div style="font-weight: bold; color: #6c63ff; margin-top: 4px; font-family: monospace;">${pet.id || '—'}</div>
          </div>
          <div>
            <div style="color: #999; font-size: 0.85em; text-transform: uppercase;">Nível</div>
            <div style="font-weight: bold; color: #00d4ff; margin-top: 4px;">Lv. ${pet.level || 1}</div>
          </div>
          <button onclick="
            window.gameState.set('currentPet', ${JSON.stringify(pet).replace(/"/g, '&quot;')});
            window.location.hash = '#/pen';
          " style="
            padding: 8px 16px;
            background: ${
              currentPet && currentPet.id === pet.id 
                ? 'rgba(76, 183, 76, 0.3)' 
                : 'rgba(108, 99, 255, 0.2)'
            };
            border: 1px solid ${
              currentPet && currentPet.id === pet.id 
                ? '#4cb74c' 
                : '#6c63ff'
            };
            color: ${
              currentPet && currentPet.id === pet.id 
                ? '#4cb74c' 
                : '#6c63ff'
            };
            border-radius: 6px;
            cursor: pointer;
            font-weight: bold;
            font-family: 'Courier New', monospace;
            transition: all 0.3s ease;
          " onmouseover="this.style.opacity = '0.8'" onmouseout="this.style.opacity = '1'">
            ${currentPet && currentPet.id === pet.id ? '✓ Ativo' : 'Selecionar'}
          </button>
        </div>
      `).join('')
    : '<div style="text-align: center; color: #999; padding: 32px;">Nenhum pet no pen</div>';

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
        <h1 style="margin: 0; font-size: 2em;">Pen de Pets</h1>
        <div style="
          background: rgba(108, 99, 255, 0.2);
          padding: 8px 16px;
          border-radius: 8px;
          border: 1px solid #6c63ff;
          font-size: 0.9em;
        ">
          🐾 <strong>${pets.length}</strong> pet(s)
        </div>
      </div>

      ${currentPet ? `
        <div style="
          background: rgba(76, 183, 76, 0.1);
          border: 1px solid rgba(76, 183, 76, 0.3);
          padding: 16px;
          border-radius: 8px;
          margin-bottom: 24px;
        ">
          <div style="color: #4cb74c; font-weight: bold; margin-bottom: 8px;">✓ Pet Selecionado</div>
          <div style="color: #ccc; font-size: 0.9em;">
            <strong>${currentPet.name || 'Sem nome'}</strong> (ID: ${currentPet.id}) - Lv. ${currentPet.level || 1}
          </div>
        </div>
      ` : `
        <div style="
          background: rgba(255, 107, 107, 0.1);
          border: 1px solid rgba(255, 107, 107, 0.3);
          padding: 16px;
          border-radius: 8px;
          margin-bottom: 24px;
        ">
          <div style="color: #ff6b6b; font-weight: bold;">⚠ Nenhum pet selecionado</div>
        </div>
      `}

      <div style="max-width: 1200px;">
        <div style="
          font-size: 0.9em;
          color: #999;
          margin-bottom: 16px;
          text-transform: uppercase;
          letter-spacing: 1px;
        ">
          Seus pets
        </div>
        ${petsList}
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
