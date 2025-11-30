/**
 * Lógica de progressão (XP, level up, recompensas).
 */
function applyBattleProgress(pet, { baseXp = 0 } = {}, xpUtils) {
  if (!pet) return { error: 'Pet não definido' };
  const xpGain = xpUtils.calculateXpGain(baseXp, pet.rarity);
  pet.experience = (pet.experience || 0) + xpGain;
  let levelsGained = 0;
  let kadirGained = 0;
  let requiredXp = xpUtils.getRequiredXpForNextLevel(pet.level);
  while (pet.experience >= requiredXp && pet.level < 100) {
    pet.level += 1;
    pet.experience -= requiredXp;
    kadirGained += 5;
    pet.kadirPoints = (pet.kadirPoints || 0) + 5;
    xpUtils.increaseAttributesOnLevelUp(pet);
    levelsGained += 1;
    requiredXp = xpUtils.getRequiredXpForNextLevel(pet.level);
  }
  return { pet, xpGain, levelsGained, kadirGained };
}

function applyJourneyRewards(pet, { eggId, coins = 0, kadirPoints = 0 } = {}, storeFns) {
  if (!pet) return { error: 'Pet não definido' };
  const { getItems, setItems, getCoins, setCoins } = storeFns;
  const items = getItems();
  
  if (eggId) items[eggId] = (items[eggId] || 0) + 1;
  
  setItems(items);
  pet.items = items;
  
  if (coins) {
    setCoins(getCoins() + coins);
    pet.coins = getCoins();
  }
  if (kadirPoints) pet.kadirPoints = (pet.kadirPoints || 0) + kadirPoints;
  
  return { pet, eggId, coinsAwarded: coins, kadirPointsAwarded: kadirPoints };
}

module.exports = { applyBattleProgress, applyJourneyRewards };
