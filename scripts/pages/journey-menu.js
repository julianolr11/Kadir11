/**
 * Journey Menu - SPA
 * Menu de seleção de jornadas/exploração
 */

function journeyMenuPage() {
  const gameState = window.gameState;
  const currentPet = gameState.get('currentPet');

  if (!currentPet) {
    return `
      <div class="spa-page">
        <div class="spa-page-header">
          <h1 class="spa-title">🗺️ Jornada</h1>
        </div>
        <div class="spa-page-content">
          <div class="spa-card is-error">
            <h3 class="spa-subtitle">⚠️ Nenhum pet selecionado</h3>
            <p class="spa-text">Selecione um pet antes de iniciar uma jornada.</p>
          </div>
        </div>
        <div class="spa-page-footer">
          <button class="spa-btn spa-btn-primary" onclick="window.router.navigate('/home')">← Voltar</button>
        </div>
      </div>
    `;
  }

  const journeys = [
    {
      id: 'forest',
      name: 'Floresta Misteriosa',
      difficulty: 'Fácil',
      duration: '5 min',
      rewards: 'XP +50, Moedas +30',
      color: '#44ff88',
      icon: '🌲',
    },
    {
      id: 'mountain',
      name: 'Montanhas Geladas',
      difficulty: 'Médio',
      duration: '10 min',
      rewards: 'XP +100, Moedas +60',
      color: '#44aaff',
      icon: '⛰️',
    },
    {
      id: 'volcano',
      name: 'Vulcão Ardente',
      difficulty: 'Difícil',
      duration: '15 min',
      rewards: 'XP +200, Moedas +120',
      color: '#ff6666',
      icon: '🌋',
    },
  ];

  return `
    <div class="spa-page">
      <div class="spa-page-header">
        <h1 class="spa-title">🗺️ Jornada de Exploração</h1>
        <p class="spa-text-muted">${currentPet.name} está pronto para aventuras!</p>
      </div>

      <div class="spa-page-content">
        <!-- Pet Status -->
        <div class="spa-card" style="margin-bottom: 24px; border-left: 4px solid #44aaff;">
          <h3 class="spa-subtitle">Seu Pet</h3>
          <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-top: 12px;">
            <div class="spa-stat">
              <span class="spa-stat-label">❤️ Vida</span>
              <span class="spa-stat-value">${currentPet.life || 100}</span>
            </div>
            <div class="spa-stat">
              <span class="spa-stat-label">⚡ Energia</span>
              <span class="spa-stat-value">${currentPet.energy || 100}</span>
            </div>
            <div class="spa-stat">
              <span class="spa-stat-label">😊 Felicidade</span>
              <span class="spa-stat-value">${currentPet.happiness || 100}</span>
            </div>
          </div>
        </div>

        <!-- Jornadas Disponíveis -->
        <div>
          <h3 class="spa-subtitle" style="margin-bottom: 16px;">Escolha sua Jornada</h3>
          ${journeys.map(journey => `
            <div class="spa-card" style="margin-bottom: 16px; border-left: 4px solid ${journey.color};">
              <div style="display: flex; align-items: center; gap: 16px;">
                <div style="font-size: 3em;">${journey.icon}</div>
                <div style="flex: 1;">
                  <h3 class="spa-subtitle" style="margin-bottom: 4px;">${journey.name}</h3>
                  <div style="display: flex; gap: 8px; margin: 8px 0; font-size: 0.85em;">
                    <span class="spa-badge" style="background: ${journey.color};">${journey.difficulty}</span>
                    <span class="spa-badge" style="background: #666;">⏱️ ${journey.duration}</span>
                  </div>
                  <p class="spa-text-small" style="color: #aaa; margin-top: 8px;">
                    🎁 ${journey.rewards}
                  </p>
                </div>
              </div>
              <button class="spa-btn spa-btn-success" style="width: 100%; margin-top: 12px;" 
                onclick="startJourney('${journey.id}')">
                🚀 Iniciar Jornada
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

function startJourney(journeyId) {
  const gameState = window.gameState;
  const currentPet = gameState.get('currentPet');

  const journeyData = {
    forest: { name: 'Floresta Misteriosa', xp: 50, coins: 30, duration: 5000 },
    mountain: { name: 'Montanhas Geladas', xp: 100, coins: 60, duration: 10000 },
    volcano: { name: 'Vulcão Ardente', xp: 200, coins: 120, duration: 15000 },
  };

  const journey = journeyData[journeyId];

  gameState.set('journeyState', {
    active: true,
    journeyId,
    journeyName: journey.name,
    startTime: Date.now(),
    duration: journey.duration,
    rewards: { xp: journey.xp, coins: journey.coins },
    pet: currentPet,
  });

  window.router.navigate('/journey-progress');
}
