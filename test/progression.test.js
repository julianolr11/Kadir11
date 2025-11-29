const assert = require('assert');
const { applyBattleProgress, applyJourneyRewards } = require('../scripts/logic/progression');

describe('progression logic', () => {
  function makePet() {
    return { petId: '000002', level: 1, experience: 0, rarity: 'Comum', kadirPoints: 0, attributes: { life: 10, attack: 5, defense:5, speed:5, magic:5 }, maxHealth: 10, currentHealth: 10 };
  }
  const mockXpUtils = {
    calculateXpGain: (base, rarity) => base, // ignore rarity for deterministic test
    getRequiredXpForNextLevel: (lvl) => 10 * lvl, // simple linear requirement
    increaseAttributesOnLevelUp: (pet) => { pet.attributes.life += 1; pet.maxHealth = pet.attributes.life; pet.currentHealth = pet.maxHealth; }
  };
  it('gains xp without leveling if below threshold', () => {
    const pet = makePet();
    const { xpGain, levelsGained } = applyBattleProgress(pet, { baseXp: 5 }, mockXpUtils);
    assert.strictEqual(xpGain, 5);
    assert.strictEqual(levelsGained, 0);
    assert.strictEqual(pet.experience, 5);
    assert.strictEqual(pet.level, 1);
  });
  it('levels up when crossing threshold and awards kadir points', () => {
    const pet = makePet();
    const res = applyBattleProgress(pet, { baseXp: 15 }, mockXpUtils); // need 10 xp
    assert.strictEqual(res.levelsGained, 1);
    assert.strictEqual(pet.level, 2);
    assert.strictEqual(pet.experience, 5); // leftover
    assert.strictEqual(res.kadirGained, 5);
    assert.strictEqual(pet.kadirPoints, 5);
  });
  it('can chain multiple level ups', () => {
    const pet = makePet();
    const res = applyBattleProgress(pet, { baseXp: 35 }, mockXpUtils); // lvl1 need10 -> lvl2 need20 -> total30 used leftover5
    assert.strictEqual(res.levelsGained, 2);
    assert.strictEqual(pet.level, 3);
    assert.strictEqual(pet.experience, 5);
    assert.strictEqual(pet.kadirPoints, 10);
  });
  it('journey rewards add egg, coins and kadir points', () => {
    const pet = makePet();
    const store = { items: {}, coins: 0 };
    const storeFns = {
      getItems: () => store.items,
      setItems: (i) => { store.items = i; },
      getCoins: () => store.coins,
      setCoins: (c) => { store.coins = c; }
    };
    const res = applyJourneyRewards(pet, { eggId: 'eggAve', coins: 50, kadirPoints: 100 }, storeFns);
    assert.strictEqual(store.items.eggAve, 1);
    assert.strictEqual(pet.items.eggAve, 1);
    assert.strictEqual(store.coins, 50);
    assert.strictEqual(pet.coins, 50);
    assert.strictEqual(pet.kadirPoints, 100);
    assert.strictEqual(res.kadirPointsAwarded, 100);
  });
});
