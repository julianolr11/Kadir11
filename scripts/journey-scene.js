console.log('journey-scene.js carregado');
import { getElementMultiplier } from './elements.js';
import { computeDisplayPower, computeBattlePower } from './moveEffectiveness.js';
import { calculateXpGain } from './xpUtils.js';

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
let statusEffectsInfo = {};
let playerStatusEffects = [];
let playerHealth = 100;
let playerMaxHealth = 100;
let enemyHealth = 100;
let enemyMaxHealth = 100;
let enemyEnergy = 100;
let enemyAttributes = { attack: 5, defense: 5, magic: 5, speed: 5 };
let currentTurn = 'player';
let actionInProgress = false;
let playerIdleSrc = '';
let playerAttackSrc = '';
let enemyIdleSrc = '';
let enemyAttackSrc = '';
let enemyElement = 'puro';
const enemyAttackCost = 10;
let difficulty = 1;

if (window.electronAPI?.getDifficulty) {
  window.electronAPI
    .getDifficulty()
    .then(async (val) => {
      difficulty = typeof val === 'number' ? val : 1;
      if (difficulty === 1 && window.electronAPI?.setDifficulty) {
        difficulty = 0.8;
        try {
          await window.electronAPI.setDifficulty(difficulty);
        } catch (err) {
          console.error('Erro ao definir dificuldade:', err);
        }
      }
    })
    .catch(() => {
      difficulty = 1;
    });
}

async function loadItemsInfo() {
  try {
    const resp = await fetch('../../data/items.json');
    const data = await resp.json();
    itemsInfo = {};
    data.forEach((it) => {
      itemsInfo[it.id] = it;
    });
    updateItems();
  } catch (err) {
    console.error('Erro ao carregar info dos itens:', err);
  }
}

async function loadStatusEffectsInfo() {
  try {
    const resp = await fetch('../../data/status-effects.json');
    const data = await resp.json();
    statusEffectsInfo = {};
    data.forEach((se) => {
      statusEffectsInfo[se.id] = se;
    });
  } catch (err) {
    console.error('Erro ao carregar info dos status effects:', err);
  }
}

function hideMenus() {
  document.getElementById('moves-menu').style.display = 'none';
  document.getElementById('items-menu').style.display = 'none';
}

function showMessage(text) {
  const box = document.getElementById('message-box');
  if (!box) return;
  box.textContent = text;
  box.style.display = 'block';
  setTimeout(() => {
    box.style.display = 'none';
  }, 2000);
}

function updateMoves() {
  const menu = document.getElementById('moves-menu');
  if (!menu) return;
  menu.innerHTML = '';
  if (!pet || !Array.isArray(pet.moves) || pet.moves.length === 0) {
    const span = document.createElement('span');
    span.textContent = 'Você não aprendeu nenhum movimento! Tente fugir!';
    span.style.gridColumn = '1 / -1';
    span.style.textAlign = 'center';
    span.style.padding = '20px';
    menu.appendChild(span);
    return;
  }
  pet.moves.forEach((move) => {
    const btn = document.createElement('button');
    btn.className = 'button small-button';
    btn.title = move.description || move.name;
    const cost = move.cost || 0;
    const power = computeDisplayPower(move, pet);

    const moveElement = Array.isArray(move.elements)
      ? move.elements.includes(pet.element)
        ? pet.element
        : move.elements[0]
      : move.element || pet.element || 'puro';
    const mult = getElementMultiplier(moveElement, enemyElement);

    let indicator = '';
    let effectivenessClass = '';
    if (mult > 1) {
      indicator = '<span class="move-indicator up">▲</span>';
      effectivenessClass = 'super-effective';
    } else if (mult < 1) {
      indicator = '<span class="move-indicator down">▼</span>';
      effectivenessClass = 'not-effective';
    }

    const moveName = document.createElement('div');
    moveName.style.fontWeight = 'bold';
    moveName.style.fontSize = '12px';
    moveName.innerHTML = `${move.name} ${indicator}`;

    const moveInfo = document.createElement('div');
    moveInfo.style.fontSize = '10px';
    moveInfo.style.color = '#aaa';
    moveInfo.textContent = `Poder: ${power} | Custo: ${cost}`;

    btn.appendChild(moveName);
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
  const menu = document.getElementById('items-menu');
  if (!menu) return;
  menu.innerHTML = '';
  if (!pet || !pet.items || Object.keys(pet.items).length === 0) {
    const span = document.createElement('span');
    span.textContent = 'Você não tem itens! Tente fugir!';
    span.style.gridColumn = '1 / -1';
    span.style.textAlign = 'center';
    span.style.padding = '20px';
    menu.appendChild(span);
    return;
  }

  const itemKeys = Object.keys(pet.items);
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
    const iconPath = info.icon && info.icon.startsWith('../../') ? info.icon : `../../${info.icon || 'Assets/Shop/health-potion.png'}`;
    img.src = iconPath;
    img.alt = info.name;
    img.className = 'item-icon';
    img.onerror = () => {
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

    menu.appendChild(itemContainer);
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

function initializeBattle() {
  if (battleInitialized || !pet) return;
  battleInitialized = true;
  const lvl = pet.level || 1;

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
  } else {
    enemyMaxHealth = 20 + lvl * 10;
  }
  enemyHealth = enemyMaxHealth;

  enemyAttributes = {
    attack: lvl * 2,
    defense: lvl,
    magic: lvl * 2,
    speed: lvl * 1.5,
  };
  // Ajuste de defesa do boss: considera defesa do jogador para escalar
  if (window.__BOSS_MULTIPLIERS__) {
    const baseDef = Math.round(lvl * 1.5 + (pet.attributes?.defense || 0) * 0.6);
    enemyAttributes.defense = baseDef;
    if (window.__BOSS_MULTIPLIERS__.defense) {
      enemyAttributes.defense = Math.round(enemyAttributes.defense * window.__BOSS_MULTIPLIERS__.defense);
    }
  }
  if ((pet.attributes?.speed || 0) < enemyAttributes.speed) {
    currentTurn = 'enemy';
    setTimeout(enemyAction, 800);
  } else {
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
  const types = ['experience', 'kadirPoints', 'coins', 'item'];
  const choice = types[Math.floor(Math.random() * types.length)];
  if (choice === 'experience') {
    return { experience: Math.floor(Math.random() * 10) + 5 };
  }
  if (choice === 'kadirPoints') {
    return { kadirPoints: Math.floor(Math.random() * 5) + 1 };
  }
  if (choice === 'coins') {
    return { coins: Math.floor(Math.random() * 5) + 1 };
  }
  const ids = Object.keys(itemsInfo);
  if (ids.length === 0) return { coins: 1 };
  const id = ids[Math.floor(Math.random() * ids.length)];
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
    window.electronAPI.send('open-journey-mode-window');
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
    window.electronAPI.send('open-tray-window');
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
  actionInProgress = false;
  applyStatusEffects();
  if (playerHealth <= 0) {
    concludeBattle(false);
  } else {
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
      concludeBattle(true);
    } else {
      endPlayerTurn();
    }
  });
}

function enemyAction() {
  actionInProgress = true;
  const enemyImg = document.getElementById('enemy-pet');
  playAttackAnimation(enemyImg, enemyIdleSrc, enemyAttackSrc, () => {
    enemyEnergy = Math.max(0, enemyEnergy - enemyAttackCost);
    updateHealthBars();

    const accuracy = 0.9;
    const speedDiff = (pet.attributes?.speed || 0) - (enemyAttributes.speed || 0);
    const dodge = Math.max(0, Math.min(0.3, speedDiff / 100));
    if (Math.random() > accuracy * (1 - dodge)) {
      showMessage('Inimigo errou!');
      currentTurn = 'player';
      actionInProgress = false;
      applyStatusEffects();
      return;
    }

    // Simulate enemy moves
    const roll = Math.random();
    let movePower = 10; // Normal attack
    let moveName = 'Ataque Normal';

    if (roll < 0.2) {
      movePower = 5;
      moveName = 'Ataque Rápido';
      showMessage(`Inimigo usou ${moveName}!`);
    } else if (roll > 0.8) {
      movePower = 15;
      moveName = 'Ataque Poderoso';
      showMessage(`Inimigo usou ${moveName}!`);
    }

    const enemyPetStub = { level: (window.__ENEMY_LEVEL || (pet?.level || 1)), element: enemyElement };
    const enemyMove = {
      power: movePower,
      elements: [enemyElement],
      rarity: roll < 0.2 ? 'Comum' : roll > 0.8 ? 'Raro' : 'Incomum',
      effect: 'nenhum',
      species: [],
    };
    const base = computeBattlePower(enemyMove, enemyPetStub) + enemyAttributes.attack * 0.5;
    const mult = getElementMultiplier(enemyElement, pet.element || 'puro');
    const defStat = pet.attributes?.defense || 0;
    const dmgMult = (window.__BOSS_MULTIPLIERS__ && window.__BOSS_MULTIPLIERS__.dmgOut) ? window.__BOSS_MULTIPLIERS__.dmgOut : 1;
    const scaled = base * mult * difficulty * dmgMult * (100 / (100 + defStat));
    const dmg = Math.max(1, Math.round(scaled));
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
  loadItemsInfo();
  loadStatusEffectsInfo().then(updateStatusIcons);

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
      updateItems();
      menu.style.display = 'flex';
    } else {
      menu.style.display = 'none';
    }
  });

  runBtn?.addEventListener('click', attemptFlee);

  window.electronAPI.on('scene-data', async (event, data) => {
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
    }
    if (data.enemyPet && enemy) {
      enemyIdleSrc = await computeIdleSrc(data.enemyPet);
      enemyAttackSrc = await computeAttackSrc(data.enemyPet);
      enemy.src = enemyIdleSrc;
      enemyEnergy = 100;
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
