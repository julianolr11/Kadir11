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
 * Adiciona essências ao inventário
 */
function addEssences(store, rarity, amount) {
  const inventory = getEssenceInventory(store);
  inventory[rarity] = (inventory[rarity] || 0) + amount;
  store.set('essences', inventory);
  return inventory;
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
 * (essência deve ter tier maior que o pet atual)
 */
function getValidEssenceForPet(store, pet) {
  const petRarity = pet.rarity || 'Comum';
  const petTier = ESSENCE_TIERS[petRarity];
  const inventory = getEssenceInventory(store);

  // Procura por essências de tier superior ao pet
  for (let i = petTier + 1; i < ESSENCE_NAMES.length; i++) {
    const rarity = ESSENCE_NAMES[i];
    if ((inventory[rarity] || 0) > 0) {
      return rarity;
    }
  }

  return null;
}

/**
 * Usa uma essência em um pet (evolui raridade)
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
  
  if ((inventory[essenceRarity] || 0) < 1) {
    return { success: false, error: 'Você não possui essa essência' };
  }

  // Remove a essência
  inventory[essenceRarity] -= 1;
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
  addEssences,
  removeEssences,
  generateEssencesFromPet,
  craftEssence,
  getValidEssenceForPet,
  useEssenceOnPet
};
