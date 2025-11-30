const assert = require('assert');
const { learnMove } = require('../scripts/logic/moveLearning');
const { applyBattleProgress, applyJourneyRewards } = require('../scripts/logic/progression');

describe('logic extra branches', () => {
  it('learnMove returns error for missing pet', () => {
    const res = learnMove(null, { name: 'Golpe', cost: 1 });
    assert.strictEqual(res.error, 'Pet inexistente');
  });

  it('learnMove returns error for invalid move object', () => {
    const res = learnMove({ kadirPoints: 10 }, null);
    assert.strictEqual(res.error, 'Golpe inválido');
  });

  it('applyBattleProgress returns error for missing pet', () => {
    const res = applyBattleProgress(null, { baseXp: 10 }, {
      calculateXpGain: () => 10,
      getRequiredXpForNextLevel: () => 100,
      increaseAttributesOnLevelUp: () => {}
    });
    assert.strictEqual(res.error, 'Pet não definido');
  });

  it('applyJourneyRewards returns error for missing pet', () => {
    const res = applyJourneyRewards(null, { eggId: 'eggAve', coins: 5, kadirPoints: 3 }, {
      getItems: () => ({}),
      setItems: () => {},
      getCoins: () => 0,
      setCoins: () => {}
    });
    assert.strictEqual(res.error, 'Pet não definido');
  });

  it('learnMove initializes moves/knownMoves when absent', () => {
    const pet = { kadirPoints: 1 };
    const move = { name: 'Novo', cost: 1 };
    const res = learnMove(pet, move);
    assert.ok(res.pet.moves.find(m => m.name === 'Novo'));
    assert.ok(res.pet.knownMoves.find(m => m.name === 'Novo'));
  });
});
