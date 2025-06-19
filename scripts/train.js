import { rarityGradients } from './constants.js';
console.log('train.js carregado');

let pet = null;

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

    window.electronAPI.on('pet-data', (event, data) => {
        pet = data;
        loadMoves();
    });
});

async function loadMoves() {
    try {
        const response = await fetch('data/moves.json');
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
        let disabled = false;
        const known = pet.moves && pet.moves.some(m => m.name === move.name);
        if (known) {
            action = 'Ativo';
            disabled = true;
        } else if (pet.moves && pet.moves.length >= 4) {
            action = 'Reaprender';
        }
        if (pet.level < move.level) {
            disabled = true;
        }

        const elementIcons = move.elements.map(el =>
            `<img class="element-icon" src="Assets/Elements/${el}.png" alt="${el}" style="image-rendering: pixelated;">`
        ).join(' ');

        let actionClass = '';
        switch (action) {
            case 'Aprender':
                actionClass = 'action-aprender';
                break;
            case 'Reaprender':
                actionClass = 'action-reaprender';
                break;
            case 'Ativo':
                actionClass = 'action-ativo';
                break;
            default:
                actionClass = 'action-aprender';
        }

        const rarityStyle = rarityGradients[move.rarity] || rarityGradients['Comum'];
        tr.innerHTML = `
            <td>${move.name}</td>
            <td><span style="padding: 5px; background: ${rarityStyle}; border-radius: 5px;">${move.rarity}</span></td>
            <td>${elementIcons}</td>
            <td>${move.power}</td>
            <td>${move.effect}</td>
            <td>${move.cost}</td>
            <td>${move.level}</td>
            <td><button class="button small-button action-button ${actionClass}">${action}</button></td>
        `;

        const btn = tr.querySelector('button');
        if (disabled) {
            btn.disabled = true;
        } else {
            btn.addEventListener('click', () => {
                window.electronAPI.send('learn-move', move);
            });
        }
        tbody.appendChild(tr);
    });
}
