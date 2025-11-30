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

  // Adicionar evento de clique nos itens para accordion
  document.querySelectorAll('.store-item').forEach((item) => {
    item.addEventListener('click', (e) => {
      // Não expandir se clicar no botão de comprar
      if (e.target.classList.contains('buy-button')) return;

      // Fechar todos os outros itens
      document.querySelectorAll('.store-item').forEach((otherItem) => {
        if (otherItem !== item) {
          otherItem.classList.remove('expanded');
        }
      });

      // Toggle no item clicado
      item.classList.toggle('expanded');
    });
  });

  document.querySelectorAll('.buy-button').forEach((btn) => {
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
      setTimeout(() => {
        alertEl.style.display = 'none';
      }, 3000);
    } else {
      alert(message);
    }
  });

  updateNestPrice();
  window.electronAPI.on('nest-updated', updateNestPrice);
});

async function loadItemsInfo() {
  try {
    const response = await fetch('../../data/items.json');
    const data = await response.json();
    itemsInfo = {};
    data.forEach((it) => {
      itemsInfo[it.id] = it;
    });
    // Tooltips removidos - descrição apenas via accordion
  } catch (err) {
    console.error('Erro ao carregar itens da loja:', err);
  }
}

function updateNestPrice() {
  if (!nestPriceEl || !window.electronAPI.getNestPrice) return;
  window.electronAPI.getNestPrice().then((price) => {
    nestPriceEl.textContent = `${price} moedas`;
  });
}

function updateTerrainVisibility(info) {
  if (!terrainMediumEl || !terrainLargeEl) return;
  const apply = (penSize) => {
    if (penSize === 'small') {
      terrainMediumEl.style.display = 'flex';
      terrainLargeEl.style.display = 'none';
    } else if (penSize === 'medium') {
      terrainMediumEl.style.display = 'none';
      terrainLargeEl.style.display = 'flex';
    } else {
      terrainMediumEl.style.display = 'none';
      terrainLargeEl.style.display = 'none';
    }
  };

  if (info && info.size) {
    apply(info.size);
  } else if (window.electronAPI?.getPenInfo) {
    window.electronAPI.getPenInfo().then((pen) => {
      apply(pen.size);
    });
  }
}
