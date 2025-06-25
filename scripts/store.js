let pet = null;
let itemsInfo = {};
let descriptionEl = null;
let nestPriceEl = null;
let terrainMediumEl = null;
let terrainLargeEl = null;

function showDescription(html, evt) {
    if (!descriptionEl) return;
    descriptionEl.innerHTML = html;
    descriptionEl.style.left = `${evt.pageX + 10}px`;
    descriptionEl.style.top = `${evt.pageY + 10}px`;
    descriptionEl.style.visibility = 'visible';
}

function hideDescription() {
    if (!descriptionEl) return;
    descriptionEl.innerHTML = '';
    descriptionEl.style.visibility = 'hidden';
}

function closeWindow() {
    window.close();
}

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('close-store-window')?.addEventListener('click', closeWindow);
    document.getElementById('back-store-window')?.addEventListener('click', () => {
        window.electronAPI.send('open-status-window');
        closeWindow();
    });

    descriptionEl = document.getElementById('store-item-description');
    nestPriceEl = document.querySelector('.store-item[data-item="nest"] .item-price');
    terrainMediumEl = document.querySelector('.store-item[data-item="terrainMedium"]');
    terrainLargeEl = document.querySelector('.store-item[data-item="terrainLarge"]');
    loadItemsInfo();

    updateTerrainVisibility();

    window.electronAPI?.on('pen-updated', (e, info) => {
        updateTerrainVisibility(info);
    });

    document.getElementById('open-items-button')?.addEventListener('click', () => {
        window.electronAPI.send('itens-pet', { fromStore: true });
    });

    document.querySelectorAll('.buy-button').forEach(btn => {
        btn.addEventListener('click', () => {
            const item = btn.dataset.item;
            window.electronAPI.send('buy-item', item);
        });
    });

    window.electronAPI.on('pet-data', (event, data) => {
        pet = data;
        const countEl = document.getElementById('store-coin-count');
        if (countEl) countEl.textContent = pet.coins ?? 0;
    });

    window.electronAPI.on('show-store-error', (event, message) => {
        const alertEl = document.getElementById('store-alert');
        if (alertEl) {
            alertEl.textContent = message || 'Erro desconhecido';
            alertEl.style.display = 'block';
            setTimeout(() => { alertEl.style.display = 'none'; }, 3000);
        } else {
            alert(message);
        }
    });

    updateNestPrice();
    window.electronAPI.on('nest-updated', updateNestPrice);
});

async function loadItemsInfo() {
    try {
        const response = await fetch('data/items.json');
        const data = await response.json();
        itemsInfo = {};
        data.forEach(it => { itemsInfo[it.id] = it; });
        setupHover();
    } catch (err) {
        console.error('Erro ao carregar itens da loja:', err);
    }
}

function setupHover() {
    const items = document.querySelectorAll('.store-item');
    items.forEach(div => {
        const id = div.dataset.item;
        if (!id || !itemsInfo[id]) return;
        const effect = itemsInfo[id].effect || itemsInfo[id].description || '';
        const html = `<strong>${itemsInfo[id].name}</strong><br>${effect}`;
        div.addEventListener('mouseenter', (e) => showDescription(html, e));
        div.addEventListener('mousemove', (e) => {
            if (descriptionEl && descriptionEl.style.visibility === 'visible') {
                descriptionEl.style.left = `${e.pageX + 10}px`;
                descriptionEl.style.top = `${e.pageY + 10}px`;
            }
        });
        div.addEventListener('mouseleave', hideDescription);
    });
}

function updateNestPrice() {
    if (!nestPriceEl || !window.electronAPI.getNestPrice) return;
    window.electronAPI.getNestPrice().then(price => {
        nestPriceEl.textContent = `${price} moedas`;
    });
}

function updateTerrainVisibility(info) {
    if (!terrainMediumEl || !terrainLargeEl) return;
    const apply = (penSize) => {
        if (penSize === 'small') {
            terrainMediumEl.style.display = 'block';
            terrainLargeEl.style.display = 'none';
        } else if (penSize === 'medium') {
            terrainMediumEl.style.display = 'none';
            terrainLargeEl.style.display = 'block';
        } else {
            terrainMediumEl.style.display = 'none';
            terrainLargeEl.style.display = 'none';
        }
    };

    if (info && info.size) {
        apply(info.size);
    } else if (window.electronAPI?.getPenInfo) {
        window.electronAPI.getPenInfo().then(pen => {
            apply(pen.size);
        });
    }
}
