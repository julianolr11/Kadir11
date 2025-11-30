const assert = require('assert');
const { learnMove } = require('../scripts/logic/moveLearning');

describe('learnMove logic', () => {
  function basePet() {
    return { petId: '000001', kadirPoints: 10, moves: [], knownMoves: [] };
  }
  const sampleMove = { name: 'Golpe A', cost: 4, power: 10 };
  it('learns a new move consuming full cost', () => {
    const pet = basePet();
    const { pet: updated, cost, learnedBefore, error } = learnMove(pet, sampleMove);
    assert.ok(!error);
    assert.strictEqual(cost, 4);
    assert.strictEqual(learnedBefore, false);
    assert.strictEqual(updated.kadirPoints, 6);
    assert.ok(updated.moves.some((m) => m.name === 'Golpe A'));
    assert.ok(updated.knownMoves.some((m) => m.name === 'Golpe A'));
  });
  it('re-learns existing move at half cost (ceil)', () => {
    const pet = basePet();
    learnMove(pet, sampleMove); // first time
    pet.kadirPoints = 10; // reset points for second test
    const moveUpdated = { name: 'Golpe A', cost: 5, power: 20 };
    const { pet: updated, cost, learnedBefore } = learnMove(pet, moveUpdated);
    assert.strictEqual(learnedBefore, true);
    assert.strictEqual(cost, Math.ceil(5 / 2));
    assert.strictEqual(updated.kadirPoints, 10 - cost);
    const stored = updated.moves.find((m) => m.name === 'Golpe A');
    assert.strictEqual(stored.power, 20);
  });
  it('returns error on insufficient points', () => {
    const pet = basePet();
    pet.kadirPoints = 1;
    const res = learnMove(pet, sampleMove);
    assert.ok(res.error);
    assert.strictEqual(res.error, 'Pontos Kadir insuficientes!');
    assert.strictEqual(pet.kadirPoints, 1); // unchanged
    assert.strictEqual(pet.moves.length, 0);
  });
  it('replaces first move if list full (>=4)', () => {
    const pet = basePet();
    pet.kadirPoints = 50;
    ['M1', 'M2', 'M3', 'M4'].forEach((n, i) => learnMove(pet, { name: n, cost: 1, power: i }));
    const res = learnMove(pet, { name: 'Novo', cost: 2, power: 99 });
    assert.ok(!res.error);
    assert.strictEqual(pet.moves.length, 4);
    assert.strictEqual(pet.moves[0].name, 'Novo');
  });
});
