/**
 * Essence Manager
 * Gerencia o inventário de essências e operações de crafting/uso
 */

const ESSENCE_TIERS = {
  Comum: 0,
  Incomum: 1,
  Raro: 2,
  MuitoRaro: 3,
  Epico: 4,
  Lendario: 5
};

const ESSENCE_NAMES = ['Comum', 'Incomum', 'Raro', 'MuitoRaro', 'Epico', 'Lendario'];

const CRAFT_COST = 10; // Quantidade de essências necessárias para craft

/**
 * Inicializa o inventário de essências no store se não existir
 */
function initEssenceInventory(store) {
  if (!store.get('essences')) {
    store.set('essences', {
      Comum: 0,
      Incomum: 0,
      Raro: 0,
      MuitoRaro: 0,
      Epico: 0,
      Lendario: 0
    });
  }
}

/**
 * Obtém o inventário de essências
 */
function getEssenceInventory(store) {
  return store.get('essences', {
    Comum: 0,
    Incomum: 0,
    Raro: 0,
    MuitoRaro: 0,
    Epico: 0,
    Lendario: 0
  });
}

/**
 * Normaliza o inventário de essências aplicando auto-craft em todas as essências
 * Garante que nenhuma tier tenha 10+ essências
 */
function normalizeEssences(store) {
  const inventory = getEssenceInventory(store);
  let hasChanges = false;
  
  // Processar cada tier do menor para o maior (exceto Lendário)
  for (let tier = 0; tier < 5; tier++) {
    const currentRarity = ESSENCE_NAMES[tier];
    const nextRarity = ESSENCE_NAMES[tier + 1];
    
    if (inventory[currentRarity] >= 10) {
      const crafted = Math.floor(inventory[currentRarity] / 10);
      inventory[currentRarity] = inventory[currentRarity] % 10;
      inventory[nextRarity] = (inventory[nextRarity] || 0) + crafted;
      hasChanges = true;
    }
  }
  
  // Salvar se houve mudanças
  if (hasChanges) {
    store.set('essences', inventory);
  }
  
  return inventory;
}

/**
 * Adiciona essências ao inventário e faz auto-craft se atingir 10
 * Retorna objeto com inventário atualizado e informações de craft
 */
function addEssences(store, rarity, amount) {
  const inventory = getEssenceInventory(store);
  inventory[rarity] = (inventory[rarity] || 0) + amount;
  
  const craftResults = [];
  
  // Auto-craft: enquanto tiver 10+ essências e não for Lendário (tier máximo)
  let currentTier = ESSENCE_TIERS[rarity];
  let currentRarity = rarity;
  
  while (currentTier < 5 && inventory[currentRarity] >= 10) {
    const crafted = Math.floor(inventory[currentRarity] / 10);
    inventory[currentRarity] = inventory[currentRarity] % 10; // Resto
    
    const nextTier = currentTier + 1;
    const nextRarity = ESSENCE_NAMES[nextTier];
    
    inventory[nextRarity] = (inventory[nextRarity] || 0) + crafted;
    
    craftResults.push({
      from: currentRarity,
      to: nextRarity,
      amount: crafted
    });
    
    // Continuar verificando o próximo tier
    currentTier = nextTier;
    currentRarity = nextRarity;
  }
  
  store.set('essences', inventory);
  
  return {
    inventory,
    craftResults
  };
}

/**
 * Remove essências do inventário
 */
function removeEssences(store, rarity, amount) {
  const inventory = getEssenceInventory(store);
  if ((inventory[rarity] || 0) < amount) {
    return null; // Não há essências suficientes
  }
  inventory[rarity] -= amount;
  store.set('essences', inventory);
  return inventory;
}

/**
 * Gera essências de um pet (1-3 baseado na raridade)
 * Retorna objeto com inventário e resultados de craft
 */
function generateEssencesFromPet(store, pet) {
  const amount = Math.floor(Math.random() * 3) + 1; // 1 a 3
  const rarity = pet.rarity || 'Comum';
  return addEssences(store, rarity, amount);
}

/**
 * Faz craft de essências (10 de tier N → 1 de tier N+1)
 */
function craftEssence(store, fromRarity) {
  const tierIndex = ESSENCE_TIERS[fromRarity];
  
  if (tierIndex === undefined || tierIndex >= ESSENCE_NAMES.length - 1) {
    return { success: false, error: 'Raridade inválida ou já no máximo' };
  }

  const inventory = getEssenceInventory(store);
  
  if ((inventory[fromRarity] || 0) < CRAFT_COST) {
    return { 
      success: false, 
      error: `Você precisa de ${CRAFT_COST} essências ${fromRarity}` 
    };
  }

  const toRarity = ESSENCE_NAMES[tierIndex + 1];
  
  // Remove 10 essências do tier inferior
  inventory[fromRarity] -= CRAFT_COST;
  
  // Adiciona 1 essência do tier superior
  inventory[toRarity] = (inventory[toRarity] || 0) + 1;
  
  store.set('essences', inventory);
  
  return {
    success: true,
    from: fromRarity,
    to: toRarity,
    inventory
  };
}

/**
 * Verifica se há uma essência válida para usar no pet
 * (essência deve ter tier maior que o pet atual E ter pelo menos 10 unidades)
 */
function getValidEssenceForPet(store, pet) {
  const petRarity = pet.rarity || 'Comum';
  const petTier = ESSENCE_TIERS[petRarity];
  const inventory = getEssenceInventory(store);

  // Procura por essências de tier superior ao pet com pelo menos 10 unidades
  for (let i = petTier + 1; i < ESSENCE_NAMES.length; i++) {
    const rarity = ESSENCE_NAMES[i];
    if ((inventory[rarity] || 0) >= 10) {
      return rarity;
    }
  }

  return null;
}

/**
 * Usa uma essência em um pet (evolui raridade)
 * Consome 10 essências para evoluir
 */
function useEssenceOnPet(store, pet, essenceRarity) {
  const petRarity = pet.rarity || 'Comum';
  const petTier = ESSENCE_TIERS[petRarity];
  const essenceTier = ESSENCE_TIERS[essenceRarity];

  if (essenceTier === undefined) {
    return { success: false, error: 'Essência inválida' };
  }

  if (essenceTier <= petTier) {
    return { 
      success: false, 
      error: 'A essência deve ser de raridade superior ao pet' 
    };
  }

  const inventory = getEssenceInventory(store);
  
  if ((inventory[essenceRarity] || 0) < 10) {
    return { success: false, error: 'Você precisa de 10 essências para usar' };
  }

  // Remove 10 essências
  inventory[essenceRarity] -= 10;
  store.set('essences', inventory);

  // Retorna a nova raridade do pet
  return {
    success: true,
    oldRarity: petRarity,
    newRarity: essenceRarity,
    inventory
  };
}

module.exports = {
  ESSENCE_TIERS,
  ESSENCE_NAMES,
  CRAFT_COST,
  initEssenceInventory,
  getEssenceInventory,
  normalizeEssences,
  addEssences,
  removeEssences,
  generateEssencesFromPet,
  craftEssence,
  getValidEssenceForPet,
  useEssenceOnPet
};
