/**
 * Battle Arena - SPA
 * Arena de batalha com visualização e execução de combate
 */

function battleArenaPage() {
  const gameState = window.gameState;
  const battleState = gameState.get('battleState');

  if (!battleState || !battleState.playerPet || !battleState.opponentPet) {
    return `
      <div class="spa-page">
        <div class="spa-page-header">
          <h1 class="spa-title">⚔️ Arena</h1>
        </div>
        <div class="spa-page-content">
          <div class="spa-card is-error">
            <h3 class="spa-subtitle">⚠️ Nenhuma batalha em andamento</h3>
          </div>
        </div>
        <div class="spa-page-footer">
          <button class="spa-btn spa-btn-primary" onclick="window.router.navigate('/battle-menu')">← Voltar</button>
        </div>
      </div>
    `;
  }

  const playerPet = battleState.playerPet;
  const opponentPet = battleState.opponentPet;

  // Calcular HP percentuais
  const playerHPPercent = Math.max(0, (playerPet.life / (playerPet.maxLife || 100)) * 100);
  const opponentHPPercent = Math.max(0, (opponentPet.life / (opponentPet.maxLife || 100)) * 100);

  // Determinar cor de vida baseado em percentual
  const getHPColor = (percent) => {
    if (percent > 50) return '#00ff88';
    if (percent > 25) return '#ffaa00';
    return '#ff4444';
  };

  return `
    <div class="spa-page">
      <div class="spa-page-header">
        <h1 class="spa-title">⚔️ Batalha em Progresso</h1>
        <p class="spa-text-muted">Rodada ${battleState.round}</p>
      </div>

      <div class="spa-page-content">
        <!-- Arena de Combate -->
        <div class="spa-card" style="background: linear-gradient(135deg, #1a1f2e 0%, #2a323e 100%); margin-bottom: 24px; padding: 20px; border-radius: 12px;">
          <!-- Opponent -->
          <div style="text-align: center; margin-bottom: 30px;">
            <p class="spa-text-small" style="color: #aaa; margin-bottom: 8px;">OPONENTE</p>
            <p class="spa-stat-label" style="margin-bottom: 4px;">${opponentPet.name}</p>
            <p class="spa-text-small" style="color: #888;">Nível ${opponentPet.level || 1} | ${opponentPet.rarity || 'Comum'}</p>
            
            <!-- HP Bar Opponent -->
            <div style="margin: 12px 0; background: #1a1f2e; border: 1px solid #444; border-radius: 6px; overflow: hidden; height: 20px;">
              <div style="width: ${opponentHPPercent}%; height: 100%; background: linear-gradient(90deg, #ff6666 0%, #ff8888 100%); transition: width 0.3s;">
              </div>
            </div>
            <p class="spa-text-small">${Math.ceil(opponentPet.life)}/${opponentPet.maxLife || 100} HP</p>
          </div>

          <!-- Divisor -->
          <div style="height: 1px; background: linear-gradient(90deg, transparent, #44aaff, transparent); margin: 20px 0;"></div>

          <!-- Player -->
          <div style="text-align: center;">
            <p class="spa-text-small" style="color: #aaa; margin-bottom: 8px;">SEU PET</p>
            <p class="spa-stat-label" style="margin-bottom: 4px;">${playerPet.name}</p>
            <p class="spa-text-small" style="color: #888;">Nível ${playerPet.level || 1} | ${playerPet.rarity || 'Comum'}</p>
            
            <!-- HP Bar Player -->
            <div style="margin: 12px 0; background: #1a1f2e; border: 1px solid #444; border-radius: 6px; overflow: hidden; height: 20px;">
              <div style="width: ${playerHPPercent}%; height: 100%; background: linear-gradient(90deg, ${getHPColor(playerHPPercent)} 0%, #44ff88 100%); transition: width 0.3s;">
              </div>
            </div>
            <p class="spa-text-small">${Math.ceil(playerPet.life)}/${playerPet.maxLife || 100} HP</p>
          </div>
        </div>

        <!-- Stats Comparison -->
        <div class="spa-card" style="margin-bottom: 24px;">
          <h3 class="spa-subtitle">📊 Comparação de Stats</h3>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-top: 12px;">
            <div>
              <p class="spa-text-small" style="color: #aaa; margin-bottom: 8px;">Seu Pet</p>
              <div style="display: grid; gap: 6px;">
                <div style="display: flex; justify-content: space-between;">
                  <span class="spa-text-small">⚡ Força:</span>
                  <span class="spa-stat-label" style="font-size: 0.95em;">${playerPet.force || 5}</span>
                </div>
                <div style="display: flex; justify-content: space-between;">
                  <span class="spa-text-small">🛡️ Defesa:</span>
                  <span class="spa-stat-label" style="font-size: 0.95em;">${playerPet.defense || 5}</span>
                </div>
                <div style="display: flex; justify-content: space-between;">
                  <span class="spa-text-small">💨 Velocidade:</span>
                  <span class="spa-stat-label" style="font-size: 0.95em;">${playerPet.speed || 5}</span>
                </div>
              </div>
            </div>
            <div>
              <p class="spa-text-small" style="color: #aaa; margin-bottom: 8px;">Oponente</p>
              <div style="display: grid; gap: 6px;">
                <div style="display: flex; justify-content: space-between;">
                  <span class="spa-text-small">⚡ Força:</span>
                  <span class="spa-stat-label" style="font-size: 0.95em;">${opponentPet.force || 5}</span>
                </div>
                <div style="display: flex; justify-content: space-between;">
                  <span class="spa-text-small">🛡️ Defesa:</span>
                  <span class="spa-stat-label" style="font-size: 0.95em;">${opponentPet.defense || 5}</span>
                </div>
                <div style="display: flex; justify-content: space-between;">
                  <span class="spa-text-small">💨 Velocidade:</span>
                  <span class="spa-stat-label" style="font-size: 0.95em;">${opponentPet.speed || 5}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Ações de Batalha -->
        <div class="spa-card" style="margin-bottom: 24px;">
          <h3 class="spa-subtitle">⚔️ Ações Disponíveis</h3>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-top: 12px;">
            <button class="spa-btn spa-btn-success" onclick="executePlayerAttack(0)">
              🎯 Atacar 1
            </button>
            <button class="spa-btn spa-btn-success" onclick="executePlayerAttack(1)">
              🎯 Atacar 2
            </button>
            <button class="spa-btn spa-btn-warning" style="grid-column: 1 / -1;" onclick="executeSimulatedBattle()">
              ⚡ Simular Batalha Completa
            </button>
          </div>
        </div>

        <!-- Battle Log -->
        <div class="spa-card" style="background: #0a0f18; border: 1px solid #333;">
          <h3 class="spa-subtitle">📜 Log de Batalha</h3>
          <div style="max-height: 200px; overflow-y: auto; margin-top: 12px; padding: 12px; background: #1a1f2e; border-radius: 6px; font-size: 0.9em; color: #aaa;">
            ${battleState.log && battleState.log.length > 0 
              ? battleState.log.map(msg => `<p style="margin: 6px 0;">${msg}</p>`).join('')
              : '<p style="color: #555;">Batalha iniciada. Escolha sua ação!</p>'
            }
          </div>
        </div>
      </div>

      <div class="spa-page-footer">
        <button class="spa-btn spa-btn-danger" onclick="surrenderBattle()">🏃 Fugir</button>
        <button class="spa-btn spa-btn-primary" onclick="window.router.navigate('/battle-menu')">← Voltar</button>
      </div>
    </div>
  `;
}

function executePlayerAttack(moveIndex) {
  const gameState = window.gameState;
  const battleState = gameState.get('battleState');

  if (!battleState) return;

  // Criar engine se não existir
  if (!window.currentBattleEngine) {
    window.currentBattleEngine = new window.BattleEngine(
      battleState.playerPet,
      battleState.opponentPet
    );
  }

  const engine = window.currentBattleEngine;

  // Turno do jogador
  engine.executeTurn(engine.playerPet, engine.opponentPet, moveIndex);

  // Turno do oponente (se ainda está vivo)
  if (engine.opponentPet.life > 0) {
    engine.executeTurn(
      engine.opponentPet,
      engine.playerPet,
      Math.floor(Math.random() * 3)
    );
  }

  // Atualizar status
  const status = engine.getStatus();
  battleState.playerPet.life = status.playerHP;
  battleState.opponentPet.life = status.opponentHP;
  battleState.log = status.log;
  battleState.round++;

  // Verificar fim de batalha
  if (engine.playerPet.life <= 0 || engine.opponentPet.life <= 0) {
    endBattle(engine);
  }

  gameState.set('battleState', battleState);
  
  // Atualizar página
  const container = document.getElementById('spa-container');
  if (container) {
    container.innerHTML = battleArenaPage();
  }
}

function executeSimulatedBattle() {
  const gameState = window.gameState;
  const battleState = gameState.get('battleState');

  if (!battleState) return;

  // Criar engine se não existir
  if (!window.currentBattleEngine) {
    window.currentBattleEngine = new window.BattleEngine(
      JSON.parse(JSON.stringify(battleState.playerPet)),
      JSON.parse(JSON.stringify(battleState.opponentPet))
    );
  }

  const engine = window.currentBattleEngine;
  const results = engine.simulateBattle();

  // Atualizar estado com resultados
  battleState.playerPet.life = results.playerFinalHP;
  battleState.opponentPet.life = results.opponentFinalHP;
  battleState.log = results.log;
  battleState.round = results.rounds;
  battleState.battleResult = results;

  gameState.set('battleState', battleState);

  // Ir para resultado
  endBattle(engine);
}

function endBattle(engine) {
  const gameState = window.gameState;
  const battleState = gameState.get('battleState');
  
  const won = engine.playerPet.life > 0;

  if (won) {
    // Recompensas por vitória
    const currentPet = gameState.get('currentPet');
    const reward = {
      xp: 100,
      coins: Math.floor(Math.random() * 50) + 50,
      happiness: 15,
    };

    currentPet.xp = (currentPet.xp || 0) + reward.xp;
    gameState.set('currentPet', currentPet);
    gameState.set('coins', (gameState.get('coins') || 0) + reward.coins);

    alert(`🎉 Vitória! Recebeu ${reward.xp} XP e ${reward.coins} moedas!`);
  } else {
    alert(`😢 Derrota... Seu pet perdeu a batalha.`);
  }

  // Limpar estado de batalha
  window.currentBattleEngine = null;
  gameState.set('battleState', null);
  window.router.navigate('/home');
}

function surrenderBattle() {
  const gameState = window.gameState;
  gameState.set('battleState', null);
  window.currentBattleEngine = null;
  alert('🏃 Você fugiu da batalha!');
  window.router.navigate('/home');
}
