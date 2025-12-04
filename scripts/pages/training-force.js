/**
 * Training Force - SPA
 * Treino de força do pet
 */

function trainingForcePage() {
  const gameState = window.gameState;
  const currentPet = gameState.get('currentPet');

  if (!currentPet) {
    return `
      <div class="spa-page">
        <div class="spa-page-header">
          <h1 class="spa-title">💪 Treino de Força</h1>
        </div>
        <div class="spa-page-content">
          <div class="spa-card is-error">
            <h3 class="spa-subtitle">⚠️ Nenhum pet selecionado</h3>
          </div>
        </div>
        <div class="spa-page-footer">
          <button class="spa-btn spa-btn-primary" onclick="window.router.navigate('/training-menu')">← Voltar</button>
        </div>
      </div>
    `;
  }

  const currentForce = currentPet.force || 1;
  const nextLevelForce = currentForce + 1;
  const requiredXP = 100 * nextLevelForce;
  const currentXP = currentPet.xp || 0;
  const xpProgress = Math.min(100, (currentXP / requiredXP) * 100);

  return `
    <div class="spa-page">
      <div class="spa-page-header">
        <div>
          <h1 class="spa-title">💪 Treino de Força</h1>
          <p class="spa-text-muted">${currentPet.name} - Nível ${currentPet.level || 1}</p>
        </div>
      </div>
      <div class="spa-page-content">
        <!-- Stat Progress -->
        <div class="spa-card" style="border-color: rgba(68, 170, 255, 0.3); margin-bottom: 24px;">
          <h3 class="spa-subtitle">📈 Progressão</h3>
          
          <div style="margin: 16px 0;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
              <span class="spa-stat-label">Força Atual</span>
              <span class="spa-stat-value">${currentForce}</span>
            </div>
            <div class="spa-progress-bar">
              <div class="spa-progress-fill" style="width: 70%;"></div>
            </div>
          </div>

          <div style="margin: 16px 0;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
              <span class="spa-stat-label">XP para Próximo Nível</span>
              <span class="spa-stat-value">${Math.round(currentXP)}/${requiredXP}</span>
            </div>
            <div class="spa-progress-bar">
              <div class="spa-progress-fill" style="width: ${xpProgress}%;"></div>
            </div>
          </div>
        </div>

        <!-- Training Sessions -->
        <div style="margin: 24px 0;">
          <h3 class="spa-subtitle">🏋️ Sessões de Treino</h3>
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 12px; margin-top: 12px;">
            <button class="spa-card" onclick="
              alert('Treino concluído! +10 Força +20 XP');
              const pet = window.gameState.get('currentPet');
              pet.force = (pet.force || 1) + 10;
              pet.xp = (pet.xp || 0) + 20;
              pet.energy = Math.max(0, (pet.energy || 100) - 20);
              window.gameState.set('currentPet', pet);
              window.location.hash = '#/training-force';
            " style="
              border: 2px solid var(--color-accent-blue);
              background: rgba(68, 170, 255, 0.05);
              cursor: pointer;
              padding: 16px;
              text-align: center;
              transition: all 0.3s ease;
            " onmouseover="this.style.background = 'rgba(68, 170, 255, 0.15)'" onmouseout="this.style.background = 'rgba(68, 170, 255, 0.05)'">
              <div style="font-size: 1.8em; margin-bottom: 8px;">⚡</div>
              <div style="font-weight: bold; color: var(--color-text-primary);">Leve</div>
              <div class="spa-text-muted" style="font-size: 0.85em; margin-top: 8px;">+10 FOR<br>-20 ENE</div>
            </button>

            <button class="spa-card" onclick="
              alert('Treino concluído! +15 Força +35 XP');
              const pet = window.gameState.get('currentPet');
              pet.force = (pet.force || 1) + 15;
              pet.xp = (pet.xp || 0) + 35;
              pet.energy = Math.max(0, (pet.energy || 100) - 35);
              window.gameState.set('currentPet', pet);
              window.location.hash = '#/training-force';
            " style="
              border: 2px solid var(--color-accent-yellow);
              background: rgba(241, 196, 15, 0.05);
              cursor: pointer;
              padding: 16px;
              text-align: center;
              transition: all 0.3s ease;
            " onmouseover="this.style.background = 'rgba(241, 196, 15, 0.15)'" onmouseout="this.style.background = 'rgba(241, 196, 15, 0.05)'">
              <div style="font-size: 1.8em; margin-bottom: 8px;">💪</div>
              <div style="font-weight: bold; color: var(--color-text-primary);">Moderado</div>
              <div class="spa-text-muted" style="font-size: 0.85em; margin-top: 8px;">+15 FOR<br>-35 ENE</div>
            </button>

            <button class="spa-card" onclick="
              alert('Treino concluído! +25 Força +60 XP');
              const pet = window.gameState.get('currentPet');
              pet.force = (pet.force || 1) + 25;
              pet.xp = (pet.xp || 0) + 60;
              pet.energy = Math.max(0, (pet.energy || 100) - 60);
              window.gameState.set('currentPet', pet);
              window.location.hash = '#/training-force';
            " style="
              border: 2px solid var(--color-accent-red);
              background: rgba(255, 68, 68, 0.05);
              cursor: pointer;
              padding: 16px;
              text-align: center;
              transition: all 0.3s ease;
            " onmouseover="this.style.background = 'rgba(255, 68, 68, 0.15)'" onmouseout="this.style.background = 'rgba(255, 68, 68, 0.05)'">
              <div style="font-size: 1.8em; margin-bottom: 8px;">🔥</div>
              <div style="font-weight: bold; color: var(--color-text-primary);">Intenso</div>
              <div class="spa-text-muted" style="font-size: 0.85em; margin-top: 8px;">+25 FOR<br>-60 ENE</div>
            </button>
          </div>
        </div>

        <!-- Stats Summary -->
        <div class="spa-card" style="border-color: rgba(0, 255, 136, 0.3); margin-top: 24px;">
          <h3 class="spa-subtitle">📊 Status Atual</h3>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-top: 12px;">
            <div class="spa-stat">
              <span class="spa-stat-label">Energia</span>
              <span class="spa-stat-value">${currentPet.energy || 100}/100</span>
            </div>
            <div class="spa-stat">
              <span class="spa-stat-label">Felicidade</span>
              <span class="spa-stat-value">${currentPet.happiness || 100}/100</span>
            </div>
          </div>
        </div>
      </div>

      <div class="spa-page-footer">
        <button class="spa-btn spa-btn-primary" onclick="window.router.navigate('/training-menu')">← Voltar</button>
        <button class="spa-btn spa-btn-danger" onclick="window.closeSPA()">✕ Fechar SPA</button>
      </div>
    </div>
  `;
}
