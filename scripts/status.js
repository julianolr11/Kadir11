import { rarityGradients, rarityColors, specieBioImages, specieDirs } from './constants.mjs';

const raceNames = {
    viborom: 'Viborom',
    draak: 'Draak Olhos de Esmeralda',
    Pidgly: 'Pidgly',
    Ashfang: 'Ashfang',
    ignis: 'Ignis',
    Mawthorn: 'Mawthorn',
    Leoracal: 'Leoracal',
    Owlberoth: 'Owlberoth',
    Digitama: 'Digitama',
    Kael: 'Kael',
    drazraq: 'Drazraq'
};

const elementImages = {
    'ar': '../../Assets/Elements/ar.png',
    'fogo': '../../Assets/Elements/fogo.png',
    'agua': '../../Assets/Elements/agua.png',
    'terra': '../../Assets/Elements/terra.png',
    'puro': '../../Assets/Elements/puro.png'
};

function getRequiredXpForNextLevel(level) {
    const baseXp = 100;
    const scale = 1.2;
    return Math.round(baseXp * Math.pow(level, 1.5) * scale);
}
console.log('status.js carregado com sucesso');

let pet = {};
let itemsInfo = {};

// Mapeia diretórios para categorias de espécie para exibição na aba Sobre
const specieDirToCategory = {
    'Draconideo': 'Draconídeo',
    'Reptiloide': 'Reptiloide',
    'Ave': 'Ave',
    'Fera': 'Fera',
    'CriaturaMistica': 'Criatura Mística',
    'CriaturaSombria': 'Criatura Sombria',
    'Monstro': 'Monstro'
};

// Normaliza nomes específicos para suas categorias principais
function getSpecieCategory(p) {
    if (!p) return 'Desconhecida';
    // Se já for uma categoria conhecida, normaliza acentuação desejada
    const direct = {
        'Reptilóide': 'Reptiloide',
        'Reptiloide': 'Reptiloide',
        'Draconídeo': 'Draconídeo',
        'Ave': 'Ave',
        'Besta': 'Besta',
        'Criatura Mística': 'Criatura Mística',
        'Criatura Sombria': 'Criatura Sombria',
        'Monstro': 'Monstro',
        'Fera': 'Fera'
    };
    if (p.specie && direct[p.specie]) return direct[p.specie];

    // Caso specie seja um nome de espécie específica, deduzir pela pasta/dir
    const dir = specieDirs[p.specie];
    if (dir && specieDirToCategory[dir]) return specieDirToCategory[dir];

    // Como fallback, tentar pelo próprio dir do pet se existir
    if (p.dir && specieDirToCategory[p.dir]) return specieDirToCategory[p.dir];

    return p.specie || 'Desconhecida';
}

let descriptionEl = null;

function showDescription(text, evt) {
    if (!descriptionEl) return;
    descriptionEl.textContent = text;
    descriptionEl.style.left = `${evt.pageX + 10}px`;
    descriptionEl.style.top = `${evt.pageY + 10}px`;
    descriptionEl.style.visibility = 'visible';
}

function hideDescription() {
    if (!descriptionEl) return;
    descriptionEl.textContent = '';
    descriptionEl.style.visibility = 'hidden';
}

let renameModal = null;
let renameInput = null;
let cheatBuffer = '';
let equipModal = null;
let equipItemsContainer = null;
let unequipButton = null;
let closeEquipButton = null;

async function loadItemsInfo() {
    try {
        const resp = await fetch('../../data/items.json');
        const data = await resp.json();
        itemsInfo = {};
        data.forEach(it => { itemsInfo[it.id] = it; });
    } catch (err) {
        console.error('Erro ao carregar infos de itens:', err);
    }
}

function activateKadirFull() {
    if (!pet || !pet.petId) return;
    pet.currentHealth = pet.maxHealth;
    pet.hunger = 100;
    pet.happiness = 100;
    pet.energy = 100;
    updateStatus();
    window.electronAPI.send('kadirfull');
}

function openRenameModal() {
    if (!renameModal || !renameInput || !pet || !pet.petId) return;
    renameInput.value = pet.name || '';
    renameModal.style.display = 'flex';
    renameInput.focus();
}

function closeRenameModal() {
    if (renameModal) renameModal.style.display = 'none';
}

function confirmRename() {
    if (!renameInput || !pet || !pet.petId) return;
    const trimmed = renameInput.value.trim();
    if (!trimmed) return;
    if (trimmed.length > 15) {
        alert('O nome do pet deve ter no m\u00e1ximo 15 caracteres!');
        return;
    }
    pet.name = trimmed;
    window.electronAPI.send('rename-pet', { petId: pet.petId, newName: trimmed });
    updateStatus();
    closeRenameModal();
}

function openEquipModal() {
    if (!equipModal || !equipItemsContainer || !pet || !pet.items) return;
    equipItemsContainer.innerHTML = '';
    Object.keys(pet.items).forEach(id => {
        const qty = pet.items[id];
        const info = itemsInfo[id];
        if (!info || info.type !== 'equipment' || qty <= 0) return;

        const btn = document.createElement('button');
        btn.className = 'button small-button';
        btn.style.display = 'flex';
        btn.style.alignItems = 'center';
        btn.style.gap = '5px';
        btn.style.width = '100%';
        btn.style.textAlign = 'left';

        const img = document.createElement('img');
        img.src = info.icon;
        img.alt = info.name;
        img.style.width = '32px';
        img.style.height = '32px';
        img.style.imageRendering = 'pixelated';

        const textWrap = document.createElement('div');
        textWrap.style.display = 'flex';
        textWrap.style.flexDirection = 'column';
        textWrap.style.alignItems = 'flex-start';

        const span = document.createElement('span');
        span.textContent = info.name;

        const desc = document.createElement('span');
        desc.textContent = info.description || '';
        desc.style.fontSize = '12px';

        textWrap.appendChild(span);
        textWrap.appendChild(desc);

        btn.appendChild(img);
        btn.appendChild(textWrap);

        btn.addEventListener('click', () => {
            window.electronAPI.useItem(id);
            closeEquipModal();
        });

        equipItemsContainer.appendChild(btn);
    });
    if (pet.equippedItem) {
        unequipButton.style.display = 'block';
    } else {
        unequipButton.style.display = 'none';
    }
    equipModal.style.display = 'flex';
}

function closeEquipModal() {
    if (equipModal) equipModal.style.display = 'none';
}

function setImageWithFallback(imgElement, relativePath) {
    if (!imgElement) return;
    if (!relativePath) {
        imgElement.src = '../../Assets/Mons/eggsy.png';
        return;
    }
    const gifSrc = relativePath.endsWith('.gif') ? `../../Assets/Mons/${relativePath}` : null;
    const pngSrc = gifSrc ? gifSrc.replace(/\.gif$/i, '.png') : `../../Assets/Mons/${relativePath}`;

    imgElement.onerror = () => {
        if (gifSrc && imgElement.src.endsWith('.gif')) {
            imgElement.src = pngSrc;
        } else if (!imgElement.src.endsWith('eggsy.png')) {
            imgElement.onerror = null;
            imgElement.src = '../../Assets/Mons/eggsy.png';
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
        if (!pet.knownMoves) {
            pet.knownMoves = pet.moves ? [...pet.moves] : [];
        }
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
    const statusKadirPoints = document.getElementById('kadir-points-value');
    const statusMoves = document.getElementById('status-moves');
    const statusEquipImg = document.getElementById('status-equipped-item');
    const statusPetImage = document.getElementById('status-pet-image');
    const statusBioImage = document.getElementById('status-bio-image');
    const bioText = document.getElementById('bio-text');
    const xpBarFill = document.getElementById('xp-bar-fill');
    const xpText = document.getElementById('xp-text');
    const specieText = document.getElementById('specie-text');
    const raceText = document.getElementById('race-text');
    const elementText = document.getElementById('element-text');
    const titleBarElement = document.getElementById('title-bar-element');
    const titleBarPetName = document.getElementById('title-bar-pet-name');
    const statusPetImageGradient = document.getElementById('status-pet-image-gradient');

    // Verificar se todos os elementos estão disponíveis
    if (!healthContainer || !hungerContainer || !happinessContainer || !energyContainer || !statusAttack || !statusDefense || !statusSpeed || !statusMagic || !statusRarityLabel || !statusHealthFill || !statusHungerFill || !statusHappinessFill || !statusEnergyFill || !statusLevel || !statusKadirPoints || !statusMoves || !statusPetImage || !statusBioImage || !titleBarElement || !titleBarPetName || !statusPetImageGradient || !bioText || !xpBarFill || !xpText || !specieText || !raceText || !elementText || !statusEquipImg) {
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
            statusKadirPoints: !!statusKadirPoints,
            statusPetImage: !!statusPetImage,
            statusBioImage: !!statusBioImage,
            titleBarElement: !!titleBarElement,
            titleBarPetName: !!titleBarPetName,
            statusPetImageGradient: !!statusPetImageGradient,
            xpBarFill: !!xpBarFill,
            xpText: !!xpText,
            specieText: !!specieText,
            raceText: !!raceText,
            elementText: !!elementText,
            statusEquipImg: !!statusEquipImg
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

    let atk = pet.attributes?.attack || 0;
    let def = pet.attributes?.defense || 0;
    let spd = pet.attributes?.speed || 0;
    let mag = pet.attributes?.magic || 0;
    switch (pet.equippedItem) {
        case 'finger':
            atk = Math.round(atk * 1.2);
            break;
        case 'turtleShell':
            def = Math.round(def * 1.2);
            break;
        case 'feather':
            spd = Math.round(spd * 1.2);
            break;
        case 'orbe':
            mag = Math.round(mag * 1.2);
            break;
    }
    statusAttack.textContent = atk;
    statusDefense.textContent = def;
    statusSpeed.textContent = spd;
    statusMagic.textContent = mag;
    statusRarityLabel.textContent = formatRarity(pet.rarity).toUpperCase();
    statusLevel.innerHTML = `<strong>Level: ${pet.level || 0}</strong>`;
    statusKadirPoints.textContent = pet.kadirPoints ?? 0;

    // Atualizar a imagem do elemento na barra de título
    const elementImageSrc = elementImages[pet.element.toLowerCase()] || '../../Assets/Elements/default.png';
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
            const desc = pet.moves[i].description || '';
            slot.addEventListener('mouseenter', (e) => {
                showDescription(desc, e);
            });
            slot.addEventListener('mousemove', (e) => {
                if (descriptionEl && descriptionEl.style.visibility === 'visible') {
                    descriptionEl.style.left = `${e.pageX + 10}px`;
                    descriptionEl.style.top = `${e.pageY + 10}px`;
                }
            });
            slot.addEventListener('mouseleave', hideDescription);
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

    if (xpBarFill && xpText) {
        const requiredXp = getRequiredXpForNextLevel(pet.level || 1);
        const percentage = Math.min((pet.experience || 0) / requiredXp * 100, 100);
        xpBarFill.style.width = `${percentage}%`;
        xpText.textContent = `${pet.experience || 0}/${requiredXp}`;
    }
    if (specieText) {
        const specieCategory = getSpecieCategory(pet);
        specieText.textContent = `Espécie: ${specieCategory}`;
    }
    if (raceText) {
        const raceName = raceNames[pet.race] || pet.race || '';
        raceText.textContent = raceName ? `Raça: ${raceName}` : '';
    }
    if (elementText) {
        const imgSrc = elementImages[pet.element?.toLowerCase()] || '../../Assets/Elements/default.png';
        const elementName = pet.element || 'Desconhecido';
        elementText.innerHTML = `Elemento: <img src="${imgSrc}" alt="${elementName}" style="height: 16px; vertical-align: middle; image-rendering: pixelated;"> ${elementName}`;
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

    if (statusEquipImg) {
        const info = itemsInfo[pet.equippedItem];
        if (info && info.icon) {
            statusEquipImg.style.backgroundImage = `url(${info.icon})`;
        } else {
            statusEquipImg.style.backgroundImage = 'none';
        }
    }

    if (statusBioImage) {
        let bioPath = null;
        const dir = specieDirs[pet.specie];
        if (dir && pet.element && pet.race) {
            bioPath = `${dir}/${pet.element}/${pet.race}/${pet.race}.png`;
        }
        if (!bioPath) {
            const fallback = pet.bioImage || specieBioImages[pet.specie];
            bioPath = fallback ? fallback : '';
        }
        statusBioImage.src = bioPath ? `../../Assets/Mons/${bioPath}` : '';
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
        let bioPath = null;
        const dir = specieDirs[pet.specie];
        if (dir && pet.element && pet.race) {
            bioPath = `${dir}/${pet.element}/${pet.race}/${pet.race}.png`;
        }
        if (!bioPath) {
            const fallback = pet.bioImage || specieBioImages[pet.specie];
            bioPath = fallback ? fallback : '';
        }
        if (bioPath) {
            statusBioImage.style.display = 'block';
        }
    } else {
        statusBioImage.style.display = 'none';
    }
}

document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM carregado na janela de status');

    loadItemsInfo();

    descriptionEl = document.getElementById('move-description');

    const nameSpan = document.getElementById('title-bar-pet-name');
    const editIcon = document.getElementById('edit-pet-name');
    renameModal = document.getElementById('rename-modal');
    renameInput = document.getElementById('rename-input');
    const renameOk = document.getElementById('rename-ok');
    const renameCancel = document.getElementById('rename-cancel');
    equipModal = document.getElementById('equipment-modal');
    equipItemsContainer = document.getElementById('equip-items-container');
    unequipButton = document.getElementById('unequip-item-button');
    closeEquipButton = document.getElementById('close-equip-modal');
    document.getElementById('status-equipped-item')?.addEventListener('click', openEquipModal);
    unequipButton?.addEventListener('click', () => {
        window.electronAPI.send('unequip-item');
        closeEquipModal();
    });
    closeEquipButton?.addEventListener('click', closeEquipModal);
    if (nameSpan) nameSpan.addEventListener('click', openRenameModal);
    if (editIcon) editIcon.addEventListener('click', openRenameModal);
    renameOk?.addEventListener('click', confirmRename);
    renameCancel?.addEventListener('click', closeRenameModal);

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

    document.addEventListener('keydown', (e) => {
        const key = e.key.toLowerCase();
        if (key.length === 1 && /[a-z0-9]/.test(key)) {
            cheatBuffer += key;
            if (cheatBuffer.length > 9) cheatBuffer = cheatBuffer.slice(-9);
            if (cheatBuffer === 'kadirfull') {
                cheatBuffer = '';
                activateKadirFull();
            }
        }
    });

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

// Ativar uma aba específica quando solicitado pelo processo principal
window.electronAPI.on('activate-status-tab', (event, tabId) => {
    const button = document.querySelector(`.tab-button[data-tab="${tabId}"]`);
    if (button) {
        button.click();
    } else {
        console.warn('Botão da aba', tabId, 'não encontrado');
    }
});