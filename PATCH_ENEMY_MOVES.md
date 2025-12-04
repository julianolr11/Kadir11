# Implementação de Sistema de Movimentos para Inimigos

## Mudanças necessárias no journey-scene.js:

### 1. Adicionar variáveis globais (após linha 127):
```javascript
let movesData = [];
let enemyMoves = [];
```

### 2. Remover linha 142:
```javascript
const enemyAttackCost = 10;  // REMOVER ESTA LINHA
```

### 3. Adicionar função loadMovesData (após loadItemsInfo):
```javascript
async function loadMovesData() {
  try {
    const resp = await fetch('../../data/moves.json');
    movesData = await resp.json();
  } catch (err) {
    console.error('Erro ao carregar moves.json:', err);
    movesData = [];
  }
}

function selectEnemyMoves(element, level, rarity) {
  const availableMoves = movesData.filter(move => {
    const matchesElement = move.elements && (move.elements.includes(element) || move.elements.includes('puro'));
    const matchesLevel = move.level && move.level <= level + 2;
    return matchesElement && matchesLevel;
  });

  if (availableMoves.length === 0) {
    return movesData.filter(m => m.level === 1 && m.rarity === 'Comum').slice(0, 3);
  }

  const rarityWeights = {
    'Comum': 0.5, 'Incomum': 0.3, 'Raro': 0.15,
    'MuitoRaro': 0.04, 'Epico': 0.01, 'Lendario': 0.001
  };

  const rarityBoost = {
    'Comum': 1.0, 'Incomum': 1.1, 'Raro': 1.2,
    'MuitoRaro': 1.3, 'Epico': 1.5, 'Lendario': 1.7
  };
  const boost = rarityBoost[rarity] || 1.0;

  const weightedMoves = availableMoves.map(move => ({
    ...move,
    weight: (rarityWeights[move.rarity] || 0.1) * boost
  }));

  const selectedMoves = [];
  const numMoves = Math.min(3 + Math.floor(Math.random() * 2), availableMoves.length);
  
  for (let i = 0; i < numMoves; i++) {
    if (weightedMoves.length === 0) break;
    const totalWeight = weightedMoves.reduce((sum, m) => sum + m.weight, 0);
    let random = Math.random() * totalWeight;
    
    for (let j = 0; j < weightedMoves.length; j++) {
      random -= weightedMoves[j].weight;
      if (random <= 0) {
        selectedMoves.push(weightedMoves[j]);
        weightedMoves.splice(j, 1);
        break;
      }
    }
  }

  return selectedMoves;
}
```

### 4. Adicionar no initializeBattle (após calcular petRarityMult):
```javascript
// Selecionar movimentos para o inimigo
enemyMoves = selectEnemyMoves(enemyElement, lvl, pet.rarity);
console.log('Movimentos do inimigo:', enemyMoves.map(m => m.name));
```

### 5. Substituir função enemyAction completa:
```javascript
function enemyAction() {
  actionInProgress = true;

  const availableMoves = enemyMoves.filter(move => {
    const cost = move.cost || 0;
    return enemyEnergy >= cost;
  });

  let selectedMove = null;
  if (availableMoves.length > 0) {
    if (enemyHealth < enemyMaxHealth * 0.5) {
      const sortedByPower = availableMoves.sort((a, b) => (b.power || 0) - (a.power || 0));
      const topMoves = sortedByPower.slice(0, Math.min(2, sortedByPower.length));
      selectedMove = topMoves[Math.floor(Math.random() * topMoves.length)];
    } else {
      const totalPower = availableMoves.reduce((sum, m) => sum + (m.power || 10), 0);
      let random = Math.random() * totalPower;
      for (const move of availableMoves) {
        random -= (move.power || 10);
        if (random <= 0) {
          selectedMove = move;
          break;
        }
      }
    }
  }

  if (!selectedMove) {
    selectedMove = {
      name: 'Descansar',
      power: 0,
      cost: 0,
      type: 'physical',
      effect: 'nenhum',
      rarity: 'Comum'
    };
    enemyEnergy = Math.min(100, enemyEnergy + 20);
    showMessage('Inimigo está descansando...');
    updateHealthBars();
    setTimeout(() => {
      currentTurn = 'player';
      actionInProgress = false;
      applyStatusEffects();
    }, 1000);
    return;
  }

  const enemyImg = document.getElementById('enemy-pet');
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

    const enemyPetStub = { 
      level: (window.__ENEMY_LEVEL || (pet?.level || 1)), 
      element: enemyElement,
      attributes: enemyAttributes
    };
    const base = computeBattlePower(selectedMove, enemyPetStub);
    const isSpecial = (selectedMove.type || 'physical') === 'special';
    const atkStat = isSpecial ? enemyAttributes.magic : enemyAttributes.attack;
    const mult = getElementMultiplier(enemyElement, pet.element || 'puro');
    const defStat = pet.attributes?.defense || 0;
    const dmgMult = (window.__BOSS_MULTIPLIERS__ && window.__BOSS_MULTIPLIERS__.dmgOut) ? window.__BOSS_MULTIPLIERS__.dmgOut : difficulty;
    const scaled = (base + atkStat * 0.5) * mult * dmgMult * (100 / (100 + defStat));
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
```

### 6. Adicionar loadMovesData() no DOMContentLoaded (após loadItemsInfo):
```javascript
loadItemsInfo();
loadStatusEffectsInfo().then(updateStatusIcons);
loadMovesData();  // ADICIONAR ESTA LINHA
```

---

**Aplicar manualmente estas mudanças no arquivo journey-scene.js**
