const assert = require('assert');
const { applyJourneyRewards } = require('../scripts/logic/progression');

describe('progression no rewards branch coverage', () => {
  it('applyJourneyRewards with no egg/coins/kadirPoints leaves pet unchanged', () => {
    const pet = { petId: '1', items: {}, kadirPoints: 5 };
    const storeFns = {
      getItems: () => ({}),
      setItems: (v) => {
        pet.items = v;
      },
      getCoins: () => 0,
      setCoins: () => {},
    };
    const res = applyJourneyRewards(pet, {}, storeFns);
    assert.strictEqual(res.eggId, undefined);
    assert.strictEqual(res.coinsAwarded, 0);
    assert.strictEqual(res.kadirPointsAwarded, 0);
  });
});
