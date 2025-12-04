/**
 * Journey Progress - SPA
 * Visualização do progresso da jornada em tempo real
 */

function journeyProgressPage() {
  const gameState = window.gameState;
  const journeyState = gameState.get('journeyState');

  if (!journeyState || !journeyState.active) {
    return `
      <div class="spa-page">
        <div class="spa-page-header">
          <h1 class="spa-title">🗺️ Jornada</h1>
        </div>
        <div class="spa-page-content">
          <div class="spa-card is-error">
            <h3 class="spa-subtitle">⚠️ Nenhuma jornada ativa</h3>
          </div>
        </div>
        <div class="spa-page-footer">
          <button class="spa-btn spa-btn-primary" onclick="window.router.navigate('/journey-menu')">← Voltar</button>
        </div>
      </div>
    `;
  }

  const elapsed = Date.now() - journeyState.startTime;
  const progress = Math.min(100, (elapsed / journeyState.duration) * 100);
  const remaining = Math.max(0, journeyState.duration - elapsed);
  const remainingSeconds = Math.ceil(remaining / 1000);

  // Auto-completar quando chegar a 100%
  if (progress >= 100 && !window.journeyCompleted) {
    window.journeyCompleted = true;
    setTimeout(() => completeJourney(), 500);
  }

  // Auto-atualizar a cada segundo
  if (progress < 100 && !window.journeyUpdateInterval) {
    window.journeyUpdateInterval = setInterval(() => {
      const container = document.getElementById('spa-container');
      if (container && window.location.hash === '#/journey-progress') {
        container.innerHTML = journeyProgressPage();
      } else {
        clearInterval(window.journeyUpdateInterval);
        window.journeyUpdateInterval = null;
      }
    }, 1000);
  }

  return `
    <div class="spa-page">
      <div class="spa-page-header">
        <h1 class="spa-title">🗺️ ${journeyState.journeyName}</h1>
        <p class="spa-text-muted">Jornada em progresso...</p>
      </div>

      <div class="spa-page-content">
        <!-- Progress Card -->
        <div class="spa-card" style="text-align: center; margin-bottom: 24px; background: linear-gradient(135deg, #1a1f2e 0%, #2a323e 100%);">
          <div style="font-size: 4em; margin: 20px 0;">
            ${progress < 33 ? '🚶' : progress < 66 ? '🏃' : progress < 100 ? '🏃‍♂️💨' : '🎉'}
          </div>
          
          <h3 class="spa-subtitle" style="margin-bottom: 16px;">
            ${progress < 100 ? 'Explorando...' : 'Jornada Concluída!'}
          </h3>

          <!-- Progress Bar -->
          <div style="margin: 20px auto; max-width: 400px; background: #1a1f2e; border: 2px solid #44aaff; border-radius: 12px; overflow: hidden; height: 30px;">
            <div style="width: ${progress}%; height: 100%; background: linear-gradient(90deg, #44aaff 0%, #00ff88 100%); transition: width 0.5s; display: flex; align-items: center; justify-content: center; color: #000; font-weight: bold; font-size: 0.9em;">
              ${Math.floor(progress)}%
            </div>
          </div>

          ${progress < 100 ? `
            <p class="spa-text" style="color: #aaa; margin-top: 16px;">
              ⏱️ Tempo restante: ${remainingSeconds}s
            </p>
          ` : ''}
        </div>

        <!-- Pet Status -->
        <div class="spa-card" style="margin-bottom: 24px;">
          <h3 class="spa-subtitle">🐾 ${journeyState.pet.name}</h3>
          <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; margin-top: 12px;">
            <div class="spa-stat">
              <span class="spa-stat-label">📊 Nível</span>
              <span class="spa-stat-value">${journeyState.pet.level || 1}</span>
            </div>
            <div class="spa-stat">
              <span class="spa-stat-label">⭐ XP</span>
              <span class="spa-stat-value">${journeyState.pet.xp || 0}</span>
            </div>
          </div>
        </div>

        <!-- Expected Rewards -->
        <div class="spa-card" style="border-left: 4px solid #ffaa00;">
          <h3 class="spa-subtitle">🎁 Recompensas Esperadas</h3>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-top: 12px;">
            <div style="text-align: center; padding: 12px; background: rgba(0, 255, 136, 0.1); border-radius: 8px;">
              <p class="spa-text-small" style="color: #aaa;">Experiência</p>
              <p class="spa-stat-value" style="color: #00ff88; margin-top: 4px;">+${journeyState.rewards.xp} XP</p>
            </div>
            <div style="text-align: center; padding: 12px; background: rgba(255, 170, 0, 0.1); border-radius: 8px;">
              <p class="spa-text-small" style="color: #aaa;">Moedas</p>
              <p class="spa-stat-value" style="color: #ffaa00; margin-top: 4px;">+${journeyState.rewards.coins} 💰</p>
            </div>
          </div>
        </div>
      </div>

      <div class="spa-page-footer">
        ${progress < 100 ? `
          <button class="spa-btn spa-btn-danger" onclick="cancelJourney()">✖️ Cancelar Jornada</button>
        ` : `
          <button class="spa-btn spa-btn-success" onclick="completeJourney()">✓ Coletar Recompensas</button>
        `}
      </div>
    </div>
  `;
}

function completeJourney() {
  const gameState = window.gameState;
  const journeyState = gameState.get('journeyState');

  if (!journeyState) return;

  // Aplicar recompensas
  const currentPet = gameState.get('currentPet');
  if (currentPet) {
    currentPet.xp = (currentPet.xp || 0) + journeyState.rewards.xp;
    currentPet.happiness = Math.min(100, (currentPet.happiness || 100) + 10);
    gameState.set('currentPet', currentPet);
  }

  const coins = gameState.get('coins') || 0;
  gameState.set('coins', coins + journeyState.rewards.coins);

  // Limpar estado
  gameState.set('journeyState', null);
  clearInterval(window.journeyUpdateInterval);
  window.journeyUpdateInterval = null;
  window.journeyCompleted = false;

  alert(`🎉 Jornada concluída!\n\n+${journeyState.rewards.xp} XP\n+${journeyState.rewards.coins} Moedas\n+10 Felicidade`);
  window.router.navigate('/home');
}

function cancelJourney() {
  const gameState = window.gameState;
  
  if (confirm('Deseja realmente cancelar a jornada? Você perderá todo o progresso.')) {
    gameState.set('journeyState', null);
    clearInterval(window.journeyUpdateInterval);
    window.journeyUpdateInterval = null;
    window.journeyCompleted = false;
    window.router.navigate('/journey-menu');
  }
}
