let pet = null;
let itemsInfo = {};
let swapModal = null;
let swapConfirmBtn = null;
let swapCancelBtn = null;
let pendingEquipId = null;
let essenceModal = null;
let currentEssenceRarity = null;

// Gradientes de raridade
const rarityGradients = {
  Comum: 'linear-gradient(135deg, #808080, #a0a0a0)',
  Incomum: 'linear-gradient(135deg, #2ecc71, #27ae60)',
  Raro: 'linear-gradient(135deg, #3498db, #2980b9)',
  MuitoRaro: 'linear-gradient(135deg, #9b59b6, #8e44ad)',
  Epico: 'linear-gradient(135deg, #e74c3c, #c0392b)',
  Lendario: 'linear-gradient(135deg, #f39c12, #e67e22)'
};

function openSwapModal(equipId) {
  pendingEquipId = equipId;
  if (swapModal) swapModal.style.display = 'flex';
}

async function openEssenceModal(essenceRarity) {
  currentEssenceRarity = essenceRarity;
  if (!essenceModal) return;

  // Limpar lista anterior
  const petsList = document.getElementById('essence-pets-list');
  if (!petsList) return;
  petsList.innerHTML = '';

  // Buscar todos os pets disponíveis
  try {
    const allPets = await window.electronAPI.invoke('get-all-pets');
    if (!allPets || allPets.length === 0) {
      petsList.innerHTML = '<p style="color: #ff4444;">Nenhum pet disponível</p>';
      essenceModal.style.display = 'flex';
      return;
    }

    // Filtrar pets que podem receber a essência (raridade menor que a essência)
    const ESSENCE_TIERS = {
      Comum: 0,
      Incomum: 1,
      Raro: 2,
      MuitoRaro: 3,
      Epico: 4,
      Lendario: 5
    };

    const essenceTier = ESSENCE_TIERS[essenceRarity];
    const eligiblePets = allPets.filter(p => {
      const petTier = ESSENCE_TIERS[p.rarity || 'Comum'];
      return petTier < essenceTier;
    });

    if (eligiblePets.length === 0) {
      petsList.innerHTML = '<p style="color: #ff4444;">Nenhum pet elegível para esta essência</p><p style="opacity: 0.7; font-size: 12px;">A raridade do pet deve ser menor que a da essência</p>';
      essenceModal.style.display = 'flex';
      return;
    }

    // Criar cards dos pets
    eligiblePets.forEach(petData => {
      const petItem = document.createElement('div');
      petItem.className = 'essence-pet-item';

      const imageContainer = document.createElement('div');
      imageContainer.className = 'essence-pet-image-container';

      // Fundo com cor da raridade atual
      const rarityBg = document.createElement('div');
      rarityBg.className = 'essence-pet-rarity-bg';
      rarityBg.style.background = rarityGradients[petData.rarity || 'Comum'];

      // Imagem do pet
      const petImage = document.createElement('img');
      petImage.className = 'essence-pet-image';
      const imagePath = petData.statusImage || petData.image || 'eggsy.png';
      petImage.src = imagePath.startsWith('Assets/') ? '../../' + imagePath : '../../Assets/Mons/' + imagePath;
      petImage.onerror = () => {
        petImage.src = '../../Assets/Mons/eggsy.png';
      };

      imageContainer.appendChild(rarityBg);
      imageContainer.appendChild(petImage);

      // Informações do pet
      const petInfo = document.createElement('div');
      petInfo.className = 'essence-pet-info';

      const petName = document.createElement('div');
      petName.className = 'essence-pet-name';
      petName.textContent = petData.name || 'Sem nome';

      const petRarity = document.createElement('div');
      petRarity.className = 'essence-pet-rarity';
      petRarity.textContent = `${petData.rarity || 'Comum'} → ${essenceRarity}`;

      petInfo.appendChild(petName);
      petInfo.appendChild(petRarity);

      petItem.appendChild(imageContainer);
      petItem.appendChild(petInfo);

      // Ao clicar, usar a essência no pet
      petItem.addEventListener('click', async () => {
        await useEssenceOnPet(petData.petId, essenceRarity, imageContainer);
      });

      petsList.appendChild(petItem);
    });

    essenceModal.style.display = 'flex';
  } catch (error) {
    console.error('Erro ao carregar pets:', error);
    petsList.innerHTML = '<p style="color: #ff4444;">Erro ao carregar pets</p>';
    essenceModal.style.display = 'flex';
  }
}

async function useEssenceOnPet(petId, essenceRarity, imageContainer) {
  try {
    const result = await window.electronAPI.invoke('use-essence-on-pet', { petId, essenceRarity });
    
    if (result.success) {
      // Animar a mudança de raridade no fundo
      const rarityBg = imageContainer.querySelector('.essence-pet-rarity-bg');
      if (rarityBg) {
        rarityBg.style.transition = 'background 1s ease';
        rarityBg.style.background = rarityGradients[result.newRarity];
      }

      // Mostrar mensagem de sucesso
      setTimeout(() => {
        alert(`Sucesso! ${result.oldRarity} → ${result.newRarity}`);
        closeEssenceModal();
        // Recarregar itens
        window.electronAPI.send('request-pet-data');
      }, 1000);
    } else {
      alert(result.error || 'Erro ao usar essência');
    }
  } catch (error) {
    console.error('Erro ao usar essência:', error);
    alert('Erro ao usar essência no pet');
  }
}

function closeEssenceModal() {
  if (essenceModal) {
    essenceModal.style.display = 'none';
    currentEssenceRarity = null;
  }
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
  essenceModal = document.getElementById('essence-modal');
  
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

  // Fechar modal de essências
  document.getElementById('essence-modal-close')?.addEventListener('click', closeEssenceModal);

  // Comando secreto para adicionar moedas
  let cheatBuffer = '';
  document.addEventListener('keydown', (e) => {
    const key = e.key.toLowerCase();
    if (key.length === 1 && /[a-z0-9]/.test(key)) {
      cheatBuffer += key;
      if (cheatBuffer.length > 7) cheatBuffer = cheatBuffer.slice(-7);
      if (cheatBuffer === 'kadir11') {
        cheatBuffer = '';
        if (pet && pet.petId) {
          window.electronAPI.send('add-coins', 1000);
          console.log('Comando kadir11 ativado: +1000 moedas');
        }
      }
    }
  });

  loadItemsInfo();

  window.electronAPI.on('pet-data', async (event, data) => {
    pet = data;
    const countEl = document.getElementById('coin-count');
    if (countEl) countEl.textContent = pet.coins ?? 0;
    
    // Carregar essências do inventário
    try {
      const essenceInventory = await window.electronAPI.invoke('get-essence-inventory');
      pet.essences = essenceInventory;
    } catch (err) {
      console.error('Erro ao carregar essências:', err);
      pet.essences = {};
    }
    
    updateItems();
  });
});

async function loadItemsInfo() {
  try {
    const response = await fetch('../../data/items.json');
    const data = await response.json();
    itemsInfo = {};
    data.forEach((it) => {
      itemsInfo[it.id] = it;
    });
    
    // Adicionar essências como itens especiais
    const essenceTypes = ['Comum', 'Incomum', 'Raro', 'MuitoRaro', 'Epico', 'Lendario'];
    essenceTypes.forEach(rarity => {
      const id = `essence_${rarity}`;
      itemsInfo[id] = {
        id: id,
        name: `Essência ${formatRarity(rarity)}`,
        type: 'essence',
        icon: 'Assets/Icons/soul-essence.png',
        description: `Colete 10 para evoluir a raridade de um pet para ${formatRarity(rarity)}`,
        rarity: rarity
      };
    });
    
    updateItems();
  } catch (err) {
    console.error('Erro ao carregar itens:', err);
  }
}

function formatRarity(rarity) {
  if (!rarity) return 'Desconhecida';
  return rarity
    .replace(/([A-Z])/g, ' $1')
    .trim()
    .replace(/\b\w/g, c => c.toUpperCase());
}

function updateItems() {
  if (!pet || !Object.keys(itemsInfo).length) return;
  const items = pet.items || {};
  const essences = pet.essences || {};
  const listEl = document.getElementById('items-list');
  if (!listEl) return;
  listEl.innerHTML = '';

  // Combinar itens normais e essências
  const allItems = { ...items };
  
  // Adicionar essências ao objeto de itens
  Object.keys(essences).forEach(rarity => {
    const essenceId = `essence_${rarity}`;
    allItems[essenceId] = essences[rarity] || 0;
  });

  // Verificar se há itens disponíveis
  const hasItems = Object.keys(allItems).some((id) => allItems[id] > 0);

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

  const itemKeys = Object.keys(allItems).filter((id) => allItems[id] > 0);
  itemKeys.forEach((id, index) => {
    const qty = allItems[id];
    const info = itemsInfo[id];
    if (!info || qty <= 0) return;

    // Container do item com accordion
    const itemContainer = document.createElement('div');
    itemContainer.className = 'item-container';

    // Header do item (clicável para accordion)
    const itemHeader = document.createElement('div');
    itemHeader.className = 'item-header';

    const img = document.createElement('img');
    // Ajusta o caminho do JSON (Assets/Shop/...) para o contexto de views/management/ (../../Assets/Shop/...)
    img.src = info.icon.startsWith('Assets/') ? '../../' + info.icon : info.icon;
    img.alt = info.name;
    img.className = 'item-icon';
    img.onerror = () => {
      img.src = '../../Assets/Shop/health-potion.png';
    };

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
    
    // Para essências, mostrar X/10
    if (info.type === 'essence') {
      qtyLabel.textContent = `${qty}/10`;
      qtyLabel.className = 'item-qty essence-progress';
      if (qty >= 10) {
        qtyLabel.style.color = '#4CAF50';
        qtyLabel.style.fontWeight = 'bold';
      }
    } else {
      qtyLabel.textContent = `x${qty}`;
      qtyLabel.className = 'item-qty';
    }

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

    // Botão de usar/equipar/chocar/essência
    const useBtn = document.createElement('button');
    useBtn.className = 'button small-button use-item-btn';

    if (info.type === 'essence') {
      // Essências: só pode usar quando tiver 10/10
      if (qty >= 10) {
        useBtn.textContent = 'Usar';
        useBtn.disabled = false;
        useBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          // Abrir modal para selecionar o pet
          const essenceRarity = id.replace('essence_', '');
          openEssenceModal(essenceRarity);
        });
      } else {
        useBtn.textContent = `${qty}/10`;
        useBtn.disabled = true;
        useBtn.style.opacity = '0.5';
        useBtn.style.cursor = 'not-allowed';
      }
    } else if (id.startsWith('egg')) {
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
      document.querySelectorAll('.item-container').forEach((container) => {
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
