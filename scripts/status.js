import { rarityGradients, rarityColors, specieBioImages } from './constants.js';
console.log('status.js carregado com sucesso');

let pet = {};

let tooltipEl = null;
function showTooltip(event) {
    const text = event.currentTarget.dataset.tooltip;
    if (!text) return;
    tooltipEl = document.createElement('div');
    tooltipEl.className = 'tooltip';
    tooltipEl.textContent = text;
    document.body.appendChild(tooltipEl);
    const rect = event.currentTarget.getBoundingClientRect();
    const left = rect.left + rect.width / 2 - tooltipEl.offsetWidth / 2;
    const top = rect.top + window.scrollY - tooltipEl.offsetHeight - 5;
    tooltipEl.style.left = `${left}px`;
    tooltipEl.style.top = `${top}px`;
}

function hideTooltip() {
    if (tooltipEl) {
        tooltipEl.remove();
        tooltipEl = null;
    }
}

function setupTooltip(el, text) {
    el.dataset.tooltip = text;
    el.addEventListener('mouseenter', showTooltip);
    el.addEventListener('mouseleave', hideTooltip);
}

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
function formatRarity(rarity) {
    if (!rarity) return 'Desconhecida';
    return rarity
        .replace(/([A-Z])/g, ' $1')
        .trim()
        .replace(/\b\w/g, c => c.toUpperCase());
}

function loadPet(petData) {
    if (petData) {
        pet = petData;
        console.log('Pet recebido via IPC na janela de status:', pet);
    } else {
        console.error('Nenhum petData recebido via IPC');
    }
    updateStatus();
}

function updateStatus() {
    // Elementos do DOM
    const healthContainer = document.getElementById('health');
    const hungerContainer = document.getElementById('hunger');
    const happinessContainer = document.getElementById('happiness');
    const energyContainer = document.getElementById('energy');
    const statusAttack = document.getElementById('status-attack');
    const statusDefense = document.getElementById('status-defense');
    const statusSpeed = document.getElementById('status-speed');
    const statusMagic = document.getElementById('status-magic');
    const statusRarityLabel = document.getElementById('status-rarity-label');
    const statusHealthFill = document.getElementById('status-health-fill');
    const statusHungerFill = document.getElementById('status-hunger-fill');
    const statusHappinessFill = document.getElementById('status-happiness-fill');
    const statusEnergyFill = document.getElementById('status-energy-fill');
    const statusLevel = document.getElementById('status-level');
    const statusMoves = document.getElementById('status-moves');
    const statusPetImage = document.getElementById('status-pet-image');
    const statusBioImage = document.getElementById('status-bio-image');
    const bioText = document.getElementById('bio-text');
    const titleBarElement = document.getElementById('title-bar-element');
    const titleBarPetName = document.getElementById('title-bar-pet-name');
    const statusPetImageGradient = document.getElementById('status-pet-image-gradient');

    // Verificar se todos os elementos estão disponíveis
    if (!healthContainer || !hungerContainer || !happinessContainer || !energyContainer || !statusAttack || !statusDefense || !statusSpeed || !statusMagic || !statusRarityLabel || !statusHealthFill || !statusHungerFill || !statusHappinessFill || !statusEnergyFill || !statusLevel || !statusMoves || !statusPetImage || !statusBioImage || !titleBarElement || !titleBarPetName || !statusPetImageGradient || !bioText) {
        console.error('Um ou mais elementos do status-container ou title-bar não encontrados', {
            healthContainer: !!healthContainer,
            hungerContainer: !!hungerContainer,
            happinessContainer: !!happinessContainer,
            energyContainer: !!energyContainer,
            statusAttack: !!statusAttack,
            statusDefense: !!statusDefense,
            statusSpeed: !!statusSpeed,
            statusMagic: !!statusMagic,
            statusRarityLabel: !!statusRarityLabel,
            statusHealthFill: !!statusHealthFill,
            statusHungerFill: !!statusHungerFill,
            statusHappinessFill: !!statusHappinessFill,
            statusEnergyFill: !!statusEnergyFill,
            statusLevel: !!statusLevel,
            statusMoves: !!statusMoves,
            statusPetImage: !!statusPetImage,
            statusBioImage: !!statusBioImage,
            titleBarElement: !!titleBarElement,
            titleBarPetName: !!titleBarPetName,
            statusPetImageGradient: !!statusPetImageGradient
        });
        return;
    }

    // Acessar os elementos filhos dentro dos contêineres
    const statusHealth = healthContainer.querySelector('#status-health');
    const statusHunger = hungerContainer.querySelector('#status-hunger');
    const statusHappiness = happinessContainer.querySelector('#status-happiness');
    const statusEnergy = energyContainer.querySelector('#status-energy');

    // Verificar se os dados do pet estão disponíveis
    if (!pet || !pet.element || !pet.rarity) {
        console.error('Dados do pet incompletos:', pet);
        return;
    }

    // Atualizar os elementos do DOM
    statusHealth.textContent = `${pet.currentHealth || 0}/${pet.maxHealth || 0}`;
    statusHunger.textContent = `${pet.hunger || 0}/100`;
    statusHappiness.textContent = `${pet.happiness || 0}/100`;
    statusEnergy.textContent = `${pet.energy || 0}/100`;
    statusAttack.textContent = pet.attributes?.attack || 0;
    statusDefense.textContent = pet.attributes?.defense || 0;
    statusSpeed.textContent = pet.attributes?.speed || 0;
    statusMagic.textContent = pet.attributes?.magic || 0;
    statusRarityLabel.textContent = formatRarity(pet.rarity).toUpperCase();
    statusLevel.innerHTML = `<strong>Level: ${pet.level || 0}</strong>`;

    // Atualizar a imagem do elemento na barra de título
    const elementImages = {
        'ar': './Assets/Elements/ar.png',
        'fogo': './Assets/Elements/fogo.png',
        'agua': './Assets/Elements/agua.png',
        'terra': './Assets/Elements/terra.png',
        'puro': './Assets/Elements/puro.png'
    };
    const elementImageSrc = elementImages[pet.element.toLowerCase()] || './Assets/Elements/default.png';
    console.log('Atualizando elemento na barra de título:', elementImageSrc);
    titleBarElement.src = elementImageSrc;
    titleBarElement.alt = `Elemento: ${pet.element}`;

    // Atualizar o nome do pet na barra de título
    console.log('Atualizando nome na barra de título:', pet.name);
    titleBarPetName.textContent = pet.name;

    statusMoves.innerHTML = '';
    const grid = document.createElement('div');
    grid.className = 'moves-grid';
    for (let i = 0; i < 4; i++) {
        const slot = document.createElement('div');
        slot.className = 'move-slot';
        if (pet.moves && pet.moves[i]) {
            slot.textContent = pet.moves[i].name;
            setupTooltip(slot, pet.moves[i].description || '');
        } else {
            const btn = document.createElement('button');
            btn.className = 'button add-move-button';
            btn.textContent = '+';
            btn.addEventListener('click', () => {
                window.electronAPI.send('train-pet');
            });
            slot.appendChild(btn);
        }
        grid.appendChild(slot);
    }
    statusMoves.appendChild(grid);

    // Atualizar bio
    if (bioText) {
        bioText.textContent = pet.bio || '';
    }

    const healthPercentage = (pet.currentHealth || 0) / (pet.maxHealth || 1) * 100;
    statusHealthFill.style.width = `${healthPercentage}%`;
    statusHungerFill.style.width = `${pet.hunger || 0}%`;
    statusHappinessFill.style.width = `${pet.happiness || 0}%`;
    statusEnergyFill.style.width = `${pet.energy || 0}%`;

    // Aplicar gradiente com base na raridade apenas na área da imagem do pet
    const gradient = rarityGradients[pet.rarity] || 'linear-gradient(135deg, #808080, #A9A9A9)';
    console.log('Aplicando gradiente:', gradient);
    statusPetImageGradient.style.background = gradient;

    const borderColor = rarityColors[pet.rarity] || '#808080';
    statusPetImage.style.borderColor = borderColor;

    // Atualizar a imagem do pet
    statusPetImage.addEventListener('load', () => {
        console.log('Imagem do pet carregada com sucesso');
    });
    statusPetImage.onerror = null;
    if (pet.statusImage) {
        setImageWithFallback(statusPetImage, pet.statusImage);
    } else {
        setImageWithFallback(statusPetImage, pet.image);
    }

    if (statusBioImage) {
        const bioPath = pet.bioImage || specieBioImages[pet.specie];
        if (bioPath) {
            statusBioImage.src = `Assets/Mons/${bioPath}`;
        } else {
            statusBioImage.src = '';
        }
        statusBioImage.style.display = 'none';
    }

    const activeBtn = document.querySelector('.tab-button.active');
    if (activeBtn) {
        const tabId = activeBtn.getAttribute('data-tab');
        updateTabImage(tabId);
    }
}

function closeWindow() {
    console.log('Botão Fechar clicado na janela de status');
    window.close();
}

function updateTabImage(tabId) {
    const statusBioImage = document.getElementById('status-bio-image');
    if (!statusBioImage) return;

    if (tabId === 'tab-sobre') {
        const bioPath = pet.bioImage || specieBioImages[pet.specie];
        if (bioPath) {
            statusBioImage.style.display = 'block';
        }
    } else {
        statusBioImage.style.display = 'none';
    }
}

document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM carregado na janela de status');

    // Controle das abas
    document.querySelectorAll('.tab-button').forEach(button => {
        button.addEventListener('click', () => {
            const tabId = button.getAttribute('data-tab');

            // Remover a classe active de todas as abas e botões
            document.querySelectorAll('.tab-content-item').forEach(tab => {
                tab.classList.remove('active');
            });
            document.querySelectorAll('.tab-button').forEach(btn => {
                btn.classList.remove('active');
            });

            // Adicionar a classe active à aba e botão selecionados
            document.getElementById(tabId)?.classList.add('active');
            button.classList.add('active');

            updateTabImage(tabId);
        });
    });

    // Garantir que a aba "Status" seja a inicial
    const statusTabButton = document.querySelector('.tab-button[data-tab="tab-status"]');
    if (statusTabButton) {
        statusTabButton.click();
    } else {
        console.warn('Botão da aba Status não encontrado');
    }

    const trainMovesButton = document.getElementById('train-moves-button');
    if (trainMovesButton) {
        trainMovesButton.addEventListener('click', () => {
            console.log('Botão Treinar Golpes clicado, abrindo janela de treinamento');
            window.electronAPI.send('train-pet');
        });
    } else {
        console.warn('train-moves-button element not found');
    }

    // Registrar o listener para o evento pet-data dentro do DOMContentLoaded
    window.electronAPI.on('pet-data', (event, petData) => {
        console.log('Dados do pet recebidos via IPC:', petData);
        loadPet(petData);
    });

    // Adicionar evento ao botão de fechar
    document.getElementById('close-status-titlebar')?.addEventListener('click', closeWindow);
    document.getElementById('back-status-titlebar')?.addEventListener('click', () => {
        closeWindow();
    });
});