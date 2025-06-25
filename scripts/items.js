let pet = null;
let itemsInfo = {};
let descriptionEl = null;
let cheatBuffer = '';

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
    document.getElementById('close-items-window')?.addEventListener('click', closeWindow);
    document.getElementById('back-items-window')?.addEventListener('click', () => {
        window.electronAPI.send('open-status-window');
        closeWindow();
    });
    document.getElementById('open-store-button')?.addEventListener('click', () => {
        // Indicar ao processo principal que o comando veio da tela de itens
        window.electronAPI.send('store-pet', { fromItems: true });
    });

    descriptionEl = document.getElementById('item-description');
    loadItemsInfo();

    window.electronAPI.on('pet-data', (event, data) => {
        pet = data;
        const countEl = document.getElementById('coin-count');
        if (countEl) countEl.textContent = pet.coins ?? 0;
        updateItems();
    });

    document.addEventListener('keydown', (e) => {
        const key = e.key.toLowerCase();
        if (key.length === 1 && /[a-z0-9]/.test(key)) {
            cheatBuffer += key;
            if (cheatBuffer.length > 7) cheatBuffer = cheatBuffer.slice(-7);
            if (cheatBuffer === 'kadir11') {
                cheatBuffer = '';
                window.electronAPI.send('reward-pet', { coins: 100, kadirPoints: 100 });
            }
        }
    });
});

async function loadItemsInfo() {
    try {
        const response = await fetch('data/items.json');
        const data = await response.json();
        itemsInfo = {};
        data.forEach(it => { itemsInfo[it.id] = it; });
        updateItems();
    } catch (err) {
        console.error('Erro ao carregar itens:', err);
    }
}

function updateItems() {
    if (!pet || !Object.keys(itemsInfo).length) return;
    const items = pet.items || {};
    const listEl = document.getElementById('items-list');
    if (!listEl) return;
    listEl.innerHTML = '';
    Object.keys(items).forEach(id => {
        const qty = items[id];
        const info = itemsInfo[id];
        if (!info || qty <= 0) return;

        const div = document.createElement('div');
        div.className = 'inventory-item';
        div.addEventListener('mouseenter', (e) => showDescription(info.description || '', e));
        div.addEventListener('mousemove', (e) => {
            if (descriptionEl && descriptionEl.style.visibility === 'visible') {
                descriptionEl.style.left = `${e.pageX + 10}px`;
                descriptionEl.style.top = `${e.pageY + 10}px`;
            }
        });
        div.addEventListener('mouseleave', hideDescription);

        const img = document.createElement('img');
        img.src = info.icon;
        img.alt = info.name;
        img.style.imageRendering = 'pixelated';

        const nameSpan = document.createElement('span');
        nameSpan.className = 'item-name';
        nameSpan.textContent = info.name;

        const qtySpan = document.createElement('span');
        qtySpan.className = 'item-qty';
        qtySpan.textContent = `x ${qty}`;

        const useBtn = document.createElement('button');
        useBtn.className = 'button small-button use-button';
        if (id.startsWith('egg')) {
            useBtn.textContent = 'Chocar';
            useBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                window.electronAPI.send('place-egg-in-nest', id);
            });
        } else {
            useBtn.textContent = 'Usar';
            useBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                window.electronAPI.send('use-item', id);
            });
        }

        div.appendChild(img);
        div.appendChild(nameSpan);
        div.appendChild(qtySpan);
        div.appendChild(useBtn);
        listEl.appendChild(div);
    });
}
