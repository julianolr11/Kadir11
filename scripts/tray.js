import { rarityGradients } from './constants.js';

const exitOverlay = document.getElementById('exit-confirm-overlay');
const exitYesBtn = document.getElementById('exit-confirm-yes');
const exitNoBtn = document.getElementById('exit-confirm-no');

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

    imgElement.src = gifSrc || pngSrc;
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
    happiness: 25 // Abaixo de 30 para forçar o alerta
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
    
    // Verificar se os elementos de alerta existem
    if (!hungerWarning || !happinessWarning || !battleAlert) {
    console.error('Um ou mais elementos de alerta não encontrados:', {
    hungerWarning: !!hungerWarning,
    happinessWarning: !!happinessWarning,
    battleAlert: !!battleAlert
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
    
    const petImage = document.getElementById('pet-image');
    const petName = document.querySelector('.pet-name');
    healthFill.style.width = `${(petData.currentHealth / petData.maxHealth || 0) * 100}%`;
    energyFill.style.width = `${petData.energy || 0}%`;
    levelDisplay.textContent = `Lvl ${petData.level || 1}`;
    if (petData.statusImage) {
        setImageWithFallback(petImage, petData.statusImage);
    } else {
        setImageWithFallback(petImage, petData.image);
    }
    petImageBackground.style.background = rarityGradients[petData.rarity] || rarityGradients['Comum'];
    petName.textContent = petData.name || 'Eggsy';
    
    // Ajustar a posição dos alertas com base no decaimento
    adjustWarnings();
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
    
    // Carregar dados iniciais
    loadPet(petData);

    if (window.electronAPI.getCurrentPet) {
        window.electronAPI.getCurrentPet().then(data => {
            if (data) loadPet(data);
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
    petInfo: !!petInfo
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
    document.querySelectorAll('.menu-item').forEach(item => {
    item.addEventListener('click', (e) => {
    const action = e.target.dataset.action;
    if (action === 'open-status') {
    console.log('Abrir Status');
    window.electronAPI.send('open-status-window');
    } else if (action === 'load-pet') {
    console.log('Mudar de Pet');
    window.electronAPI.send('open-load-pet-window');
    } else if (action === 'exit') {
    console.log('Sair');
    if (exitOverlay) {
        exitOverlay.style.display = 'flex';
    }
    } else if (action === 'train-pet') {
    console.log('Treinar Pet');
    window.electronAPI.send('train-pet');
    } else if (action === 'care-pet') {
    console.log('Cuidar do Pet');
    window.electronAPI.send('care-pet');
    } else if (action === 'battle-pet') {
    console.log('Abrir Modo de Batalha');
    window.electronAPI.send('open-battle-mode-window'); // Alterado pra abrir a nova janela
    } else if (action === 'itens-pet') {
    console.log('Abrir Itens');
    window.electronAPI.send('itens-pet');
    } else if (action === 'store-pet') {
    console.log('Abrir Loja');
    window.electronAPI.send('store-pet');
    }
    });
    });
    
    // Receber dados do pet via IPC
    window.electronAPI.on('pet-data', (event, petData) => {
    console.log('Dados do pet recebidos via IPC:', petData);
    loadPet(petData);
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

