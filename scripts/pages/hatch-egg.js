/**
 * Hatch Egg - SPA
 * Sistema de chocagem de ovos
 */

function hatchEggPage() {
  const gameState = window.gameState;
  const inventory = gameState.get('inventory') || [];

  // Filtrar apenas ovos
  const eggs = inventory.filter(item => item.type === 'egg');

  return `
    <div class="spa-page">
      <div class="spa-page-header">
        <h1 class="spa-title">🥚 Chocar Ovos</h1>
        <p class="spa-text-muted">Transforme seus ovos em pets!</p>
      </div>

      <div class="spa-page-content">
        ${eggs.length === 0 ? `
          <div class="spa-card is-warning">
            <h3 class="spa-subtitle">⚠️ Nenhum ovo disponível</h3>
            <p class="spa-text">Você precisa adquirir ovos na loja ou em jornadas.</p>
          </div>
        ` : `
          <div style="display: grid; gap: 16px;">
            ${eggs.map((egg, idx) => `
              <div class="spa-card" style="border-left: 4px solid #ffaa00;">
                <div style="display: grid; grid-template-columns: auto 1fr auto; gap: 16px; align-items: center;">
                  <div style="font-size: 3em;">🥚</div>
                  <div>
                    <h3 class="spa-subtitle">${egg.name}</h3>
                    <p class="spa-text-small" style="color: #aaa; margin-top: 4px;">
                      ${egg.description || 'Ovo misterioso aguardando para ser chocado'}
                    </p>
                    <div style="margin-top: 8px;">
                      <span class="spa-badge" style="background: #ffaa00;">
                        ${egg.rarity || 'Comum'}
                      </span>
                    </div>
                  </div>
                  <button class="spa-btn spa-btn-success" onclick="hatchEgg(${idx})">
                    🐣 Chocar
                  </button>
                </div>
              </div>
            `).join('')}
          </div>
        `}

        <!-- Informações -->
        <div class="spa-card" style="margin-top: 24px; background: rgba(68, 170, 255, 0.1); border-color: #44aaff;">
          <h3 class="spa-subtitle">💡 Como funciona</h3>
          <ul style="margin: 12px 0; padding-left: 20px; color: #aaa; line-height: 1.8;">
            <li>Cada ovo pode gerar um pet aleatório</li>
            <li>A raridade do ovo influencia os stats do pet</li>
            <li>Pets chocados começam no nível 1</li>
            <li>Você pode ter até 10 pets simultaneamente</li>
          </ul>
        </div>
      </div>

      <div class="spa-page-footer">
        <button class="spa-btn spa-btn-primary" onclick="window.router.navigate('/home')">← Voltar</button>
      </div>
    </div>
  `;
}

function hatchEgg(eggIndex) {
  const gameState = window.gameState;
  const inventory = gameState.get('inventory') || [];
  const eggs = inventory.filter(item => item.type === 'egg');
  const egg = eggs[eggIndex];

  if (!egg) {
    alert('❌ Ovo não encontrado!');
    return;
  }

  // Gerar pet aleatório
  const species = ['Pidgly', 'Ignis', 'Drazraq', 'Ashfang', 'Kael', 'Leoracal'];
  const elements = ['fogo', 'agua', 'terra', 'ar', 'puro'];
  const rarities = ['Comum', 'Incomum', 'Raro', 'MuitoRaro'];

  const newPet = {
    id: `pet_${Date.now()}`,
    name: `${species[Math.floor(Math.random() * species.length)]} Jr`,
    species: species[Math.floor(Math.random() * species.length)],
    element: elements[Math.floor(Math.random() * elements.length)],
    rarity: egg.rarity || rarities[Math.floor(Math.random() * rarities.length)],
    level: 1,
    xp: 0,
    life: 100,
    maxLife: 100,
    energy: 100,
    hunger: 100,
    happiness: 100,
    force: Math.floor(Math.random() * 5) + 3,
    defense: Math.floor(Math.random() * 5) + 3,
    speed: Math.floor(Math.random() * 5) + 3,
    intelligence: Math.floor(Math.random() * 5) + 3,
    moves: ['Arranhão', 'Mordida'],
  };

  // Adicionar pet à lista
  const pets = gameState.get('pets') || [];
  pets.push(newPet);
  gameState.set('pets', pets);

  // Remover ovo do inventário
  const eggInventoryIndex = inventory.findIndex(item => item === egg);
  if (eggInventoryIndex !== -1) {
    inventory.splice(eggInventoryIndex, 1);
    gameState.set('inventory', inventory);
  }

  // Setar como pet atual se for o primeiro
  if (!gameState.get('currentPet')) {
    gameState.set('currentPet', newPet);
  }

  alert(`🎉 ${newPet.name} nasceu!\n\nElemento: ${newPet.element}\nRaridade: ${newPet.rarity}\nNível: ${newPet.level}`);
  
  // Atualizar página
  const container = document.getElementById('spa-container');
  if (container) {
    container.innerHTML = hatchEggPage();
  }
}
