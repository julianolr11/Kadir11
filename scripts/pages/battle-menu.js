/**
 * Battle Menu - SPA
 * Seleção de oponente para batalha
 */

function battleMenuPage() {
  const gameState = window.gameState;
  const currentPet = gameState.get('currentPet');

  if (!currentPet) {
    return `
      <div class="spa-page">
        <div class="spa-page-header">
          <h1 class="spa-title">⚔️ Arena de Batalha</h1>
        </div>
        <div class="spa-page-content">
          <div class="spa-card is-error">
            <h3 class="spa-subtitle">⚠️ Nenhum pet selecionado</h3>
            <p class="spa-text">Selecione um pet antes de entrar em batalha.</p>
          </div>
        </div>
        <div class="spa-page-footer">
          <button class="spa-btn spa-btn-primary" onclick="window.router.navigate('/home')">← Voltar</button>
        </div>
      </div>
    `;
  }

  // Gerar 3 oponentes aleatórios
  const opponents = generateOpponents(3);

  return `
    <div class="spa-page">
      <div class="spa-page-header">
        <h1 class="spa-title">⚔️ Arena de Batalha</h1>
        <p class="spa-text-muted">${currentPet.name} vs ?</p>
      </div>
      
      <div class="spa-page-content">
        <!-- Seu Pet -->
        <div class="spa-card" style="margin-bottom: 24px; border-left: 4px solid #44aaff;">
          <h3 class="spa-subtitle">Seu Pet</h3>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-top: 12px;">
            <div>
              <p class="spa-stat-label">${currentPet.name}</p>
              <p class="spa-text-small" style="color: #888; margin: 4px 0;">Nível ${currentPet.level || 1}</p>
            </div>
            <div style="text-align: right;">
              <p class="spa-stat-label" style="color: #44ff44;">❤️ ${currentPet.life || 100}</p>
              <p class="spa-text-small" style="color: #888; margin: 4px 0;">Vida</p>
            </div>
          </div>
        </div>

        <!-- Oponentes -->
        <div>
          <h3 class="spa-subtitle" style="margin-bottom: 16px;">Escolha seu Oponente</h3>
          ${opponents.map((opponent, idx) => `
            <div class="spa-card" style="margin-bottom: 12px; cursor: pointer; transition: all 0.3s; border-left: 4px solid ${getRarityColor(opponent.rarity)};">
              <div style="display: grid; grid-template-columns: 1fr auto; gap: 12px; align-items: center;">
                <div>
                  <p class="spa-stat-label">${opponent.name}</p>
                  <div style="display: flex; gap: 8px; margin-top: 4px; font-size: 0.85em;">
                    <span class="spa-badge" style="background: ${getElementColor(opponent.element)};">
                      ${opponent.element}
                    </span>
                    <span class="spa-badge" style="background: ${getRarityColor(opponent.rarity)};">
                      ${opponent.rarity}
                    </span>
                  </div>
                </div>
                <div style="text-align: right;">
                  <p class="spa-stat-label" style="color: #ff6666;">❤️ ${opponent.life || 100}</p>
                  <p class="spa-text-small" style="color: #888;">Nível ${opponent.level || 1}</p>
                </div>
              </div>
              <button class="spa-btn spa-btn-success" style="width: 100%; margin-top: 12px;" 
                onclick="startBattle(${idx})">
                Desafiar
              </button>
            </div>
          `).join('')}
        </div>
      </div>

      <div class="spa-page-footer">
        <button class="spa-btn spa-btn-primary" onclick="window.router.navigate('/home')">← Voltar</button>
      </div>
    </div>
  `;
}

function generateOpponents(count) {
  const species = ['Pidgly', 'Ignis', 'Drazraq', 'Ashfang', 'Kael', 'Leoracal'];
  const elements = ['fogo', 'agua', 'terra', 'ar', 'puro'];
  const rarities = ['Comum', 'Incomum', 'Raro', 'MuitoRaro'];
  
  const opponents = [];
  for (let i = 0; i < count; i++) {
    opponents.push({
      id: `opponent_${Date.now()}_${i}`,
      name: `${species[Math.floor(Math.random() * species.length)]} Selvagem`,
      species: species[Math.floor(Math.random() * species.length)],
      element: elements[Math.floor(Math.random() * elements.length)],
      rarity: rarities[Math.floor(Math.random() * rarities.length)],
      level: Math.floor(Math.random() * 10) + 1,
      life: Math.floor(Math.random() * 50) + 80,
      maxLife: Math.floor(Math.random() * 50) + 80,
      force: Math.floor(Math.random() * 8) + 3,
      defense: Math.floor(Math.random() * 8) + 3,
      speed: Math.floor(Math.random() * 8) + 3,
      intelligence: Math.floor(Math.random() * 8) + 3,
      moves: ['Arranhão', 'Mordida', 'Ataque Rápido'],
    });
  }
  return opponents;
}

function startBattle(opponentIndex) {
  const gameState = window.gameState;
  const currentPet = gameState.get('currentPet');
  const opponents = generateOpponents(3);
  const selectedOpponent = opponents[opponentIndex];

  // Armazenar estado da batalha no gameState
  gameState.set('battleState', {
    playerPet: currentPet,
    opponentPet: selectedOpponent,
    currentTurn: 'player',
    round: 1,
    log: [],
  });

  window.router.navigate('/battle-arena');
}

function getRarityColor(rarity) {
  const colors = {
    'Comum': '#888888',
    'Incomum': '#44ff88',
    'Raro': '#44aaff',
    'MuitoRaro': '#ff44ff',
    'Epico': '#ffaa00',
    'Lendario': '#ffff00',
  };
  return colors[rarity] || '#888888';
}

function getElementColor(element) {
  const colors = {
    'fogo': '#ff6666',
    'agua': '#6699ff',
    'terra': '#99dd44',
    'ar': '#99ddff',
    'puro': '#dd88ff',
  };
  return colors[element] || '#888888';
}
