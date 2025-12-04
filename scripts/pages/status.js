/**
 * Status Page - Página de status do pet (SPA)
 * Mostra dados, stats, e ações do pet ativo
 */

function statusPage(state = {}) {
  const pet = gameState.get('currentPet')
  
  if (!pet) {
    return `
      <div class="page status-page">
        <div class="page-header">
          <h1>📊 Status</h1>
          <button class="close-btn" onclick="closeSPA()">✕</button>
        </div>
        <div class="page-content">
          <div class="error-box">
            <p>⚠️ Nenhum pet selecionado</p>
            <button onclick="router.back()">← Voltar</button>
          </div>
        </div>
      </div>
    `
  }

  const stats = pet.stats || {}
  const healthPercent = Math.round((pet.life / (pet.lifeMax || 100)) * 100)
  const hungerPercent = Math.round((pet.hunger / 100) * 100)
  const happinessPercent = Math.round((pet.happiness / 100) * 100)
  const energyPercent = Math.round((pet.energy / 100) * 100)

  return `
    <div class="page status-page">
      <div class="page-header">
        <h1>📊 ${pet.name || 'Pet'} (Nível ${pet.level || 1})</h1>
        <button class="close-btn" onclick="closeSPA()">✕</button>
      </div>

      <div class="page-content">
        <div class="status-container">
          
          <!-- Seção Pet Info -->
          <div class="status-section pet-info">
            <div class="pet-image-area">
              <img src="${pet.statusImage || 'Assets/Mons/eggsy.png'}" alt="Pet" class="pet-image">
            </div>
            
            <div class="pet-details">
              <div class="info-row">
                <span class="label">ID:</span>
                <span class="value">#${pet.id || '000000'}</span>
              </div>
              <div class="info-row">
                <span class="label">Espécie:</span>
                <span class="value">${pet.specie || 'Desconhecida'}</span>
              </div>
              <div class="info-row">
                <span class="label">Elemento:</span>
                <span class="value">${pet.element || '?'}</span>
              </div>
              <div class="info-row">
                <span class="label">Raridade:</span>
                <span class="value rarity-${(pet.rarity || '').toLowerCase()}">${pet.rarity || '?'}</span>
              </div>
              <div class="info-row">
                <span class="label">Experiência:</span>
                <span class="value">${pet.experience || 0} XP</span>
              </div>
            </div>
          </div>

          <!-- Seção Stats -->
          <div class="status-section">
            <h3>⚔️ Atributos</h3>
            <div class="stats-grid">
              <div class="stat-item">
                <span class="stat-label">Força</span>
                <span class="stat-value">${stats.force || 0}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">Defesa</span>
                <span class="stat-value">${stats.defense || 0}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">Velocidade</span>
                <span class="stat-value">${stats.speed || 0}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">Inteligência</span>
                <span class="stat-value">${stats.intelligence || 0}</span>
              </div>
            </div>
          </div>

          <!-- Seção Vital -->
          <div class="status-section">
            <h3>💚 Vital</h3>
            <div class="vital-bars">
              <div class="vital-item">
                <span class="vital-label">Vida: ${pet.life || 0}/${pet.lifeMax || 100}</span>
                <div class="vital-bar">
                  <div class="vital-fill health" style="width: ${healthPercent}%"></div>
                </div>
              </div>
              <div class="vital-item">
                <span class="vital-label">Fome: ${pet.hunger || 0}/100</span>
                <div class="vital-bar">
                  <div class="vital-fill hunger" style="width: ${hungerPercent}%"></div>
                </div>
              </div>
              <div class="vital-item">
                <span class="vital-label">Felicidade: ${pet.happiness || 0}/100</span>
                <div class="vital-bar">
                  <div class="vital-fill happiness" style="width: ${happinessPercent}%"></div>
                </div>
              </div>
              <div class="vital-item">
                <span class="vital-label">Energia: ${pet.energy || 0}/100</span>
                <div class="vital-bar">
                  <div class="vital-fill energy" style="width: ${energyPercent}%"></div>
                </div>
              </div>
            </div>
          </div>

          <!-- Seção Moves -->
          <div class="status-section">
            <h3>🎯 Golpes Conhecidos</h3>
            <div class="moves-list">
              ${(pet.knownMoves || []).map(move => `
                <div class="move-item">
                  <span class="move-name">${move.name || 'Golpe'}</span>
                  <span class="move-power">💥 ${move.power || 0}</span>
                </div>
              `).join('') || '<p>Nenhum golpe aprendido</p>'}
            </div>
          </div>

          <!-- Botões de Ação -->
          <div class="action-buttons">
            <button class="action-btn" onclick="router.navigate('/home')">
              🏠 Home
            </button>
            <button class="action-btn" onclick="closeSPA()">
              ✕ Fechar
            </button>
          </div>

        </div>
      </div>
    </div>

    <style>
      .status-page {
        padding: 15px;
        background: linear-gradient(135deg, #1a2a3a 0%, #0a1a2a 100%);
        min-height: 100vh;
        color: #ccc;
      }

      .page-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 20px;
        border-bottom: 2px solid #3a4a5a;
        padding-bottom: 15px;
      }

      .page-header h1 {
        margin: 0;
        font-size: 2em;
        color: #fff;
      }

      .close-btn {
        background: #5a4a4a;
        color: #fff;
        border: none;
        width: 30px;
        height: 30px;
        border-radius: 50%;
        cursor: pointer;
        font-size: 1.2em;
        transition: all 0.3s;
      }

      .close-btn:hover {
        background: #6a5a5a;
      }

      .error-box {
        background: #5a3a3a;
        padding: 20px;
        border-radius: 8px;
        text-align: center;
        color: #ff8888;
      }

      .error-box button {
        margin-top: 10px;
        padding: 10px 20px;
        background: #4a5a7a;
        color: white;
        border: none;
        border-radius: 6px;
        cursor: pointer;
      }

      .status-container {
        display: flex;
        flex-direction: column;
        gap: 15px;
      }

      .status-section {
        background: #2a3a4a;
        padding: 15px;
        border-radius: 8px;
        border-left: 4px solid #5a6a7a;
      }

      .status-section h3 {
        margin: 0 0 10px 0;
        color: #fff;
      }

      .pet-info {
        display: grid;
        grid-template-columns: 200px 1fr;
        gap: 15px;
        align-items: start;
      }

      .pet-image-area {
        text-align: center;
      }

      .pet-image {
        width: 180px;
        height: 180px;
        border: 2px solid #5a7a9a;
        border-radius: 8px;
        object-fit: contain;
        background: #1a2a3a;
      }

      .pet-details {
        display: grid;
        gap: 8px;
      }

      .info-row {
        display: grid;
        grid-template-columns: 100px 1fr;
        gap: 10px;
        padding: 5px 0;
        border-bottom: 1px solid #3a4a5a;
      }

      .info-row:last-child {
        border-bottom: none;
      }

      .label {
        color: #8a9aaa;
        font-weight: bold;
      }

      .value {
        color: #fff;
        font-family: monospace;
      }

      .rarity-comum { color: #888; }
      .rarity-incomum { color: #4a8;  }
      .rarity-raro { color: #48a; }
      .rarity-muitraro { color: #8a4; }
      .rarity-epico { color: #a48; }
      .rarity-lendario { color: #fa8; }

      .stats-grid {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 10px;
      }

      .stat-item {
        background: #1a2a3a;
        padding: 10px;
        border-radius: 6px;
        text-align: center;
      }

      .stat-label {
        display: block;
        color: #8a9aaa;
        font-size: 0.85em;
        margin-bottom: 5px;
      }

      .stat-value {
        display: block;
        font-size: 1.5em;
        font-weight: bold;
        color: #4a8;
      }

      .vital-bars {
        display: grid;
        gap: 12px;
      }

      .vital-item {
        display: flex;
        flex-direction: column;
        gap: 5px;
      }

      .vital-label {
        font-size: 0.85em;
        color: #8a9aaa;
      }

      .vital-bar {
        height: 24px;
        background: #1a2a3a;
        border-radius: 4px;
        overflow: hidden;
        border: 1px solid #3a4a5a;
      }

      .vital-fill {
        height: 100%;
        transition: width 0.3s ease;
      }

      .health { background: linear-gradient(90deg, #f00, #8f0); }
      .hunger { background: linear-gradient(90deg, #f80, #f0f); }
      .happiness { background: linear-gradient(90deg, #f0f, #0ff); }
      .energy { background: linear-gradient(90deg, #08f, #0f8); }

      .moves-list {
        display: grid;
        gap: 8px;
      }

      .move-item {
        background: #1a2a3a;
        padding: 10px;
        border-radius: 6px;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      .move-name {
        color: #8ac;
        font-weight: bold;
      }

      .move-power {
        color: #f88;
        font-size: 0.9em;
      }

      .action-buttons {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 10px;
        margin-top: 15px;
      }

      .action-btn {
        padding: 12px;
        background: #3a5a7a;
        color: white;
        border: none;
        border-radius: 6px;
        cursor: pointer;
        font-size: 0.95em;
        transition: all 0.3s;
      }

      .action-btn:hover {
        background: #4a6a8a;
        transform: translateY(-2px);
      }

      .action-btn:active {
        transform: translateY(0);
      }

      @media (max-width: 768px) {
        .pet-info {
          grid-template-columns: 1fr;
        }

        .stats-grid {
          grid-template-columns: repeat(2, 1fr);
        }

        .page-header h1 {
          font-size: 1.5em;
        }
      }
    </style>
  `
}
