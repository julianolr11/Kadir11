/**
 * Training Menu - SPA
 * Menu principal de treino do pet
 */

function trainingMenuPage() {
  const gameState = window.gameState;
  const currentPet = gameState.get('currentPet');

  if (!currentPet) {
    return `
      <div class="spa-page">
        <div class="spa-page-header">
          <h1 class="spa-title">🏋️ Treino</h1>
        </div>
        <div class="spa-page-content">
          <div class="spa-card is-error">
            <h3 class="spa-subtitle">⚠️ Nenhum pet selecionado</h3>
            <p class="spa-text">Selecione um pet no Pen antes de treinar.</p>
          </div>
        </div>
        <div class="spa-page-footer">
          <button class="spa-btn spa-btn-primary" onclick="window.router.navigate('/home')">← Voltar</button>
          <button class="spa-btn spa-btn-danger" onclick="window.closeSPA()">✕ Fechar SPA</button>
        </div>
      </div>
    `;
  }

  return `
    <div class="spa-page">
      <div class="spa-page-header">
        <div>
          <h1 class="spa-title">🏋️ Treino - ${currentPet.name}</h1>
          <p class="spa-text-muted">Escolha uma habilidade para treinar</p>
        </div>
      </div>
      <div class="spa-page-content">
        <!-- Pet Info -->
        <div class="spa-card" style="border-color: rgba(68, 170, 255, 0.3); margin-bottom: 24px;">
          <h3 class="spa-subtitle">📊 Informações do Pet</h3>
          <div style="display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; gap: 12px; margin-top: 12px;">
            <div class="spa-stat">
              <span class="spa-stat-label">Nível</span>
              <span class="spa-stat-value">Lv. ${currentPet.level || 1}</span>
            </div>
            <div class="spa-stat">
              <span class="spa-stat-label">Experiência</span>
              <span class="spa-stat-value">${currentPet.xp || 0} XP</span>
            </div>
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

        <!-- Training Options -->
        <div style="margin: 24px 0;">
          <h3 class="spa-subtitle">🎯 Opções de Treino</h3>
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 12px; margin-top: 12px;">
            <button class="spa-card" onclick="window.router.navigate('/training-force')" style="
              border: 2px solid var(--color-accent-blue);
              background: rgba(68, 170, 255, 0.05);
              cursor: pointer;
              transition: all 0.3s ease;
              text-align: left;
              padding: 16px;
            " onmouseover="this.style.background = 'rgba(68, 170, 255, 0.15)'" onmouseout="this.style.background = 'rgba(68, 170, 255, 0.05)'">
              <div style="font-size: 2em; margin-bottom: 8px;">💪</div>
              <div class="spa-subtitle" style="margin: 0 0 8px 0;">Força</div>
              <p class="spa-text-muted" style="margin: 0;">Aumenta força e poder de ataque</p>
            </button>

            <button class="spa-card" onclick="window.router.navigate('/training-defense')" style="
              border: 2px solid var(--color-accent-green);
              background: rgba(0, 255, 136, 0.05);
              cursor: pointer;
              transition: all 0.3s ease;
              text-align: left;
              padding: 16px;
            " onmouseover="this.style.background = 'rgba(0, 255, 136, 0.15)'" onmouseout="this.style.background = 'rgba(0, 255, 136, 0.05)'">
              <div style="font-size: 2em; margin-bottom: 8px;">🛡️</div>
              <div class="spa-subtitle" style="margin: 0 0 8px 0;">Defesa</div>
              <p class="spa-text-muted" style="margin: 0;">Aumenta defesa e resistência</p>
            </button>

            <button class="spa-card" onclick="window.router.navigate('/training-attributes')" style="
              border: 2px solid var(--color-accent-yellow);
              background: rgba(241, 196, 15, 0.05);
              cursor: pointer;
              transition: all 0.3s ease;
              text-align: left;
              padding: 16px;
            " onmouseover="this.style.background = 'rgba(241, 196, 15, 0.15)'" onmouseout="this.style.background = 'rgba(241, 196, 15, 0.05)'">
              <div style="font-size: 2em; margin-bottom: 8px;">⚡</div>
              <div class="spa-subtitle" style="margin: 0 0 8px 0;">Atributos</div>
              <p class="spa-text-muted" style="margin: 0;">Treina velocidade e inteligência</p>
            </button>
          </div>
        </div>

        <!-- Training Tips -->
        <div class="spa-card" style="border-color: rgba(0, 255, 136, 0.3); margin-top: 24px;">
          <h3 class="spa-subtitle">💡 Dicas de Treino</h3>
          <ul style="color: var(--color-text-secondary); line-height: 1.8; margin: 12px 0 0 20px;">
            <li>Cada treino consome energia do pet</li>
            <li>O pet precisa de felicidade acima de 50% para treinar</li>
            <li>Ganha experiência ao completar sessões de treino</li>
            <li>Pode subir de nível ao acumular XP suficiente</li>
          </ul>
        </div>
      </div>

      <div class="spa-page-footer">
        <button class="spa-btn spa-btn-primary" onclick="window.router.navigate('/home')">← Voltar</button>
        <button class="spa-btn spa-btn-danger" onclick="window.closeSPA()">✕ Fechar SPA</button>
      </div>
    </div>
  `;
}
