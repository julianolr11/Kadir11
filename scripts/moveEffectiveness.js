export function calculateMovePower(basePower, level, maxHealth) {
  if (!basePower || basePower <= 0) return 0;

  const effectiveLevel = Math.max(level, 1);
  const levelScale = 1 + (effectiveLevel - 1) * 0.05; // 5% increase per level

  let scaled = basePower * levelScale;

  if (typeof maxHealth === 'number' && maxHealth > 0) {
    const min = Math.ceil(maxHealth * 0.05); // at least 5% of max health
    const max = Math.ceil(maxHealth * 0.3); // at most 30% of max health
    scaled = Math.min(Math.max(scaled, min), max);
  }

  return Math.round(scaled);
}

// Cálculo de poder exibido no treino considerando nível, elemento e raridade
export function computeDisplayPower(move, pet) {
  if (!move || !pet) return 0;
  const base = move.power || 0;
  const level = pet.level || 1;
  const maxHealth = pet.maxHealth || 0;

  // Escala por nível (mesma base do cálculo anterior)
  const effectiveLevel = Math.max(level, 1);
  const levelScale = 1 + (effectiveLevel - 1) * 0.04; // 4% por nível

  // Fator por raridade
  const rarity = String(move.rarity || 'Comum');
  const rarityFactors = {
    Comum: 1.0,
    Incomum: 1.12,
    Raro: 1.28,
    MuitoRaro: 1.45,
    Epico: 1.6,
    Lendario: 1.8,
  };
  const rarityScale = rarityFactors[rarity] || 1.0;

  // Fator por elemento (leve diferença para caracter)
  const elements = Array.isArray(move.elements) ? move.elements : [];
  let elementForScale = elements[0] || pet.element || 'puro';
  // Se o elemento do pet está dentre os do golpe, preferir ele
  if (elements.includes(pet.element)) {
    elementForScale = pet.element;
  }
  const elementFactors = {
    fogo: 1.06,
    agua: 1.0,
    terra: 1.08,
    ar: 0.97,
    puro: 1.03,
  };
  const elementScale = elementFactors[String(elementForScale || '').toLowerCase()] || 1.0;

  // Penalidade/bonificação por efeito de status (golpes com status tendem a ter potência menor)
  const effect = String(move.effect || '').toLowerCase();
  const effectFactors = {
    queimado: 0.88,
    envenenamento: 0.9,
    sangramento: 0.9,
    paralisia: 0.85,
    congelamento: 0.85,
    dormencia: 0.82,
    cura: 0.7,
  };
  const effectScale = effectFactors[effect] || 1.0;

  // Multi-elemento ligeiramente mais forte, moves universais de muitas espécies ligeiramente mais fracos
  const multiElementBoost = elements.length > 1 ? 1.04 : 1.0;
  const species = Array.isArray(move.species) ? move.species : [];
  const speciesScopeScale = species.length <= 1 ? 1.05 : species.length >= 6 ? 0.98 : 1.0;

  let scaled = base * levelScale * rarityScale * elementScale * effectScale * multiElementBoost * speciesScopeScale;

  // Apenas limitador superior suave para não estourar valores na UI
  if (typeof maxHealth === 'number' && maxHealth > 0) {
    const max = Math.ceil(maxHealth * 0.4); // teto em 40% da vida
    scaled = Math.min(scaled, max);
  }

  return Math.round(scaled);
}

// Poder usado no cálculo de dano em batalha (sem multiplicador contra elemento inimigo)
export function computeBattlePower(move, pet) {
  if (!move || !pet) return 0;
  const base = move.power || 0;
  const level = pet.level || 1;

  // Escala por nível (mais conservadora que a UI)
  const levelScale = 1 + (Math.max(level, 1) - 1) * 0.03;

  // Raridade influencia de forma moderada
  const rarity = String(move.rarity || 'Comum');
  const rarityFactors = {
    Comum: 1.0,
    Incomum: 1.08,
    Raro: 1.16,
    MuitoRaro: 1.28,
    Epico: 1.38,
    Lendario: 1.5,
  };
  const rarityScale = rarityFactors[rarity] || 1.0;

  // STAB (Same-Type Attack Bonus): se o elemento do pet pertence ao golpe
  const elements = Array.isArray(move.elements) ? move.elements : [];
  const hasSTAB = elements.includes(String(pet.element || '').toLowerCase());
  const stabScale = hasSTAB ? 1.2 : 1.0;

  // Penalidade/bonificação por efeito de status
  const effect = String(move.effect || '').toLowerCase();
  const effectFactors = {
    queimado: 0.9,
    envenenamento: 0.92,
    sangramento: 0.92,
    paralisia: 0.88,
    congelamento: 0.88,
    dormencia: 0.85,
    cura: 0.7,
  };
  const effectScale = effectFactors[effect] || 1.0;

  // Multi-elemento e escopo de espécie
  const multiElementBoost = elements.length > 1 ? 1.03 : 1.0;
  const species = Array.isArray(move.species) ? move.species : [];
  const speciesScopeScale = species.length <= 1 ? 1.05 : species.length >= 6 ? 0.98 : 1.0;

  const scaled = base * levelScale * rarityScale * stabScale * effectScale * multiElementBoost * speciesScopeScale;
  return Math.round(scaled);
}
