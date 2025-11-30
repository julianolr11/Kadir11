const assert = require('assert');
const { applyBattleProgress, applyJourneyRewards } = require('../scripts/logic/progression');

describe('progression threshold branches', () => {
  it('cobre while condition false quando level>=100 (linha 11)', () => {
    const pet = { level: 100, experience: 0, kadirPoints: 0 };
    const xpUtils = {
      calculateXpGain: () => 9999,
      getRequiredXpForNextLevel: () => 100,
      increaseAttributesOnLevelUp: () => {},
    };
    const result = applyBattleProgress(pet, { baseXp: 100 }, xpUtils);
    assert.strictEqual(result.pet.level, 100); // não subiu
    assert.ok(result.pet.experience > 0); // XP acumulado mas sem level up
  });

  it('cobre branch exato do threshold de level up (linha 11 condição exata)', () => {
    const pet = { level: 1, experience: 0, kadirPoints: 0 };
    let requiredForLevel2 = 100;
    const xpUtils = {
      calculateXpGain: () => requiredForLevel2, // exatamente o necessário
      getRequiredXpForNextLevel: (lvl) => (lvl === 1 ? requiredForLevel2 : 200),
      increaseAttributesOnLevelUp: () => {},
    };
    const result = applyBattleProgress(pet, { baseXp: 10 }, xpUtils);
    assert.strictEqual(result.levelsGained, 1);
    assert.strictEqual(result.pet.level, 2);
    assert.strictEqual(result.pet.experience, 0); // XP reset após level up exato
  });

  it('cobre branch sem eggId em applyJourneyRewards (linha 26)', () => {
    const pet = { petId: '1', kadirPoints: 0, items: {} };
    const storeFns = {
      getItems: () => ({}),
      setItems: () => {},
      getCoins: () => 50,
      setCoins: () => {},
    };
    const result = applyJourneyRewards(pet, { coins: 10, kadirPoints: 5 }, storeFns);
    assert.strictEqual(result.eggId, undefined); // sem egg
    assert.strictEqual(result.coinsAwarded, 10);
    assert.strictEqual(result.kadirPointsAwarded, 5);
  });

  it('cobre branch sem coins e sem kadirPoints (linhas 30,33)', () => {
    const pet = { petId: '1', kadirPoints: 0, items: {} };
    const storeFns = {
      getItems: () => ({}),
      setItems: () => {},
      getCoins: () => 50,
      setCoins: () => {},
    };
    const result = applyJourneyRewards(pet, { eggId: 'eggAve' }, storeFns);
    assert.strictEqual(result.coinsAwarded, 0);
    assert.strictEqual(result.kadirPointsAwarded, 0);
  });

  it('cobre múltiplos level ups consecutivos (linha 23 threshold loop)', () => {
    const pet = {
      level: 1,
      experience: 0,
      kadirPoints: 0,
      attack: 1,
      defense: 1,
      speed: 1,
      magic: 1,
    };
    const xpUtils = {
      calculateXpGain: () => 350, // suficiente para 3 níveis
      getRequiredXpForNextLevel: () => 100, // sempre 100 para simplificar
      increaseAttributesOnLevelUp: (p) => {
        p.attack += 1;
      },
    };
    const result = applyBattleProgress(pet, { baseXp: 10 }, xpUtils);
    assert.ok(result.levelsGained >= 3);
    assert.ok(result.pet.level >= 4);
    assert.ok(result.kadirGained >= 15); // 3 níveis * 5 pontos
  });
});
