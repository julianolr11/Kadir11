import { rarityGradients } from './constants.js';
import { calculateMovePower } from './moveEffectiveness.js';

const statusIcons = {
    'queimado': 'Assets/icons/burning.png',
    'envenenamento': 'Assets/icons/poison.png',
    'sangramento': 'Assets/icons/bleed.png',
    'dormencia': 'Assets/icons/sleep.png',
    'congelamento': 'Assets/icons/freeze.png',
    'paralisia': 'Assets/icons/paralyze.png',
    'cura': 'Assets/Shop/health-potion.png'
};
console.log('train.js carregado');

let pet = null;

let descriptionEl = null;
let trainAlert = null;

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

function closeWindow() {
    window.close();
}

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('close-train-window')?.addEventListener('click', closeWindow);
    document.getElementById('back-train-window')?.addEventListener('click', () => {
        window.electronAPI.send('open-status-window');
        closeWindow();
    });

    descriptionEl = document.getElementById('move-description');
    trainAlert = document.getElementById('train-alert');

    if (window.electronAPI.getCurrentPet) {
        window.electronAPI.getCurrentPet().then(data => {
            if (data) {
                pet = data;
                if (!pet.knownMoves) {
                    pet.knownMoves = pet.moves ? [...pet.moves] : [];
                }
                const kpEl = document.getElementById('train-kadir-points-value');
                if (kpEl) kpEl.textContent = pet.kadirPoints ?? 0;
                loadMoves();
            }
        });
    }

    window.electronAPI.on('pet-data', (event, data) => {
        pet = data;
        if (!pet.knownMoves) {
            pet.knownMoves = pet.moves ? [...pet.moves] : [];
        }
        const kpEl = document.getElementById('train-kadir-points-value');
        if (kpEl) kpEl.textContent = pet.kadirPoints ?? 0;
        loadMoves();
    });

    window.electronAPI.on('show-train-error', (event, message) => {
        if (trainAlert) {
            trainAlert.textContent = message || 'Erro desconhecido';
            trainAlert.style.display = 'block';
            setTimeout(() => {
                trainAlert.style.display = 'none';
            }, 3000);
        } else {
            alert(message);
        }
    });
});

async function loadMoves() {
    try {
        const response = await fetch('../data/moves.json');
        const moves = await response.json();
        renderMoves(moves);
    } catch (err) {
        console.error('Erro ao carregar golpes:', err);
    }
}

function renderMoves(moves) {
    const tbody = document.querySelector('#moves-table tbody');
    tbody.innerHTML = '';
    moves.forEach(move => {
        if (!move.elements.includes(pet.element) || !move.species.includes(pet.specie)) {
            return;
        }
        const tr = document.createElement('tr');
        tr.addEventListener('mouseenter', (e) => {
            showDescription(move.description || '', e);
        });
        tr.addEventListener('mousemove', (e) => {
            if (descriptionEl && descriptionEl.style.visibility === 'visible') {
                descriptionEl.style.left = `${e.pageX + 10}px`;
                descriptionEl.style.top = `${e.pageY + 10}px`;
            }
        });
        tr.addEventListener('mouseleave', hideDescription);

        let action = 'Aprender';
        const active = pet.moves && pet.moves.some(m => m.name === move.name);
        const learned = pet.knownMoves && pet.knownMoves.some(m => m.name === move.name);
        if (active) {
            action = 'Ativo';
        } else if (learned) {
            action = 'Ativar';
        } else if (pet.moves && pet.moves.length >= 4) {
            action = 'Trocar';
        }
        if (pet.level < move.level) action = 'Indisponível';

        const elementIcons = move.elements.map(el =>
            `<img class="element-icon" src="Assets/Elements/${el}.png" alt="${el}" style="image-rendering: pixelated;">`
        ).join(' ');

        let actionClass = '';
        switch (action) {
            case 'Aprender':
                actionClass = 'action-aprender';
                break;
            case 'Ativar':
                actionClass = 'action-ativar';
                break;
            case 'Ativo':
                actionClass = 'action-ativo';
                break;
            case 'Trocar':
                actionClass = 'action-trocar';
                break;
            default:
                actionClass = 'action-indisponivel';
        }

        const rarityStyle = rarityGradients[move.rarity] || rarityGradients['Comum'];
        const effectIcon = statusIcons[move.effect?.toLowerCase()];
        const effectHtml = effectIcon ? `<img class="status-icon" src="${effectIcon}" alt="${move.effect}">` : move.effect;

        let displayCost = move.cost;
        if (learned) {
            displayCost = Math.ceil(move.cost / 2);
        }

        tr.innerHTML = `
            <td>${move.name}</td>
            <td><span style="padding: 5px; background: ${rarityStyle}; border-radius: 5px;">${move.rarity}</span></td>
            <td>${elementIcons}</td>
            <td>${calculateMovePower(move.power, pet.level, pet.maxHealth)}</td>
            <td>${effectHtml}</td>
            <td><img src="assets/icons/dna-kadir.png" alt="KP" style="height:16px; vertical-align:middle; image-rendering:pixelated;"> ${displayCost}</td>
            <td>${move.level}</td>
            <td><button class="button small-button action-button ${actionClass}">${action}</button></td>
        `;

        const btn = tr.querySelector('button');
        if (action === 'Indisponível' || action === 'Ativo') {
            btn.disabled = true;
        } else {
            btn.addEventListener('click', () => {
                window.electronAPI.send('learn-move', move);
            });
        }
        tbody.appendChild(tr);
    });
}
