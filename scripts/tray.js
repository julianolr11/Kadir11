import { rarityGradients } from './constants.mjs';

const exitOverlay = document.getElementById('exit-confirm-overlay');
const exitYesBtn = document.getElementById('exit-confirm-yes');
const exitNoBtn = document.getElementById('exit-confirm-no');

const itemBubble = document.getElementById('item-found-bubble');
const itemBubbleImg = document.getElementById('item-found-img');

let itemsData = [];
const itemRarities = {
  healthPotion: 'Comum',
  meat: 'Comum',
  staminaPotion: 'Comum',
  chocolate: 'Comum',
  terrainMedium: 'Raro',
  terrainLarge: 'Epico',
  nest: 'Raro',
  eggAve: 'Raro',
  eggCriaturaMistica: 'Raro',
  eggCriaturaSombria: 'Raro',
  eggDraconideo: 'Raro',
  eggFera: 'Raro',
  eggMonstro: 'Raro',
  eggReptiloide: 'Raro',
};

const rarityWeights = {
  Comum: 40,
  Incomum: 30,
  Raro: 15,
  MuitoRaro: 10,
  Epico: 4,
  Lendario: 1,
};

fetch('data/items.json')
  .then((r) => r.json())
  .then((d) => {
    itemsData = d;
  })
  .catch(() => {
    itemsData = [];
  });

function setImageWithFallback(imgElement, relativePath) {
  if (!imgElement) return;
  if (!relativePath) {
    imgElement.src = 'Assets/Mons/eggsy.png';
    return;
  }

  const gifSrc = relativePath.endsWith('.gif') ? `Assets/Mons/${relativePath}` : null;
  const pngSrc = gifSrc ? gifSrc.replace(/\.gif$/i, '.png') : `Assets/Mons/${relativePath}`;

  imgElement.onerror = () => {
    if (gifSrc && imgElement.src.endsWith('.gif')) {
      imgElement.src = pngSrc;
    } else if (!imgElement.src.endsWith('eggsy.png')) {
      imgElement.onerror = null;
      imgElement.src = 'Assets/Mons/eggsy.png';
    }
  };

  // Primeiro tenta GIF, depois PNG, depois eggsy
  const tryOrder = [gifSrc, pngSrc, 'Assets/Mons/eggsy.png'];
  (function loadNext(i) {
    if (i >= tryOrder.length) return;
    imgElement.onerror = () => loadNext(i + 1);
    imgElement.src = tryOrder[i];
  })(0);
}
// Verificar se electronAPI está disponível
if (!window.electronAPI) {
  console.error('Erro: window.electronAPI não está disponível. Verifique o preload.js');
}

// Estado inicial
let petData = {
  image: 'eggsy.png',
  name: 'Eggsy',
  rarity: 'Raro',
  element: 'fire',
  currentHealth: 80,
  maxHealth: 100,
  energy: 60,
  level: 5,
  hunger: 20, // Abaixo de 30 para forçar o alerta
  happiness: 25, // Abaixo de 30 para forçar o alerta
};

// Definir os elementos no escopo global
const petImageBackground = document.querySelector('.pet-image-background');
const texture = document.querySelector('.pet-image-texture');
const petInfo = document.querySelector('.pet-info');
const healthFill = document.getElementById('health-fill');
const energyFill = document.getElementById('energy-fill');
const levelDisplay = document.getElementById('level-display');
const hungerWarning = document.getElementById('hunger-warning');
const happinessWarning = document.getElementById('happiness-warning');
const battleAlert = document.getElementById('battle-alert');
const petImageEl = document.getElementById('pet-image');
const statusBubble = document.getElementById('pet-status-bubble');
const penCanvas = document.getElementById('pen-canvas');
const penCtx = penCanvas ? penCanvas.getContext('2d') : null;
const tileset = new Image();
tileset.src = 'Assets/tileset/tileset.png';
let penInfo = { size: 'small', maxPets: 3 };
const sizeMap = { small: { w: 4, h: 3 }, medium: { w: 5, h: 4 }, large: { w: 7, h: 5 } };

function drawPen() {
  if (!penCtx || !tileset.complete) return;
  const dims = sizeMap[penInfo.size] || sizeMap.small;
  const w = (dims.w + 2) * 32;
  const h = (dims.h + 2) * 32;
  penCanvas.width = w;
  penCanvas.height = h;
  penCtx.clearRect(0, 0, w, h);
  for (let y = 0; y < dims.h + 2; y++) {
    for (let x = 0; x < dims.w + 2; x++) {
      let sx = 32,
        sy = 32;
      if (x === 0 && y === 0) {
        sx = 0;
        sy = 0;
      } else if (x === dims.w + 1 && y === 0) {
        sx = 64;
        sy = 0;
      } else if (x === 0 && y === dims.h + 1) {
        sx = 0;
        sy = 64;
      } else if (x === dims.w + 1 && y === dims.h + 1) {
        sx = 64;
        sy = 64;
      } else if (y === 0) {
        sx = 32;
        sy = 0;
      } else if (y === dims.h + 1) {
        sx = 32;
        sy = 64;
      } else if (x === 0) {
        sx = 0;
        sy = 32;
      } else if (x === dims.w + 1) {
        sx = 64;
        sy = 32;
      }
      penCtx.drawImage(tileset, sx, sy, 32, 32, x * 32, y * 32, 32, 32);
    }
  }
}

tileset.onload = drawPen;

if (window.electronAPI && window.electronAPI.getPenInfo) {
  window.electronAPI.getPenInfo().then((info) => {
    penInfo = info;
    drawPen();
  });
  window.electronAPI.on('pen-updated', (e, info) => {
    penInfo = info;
    drawPen();
  });
}

// Verificar se os elementos de alerta existem
if (!hungerWarning || !happinessWarning || !battleAlert) {
  console.error('Um ou mais elementos de alerta não encontrados:', {
    hungerWarning: !!hungerWarning,
    happinessWarning: !!happinessWarning,
    battleAlert: !!battleAlert,
  });
}

// Função para carregar os dados do pet e ajustar os alertas
function loadPet(data) {
  if (data) {
    petData = data;
    console.log('Pet recebido via IPC na bandeja:', petData);
  } else {
    console.error('Nenhum petData recebido via IPC');
  }

  const petName = document.querySelector('.pet-name');
  healthFill.style.width = `${(petData.currentHealth / petData.maxHealth || 0) * 100}%`;
  energyFill.style.width = `${petData.energy || 0}%`;
  levelDisplay.textContent = `Lvl ${petData.level || 1}`;
  if (petData.statusImage) {
    setImageWithFallback(petImageEl, petData.statusImage);
  } else {
    setImageWithFallback(petImageEl, petData.image);
  }
  petImageBackground.style.background = rarityGradients[petData.rarity] || rarityGradients['Comum'];
  petName.textContent = petData.name || 'Eggsy';

  // Ajustar a posição dos alertas com base no decaimento
  adjustWarnings();
  showStatusBubble();
}

// Função para ajustar a posição e exibição dos alertas
function adjustWarnings() {
  let baseTop = 110; // Posição inicial
  let verticalOffset = 20; // Espaçamento entre ícones

  if (hungerWarning && happinessWarning) {
    // Verificar qual atributo está abaixo de 30 e definir a ordem
    const hungerLow = petData.hunger < 30;
    const happinessLow = petData.happiness < 30;

    if (hungerLow && !happinessLow) {
      // Só fome está baixa
      hungerWarning.style.top = `${baseTop}px`;
      hungerWarning.style.display = 'block';
      happinessWarning.style.display = 'none';
      console.log('Fome abaixo de 30, mostrando alerta');
    } else if (!hungerLow && happinessLow) {
      // Só felicidade está baixa
      happinessWarning.style.top = `${baseTop}px`;
      happinessWarning.style.display = 'block';
      hungerWarning.style.display = 'none';
      console.log('Felicidade abaixo de 30, mostrando alerta');
    } else if (hungerLow && happinessLow) {
      // Ambos estão baixos, ajustar verticalmente (fome em cima, felicidade embaixo)
      hungerWarning.style.top = `${baseTop}px`;
      hungerWarning.style.display = 'block';
      happinessWarning.style.top = `${baseTop + verticalOffset}px`;
      happinessWarning.style.display = 'block';
      console.log('Fome e Felicidade abaixo de 30, mostrando alertas');
    } else {
      // Nenhum está baixo
      hungerWarning.style.display = 'none';
      happinessWarning.style.display = 'none';
      console.log('Fome e Felicidade acima de 30, escondendo alertas');
    }
  } else {
    console.error('Elementos de alerta não encontrados');
  }
}

function updateStatusBubble() {
  if (!statusBubble) return;
  let icon = '';
  const h = petData.happiness || 0;
  if (h > 90) {
    icon = '<img src="Assets/Shop/happy.png" alt="Feliz">';
  } else if (h > 70) {
    icon = '<img src="Assets/Shop/smile.png" alt="Sorriso">';
  } else if (h > 50) {
    icon = '<img src="Assets/Shop/shy-smile.png" alt="Sorriso tímido">';
  } else if (h > 30) {
    icon = '<img src="Assets/Shop/poker-face.png" alt="Poker face">';
  } else {
    icon = '<img src="Assets/Shop/sad.png" alt="Triste">';
  }
  statusBubble.innerHTML = icon;
}

function showStatusBubble() {
  if (!statusBubble) return;
  updateStatusBubble();
  statusBubble.style.display = 'block';
  clearTimeout(statusBubble.hideTimeout);
  statusBubble.hideTimeout = setTimeout(() => {
    statusBubble.style.display = 'none';
  }, 5000);
}

function getRandomItem() {
  if (!itemsData.length) return null;
  let total = 0;
  const weights = itemsData.map((it) => {
    const rarity = itemRarities[it.id] || 'Comum';
    const w = rarityWeights[rarity] || 1;
    total += w;
    return w;
  });
  let r = Math.random() * total;
  for (let i = 0; i < itemsData.length; i++) {
    if (r < weights[i]) return itemsData[i];
    r -= weights[i];
  }
  return itemsData[0];
}

function maybeFindItem() {
  if (Math.random() < 0.1) {
    // 10% de chance
    const item = getRandomItem();
    if (!item) return;
    if (itemBubble && itemBubbleImg) {
      itemBubbleImg.src = item.icon;
      itemBubble.style.display = 'flex';
      setTimeout(() => {
        if (itemBubble) itemBubble.style.display = 'none';
      }, 5000);
    }
    window.electronAPI?.send('reward-pet', { item: item.id, qty: 1 });
  }
}

// Carregar dados iniciais
loadPet(petData);

if (petImageEl) {
  petImageEl.addEventListener('click', () => {
    showStatusBubble();
  });
  document.addEventListener('click', (e) => {
    if (statusBubble && !petImageEl.contains(e.target) && e.target !== statusBubble) {
      statusBubble.style.display = 'none';
    }
  });
}

// Toggle entre raridade e textura
let showRarity = true;
const toggleSwitch = document.querySelector('.toggle-switch');
if (toggleSwitch) {
  toggleSwitch.addEventListener('click', () => {
    showRarity = !showRarity;
    toggleSwitch.classList.toggle('active');
    if (!petImageBackground || !texture || !petInfo) {
      console.error('Um ou mais elementos não encontrados para o toggle:', {
        petImageBackground: !!petImageBackground,
        texture: !!texture,
        petInfo: !!petInfo,
      });
      return;
    }
    if (showRarity) {
      petImageBackground.style.display = 'block';
      texture.style.display = 'block';
      petInfo.style.display = 'block';
    } else {
      petImageBackground.style.display = 'none';
      texture.style.display = 'none';
      petInfo.style.display = 'none';
    }
  });
} else {
  console.error('Toggle switch não encontrado');
}

// Menu hamburger
const hamburgerMenu = document.querySelector('.hamburger-menu');
const menuDropdown = document.querySelector('.menu-dropdown');

if (hamburgerMenu && menuDropdown) {
  hamburgerMenu.addEventListener('click', (e) => {
    e.stopPropagation();
    menuDropdown.classList.toggle('active');
  });

  document.addEventListener('click', (e) => {
    if (!hamburgerMenu.contains(e.target)) {
      menuDropdown.classList.remove('active');
    }
  });
} else {
  console.error('Hamburger menu ou dropdown não encontrados');
}

// Ações do menu
document.querySelectorAll('.menu-item').forEach((item) => {
  item.addEventListener('click', (e) => {
    const action = e.target.dataset.action;
    if (action === 'open-status') {
      console.log('Abrir Status');
      window.electronAPI.send('open-status-window');
    } else if (action === 'load-pet') {
      console.log('Abrir Pets');
      window.electronAPI.send('open-load-pet-window');
    } else if (action === 'exit') {
      console.log('Sair');
      if (exitOverlay) {
        exitOverlay.style.display = 'flex';
      }
    } else if (action === 'train-pet') {
      console.log('Treinar Pet');
      window.electronAPI.send('open-train-menu-window');
    } else if (action === 'gift-pet') {
      console.log('Abrir Presentes');
      window.electronAPI.send('open-gift-window');
    } else if (action === 'battle-pet') {
      // Verificar se o pet tem golpes
      const moves = petData.knownMoves || petData.moves || [];
      if (moves.length === 0) {
        if (battleAlert) {
          battleAlert.textContent = 'Primeiro deve aprender algum golpe para se defender';
          battleAlert.style.display = 'block';
          setTimeout(() => {
            battleAlert.style.display = 'none';
          }, 3000);
        }
        return;
      }
      console.log('Abrir Modo de Batalha');
      window.electronAPI.send('open-battle-mode-window'); // Alterado pra abrir a nova janela
    } else if (action === 'itens-pet') {
      console.log('Abrir Itens');
      // Usar canal oficial 'itens-pet' para acionar handler de criação
      window.electronAPI.send('itens-pet');
    } else if (action === 'store-pet') {
      console.log('Abrir Loja');
      window.electronAPI.send('store-pet');
    } else if (action === 'bestiary-pet') {
      console.log('Abrir Bestiário');
      window.electronAPI.send('open-bestiary-window');
    } else if (action === 'mini-mode') {
      console.log('Ativando Modo Miniatura');
      toggleMiniMode(true);
    }
  });
});

// Sistema de Mini-Mode (transforma o index.html em mini-mode)
let isMiniMode = false;

function toggleMiniMode(enable) {
  isMiniMode = enable;
  const body = document.body;
  
  if (enable) {
    // Ativar mini-mode: esconder elementos e redimensionar janela
    console.log('Ativando Modo Miniatura, petData:', petData);
    body.classList.add('mini-mode-active');
    
    console.log('Enviando set-mini-mode-layout...');
    window.electronAPI.send('set-mini-mode-layout', { 
      width: 50, 
      height: 350,
      mini: true
    });
    
    // Aguardar renderização dos elementos do mini-mode
    setTimeout(() => {
      console.log('Atualizando dados do pet...');
      updateMiniPetData();
    }, 100);
  } else {
    // Desativar mini-mode: restaurar elementos e tamanho original
    body.classList.remove('mini-mode-active');
    window.electronAPI.send('set-mini-mode-layout', { 
      width: 250, 
      height: 250,
      mini: false
    });
  }
}

function updateMiniPetData() {
  console.log('Atualizando dados do mini-mode, petData:', petData);
  
  if (!petData) {
    console.warn('petData não disponível para mini-mode');
    return;
  }
  
  // Atualizar level
  const miniLevel = document.getElementById('mini-level');
  if (miniLevel) {
    miniLevel.textContent = `Nv ${petData.level || 1}`;
    console.log('Level atualizado:', miniLevel.textContent);
  }
  
  // Atualizar nome
  const miniName = document.getElementById('mini-name');
  if (miniName) {
    miniName.textContent = petData.name || 'Eggsy';
    console.log('Nome atualizado:', miniName.textContent);
  }
  
  // Atualizar imagem do pet
  const miniPetImg = document.getElementById('mini-pet-img');
  if (miniPetImg && petData.statusImage) {
    // O statusImage pode ser: "Ave/fogo/Pidgly/front.gif" ou similar
    const statusDir = petData.statusImage.replace(/\/(front|back)\.(gif|png)$/i, '');
    const miniIconPath = `Assets/Mons/${statusDir}/mini-icon.png`;
    const frontPath = `Assets/Mons/${statusDir}/front.png`;
    const fallbackPath = 'Assets/Mons/eggsy.png';
    
    // Tentar mini-icon.png primeiro
    miniPetImg.onerror = function() {
      // Se mini-icon falhar, tentar front.png
      if (miniPetImg.src !== frontPath) {
        miniPetImg.onerror = function() {
          // Se front falhar, usar eggsy.png
          miniPetImg.onerror = null;
          miniPetImg.src = fallbackPath;
        };
        miniPetImg.src = frontPath;
      }
    };
    miniPetImg.src = miniIconPath;
    console.log('Imagem do pet atualizada:', miniIconPath);
  }
  
  // Atualizar elemento
  const miniElementImg = document.getElementById('mini-element-img');
  if (miniElementImg) {
    const element = petData.element || 'puro';
    const imgSrc = `Assets/Elements/${element}.png`;
    miniElementImg.src = imgSrc;
    miniElementImg.alt = element;
    console.log('Elemento atualizado:', imgSrc);
  }
  
  // Atualizar background de raridade
  const miniContainer = document.querySelector('.mini-mode-container');
  if (miniContainer) {
    const rarity = petData.rarity || 'Raro';
    const gradient = rarityGradients[rarity] || rarityGradients['Raro'];
    miniContainer.style.background = gradient;
    console.log('Raridade atualizada:', rarity, gradient);
  }
}

// Setup do mini-mode menu toggle
const miniMenuToggle = document.getElementById('mini-menu-toggle');

if (miniMenuToggle) {
  miniMenuToggle.addEventListener('click', (e) => {
    e.stopPropagation();
    console.log('Abrindo mini-menu...');
    window.electronAPI.send('open-mini-menu');
  });
}

// Adicionar item no menu para voltar ao modo normal
if (menuDropdown) {
  const normalModeItem = document.createElement('div');
  normalModeItem.className = 'menu-item';
  normalModeItem.dataset.action = 'normal-mode';
  normalModeItem.textContent = 'Modo Normal';
  normalModeItem.style.display = 'none'; // Inicialmente escondido
  normalModeItem.addEventListener('click', () => {
    console.log('Voltando ao Modo Normal');
    toggleMiniMode(false);
  });
  menuDropdown.appendChild(normalModeItem);
  
  // Mostrar/esconder item baseado no modo
  const originalObserver = new MutationObserver(() => {
    normalModeItem.style.display = isMiniMode ? 'block' : 'none';
  });
}

// Receber dados do pet via IPC
window.electronAPI.on('pet-data', (event, receivedPetData) => {
  console.log('Dados do pet recebidos via IPC:', receivedPetData);
  loadPet(receivedPetData);
  
  // Se estamos em mini-mode, atualizar também os dados do mini-mode
  if (isMiniMode) {
    updateMiniPetData();
  }
});

// Escutar o evento de erro de batalha e exibir o alerta
window.electronAPI.on('show-battle-error', (event, message) => {
  if (battleAlert) {
    battleAlert.textContent = message || 'Erro desconhecido';
    battleAlert.style.display = 'block';
    // Esconde o alerta após 3 segundos
    setTimeout(() => {
      battleAlert.style.display = 'none';
    }, 3000);
  } else {
    console.error('Elemento #battle-alert não encontrado');
  }
});

exitYesBtn?.addEventListener('click', () => {
  window.electronAPI.send('exit-app');
});

exitNoBtn?.addEventListener('click', () => {
  if (exitOverlay) {
    exitOverlay.style.display = 'none';
  }
});

// Função para processar ações do menu
function handleMenuAction(action) {
  console.log('Processando ação do menu:', action);
  
  switch(action) {
    case 'bestiary':
      window.electronAPI.send('open-bestiary-window');
      break;
    case 'status':
      window.electronAPI.send('open-status-window');
      break;
    case 'presentes':
      window.electronAPI.send('open-gift-window');
      break;
    case 'train':
      window.electronAPI.send('open-train-menu-window');
      break;
    case 'battle':
      // Verificar se o pet tem golpes
      const moves = petData.knownMoves || petData.moves || [];
      if (moves.length === 0) {
        if (battleAlert) {
          battleAlert.textContent = 'Primeiro deve aprender algum golpe para se defender';
          battleAlert.style.display = 'block';
          setTimeout(() => {
            battleAlert.style.display = 'none';
          }, 3000);
        }
        return;
      }
      window.electronAPI.send('open-battle-mode-window');
      break;
    case 'items':
      window.electronAPI.send('itens-pet');
      break;
    case 'store':
      window.electronAPI.send('store-pet');
      break;
    case 'pets':
      window.electronAPI.send('open-load-pet-window');
      break;
    default:
      console.log('Ação não reconhecida:', action);
  }
}

// Receber ações do mini-menu (em janela separada)
window.electronAPI.on('mini-menu-action', (event, action) => {
  console.log('Ação recebida do mini-menu:', action);
  if (action === 'normal-mode') {
    toggleMiniMode(false);
  } else {
    handleMenuAction(action);
  }
});

// Verificação periódica para encontrar itens
setInterval(maybeFindItem, 20 * 60 * 1000);
