export function getElementMultiplier(attacker, defender) {
  const table = {
    Fogo: { Fogo: 1.0, Água: 0.8, Terra: 1.0, Ar: 1.2, Puro: 0.9 },
    Água: { Fogo: 1.2, Água: 1.0, Terra: 0.8, Ar: 1.0, Puro: 0.9 },
    Terra: { Fogo: 1.0, Água: 1.2, Terra: 1.0, Ar: 0.8, Puro: 0.9 },
    Ar: { Fogo: 0.8, Água: 1.0, Terra: 1.2, Ar: 1.0, Puro: 0.9 },
    Puro: { Fogo: 1.0, Água: 1.0, Terra: 1.0, Ar: 1.0, Puro: 1.2 },
  };

  const canonical = {
    fogo: 'Fogo',
    agua: 'Água',
    terra: 'Terra',
    ar: 'Ar',
    puro: 'Puro',
  };

  const normalize = (str) =>
    str
      ? str
          .toLowerCase()
          .normalize('NFD')
          .replace(/\p{Diacritic}/gu, '')
      : '';

  const att = canonical[normalize(attacker)] || attacker;
  const def = canonical[normalize(defender)] || defender;

  // Caso o atacante ou defensor não sejam válidos, retorna 1.0 (neutro)
  if (!table[att] || table[att][def] === undefined) {
    return 1.0;
  }
  return table[att][def];
}
