function learnMove(pet, move) {
  if (!pet) return { error: 'Pet inexistente' };
  if (!move || typeof move !== 'object') return { error: 'Golpe inválido' };
  if (!pet.moves) pet.moves = [];
  if (!pet.knownMoves) pet.knownMoves = pet.moves.slice();

  const learnedBefore = pet.knownMoves.some(m => m.name === move.name);
  const baseCost = move.cost || 0;
  const cost = learnedBefore ? Math.ceil(baseCost / 2) : baseCost;
  const available = pet.kadirPoints || 0;
  if (available < cost) {
    return { error: 'Pontos Kadir insuficientes!', cost, learnedBefore };
  }
  pet.kadirPoints = available - cost;
  const knownIdx = pet.knownMoves.findIndex(m => m.name === move.name);
  if (knownIdx < 0) {
    pet.knownMoves.push(move);
  } else {
    pet.knownMoves[knownIdx] = move;
  }
  const idx = pet.moves.findIndex(m => m.name === move.name);
  if (idx >= 0) {
    pet.moves[idx] = move;
  } else if (pet.moves.length >= 4) {
    pet.moves[0] = move; // sobrescreve o primeiro se cheio
  } else {
    pet.moves.push(move);
  }
  return { pet, cost, learnedBefore };
}

module.exports = { learnMove };
