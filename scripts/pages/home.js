/**
 * Home Page - Primeira página SPA
 * Página simples de teste do roteador
 */

function homePage(state = {}) {
  const gameState = window.gameState;
  
  return `
    <div class="spa-page">
      <!-- Header -->
      <div class="spa-page-header">
        <div>
          <h1 class="spa-title">🏠 Kadir11 SPA</h1>
          <p class="spa-text-muted">Single Page Application - FASE 1-4</p>
        </div>
      </div>

      <!-- Content -->
      <div class="spa-page-content">
        <!-- Welcome Card -->
        <div class="spa-card spa-animate-in" style="background: linear-gradient(135deg, rgba(68, 170, 255, 0.1), rgba(0, 255, 136, 0.1)); border-color: rgba(68, 170, 255, 0.3);">
          <h2 class="spa-subtitle">🎮 Bem-vindo ao Kadir11!</h2>
          <p class="spa-text">Esta é a infraestrutura base da aplicação Single Page. Navegue entre as seções usando os botões abaixo.</p>
        </div>

        <!-- Navigation Grid -->
        <div style="margin: 24px 0;">
          <h3 class="spa-subtitle">📍 Navegação</h3>
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 12px;">
            <button class="spa-btn spa-btn-primary" onclick="router.navigate('/home')">🏠 Home</button>
            <button class="spa-btn spa-btn-success" onclick="router.navigate('/create-pet')">🐣 Criar Pet</button>
            <button class="spa-btn spa-btn-primary" onclick="router.navigate('/status')">📊 Status</button>
            <button class="spa-btn spa-btn-primary" onclick="router.navigate('/items')">🎒 Items</button>
            <button class="spa-btn spa-btn-primary" onclick="router.navigate('/store')">🛍️ Loja</button>
            <button class="spa-btn spa-btn-primary" onclick="router.navigate('/pen')">🏠 Meu Pen</button>
            <button class="spa-btn spa-btn-primary" onclick="router.navigate('/nests')">🥚 Ninhos</button>
            <button class="spa-btn spa-btn-primary" onclick="router.navigate('/hatch-egg')">🐣 Chocar Ovos</button>
            <button class="spa-btn spa-btn-primary" onclick="router.navigate('/training-menu')">🏋️ Treino</button>
            <button class="spa-btn spa-btn-danger" onclick="router.navigate('/battle-menu')">⚔️ Batalha</button>
            <button class="spa-btn spa-btn-success" onclick="router.navigate('/journey-menu')">🗺️ Jornada</button>
            <button class="spa-btn spa-btn-primary" onclick="router.navigate('/bestiary')">📖 Bestiário</button>
            <button class="spa-btn spa-btn-primary" onclick="router.navigate('/store')">🛒 Loja</button>
            <button class="spa-btn spa-btn-primary" onclick="router.navigate('/items')">🎒 Inventário</button>
            <button class="spa-btn spa-btn-warning" onclick="router.navigate('/settings')">⚙️ Config</button>
          </div>
        </div>

        <!-- Game State -->
        <div class="spa-card spa-animate-slide" style="margin-top: 24px; border-color: rgba(68, 170, 255, 0.3);">
          <h3 class="spa-subtitle">📈 Estado do Jogo</h3>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-top: 12px;">
            <div>
              <div class="spa-stat">
                <span class="spa-stat-label">💰 Moedas</span>
                <span class="spa-stat-value">${gameState.get('coins') || 0}</span>
              </div>
              <div class="spa-stat">
                <span class="spa-stat-label">🎛️ Mini-mode</span>
                <span class="spa-stat-value">${gameState.get('isMiniMode') ? '✓ Ativo' : '✗ Inativo'}</span>
              </div>
            </div>
            <div>
              <div class="spa-stat">
                <span class="spa-stat-label">🐾 Pet Ativo</span>
                <span class="spa-stat-value">${gameState.get('currentPet')?.name || '—'}</span>
              </div>
              <div class="spa-stat">
                <span class="spa-stat-label">🆔 ID do Pet</span>
                <span class="spa-stat-value" style="font-size: 0.9em; font-family: monospace;">${gameState.get('currentPet')?.id || '—'}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Router Info -->
        <div class="spa-card" style="margin-top: 16px; border-color: rgba(0, 255, 136, 0.3);">
          <h3 class="spa-subtitle">🛣️ Informações do Router</h3>
          <div style="margin-top: 12px;">
            <div class="spa-stat">
              <span class="spa-stat-label">Página Atual</span>
              <span class="spa-stat-value">${router.getCurrentPage()}</span>
            </div>
            <div class="spa-stat">
              <span class="spa-stat-label">Histórico</span>
              <span class="spa-stat-value" style="font-size: 0.9em; word-break: break-all;">${router.getHistory().join(' → ')}</span>
            </div>
          </div>
        </div>

        <!-- Test Actions -->
        <div style="margin: 24px 0;">
          <h3 class="spa-subtitle">🧪 Ações de Teste</h3>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
            <button class="spa-btn spa-btn-success spa-btn-small" onclick="
              gameState.set('coins', gameState.get('coins') + 10);
              location.hash = '#/home';
            ">➕ +10 Moedas</button>
            <button class="spa-btn spa-btn-warning spa-btn-small" onclick="
              gameState.set('isMiniMode', !gameState.get('isMiniMode'));
              location.hash = '#/home';
            ">🎛️ Toggle Mini-mode</button>
            <button class="spa-btn spa-btn-primary spa-btn-small" onclick="
              gameState.set('currentPet', { 
                id: '000001', 
                name: 'Test Pet',
                level: 5,
                element: 'fogo',
                rarity: 'raro',
                life: 100,
                maxLife: 100,
                force: 8,
                defense: 6,
                speed: 7,
                intelligence: 5,
                moves: ['Arranhão', 'Mordida', 'Ataque Rápido']
              });
              location.hash = '#/home';
            ">🐾 Simular Pet</button>
            <button class="spa-btn spa-btn-danger spa-btn-small" onclick="router.back()">⬅️ Voltar</button>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div class="spa-page-footer">
        <button class="spa-btn spa-btn-primary" onclick="window.closeSPA()">✕ Fechar SPA</button>
        <div style="text-align: right; font-size: 0.85em; color: var(--color-text-muted); align-self: center;">
          SPA Completo (23 Rotas) | ${new Date().toLocaleString('pt-BR')}
        </div>
      </div>
    </div>
  `;
}
