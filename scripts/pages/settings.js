/**
 * Settings - SPA
 * Configurações do jogo
 */

function settingsPage() {
  const gameState = window.gameState;
  const settings = gameState.get('settings') || {
    sound: true,
    notifications: true,
    autoSave: true,
    language: 'pt-BR',
  };

  return `
    <div class="spa-page">
      <div class="spa-page-header">
        <h1 class="spa-title">⚙️ Configurações</h1>
        <p class="spa-text-muted">Personalize sua experiência</p>
      </div>

      <div class="spa-page-content">
        <!-- Game Settings -->
        <div class="spa-card" style="margin-bottom: 24px;">
          <h3 class="spa-subtitle">🎮 Configurações do Jogo</h3>
          
          <div style="margin-top: 16px;">
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px; background: rgba(68, 170, 255, 0.1); border-radius: 8px; margin-bottom: 12px;">
              <div>
                <p class="spa-stat-label">🔊 Som</p>
                <p class="spa-text-small" style="color: #888;">Efeitos sonoros e música</p>
              </div>
              <button class="spa-btn ${settings.sound ? 'spa-btn-success' : 'spa-btn-danger'} spa-btn-small" 
                onclick="toggleSetting('sound')">
                ${settings.sound ? '✓ Ativado' : '✗ Desativado'}
              </button>
            </div>

            <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px; background: rgba(68, 170, 255, 0.1); border-radius: 8px; margin-bottom: 12px;">
              <div>
                <p class="spa-stat-label">🔔 Notificações</p>
                <p class="spa-text-small" style="color: #888;">Alertas de eventos importantes</p>
              </div>
              <button class="spa-btn ${settings.notifications ? 'spa-btn-success' : 'spa-btn-danger'} spa-btn-small" 
                onclick="toggleSetting('notifications')">
                ${settings.notifications ? '✓ Ativado' : '✗ Desativado'}
              </button>
            </div>

            <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px; background: rgba(68, 170, 255, 0.1); border-radius: 8px;">
              <div>
                <p class="spa-stat-label">💾 Auto-salvamento</p>
                <p class="spa-text-small" style="color: #888;">Salvar progresso automaticamente</p>
              </div>
              <button class="spa-btn ${settings.autoSave ? 'spa-btn-success' : 'spa-btn-danger'} spa-btn-small" 
                onclick="toggleSetting('autoSave')">
                ${settings.autoSave ? '✓ Ativado' : '✗ Desativado'}
              </button>
            </div>
          </div>
        </div>

        <!-- Game Stats -->
        <div class="spa-card" style="margin-bottom: 24px;">
          <h3 class="spa-subtitle">📊 Estatísticas do Jogo</h3>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-top: 16px;">
            <div class="spa-stat">
              <span class="spa-stat-label">🐾 Total de Pets</span>
              <span class="spa-stat-value">${(gameState.get('pets') || []).length}</span>
            </div>
            <div class="spa-stat">
              <span class="spa-stat-label">💰 Total de Moedas</span>
              <span class="spa-stat-value">${gameState.get('coins') || 0}</span>
            </div>
            <div class="spa-stat">
              <span class="spa-stat-label">📦 Itens no Inventário</span>
              <span class="spa-stat-value">${(gameState.get('inventory') || []).length}</span>
            </div>
            <div class="spa-stat">
              <span class="spa-stat-label">⚔️ Batalhas Vencidas</span>
              <span class="spa-stat-value">${gameState.get('battlesWon') || 0}</span>
            </div>
          </div>
        </div>

        <!-- Danger Zone -->
        <div class="spa-card" style="border-color: #ff4444; background: rgba(255, 68, 68, 0.1);">
          <h3 class="spa-subtitle" style="color: #ff4444;">⚠️ Zona de Perigo</h3>
          <p class="spa-text-small" style="color: #aaa; margin: 12px 0;">
            Ações irreversíveis que afetam permanentemente seu progresso
          </p>
          <div style="display: grid; gap: 12px; margin-top: 16px;">
            <button class="spa-btn spa-btn-warning" onclick="resetGameData()">
              🔄 Resetar Dados do Jogo
            </button>
            <button class="spa-btn spa-btn-danger" onclick="clearAllData()">
              🗑️ Limpar Todos os Dados
            </button>
          </div>
        </div>
      </div>

      <div class="spa-page-footer">
        <button class="spa-btn spa-btn-primary" onclick="window.router.navigate('/home')">← Voltar</button>
        <div style="text-align: right; font-size: 0.85em; color: var(--color-text-muted); align-self: center;">
          Kadir11 SPA v1.0.0
        </div>
      </div>
    </div>
  `;
}

function toggleSetting(settingName) {
  const gameState = window.gameState;
  const settings = gameState.get('settings') || {};
  
  settings[settingName] = !settings[settingName];
  gameState.set('settings', settings);

  // Atualizar página
  const container = document.getElementById('spa-container');
  if (container) {
    container.innerHTML = settingsPage();
  }
}

function resetGameData() {
  if (confirm('⚠️ Isso irá resetar todo o progresso do jogo!\n\nTem certeza que deseja continuar?')) {
    const gameState = window.gameState;
    gameState.set('pets', []);
    gameState.set('currentPet', null);
    gameState.set('coins', 1000);
    gameState.set('inventory', []);
    gameState.set('battlesWon', 0);
    
    alert('✓ Dados do jogo resetados!');
    window.router.navigate('/home');
  }
}

function clearAllData() {
  if (confirm('⚠️ ATENÇÃO: Isso irá APAGAR TUDO!\n\nIncluindo configurações, pets, itens e progresso.\n\nEsta ação NÃO PODE ser desfeita!\n\nTem CERTEZA ABSOLUTA?')) {
    if (confirm('Última confirmação: Apagar TODOS os dados?')) {
      localStorage.clear();
      alert('✓ Todos os dados foram apagados!\n\nA página será recarregada.');
      window.location.reload();
    }
  }
}
