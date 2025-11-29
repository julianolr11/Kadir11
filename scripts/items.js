let pet = null;
let itemsInfo = {};
let swapModal = null;
let swapConfirmBtn = null;
let swapCancelBtn = null;
let pendingEquipId = null;

function openSwapModal(equipId) {
    pendingEquipId = equipId;
    if (swapModal) swapModal.style.display = 'flex';
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

    swapModal = document.getElementById('swap-modal');
    swapConfirmBtn = document.getElementById('swap-confirm');
    swapCancelBtn = document.getElementById('swap-cancel');
    swapConfirmBtn?.addEventListener('click', () => {
        if (pendingEquipId) {
            window.electronAPI.useItem(pendingEquipId);
        }
        pendingEquipId = null;
        if (swapModal) swapModal.style.display = 'none';
    });
    swapCancelBtn?.addEventListener('click', () => {
        pendingEquipId = null;
        if (swapModal) swapModal.style.display = 'none';
    });

    loadItemsInfo();

    window.electronAPI.on('pet-data', (event, data) => {
        pet = data;
        const countEl = document.getElementById('coin-count');
        if (countEl) countEl.textContent = pet.coins ?? 0;
        updateItems();
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

    // Verificar se há itens disponíveis
    const hasItems = Object.keys(items).some(id => items[id] > 0);

    if (!hasItems) {
        const emptyMsg = document.createElement('div');
        emptyMsg.style.padding = '20px';
        emptyMsg.style.textAlign = 'center';
        emptyMsg.style.color = '#888';
        emptyMsg.style.fontFamily = 'PixelOperator, sans-serif';
        emptyMsg.textContent = 'Sem itens disponíveis';
        listEl.appendChild(emptyMsg);
        return;
    }

    const itemKeys = Object.keys(items).filter(id => items[id] > 0);
    itemKeys.forEach((id, index) => {
        const qty = items[id];
        const info = itemsInfo[id];
        if (!info || qty <= 0) return;

        // Container do item com accordion
        const itemContainer = document.createElement('div');
        itemContainer.className = 'item-container';

        // Header do item (clicável para accordion)
        const itemHeader = document.createElement('div');
        itemHeader.className = 'item-header';

        const img = document.createElement('img');
        img.src = info.icon;
        img.alt = info.name;
        img.className = 'item-icon';

        const itemInfo = document.createElement('div');
        itemInfo.className = 'item-info';

        const nameQtyContainer = document.createElement('div');
        nameQtyContainer.className = 'item-name-qty';

        const label = document.createElement('span');
        label.textContent = info.name;
        label.className = 'item-name';

        const infoIcon = document.createElement('span');
        infoIcon.textContent = 'ⓘ';
        infoIcon.className = 'info-icon';
        infoIcon.title = 'Clique para ver detalhes';

        const qtyLabel = document.createElement('span');
        qtyLabel.textContent = `x${qty}`;
        qtyLabel.className = 'item-qty';

        nameQtyContainer.appendChild(label);
        nameQtyContainer.appendChild(infoIcon);
        nameQtyContainer.appendChild(qtyLabel);

        itemInfo.appendChild(nameQtyContainer);

        const arrow = document.createElement('span');
        arrow.className = 'accordion-arrow';
        arrow.textContent = '▼';

        // Criar área clicável do header (ícone, info, seta)
        const headerClickable = document.createElement('div');
        headerClickable.className = 'item-header-clickable';
        headerClickable.appendChild(img);
        headerClickable.appendChild(itemInfo);
        
        // Criar área de ações (botão usar + seta)
        const headerActions = document.createElement('div');
        headerActions.className = 'item-header-actions';

        // Botão de usar/equipar/chocar
        const useBtn = document.createElement('button');
        useBtn.className = 'button small-button use-item-btn';

        if (id.startsWith('egg')) {
            useBtn.textContent = 'Chocar';
            useBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                window.electronAPI.send('place-egg-in-nest', id);
            });
        } else {
            useBtn.textContent = info.type === 'equipment' ? 'Equipar' : 'Usar';
            useBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                if (info.type === 'equipment') {
                    if (pet.equippedItem && pet.equippedItem !== id) {
                        openSwapModal(id);
                        return;
                    }
                    if (pet.equippedItem === id) {
                        return;
                    }
                }
                window.electronAPI.useItem(id);
            });
        }

        headerActions.appendChild(useBtn);
        headerActions.appendChild(arrow);
        
        itemHeader.appendChild(headerClickable);
        itemHeader.appendChild(headerActions);

        // Conteúdo do accordion (descrição)
        const itemContent = document.createElement('div');
        itemContent.className = 'item-content';

        const description = document.createElement('p');
        description.style.margin = '0';
        description.textContent = info.description || info.effect || 'Sem descrição';
        itemContent.appendChild(description);

        // Toggle accordion ao clicar na área clicável ou na seta
        const toggleAccordion = () => {
            const isOpen = itemContainer.classList.contains('open');
            // Fechar todos os outros itens
            document.querySelectorAll('.item-container').forEach(container => {
                container.classList.remove('open');
            });
            // Toggle do item atual
            if (!isOpen) {
                itemContainer.classList.add('open');
            }
        };

        headerClickable.addEventListener('click', toggleAccordion);
        arrow.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleAccordion();
        });

        itemContainer.appendChild(itemHeader);
        itemContainer.appendChild(itemContent);

        // Adicionar divisória se não for o último item
        if (index < itemKeys.length - 1) {
            const divider = document.createElement('div');
            divider.className = 'item-divider';
            itemContainer.appendChild(divider);
        }

        listEl.appendChild(itemContainer);
    });
}
