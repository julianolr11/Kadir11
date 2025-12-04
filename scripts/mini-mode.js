console.log('mini-mode.js carregado');

// Estado do mini-mode
let currentPet = null;

// Elementos DOM
const petElementImg = document.getElementById('pet-element-img');
const petNameRotated = document.getElementById('pet-name-rotated');
const petLevel = document.getElementById('pet-level');
const menuBtn = document.getElementById('menu-btn');
const menuDropdown = document.getElementById('menu-dropdown');
const miniContainer = document.getElementById('mini-container');

// Gradientes de raridade
const rarityGradients = {
  Comum: 'linear-gradient(135deg, #808080, #A9A9A9)',
  Incomum: 'linear-gradient(135deg, #D3D3D3, #E0E0E0)',
  Raro: 'linear-gradient(135deg, #32CD32, #228B22)',
  MuitoRaro: 'linear-gradient(135deg, #4682B4, #1E90FF)',
  Epico: 'linear-gradient(135deg, #800080, #DA70D6)',
  Lendario: 'linear-gradient(135deg, #FFD700, #FFA500)',
};

// Inicialização
function init() {
  setupEventListeners();
  requestPetData();
}

// Event Listeners
function setupEventListeners() {
  // Menu - abrir/fechar dropdown (SEM redimensionar janela)
  menuBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    menuDropdown.classList.toggle('active');
  });
  
  // Fechar menu ao clicar fora
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.menu-btn') && !e.target.closest('.menu-dropdown')) {
      menuDropdown.classList.remove('active');
    }
  });
  
  // Itens do menu
  document.querySelectorAll('.menu-item').forEach(item => {
    item.addEventListener('click', (e) => {
      const action = e.target.dataset.action;
      handleMenuAction(action);
      menuDropdown.classList.remove('active');
    });
  });
  
  // Receber dados do pet
  window.electronAPI.on('pet-data', (event, pet) => {
    updatePetData(pet);
  });
}

// Solicitar dados do pet
function requestPetData() {
  window.electronAPI.send('request-pet-data');
}

// Normalizar nome do elemento para arquivo
function getElementFileName(element) {
  const mapping = {
    'fogo': 'fogo.png',
    'agua': 'agua.png',
    'ar': 'ar.png',
    'terra': 'terra.png',
    'puro': 'puro.png'
  };
  return mapping[element?.toLowerCase()] || 'default.png';
}

// Manipular ações do menu
function handleMenuAction(action) {
  console.log('Ação do menu:', action);
  
  switch(action) {
    case 'bestiary-pet':
      window.electronAPI.send('open-bestiary');
      break;
    case 'open-status':
      window.electronAPI.send('open-status-window');
      break;
    case 'gift-pet':
      window.electronAPI.send('open-gift-window');
      break;
    case 'train-pet':
      window.electronAPI.send('open-train-window');
      break;
    case 'battle-pet':
      window.electronAPI.send('open-battle-window');
      break;
    case 'itens-pet':
      window.electronAPI.send('open-items-window');
      break;
    case 'store-pet':
      window.electronAPI.send('open-store-window');
      break;
    case 'load-pet':
      window.electronAPI.send('open-load-pet-window');
      break;
    case 'open-mini-mode':
      window.electronAPI.send('close-mini-mode');
      window.electronAPI.send('open-tray-window');
      break;
    case 'exit':
      window.electronAPI.send('exit-app');
      break;
  }
}

// Atualizar dados do pet
function updatePetData(pet) {
  if (!pet) return;
  currentPet = pet;
  
  // Atualizar imagem do elemento
  const elementFileName = getElementFileName(pet.element);
  petElementImg.src = `Assets/Elements/${elementFileName}`;
  
  // Atualizar nome
  petNameRotated.textContent = pet.name || 'Eggsy';
  petLevel.textContent = pet.level || 1;
  
  // Atualizar background de acordo com raridade
  const gradient = rarityGradients[pet.rarity] || 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
  miniContainer.style.background = gradient;
}

// Inicializar quando DOM carregar
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
