console.log('journey-scene.js carregado');
import { getElementMultiplier } from './elements.js';
import { computeDisplayPower, computeBattlePower } from './moveEffectiveness.js';
import { calculateXpGain } from './xpUtils.js';

// Variável global para rastrear a origem da batalha (journey ou lair)
let battleSource = 'journey';

function closeWindow() {
  window.close();
}

function assetPath(relative) {
  if (!relative) return '';
  // Remove Assets/Mons/ do início se já existir para evitar duplicação
  const cleaned = relative.replace(/^[Aa]ssets\/[Mm]ons\//, '').replace(/\\/g, '/');
  return `../../Assets/Mons/${cleaned}`;
}

function imageExists(src) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(true);
    img.onerror = () => resolve(false);
    img.src = src;
  });
}

async function computeAttackSrc(idleRelative) {
  if (!idleRelative) return '';
  console.log('computeAttackSrc input:', idleRelative);
  
  // Se já é um caminho completo (Boss), usar diretamente
  if (idleRelative.startsWith('../../Assets/Boss/')) {
    const attackGif = idleRelative.replace(/idle\.(gif|png)$/i, 'attack.gif');
    console.log('computeAttackSrc (Boss path) checking:', attackGif);
    if (await imageExists(attackGif)) {
      return attackGif;
    }
    
    const attackPng = idleRelative.replace(/idle\.(gif|png)$/i, 'attack.png');
    console.log('computeAttackSrc (Boss path) checking fallback:', attackPng);
    if (await imageExists(attackPng)) {
      return attackPng;
    }
    
    return idleRelative; // Retorna idle como fallback
  }
  
  const fullPath = assetPath(idleRelative);
  const attackGif = fullPath.replace(/idle\.(gif|png)$/i, 'attack.gif');
  console.log('computeAttackSrc checking:', attackGif);

  if (await imageExists(attackGif)) {
    return attackGif;
  }
  
  const attackPng = fullPath.replace(/idle\.(gif|png)$/i, 'attack.png');
  console.log('computeAttackSrc checking fallback:', attackPng);
  if (await imageExists(attackPng)) {
    return attackPng;
  }
  
  return fullPath; // Retorna o idle se não tiver ataque
}

async function computeIdleSrc(idleRelative) {
  if (!idleRelative) return '';
  console.log('computeIdleSrc input:', idleRelative);
  
  // Se já é um caminho completo (Boss), usar diretamente
  if (idleRelative.startsWith('../../Assets/Boss/')) {
    const idleGif = idleRelative.replace(/idle\.(gif|png)$/i, 'idle.gif');
    if (await imageExists(idleGif)) return idleGif;
    
    const idlePng = idleRelative.replace(/idle\.(gif|png)$/i, 'idle.png');
    if (await imageExists(idlePng)) return idlePng;
    
    console.warn('Boss idle.gif/png não encontrado');
    return idleRelative;
  }
  
  const fullPath = assetPath(idleRelative);
  const idleGif = fullPath.replace(/idle\.(gif|png)$/i, 'idle.gif');
  
  if (await imageExists(idleGif)) return idleGif;
  
  const idlePng = fullPath.replace(/idle\.(gif|png)$/i, 'idle.png');
  if (await imageExists(idlePng)) return idlePng;
  
  return fullPath;
}

async function computeFrontSrc(idleRelative) {
  if (!idleRelative) return '';
  console.log('computeFrontSrc input:', idleRelative);
  
  // Se já é um caminho completo (Boss), usar diretamente
  if (idleRelative.startsWith('../../Assets/Boss/')) {
    const frontGif = idleRelative.replace(/idle\.(gif|png)$/i, 'front.gif');
    if (await imageExists(frontGif)) return frontGif;
    
    const frontPng = idleRelative.replace(/idle\.(gif|png)$/i, 'front.png');
    if (await imageExists(frontPng)) return frontPng;
    
    console.warn('Boss front.gif/png não encontrado, usando idle como fallback');
    return idleRelative;
  }
  
  const fullPath = assetPath(idleRelative);
  const frontGif = fullPath.replace(/idle\.(gif|png)$/i, 'front.gif');

  if (await imageExists(frontGif)) return frontGif;

  const frontPng = fullPath.replace(/idle\.(gif|png)$/i, 'front.png');
  if (await imageExists(frontPng)) return frontPng;

  // Fallback: retorna idle path se front não existir
  console.warn('front.gif/png não encontrado, usando idle como fallback');
  return fullPath;
}

let pet = null;
let battleInitialized = false;

function getJourneyKey(base) {
  return pet && pet.petId ? `${base}_${pet.petId}` : base;
}
let itemsInfo = {};
let currentItemsTab = 'consumables';
let statusEffectsInfo = {};
let movesData = [];
let playerStatusEffects = [];
let playerHealth = 100;
let playerMaxHealth = 100;
let enemyHealth = 100;
let enemyMaxHealth = 100;
let enemyBars = 1;
let enemyCurrentBar = 1;
let enemyEnergy = 100;
let enemyAttributes = { attack: 5, defense: 5, magic: 5, speed: 5 };
let enemyMoves = [];
let currentTurn = 'player';
let actionInProgress = false;
let playerIdleSrc = '';
let playerAttackSrc = '';
let enemyIdleSrc = '';
let enemyAttackSrc = '';
let enemyElement = 'puro';
// custo agora vem do próprio move selecionado
let difficulty = 1;

if (window.electronAPI?.getDifficulty) {
  window.electronAPI
    .getDifficulty()
    .then(async (val) => {
      difficulty = typeof val === 'number' ? val : 1;
      if (difficulty === 1 && window.electronAPI?.setDifficulty) {
        difficulty = 1.5;
        try {
          await window.electronAPI.setDifficulty(difficulty);
        } catch (err) {
          console.error('Erro ao definir dificuldade:', err);
        }
      }
    })
    .catch(() => {
      difficulty = 1.5;
    });
}

async function loadItemsInfo() {
  try {
    const response = await fetch('../../data/items.json');
    const itemsArray = await response.json();
    // Converter array em objeto mapeado por ID
    itemsInfo = {};
    if (Array.isArray(itemsArray)) {
      itemsArray.forEach(item => {
        if (item.id) {
          itemsInfo[item.id] = item;
        }
      });
    }
    console.log('Items loaded:', Object.keys(itemsInfo).length);
  } catch (error) {
    console.error('Erro ao carregar items:', error);
    itemsInfo = {};
  }
}

async function loadStatusEffectsInfo() {
  try {
    const response = await fetch('../../data/status-effects.json');
    statusEffectsInfo = await response.json();
  } catch (error) {
    console.error('Erro ao carregar status effects:', error);
    statusEffectsInfo = {};
  }
}

async function loadMovesData() {
  try {
    const response = await fetch('../../data/moves.json');
    movesData = await response.json();
  } catch (error) {
    console.error('Erro ao carregar moves:', error);
    movesData = [];
  }
}

function showMessage(text) {
  const messageBox = document.getElementById('message-box');
  if (!messageBox) return;
  messageBox.textContent = text;
  messageBox.style.opacity = '1';
  setTimeout(() => {
    messageBox.style.opacity = '0';
  }, 2000);
}

function hideMenus() {
  const movesMenu = document.getElementById('moves-menu');
  const itemsMenu = document.getElementById('items-menu');
  if (movesMenu) movesMenu.style.display = 'none';
  if (itemsMenu) itemsMenu.style.display = 'none';
}

function updateMoves() {
  const menu = document.getElementById('moves-menu');
  if (!menu) return;
  menu.innerHTML = '';
  
  if (!pet || !pet.moves || pet.moves.length === 0) {
    const span = document.createElement('span');
    span.textContent = 'Sem golpes disponíveis!';
    span.style.gridColumn = '1 / -1';
    span.style.textAlign = 'center';
    span.style.padding = '20px';
    menu.appendChild(span);
    return;
  }

  pet.moves.forEach((move) => {
    const btn = document.createElement('button');
    btn.className = 'move-button';
    
    if (pet.energy < move.cost) {
      btn.disabled = true;
      btn.style.opacity = '0.5';
      btn.style.cursor = 'not-allowed';
    }

    const moveInfo = document.createElement('div');
    moveInfo.className = 'move-info';
    
    const moveName = document.createElement('div');
    moveName.className = 'move-name';
    moveName.textContent = move.name;
    
    const moveDetails = document.createElement('div');
    moveDetails.className = 'move-details';
    moveDetails.textContent = `Poder: ${move.power} | Custo: ${move.cost}`;
    
    moveInfo.appendChild(moveName);
    moveInfo.appendChild(moveDetails);

    let effectivenessClass = '';
    if (enemyElement && move.element) {
      const multiplier = getElementMultiplier(move.element, enemyElement);
      if (multiplier > 1) effectivenessClass = 'effective';
      else if (multiplier < 1) effectivenessClass = 'not-effective';
    }

    btn.appendChild(moveInfo);

    if (effectivenessClass) {
      btn.classList.add(effectivenessClass);
    }

    btn.addEventListener('click', () => {
      performPlayerMove(move);
    });
    menu.appendChild(btn);
  });
}

function updateItems() {
  const listEl = document.getElementById('items-list');
  if (!listEl) return;
  listEl.innerHTML = '';
  
  if (!pet || !pet.items || Object.keys(pet.items).length === 0) {
    const span = document.createElement('span');
    span.textContent = 'Você não tem itens! Tente fugir!';
    span.style.textAlign = 'center';
    span.style.padding = '20px';
    listEl.appendChild(span);
    return;
  }

  const items = pet.items;
  const ids = Object.keys(items).filter((id) => items[id] > 0);
  
  // Categorizar itens
  const categories = { equipments: [], consumables: [], eggs: [], others: [] };
  ids.forEach((id) => {
    const info = itemsInfo[id] || {};
    if (info.type === 'equipment') categories.equipments.push(id);
    else if (id.startsWith('egg')) categories.eggs.push(id);
    else if (info.type === 'consumable' || (!info.type && (id.includes('Potion') || id === 'meat' || id === 'chocolate'))) categories.consumables.push(id);
    else categories.others.push(id);
  });
  
  const itemKeys = categories[currentItemsTab] || [];
  
  if (itemKeys.length === 0) {
    const emptyMsg = document.createElement('div');
    emptyMsg.style.padding = '20px';
    emptyMsg.style.textAlign = 'center';
    emptyMsg.style.color = '#888';
    emptyMsg.textContent = 'Sem itens nesta categoria';
    listEl.appendChild(emptyMsg);
    return;
  }
  itemKeys.forEach((id, index) => {
    const qty = pet.items[id];
    if (qty <= 0) return;
    const info = itemsInfo[id] || { name: id, icon: '../../Assets/Shop/health-potion.png' };

    // Container do item com accordion
    const itemContainer = document.createElement('div');
    itemContainer.className = 'item-container';

    // Header do item (clicável para accordion)
    const itemHeader = document.createElement('div');
    itemHeader.className = 'item-header';

    const img = document.createElement('img');
    // Garantir que o caminho esteja correto
    let iconPath = info.icon || 'Assets/Shop/health-potion.png';
    if (!iconPath.startsWith('../../') && !iconPath.startsWith('http')) {
      iconPath = '../../' + iconPath;
    }
    img.src = iconPath;
    img.alt = info.name || id;
    img.className = 'item-icon';
    img.onerror = () => {
      console.warn('Failed to load icon:', iconPath, 'for item:', id);
      img.src = '../../Assets/Shop/health-potion.png';
    };

    const itemInfo = document.createElement('div');
    itemInfo.className = 'item-info';

    const nameQtyContainer = document.createElement('div');
    nameQtyContainer.className = 'item-name-qty';

    const label = document.createElement('span');
    label.textContent = info.name;
    label.className = 'item-name';

    const infoIcon = document.createElement('span');
    infoIcon.textContent = 'ⓘ';
    infoIcon.className = 'info-icon';
    infoIcon.title = 'Clique para ver detalhes';

    const qtyLabel = document.createElement('span');
    qtyLabel.textContent = `x${qty}`;
    qtyLabel.className = 'item-qty';

    nameQtyContainer.appendChild(label);
    nameQtyContainer.appendChild(infoIcon);
    nameQtyContainer.appendChild(qtyLabel);

    const arrow = document.createElement('span');
    arrow.className = 'accordion-arrow';
    arrow.textContent = '▼';

    itemInfo.appendChild(nameQtyContainer);
    itemHeader.appendChild(img);
    itemHeader.appendChild(itemInfo);
    itemHeader.appendChild(arrow);

    // Conteúdo do accordion (descrição)
    const itemContent = document.createElement('div');
    itemContent.className = 'item-content';

    const description = document.createElement('p');
    description.style.margin = '0 0 10px 0';
    description.textContent = info.description || info.effect || 'Sem descrição';
    itemContent.appendChild(description);

    // Botão de usar
    const useBtn = document.createElement('button');
    useBtn.className = 'button small-button use-item-btn';
    useBtn.textContent = 'Usar';

    useBtn.addEventListener('click', async (e) => {
      e.stopPropagation();
      if (currentTurn !== 'player' || actionInProgress) return;
      actionInProgress = true;
      hideMenus();
      showMessage(`Usando ${info.name}...`);

      try {
        const result = await window.electronAPI.useItem(id);

        if (result && typeof result.currentHealth === 'number') {
          playerHealth = result.currentHealth;
          updatePlayerHealth();
        }

        if (result && typeof result.energy === 'number') {
          pet.energy = result.energy;
          updatePlayerEnergy();
        }

        if (result && typeof result.happiness === 'number') {
          pet.happiness = result.happiness;
        }

        if (result && typeof result.hunger === 'number') {
          pet.hunger = result.hunger;
        }

        const petData = await window.electronAPI.invoke('get-current-pet');
        if (petData) {
          pet.items = petData.items;
          updateItems();
        }

        showMessage(`${info.name} usado com sucesso!`);
      } catch (err) {
        console.error('Erro ao usar item:', err);
        showMessage('Erro ao usar item!');
      }

      endPlayerTurn();
    });

    itemContent.appendChild(useBtn);

    // Toggle accordion ao clicar no header
    itemHeader.addEventListener('click', () => {
      const isOpen = itemContainer.classList.contains('open');
      // Fechar todos os outros itens
      document.querySelectorAll('.item-container').forEach((container) => {
        container.classList.remove('open');
      });
      // Toggle do item atual
      if (!isOpen) {
        itemContainer.classList.add('open');
      }
    });

    itemContainer.appendChild(itemHeader);
    itemContainer.appendChild(itemContent);

    // Adicionar divisória se não for o último item
    if (index < itemKeys.filter((k) => pet.items[k] > 0).length - 1) {
      const divider = document.createElement('div');
      divider.className = 'item-divider';
      itemContainer.appendChild(divider);
    }

    listEl.appendChild(itemContainer);
  });
}

function updateStatusIcons() {
  const container = document.getElementById('player-status-icons');
  if (!container) return;
  container.innerHTML = '';
  if (!Array.isArray(playerStatusEffects) || playerStatusEffects.length === 0) {
    container.style.display = 'none';
    return;
  }
  playerStatusEffects.forEach((id) => {
    const info = statusEffectsInfo[id];
    if (!info) return;
    const img = document.createElement('img');
    img.src = info.icon;
    img.alt = info.name;
    img.title = info.name;
    container.appendChild(img);
  });
  container.style.display = 'flex';
}

function attemptFlee() {
  if (currentTurn !== 'player' || actionInProgress) return;
  actionInProgress = true;
  hideMenus();
  let chance = 0.5;
  if (playerHealth >= enemyHealth) chance += 0.25;
  else chance -= 0.25;
  chance = Math.max(0.1, Math.min(0.9, chance));
  if (Math.random() < chance) {
    showMessage('Fuga bem-sucedida!');
    setTimeout(() => {
      actionInProgress = false;
      closeWindow();
    }, 1500);
  } else {
    showMessage('Fuga falhou!');
    endPlayerTurn();
  }
}

function updateHealthBars() {
  const playerFill = document.getElementById('player-health-fill');
  if (playerFill) {
    const percent = (playerHealth / playerMaxHealth) * 100;
    playerFill.style.width = `${percent}%`;
  }
  const enemyFill = document.getElementById('enemy-health-fill');
  if (enemyFill) {
    const percent = (enemyHealth / enemyMaxHealth) * 100;
    if (window.__BOSS_MULTIPLIERS__) {
      // Cor de barra: roxa na 1ª, vermelha na 2ª+
      enemyFill.style.backgroundColor = enemyCurrentBar === 1 ? '#800080' : '#B00020';
      // Indicador "x2" na segunda barra (direita do preenchimento)
      let multSpan = enemyFill.querySelector('.health-mult');
      if (enemyCurrentBar > 1) {
        if (!multSpan) {
          multSpan = document.createElement('span');
          multSpan.className = 'health-mult';
          multSpan.textContent = 'x2';
          multSpan.style.position = 'absolute';
          multSpan.style.right = '4px';
          multSpan.style.top = '50%';
          multSpan.style.transform = 'translateY(-50%)';
          multSpan.style.color = '#fff';
          multSpan.style.fontWeight = '700';
          multSpan.style.fontSize = '12px';
          multSpan.style.textShadow = '0 1px 2px rgba(0,0,0,0.6)';
          enemyFill.style.position = 'relative';
          enemyFill.appendChild(multSpan);
        }
      } else {
        if (multSpan) multSpan.remove();
      }
    }
    enemyFill.style.width = `${percent}%`;
  }
  const playerEnergy = pet ? pet.energy || 0 : 0;
  const playerEnergyFill = document.getElementById('player-energy-fill');
  if (playerEnergyFill) {
    playerEnergyFill.style.width = `${playerEnergy}%`;
  }
  const enemyEnergyFill = document.getElementById('enemy-energy-fill');
  if (enemyEnergyFill) {
    enemyEnergyFill.style.width = `${enemyEnergy}%`;
  }
}

function updatePlayerHealth() {
  const playerFill = document.getElementById('player-health-fill');
  if (playerFill) {
    const percent = (playerHealth / playerMaxHealth) * 100;
    playerFill.style.width = `${percent}%`;
  }
}

function updatePlayerEnergy() {
  const playerEnergy = pet ? pet.energy || 0 : 0;
  const playerEnergyFill = document.getElementById('player-energy-fill');
  if (playerEnergyFill) {
    playerEnergyFill.style.width = `${playerEnergy}%`;
  }
}

function playAttackAnimation(img, idle, attack, cb) {
  if (!img) {
    if (cb) cb();
    return;
  }
  console.log('Attack animation - switching to:', attack);
  // Força reload do GIF adicionando timestamp para tocar do início
  img.src = attack + '?t=' + Date.now();
  setTimeout(() => {
    console.log('Attack animation - returning to idle:', idle);
    img.src = idle + '?t=' + Date.now();
    if (cb) cb();
  }, 800);
}

function showHitEffect(target) {
  const id = target === 'player' ? 'player-hit' : 'enemy-hit';
  const el = document.getElementById(id);
  if (!el) return;
  el.style.display = 'block';
  setTimeout(() => {
    el.style.display = 'none';
  }, 300);
}

function selectEnemyMoves(element, level, rarity) {
  if (!movesData || movesData.length === 0) {
    console.warn('movesData não carregado, usando golpes padrão');
    // Golpes padrão por elemento
    const defaultMoves = {
      terra: [
        { name: 'Terremoto', power: 45, cost: 15, element: 'terra', elements: ['terra'], level: 1, type: 'physical' },
        { name: 'Pedrada', power: 30, cost: 10, element: 'terra', elements: ['terra'], level: 1, type: 'physical' },
        { name: 'Lâmina de Pedra', power: 35, cost: 12, element: 'terra', elements: ['terra'], level: 1, type: 'physical' }
      ],
      fogo: [
        { name: 'Chamas', power: 40, cost: 15, element: 'fogo', elements: ['fogo'], level: 1, type: 'special' },
        { name: 'Bola de Fogo', power: 35, cost: 12, element: 'fogo', elements: ['fogo'], level: 1, type: 'special' },
        { name: 'Incineração', power: 45, cost: 18, element: 'fogo', elements: ['fogo'], level: 1, type: 'special' }
      ],
      agua: [
        { name: 'Jato d\'Água', power: 40, cost: 15, element: 'agua', elements: ['agua'], level: 1, type: 'special' },
        { name: 'Bolha', power: 30, cost: 10, element: 'agua', elements: ['agua'], level: 1, type: 'special' },
        { name: 'Tsunami', power: 45, cost: 18, element: 'agua', elements: ['agua'], level: 1, type: 'special' }
      ],
      ar: [
        { name: 'Tornado', power: 40, cost: 15, element: 'ar', elements: ['ar'], level: 1, type: 'special' },
        { name: 'Ventania', power: 35, cost: 12, element: 'ar', elements: ['ar'], level: 1, type: 'special' },
        { name: 'Corte Aéreo', power: 38, cost: 14, element: 'ar', elements: ['ar'], level: 1, type: 'physical' }
      ],
      puro: [
        { name: 'Impacto', power: 35, cost: 12, element: 'puro', elements: ['puro'], level: 1, type: 'physical' },
        { name: 'Energia Pura', power: 40, cost: 15, element: 'puro', elements: ['puro'], level: 1, type: 'special' },
        { name: 'Rajada', power: 30, cost: 10, element: 'puro', elements: ['puro'], level: 1, type: 'physical' }
      ]
    };
    return defaultMoves[element] || defaultMoves.puro;
  }
  
  // Filtrar moves compatíveis com o elemento do inimigo
  const compatibleMoves = movesData.filter(move => {
    if (!move.elements || !Array.isArray(move.elements)) return false;
    return move.elements.includes(element);
  });
  
  if (compatibleMoves.length === 0) {
    console.warn('Nenhum move compatível encontrado para elemento:', element, 'usando golpes padrão');
    const defaultMoves = {
      terra: [
        { name: 'Terremoto', power: 45, cost: 15, element: 'terra', elements: ['terra'], level: 1, type: 'physical' },
        { name: 'Pedrada', power: 30, cost: 10, element: 'terra', elements: ['terra'], level: 1, type: 'physical' }
      ],
      fogo: [
        { name: 'Chamas', power: 40, cost: 15, element: 'fogo', elements: ['fogo'], level: 1, type: 'special' },
        { name: 'Bola de Fogo', power: 35, cost: 12, element: 'fogo', elements: ['fogo'], level: 1, type: 'special' }
      ],
      agua: [
        { name: 'Jato d\'Água', power: 40, cost: 15, element: 'agua', elements: ['agua'], level: 1, type: 'special' },
        { name: 'Bolha', power: 30, cost: 10, element: 'agua', elements: ['agua'], level: 1, type: 'special' }
      ],
      ar: [
        { name: 'Tornado', power: 40, cost: 15, element: 'ar', elements: ['ar'], level: 1, type: 'special' },
        { name: 'Ventania', power: 35, cost: 12, element: 'ar', elements: ['ar'], level: 1, type: 'special' }
      ],
      puro: [
        { name: 'Impacto', power: 35, cost: 12, element: 'puro', elements: ['puro'], level: 1, type: 'physical' },
        { name: 'Rajada', power: 30, cost: 10, element: 'puro', elements: ['puro'], level: 1, type: 'physical' }
      ]
    };
    return defaultMoves[element] || defaultMoves.puro;
  }
  
  // Selecionar moves apropriados para o nível (até 3 moves mais fortes)
  const suitableMoves = compatibleMoves
    .filter(move => (move.level || 1) <= level)
    .sort((a, b) => (b.power || 0) - (a.power || 0))
    .slice(0, 3);
  
  console.log('Selected enemy moves:', suitableMoves.map(m => m.name));
  return suitableMoves;
}

function initializeBattle() {
  if (battleInitialized || !pet) {
    console.log('Battle already initialized or no pet:', { battleInitialized, hasPet: !!pet });
    return;
  }
  battleInitialized = true;
  console.log('Initializing battle with pet:', pet.name, 'speed:', pet.attributes?.speed, 'vs enemy speed:', enemyAttributes.speed);
  const lvl = pet.level || 1;

  // Multiplicador baseado na raridade do pet (inimigos escalam com pets fortes)
  const rarityMultiplier = {
    'Comum': 1.0,
    'Incomum': 1.10,
    'Raro': 1.15,
    'MuitoRaro': 1.25,
    'Epico': 1.40,
    'Lendario': 1.65
  };
  const petRarityMult = rarityMultiplier[pet.rarity] || 1.0;

  // Selecionar movimentos do inimigo com base no elemento e nível
  try {
    enemyMoves = selectEnemyMoves(enemyElement, lvl, pet.rarity);
  } catch (err) {
    console.warn('Falha ao selecionar movimentos do inimigo:', err);
    enemyMoves = [];
  }

  // Escala de vida do inimigo
  // Para encontros normais: curva leve por nível
  // Para boss: basear na vida do jogador para evitar "one-shot"
  if (window.__BOSS_MULTIPLIERS__) {
    const playerRefHp = Math.max(pet.maxHealth || (lvl * 10 + 20), 80);
    // Boss tem ~2.2x a vida do jogador, com pequeno ganho por nível
    enemyMaxHealth = Math.round(playerRefHp * 2.2 + lvl * 8);
    if (window.__BOSS_MULTIPLIERS__.hp) {
      enemyMaxHealth = Math.round(enemyMaxHealth * window.__BOSS_MULTIPLIERS__.hp);
    }
    // Boss com duas barras de vida
    enemyBars = 2;
    enemyCurrentBar = 1;
  } else {
    // HP base aumentado e escalado com raridade: pets fortes enfrentam inimigos fortes
    const baseHp = 60 + lvl * 20;
    enemyMaxHealth = Math.round(baseHp * petRarityMult);
  }
  enemyHealth = enemyMaxHealth;

  // Atributos do inimigo escalados com raridade do pet
  // Reduzir atributos base para evitar one-shot
  const baseAttack = Math.round((lvl * 2.0 + 3) * petRarityMult);
  const baseDef = Math.round((lvl * 2.0 + 2) * petRarityMult);
  const baseMagic = Math.round((lvl * 2.0 + 3) * petRarityMult);
  const baseSpeed = Math.round((lvl * 1.2 + 1) * petRarityMult);

  enemyAttributes = {
    attack: baseAttack,
    defense: baseDef,
    magic: baseMagic,
    speed: baseSpeed,
  };
  
  // Ajuste de defesa do boss: considera defesa do jogador para escalar
  if (window.__BOSS_MULTIPLIERS__) {
    // Reduzir ainda mais os atributos do boss
    enemyAttributes.attack = Math.round(baseAttack * 0.7);
    enemyAttributes.magic = Math.round(baseMagic * 0.7);
    enemyAttributes.speed = Math.round(baseSpeed * 0.9);
    
    const bossDef = Math.round(lvl * 1.2 + (pet.attributes?.defense || 0) * 0.4);
    enemyAttributes.defense = bossDef;
    if (window.__BOSS_MULTIPLIERS__.defense) {
      enemyAttributes.defense = Math.round(enemyAttributes.defense * window.__BOSS_MULTIPLIERS__.defense);
    }
  }
  if ((pet.attributes?.speed || 0) < enemyAttributes.speed) {
    console.log('Enemy is faster! Starting enemy turn');
    currentTurn = 'enemy';
    setTimeout(enemyAction, 800);
  } else {
    console.log('Player is faster! Starting player turn');
    currentTurn = 'player';
  }
}

function applyStatusEffects() {
  if (playerStatusEffects.includes('poison')) {
    const dmg = Math.ceil(playerMaxHealth * (Math.random() * 0.01 + 0.01));
    playerHealth = Math.max(0, playerHealth - dmg);
  }
  if (playerStatusEffects.includes('burn')) {
    const dmg = Math.ceil(playerMaxHealth * (Math.random() * 0.01 + 0.02));
    playerHealth = Math.max(0, playerHealth - dmg);
  }
  if (playerStatusEffects.includes('bleed')) {
    const dmg = Math.ceil(playerHealth * 0.03);
    playerHealth = Math.max(0, playerHealth - dmg);
  }
  updateHealthBars();
  window.electronAPI.send('update-health', playerHealth);
}

function generateReward() {
  // Probabilidades ajustadas para reduzir item (ovo) e kadirPoints em modo jornada
  const weightedTypes = [
    { t: 'experience', w: 0.50 },
    { t: 'kadirPoints', w: 0.10 }, // reduzida de 0.25 para 0.10
    { t: 'coins', w: 0.35 }, // aumentada para compensar
    { t: 'item', w: 0.05 }, // reduz chance de item (e consequentemente de ovo)
  ];
  let totalW = weightedTypes.reduce((s, x) => s + x.w, 0);
  let r = Math.random() * totalW;
  let choice = weightedTypes[0].t;
  for (const x of weightedTypes) {
    r -= x.w;
    if (r <= 0) { choice = x.t; break; }
  }
  if (choice === 'experience') {
    return { experience: Math.floor(Math.random() * 10) + 5 };
  }
  if (choice === 'kadirPoints') {
    return { kadirPoints: Math.floor(Math.random() * 3) + 1 }; // reduzido de 1-5 para 1-3
  }
  if (choice === 'coins') {
    return { coins: Math.floor(Math.random() * 5) + 1 };
  }
  const ids = Object.keys(itemsInfo);
  if (ids.length === 0) return { coins: 1 };
  // Ao escolher item, reduzir ainda mais a probabilidade de ovos
  const isEgg = (id) => /^egg/i.test(id) || /ovo/i.test(id) || /egg/i.test(itemsInfo[id]?.name || '');
  const nonEggs = ids.filter((id) => !isEgg(id));
  const eggs = ids.filter((id) => isEgg(id));
  if (nonEggs.length === 0 && eggs.length === 0) return { coins: 1 };
  // 90% chance de não-ovo, 10% de ovo
  let pickPool;
  if (nonEggs.length > 0 && Math.random() < 0.9) {
    pickPool = nonEggs;
  } else if (eggs.length > 0) {
    pickPool = eggs;
  } else {
    pickPool = nonEggs.length ? nonEggs : eggs;
  }
  const id = pickPool[Math.floor(Math.random() * pickPool.length)];
  return { item: id, qty: 1 };
}

function generateBossReward() {
  // Recompensa diferenciada: mais XP + item raro + moedas/kadirPoints
  const xp = 40 + Math.floor(Math.random() * 20); // 40-60 XP
  // Priorizar itens de raridade alta se existirem
  const rareItems = Object.keys(itemsInfo).filter((id) => {
    const info = itemsInfo[id];
    return info && /epic|legend|lendario|raro/i.test(info.rarity || info.id || '');
  });
  let itemId = null;
  if (rareItems.length) {
    itemId = rareItems[Math.floor(Math.random() * rareItems.length)];
  } else {
    const ids = Object.keys(itemsInfo);
    itemId = ids.length ? ids[Math.floor(Math.random() * ids.length)] : null;
  }
  const coins = 10 + Math.floor(Math.random() * 11); // 10-20 moedas
  const kadirPoints = 5 + Math.floor(Math.random() * 6); // 5-10 kadir points
  const reward = { experience: xp, coins, kadirPoints };
  if (itemId) reward.item = itemId;
  return reward;
}

function showVictoryModal(reward, xp) {
  const modal = document.getElementById('victory-modal');
  const rewardBox = document.getElementById('victory-reward');
  const xpBox = document.getElementById('victory-xp');
  const closeBtn = document.getElementById('victory-close');
  if (!modal || !rewardBox || !closeBtn || !xpBox) return;

  let text = '';
  if (reward && reward.kadirPoints) text = `Você recebeu ${reward.kadirPoints} DNA Kadir!`;
  else if (reward && reward.coins) text = `Você recebeu ${reward.coins} moedas!`;
  else if (reward && reward.item) {
    const info = itemsInfo[reward.item] || { name: reward.item };
    text = `Você recebeu 1 ${info.name}!`;
  }
  xpBox.textContent = `XP ganho: ${xp}`;
  rewardBox.textContent = text;
  modal.style.display = 'flex';
  closeBtn.onclick = () => {
    modal.style.display = 'none';
    // Abre a janela correta baseada na origem da batalha
    if (battleSource === 'lair') {
      window.electronAPI.send('open-lair-mode-window');
    } else {
      window.electronAPI.send('open-journey-mode-window');
    }
    closeWindow();
  };
}

function showDefeatModal() {
  const modal = document.getElementById('defeat-modal');
  const closeBtn = document.getElementById('defeat-close');
  if (!modal || !closeBtn) return;
  modal.style.display = 'flex';
  closeBtn.onclick = () => {
    modal.style.display = 'none';
    // Abre a janela correta baseada na origem da batalha
    if (battleSource === 'lair') {
      window.electronAPI.send('open-lair-mode-window');
    } else {
      window.electronAPI.send('open-tray-window');
    }
    closeWindow();
  };
}

function concludeBattle(playerWon) {
  currentTurn = 'ended';
  hideMenus();
  window.electronAPI.send('battle-result', { win: playerWon });
  localStorage.setItem(getJourneyKey('journeyBattleWin'), playerWon ? '1' : '0');
  if (playerWon) {
    if (window.__BOSS_MULTIPLIERS__) {
      const bossReward = generateBossReward();
      window.electronAPI.send('reward-pet', bossReward);
      showVictoryModal(bossReward, bossReward.experience);
      window.electronAPI.send('boss-defeated', bossReward);
    } else {
      const baseXp = 10;
      const xpGained = calculateXpGain(baseXp, pet?.rarity);
      const reward = generateReward();
      const additionalReward = reward.experience ? null : reward;
      const totalXp = xpGained + (reward.experience || 0);
      window.electronAPI.send('reward-pet', { experience: totalXp });
      if (additionalReward) window.electronAPI.send('reward-pet', additionalReward);
      showVictoryModal(additionalReward, totalXp);
    }
  } else {
    showDefeatModal();
  }
}

function endPlayerTurn() {
  console.log('End player turn, enemy health:', enemyHealth);
  actionInProgress = false;
  applyStatusEffects();
  if (playerHealth <= 0) {
    concludeBattle(false);
  } else {
    console.log('Setting turn to enemy, calling enemyAction in 800ms');
    currentTurn = 'enemy';
    setTimeout(enemyAction, 800);
  }
}

function performPlayerMove(move) {
  if (currentTurn !== 'player' || actionInProgress) return;
  actionInProgress = true;
  if (playerStatusEffects.includes('paralyze') && Math.random() < 0.5) {
    showMessage('Paralisado!');
    endPlayerTurn();
    return;
  }
  if (playerStatusEffects.includes('sleep') || playerStatusEffects.includes('freeze')) {
    showMessage('Incapaz de agir!');
    endPlayerTurn();
    return;
  }
  const cost = move.cost || 0;
  if ((pet.energy || 0) < cost) {
    showMessage('Energia insuficiente!');
    return;
  }
  pet.energy = Math.max(0, (pet.energy || 0) - cost);
  const energyFill = document.getElementById('player-energy-fill');
  if (energyFill) energyFill.style.width = `${pet.energy}%`;
  window.electronAPI.send('use-move', move);
  hideMenus();
  const playerImg = document.getElementById('player-pet');
  playAttackAnimation(playerImg, playerIdleSrc, playerAttackSrc, () => {
    const base = computeBattlePower(move, pet);
    const moveElement = Array.isArray(move.elements)
      ? move.elements.includes(pet.element)
        ? pet.element
        : move.elements[0]
      : move.element || pet.element || 'puro';
    const mult = getElementMultiplier(moveElement, enemyElement);

    const accuracy = typeof move.accuracy === 'number' ? move.accuracy : 1;
    const speedDiff = (enemyAttributes.speed || 0) - (pet.attributes?.speed || 0);
    const dodge = Math.max(0, Math.min(0.3, speedDiff / 100));
    if (Math.random() > accuracy * (1 - dodge)) {
      showMessage('Ataque errou!');
      endPlayerTurn();
      return;
    }

    const isSpecial = (move.type || 'physical') === 'special';
    const atkStat = isSpecial ? pet.attributes?.magic || 0 : pet.attributes?.attack || 0;
    const defStat = enemyAttributes.defense || 0;
    const scaled = (base + atkStat * 0.5) * mult * (100 / (100 + defStat));
    let dmg = Math.max(1, Math.round(scaled));
    // Limite de dano por golpe em boss para evitar one-shot
    if (window.__BOSS_MULTIPLIERS__) {
      const mitigation = 0.85; // redução global de 15% no dano recebido
      dmg = Math.round(dmg * mitigation);
      const capFrac = typeof window.__BOSS_MULTIPLIERS__.dmgCap === 'number' ? window.__BOSS_MULTIPLIERS__.dmgCap : 0.30;
      const cap = Math.max(1, Math.ceil(enemyMaxHealth * capFrac));
      dmg = Math.min(dmg, cap);
    }
    enemyHealth = Math.max(0, enemyHealth - dmg);
    showHitEffect('enemy');
    updateHealthBars();
    if (enemyHealth <= 0) {
      if (window.__BOSS_MULTIPLIERS__ && enemyCurrentBar < enemyBars) {
        enemyCurrentBar += 1;
        enemyHealth = enemyMaxHealth;
        updateHealthBars();
        endPlayerTurn();
      } else {
        concludeBattle(true);
      }
    } else {
      endPlayerTurn();
    }
  });
}

function enemyAction() {
  console.log('enemyAction called! currentTurn:', currentTurn, 'actionInProgress:', actionInProgress);
  console.log('Enemy moves:', enemyMoves, 'Enemy energy:', enemyEnergy);
  actionInProgress = true;
  const enemyImg = document.getElementById('enemy-pet');

  // Escolher move com base em energia e situação de HP
  const availableMoves = enemyMoves.filter((m) => (m.cost || 0) <= enemyEnergy);
  console.log('Available moves after energy filter:', availableMoves);
  let selectedMove = null;
  if (availableMoves.length > 0) {
    if (enemyHealth < enemyMaxHealth * 0.5) {
      const sorted = [...availableMoves].sort((a, b) => (b.power || 0) - (a.power || 0));
      const top = sorted.slice(0, Math.min(2, sorted.length));
      selectedMove = top[Math.floor(Math.random() * top.length)];
    } else {
      const total = availableMoves.reduce((sum, m) => sum + (m.power || 10), 0);
      let rnd = Math.random() * total;
      for (const m of availableMoves) {
        rnd -= (m.power || 10);
        if (rnd <= 0) { selectedMove = m; break; }
      }
    }
  }

  if (!selectedMove) {
    console.log('No move selected! Resting...');
    // Sem energia: descansar
    enemyEnergy = Math.min(100, enemyEnergy + 25);
    showMessage('Inimigo está descansando...');
    updateHealthBars();
    setTimeout(() => {
      currentTurn = 'player';
      actionInProgress = false;
      applyStatusEffects();
    }, 800);
    return;
  }

  console.log('Selected move:', selectedMove.name);
  showMessage(`Inimigo usou ${selectedMove.name}!`);
  playAttackAnimation(enemyImg, enemyIdleSrc, enemyAttackSrc, () => {
    const cost = selectedMove.cost || 0;
    enemyEnergy = Math.max(0, enemyEnergy - cost);
    updateHealthBars();

    const accuracy = typeof selectedMove.accuracy === 'number' ? selectedMove.accuracy : 0.9;
    const speedDiff = (pet.attributes?.speed || 0) - (enemyAttributes.speed || 0);
    const dodge = Math.max(0, Math.min(0.3, speedDiff / 100));
    if (Math.random() > accuracy * (1 - dodge)) {
      showMessage('Inimigo errou!');
      currentTurn = 'player';
      actionInProgress = false;
      applyStatusEffects();
      return;
    }

    const enemyPetStub = { level: (window.__ENEMY_LEVEL || (pet?.level || 1)), element: enemyElement };
    const base = computeBattlePower(selectedMove, enemyPetStub);
    const isSpecial = (selectedMove.type || 'physical') === 'special';
    const atkStat = isSpecial ? enemyAttributes.magic : enemyAttributes.attack;
    let mult = getElementMultiplier(enemyElement, pet.element || 'puro');
    // Clamp de vantagem elemental na jornada para evitar picos
    mult = Math.min(mult, 1.2);
    const defStat = pet.attributes?.defense || 0;
    
    // Reduzir drasticamente o multiplicador de dano do boss
    let dmgMult = difficulty;
    if (window.__BOSS_MULTIPLIERS__ && window.__BOSS_MULTIPLIERS__.dmgOut) {
      dmgMult = window.__BOSS_MULTIPLIERS__.dmgOut * 0.4; // Reduz para 40% do valor original
    } else {
      dmgMult = dmgMult * 0.6; // Reduz para 60% em encontros normais
    }
    
    const scaled = (base + atkStat * 0.3) * mult * dmgMult * (100 / (100 + defStat));
    let dmg = Math.max(1, Math.round(scaled));
    
    // Mitigação adicional para boss
    if (window.__BOSS_MULTIPLIERS__) {
      // Boss: máximo de 20% da vida por golpe
      const bossCap = Math.max(5, Math.ceil(playerMaxHealth * 0.20));
      dmg = Math.min(dmg, bossCap);
      // Redução adicional de 30%
      dmg = Math.round(dmg * 0.7);
    } else {
      // Mitigação para evitar "one-shot" em encontros normais
      const rarityMitigation = {
        'Comum': 0.70,
        'Incomum': 0.65,
        'Raro': 0.60,
        'MuitoRaro': 0.55,
        'Epico': 0.50,
        'Lendario': 0.45,
      };
      const mit = rarityMitigation[pet.rarity] || 0.70;
      dmg = Math.round(dmg * mit);
      // Teto: no máximo 25% da vida máxima por golpe
      const cap = Math.max(5, Math.ceil(playerMaxHealth * 0.25));
      dmg = Math.min(dmg, cap);
    }
    
    console.log('Enemy damage:', dmg, 'from', playerHealth, '/', playerMaxHealth);
    playerHealth = Math.max(0, playerHealth - dmg);
    showHitEffect('player');
    updateHealthBars();
    window.electronAPI.send('update-health', playerHealth);
    if (playerHealth <= 0) {
      concludeBattle(false);
    } else {
      currentTurn = 'player';
      actionInProgress = false;
      applyStatusEffects();
    }
  });
}

document.addEventListener('DOMContentLoaded', () => {
  const bg = document.getElementById('scene-bg');
  const player = document.getElementById('player-pet');
  const enemy = document.getElementById('enemy-pet');
  const playerFront = document.getElementById('player-front');
  const enemyFront = document.getElementById('enemy-front');
  const enemyName = document.getElementById('enemy-name');
  const playerName = document.getElementById('player-name');
  const playerElementImg = document.getElementById('player-element');
  const enemyElementImg = document.getElementById('enemy-element');
  const playerLevelTxt = document.getElementById('player-level');
  const enemyLevelTxt = document.getElementById('enemy-level');
  
  // Carregar dados antes de iniciar
  Promise.all([
    loadItemsInfo(),
    loadStatusEffectsInfo(),
    loadMovesData()
  ]).then(() => {
    console.log('All data loaded, ready for battle');
    updateStatusIcons();
  }).catch(err => {
    console.error('Error loading data:', err);
  });

  document.getElementById('close-journey-scene')?.addEventListener('click', closeWindow);
  document.getElementById('back-journey-scene')?.addEventListener('click', () => {
    window.electronAPI.send('open-journey-mode-window');
    closeWindow();
  });

  const fightBtn = document.getElementById('fight-btn');
  const itemsBtn = document.getElementById('items-btn');
  const runBtn = document.getElementById('run-btn');

  fightBtn?.addEventListener('click', () => {
    const menu = document.getElementById('moves-menu');
    if (!menu) return;
    if (!pet || !Array.isArray(pet.moves) || pet.moves.length === 0) {
      showMessage('Você não aprendeu nenhum movimento! Tente fugir!');
      return;
    }
    if (menu.style.display === 'none' || menu.style.display === '') {
      hideMenus();
      updateMoves();
      menu.style.display = 'grid';
    } else {
      menu.style.display = 'none';
    }
  });

  itemsBtn?.addEventListener('click', () => {
    const menu = document.getElementById('items-menu');
    if (!menu) return;
    if (!pet || !pet.items || !Object.values(pet.items).some((qty) => qty > 0)) {
      showMessage('Você não tem itens! Tente fugir!');
      return;
    }
    if (menu.style.display === 'none' || menu.style.display === '') {
      hideMenus();
      // Inicializa abas
      const tabs = menu.querySelectorAll('.items-tab');
      tabs.forEach(tab => {
        tab.addEventListener('click', () => {
          tabs.forEach(t => t.classList.remove('active'));
          tab.classList.add('active');
          currentItemsTab = tab.dataset.tab;
          updateItems();
        });
      });
      // ativa aba padrão Consumíveis
      const defaultTab = menu.querySelector('.items-tab[data-tab="consumables"]');
      if (defaultTab) {
        tabs.forEach(t => t.classList.remove('active'));
        defaultTab.classList.add('active');
        currentItemsTab = 'consumables';
      }
      updateItems();
      menu.style.display = 'flex';
    } else {
      menu.style.display = 'none';
    }
  });

  runBtn?.addEventListener('click', attemptFlee);

  window.electronAPI.on('scene-data', async (event, data) => {
    // Armazena a origem da batalha
    battleSource = data.source || 'journey';
    
    // Atualiza o título da janela com base na origem
    const sceneTitle = document.getElementById('scene-title');
    if (sceneTitle) {
      if (data.boss === true) {
        sceneTitle.textContent = 'Boss Final';
        document.body.classList.add('boss');
      } else if (data.source === 'lair') {
        sceneTitle.textContent = 'Cenário do Covil';
        document.body.classList.remove('boss');
      } else {
        sceneTitle.textContent = 'Cenário da Jornada';
        document.body.classList.remove('boss');
      }
    }

    if (data.background && bg) {
      bg.onerror = () => {
        console.warn('Background falhou, aplicando fallback');
        bg.src = '../../Assets/Modes/journey-bg.jpg';
      };
      bg.src = data.background;
    }
    if (data.playerPet && player) {
      playerIdleSrc = await computeIdleSrc(data.playerPet);
      playerAttackSrc = await computeAttackSrc(data.playerPet);
      player.src = playerIdleSrc;
      try {
        const speciesInfo = await window.electronAPI.invoke('get-species-info');
        const speciesList = speciesInfo?.specieData || speciesInfo || {};
        const metersPerPx = 150; // 3m = 450px → 1m = 150px
        const deriveRace = (rel) => {
          if (!rel) return null;
          const normalized = rel.replace(/\\/g, '/');
          const parts = normalized.split('/');
          for (let i = 0; i < parts.length; i++) {
            if (/idle\.(gif|png)$/i.test(parts[i])) {
              return parts[i - 1] || null;
            }
          }
          const last = parts[parts.length - 1];
          return last && !/\.(gif|png)$/i.test(last) ? last : (parts[parts.length - 2] || null);
        };
        const playerRace = deriveRace(data.playerPet);
        let playerSize = null;
        for (const [specieName, meta] of Object.entries(speciesList)) {
          if (meta && (meta.race === playerRace || meta.race?.toLowerCase() === playerRace?.toLowerCase())) {
            playerSize = typeof meta.sizeMeters === 'number' ? meta.sizeMeters : null;
            break;
          }
        }
        if (typeof playerSize === 'number' && playerSize > 0) {
          player.style.width = `${Math.round(playerSize * metersPerPx)}px`;
        }
      } catch (err) {
        console.warn('Falha ao aplicar tamanho do player-pet:', err);
      }
    }
    if (data.enemyPet && enemy) {
      enemyIdleSrc = await computeIdleSrc(data.enemyPet);
      enemyAttackSrc = await computeAttackSrc(data.enemyPet);
      enemy.src = enemyIdleSrc;
      enemyEnergy = 100;
      try {
        const speciesInfo = await window.electronAPI.invoke('get-species-info');
        const speciesList = speciesInfo?.specieData || speciesInfo || {};
        const metersPerPx = 150; // 3m = 450px → 1m = 150px
        const deriveRace = (rel) => {
          if (!rel) return null;
          const normalized = rel.replace(/\\/g, '/');
          const parts = normalized.split('/');
          for (let i = 0; i < parts.length; i++) {
            if (/idle\.(gif|png)$/i.test(parts[i])) {
              return parts[i - 1] || null;
            }
          }
          const last = parts[parts.length - 1];
          return last && !/\.(gif|png)$/i.test(last) ? last : (parts[parts.length - 2] || null);
        };
        const enemyRace = deriveRace(data.enemyPet);
        let enemySize = null;
        for (const [specieName, meta] of Object.entries(speciesList)) {
          if (meta && (meta.race === enemyRace || meta.race?.toLowerCase() === enemyRace?.toLowerCase())) {
            enemySize = typeof meta.sizeMeters === 'number' ? meta.sizeMeters : null;
            break;
          }
        }
        if (typeof enemySize === 'number' && enemySize > 0) {
          enemy.style.width = `${Math.round(enemySize * metersPerPx)}px`;
        }
      } catch (err) {
        console.warn('Falha ao aplicar tamanho do enemy-pet:', err);
      }
    }

    if (data.playerPet && playerFront) {
      playerFront.src = await computeFrontSrc(data.playerPet);
    }

    if (data.enemyPet && enemyFront) {
      enemyFront.src = await computeFrontSrc(data.enemyPet);
    }

    if (data.enemyElement) {
      enemyElement = data.enemyElement;
      if (enemyElementImg) {
        enemyElementImg.src = `../../Assets/Elements/${enemyElement}.png`;
        enemyElementImg.alt = enemyElement;
      }
      updateMoves();
    }

    if (data.enemyName && enemyName) enemyName.textContent = data.enemyName;
    
    // Marca inimigo como visto no bestiário
    if (data.enemyName && data.enemyName !== 'Inimigo') {
      window.electronAPI.send('mark-creature-seen', data.enemyName);
    }
    
    // Preset de dificuldade para boss
    if (data.boss === true && data.difficultyPreset && typeof data.difficultyPreset === 'object') {
      const m = data.difficultyPreset.multipliers || {};
      const levelOffset = data.difficultyPreset.levelOffset || 0;
      // Ajuste de nível exibido
      if (enemyLevelTxt && pet && typeof pet.level === 'number') {
        enemyLevelTxt.textContent = `Lvl ${pet.level + levelOffset}`;
      }
      // Guardar nível efetivo do inimigo para cálculo de poder
      window.__ENEMY_LEVEL = (pet && typeof pet.level === 'number') ? (pet.level + levelOffset) : (data.level || 1);
      // Guardar multiplicadores para uso em inicialização e dano
      window.__BOSS_MULTIPLIERS__ = {
        hp: typeof m.hp === 'number' ? m.hp : 1,
        defense: typeof m.defense === 'number' ? m.defense : 1,
        dmgOut: typeof m.dmgOut === 'number' ? m.dmgOut : 1,
        statusDur: typeof m.statusDur === 'number' ? m.statusDur : 1,
        dmgCap: typeof m.dmgCap === 'number' ? m.dmgCap : undefined,
      };
      window.__BOSS_IMMUNITIES__ = Array.isArray(data.difficultyPreset.immunities)
        ? data.difficultyPreset.immunities
        : [];
      // Aumentar dificuldade global de dano do inimigo
      difficulty = Math.max(difficulty, window.__BOSS_MULTIPLIERS__.dmgOut);
    }
    playerStatusEffects = Array.isArray(data.statusEffects) ? data.statusEffects : [];
    updateStatusIcons();
    updateHealthBars();
  });

  window.electronAPI.on('pet-data', (event, data) => {
    if (!data) return;
    pet = data;
    if (playerName) playerName.textContent = data.name || '';
    if (playerElementImg) {
      const el = (data.element || 'default').toLowerCase();
      playerElementImg.src = `../../Assets/Elements/${el}.png`;
      playerElementImg.alt = el;
    }
    if (playerLevelTxt) playerLevelTxt.textContent = `Lvl ${data.level || 1}`;
    if (enemyLevelTxt) enemyLevelTxt.textContent = `Lvl ${data.level || 1}`;
    window.__ENEMY_LEVEL = data.level || (pet?.level || 1);
    playerHealth = data.currentHealth ?? playerHealth;
    playerMaxHealth = data.maxHealth ?? playerMaxHealth;
    const healthFill = document.getElementById('player-health-fill');
    const energyFill = document.getElementById('player-energy-fill');
    if (healthFill) {
      const percent = (playerHealth / playerMaxHealth) * 100;
      healthFill.style.width = `${percent}%`;
    }
    if (energyFill) {
      const percent = data.energy || 0;
      energyFill.style.width = `${percent}%`;
    }
    updateHealthBars();
    if (Array.isArray(data.statusEffects)) {
      playerStatusEffects = data.statusEffects;
      updateStatusIcons();
    }
    updateMoves();
    updateItems();
    initializeBattle();
  });
});
