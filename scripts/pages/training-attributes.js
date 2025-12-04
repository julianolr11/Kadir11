/**
 * Training Attributes - SPA
 * Treino de atributos (velocidade, inteligência)
 */

function trainingAttributesPage() {
  const gameState = window.gameState;
  const currentPet = gameState.get('currentPet');

  if (!currentPet) {
    return `
      <div class="spa-page">
        <div class="spa-page-header">
          <h1 class="spa-title">⚡ Treino de Atributos</h1>
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

  const currentSpeed = currentPet.speed || 1;
  const currentInteligence = currentPet.inteligence || 1;

  return `
    <div class="spa-page">
      <div class="spa-page-header">
        <div>
          <h1 class="spa-title">⚡ Treino de Atributos</h1>
          <p class="spa-text-muted">${currentPet.name} - Nível ${currentPet.level || 1}</p>
        </div>
      </div>
      <div class="spa-page-content">
        <!-- Current Attributes -->
        <div class="spa-card" style="border-color: rgba(241, 196, 15, 0.3); margin-bottom: 24px;">
          <h3 class="spa-subtitle">📈 Atributos Atuais</h3>
          
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-top: 16px;">
            <div>
              <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                <span class="spa-stat-label">⚡ Velocidade</span>
                <span class="spa-stat-value">${currentSpeed}</span>
              </div>
              <div class="spa-progress-bar">
                <div class="spa-progress-fill" style="width: ${Math.min(100, currentSpeed * 10)}%;"></div>
              </div>
            </div>

            <div>
              <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                <span class="spa-stat-label">🧠 Inteligência</span>
                <span class="spa-stat-value">${currentInteligence}</span>
              </div>
              <div class="spa-progress-bar">
                <div class="spa-progress-fill" style="width: ${Math.min(100, currentInteligence * 10)}%;"></div>
              </div>
            </div>
          </div>
        </div>

        <!-- Training Options -->
        <div style="margin: 24px 0;">
          <h3 class="spa-subtitle">🏋️ Treinos Disponíveis</h3>
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 12px; margin-top: 12px;">
            <!-- Speed Training -->
            <div class="spa-card" style="border-color: rgba(68, 170, 255, 0.3);">
              <h4 style="color: var(--color-accent-blue); font-size: 1.2em; margin-bottom: 12px;">⚡ Velocidade</h4>
              <p class="spa-text-muted" style="font-size: 0.9em; margin-bottom: 12px;">Treine a velocidade do seu pet</p>
              <button class="spa-btn spa-btn-primary spa-btn-small" onclick="
                alert('Treino de Velocidade concluído! +10 SPD +25 XP');
                const pet = window.gameState.get('currentPet');
                pet.speed = (pet.speed || 1) + 10;
                pet.xp = (pet.xp || 0) + 25;
                pet.energy = Math.max(0, (pet.energy || 100) - 30);
                window.gameState.set('currentPet', pet);
                window.location.hash = '#/training-attributes';
              " style="width: 100%; margin-top: 8px;">Treinar (+10 SPD)</button>
            </div>

            <!-- Intelligence Training -->
            <div class="spa-card" style="border-color: rgba(0, 255, 136, 0.3);">
              <h4 style="color: var(--color-accent-green); font-size: 1.2em; margin-bottom: 12px;">🧠 Inteligência</h4>
              <p class="spa-text-muted" style="font-size: 0.9em; margin-bottom: 12px;">Aumente a inteligência do pet</p>
              <button class="spa-btn spa-btn-success spa-btn-small" onclick="
                alert('Treino de Inteligência concluído! +10 INT +25 XP');
                const pet = window.gameState.get('currentPet');
                pet.inteligence = (pet.inteligence || 1) + 10;
                pet.xp = (pet.xp || 0) + 25;
                pet.energy = Math.max(0, (pet.energy || 100) - 30);
                window.gameState.set('currentPet', pet);
                window.location.hash = '#/training-attributes';
              " style="width: 100%; margin-top: 8px;">Treinar (+10 INT)</button>
            </div>

            <!-- Balanced Training -->
            <div class="spa-card" style="border-color: rgba(241, 196, 15, 0.3);">
              <h4 style="color: var(--color-accent-yellow); font-size: 1.2em; margin-bottom: 12px;">⚖️ Balanceado</h4>
              <p class="spa-text-muted" style="font-size: 0.9em; margin-bottom: 12px;">Treina ambos os atributos</p>
              <button class="spa-btn spa-btn-warning spa-btn-small" onclick="
                alert('Treino Balanceado concluído! +5 SPD +5 INT +30 XP');
                const pet = window.gameState.get('currentPet');
                pet.speed = (pet.speed || 1) + 5;
                pet.inteligence = (pet.inteligence || 1) + 5;
                pet.xp = (pet.xp || 0) + 30;
                pet.energy = Math.max(0, (pet.energy || 100) - 40);
                window.gameState.set('currentPet', pet);
                window.location.hash = '#/training-attributes';
              " style="width: 100%; margin-top: 8px;">Treinar (Ambos)</button>
            </div>
          </div>
        </div>

        <!-- Stats Summary -->
        <div class="spa-card" style="border-color: rgba(0, 255, 136, 0.3); margin-top: 24px;">
          <h3 class="spa-subtitle">📊 Status Atual</h3>
          <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; margin-top: 12px;">
            <div class="spa-stat">
              <span class="spa-stat-label">Energia</span>
              <span class="spa-stat-value">${currentPet.energy || 100}/100</span>
            </div>
            <div class="spa-stat">
              <span class="spa-stat-label">Felicidade</span>
              <span class="spa-stat-value">${currentPet.happiness || 100}/100</span>
            </div>
            <div class="spa-stat">
              <span class="spa-stat-label">XP Total</span>
              <span class="spa-stat-value">${currentPet.xp || 0}</span>
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
