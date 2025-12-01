const rarityMultipliers = {
  Comum: 1.0,
  Incomum: 1.05,
  Raro: 1.1,
  MuitoRaro: 1.2,
  Epico: 1.35,
  Lendario: 1.55,
};

function getRequiredXpForNextLevel(level) {
  // Nova curva: crescimento mais suave início e acelera após nível 20
  const lvl = Math.max(level, 1);
  const base = 60; // base inicial menor
  const scaling = 90 * Math.pow(lvl, 1.35); // expo reduzido (1.35) vs 1.5 anterior
  const midBonus = lvl > 20 ? (lvl - 20) * 25 : 0; // aceleração após nível 20
  return Math.round(base + scaling + midBonus);
}

function calculateXpGain(baseXp, rarity) {
  const multiplier = rarityMultipliers[rarity] || 1.0;
  return Math.round(baseXp * multiplier);
}

function increaseAttributesOnLevelUp(pet) {
  const attributes = pet.attributes;
  const oldLife = attributes.life;
  const oldHealthPercentage = pet.currentHealth / pet.maxHealth;

  attributes.life = (attributes.life || 0) + Math.floor(Math.random() * 3) + 1;
  attributes.attack = (attributes.attack || 0) + Math.floor(Math.random() * 3) + 1;
  attributes.defense = (attributes.defense || 0) + Math.floor(Math.random() * 3) + 1;
  attributes.speed = (attributes.speed || 0) + Math.floor(Math.random() * 3) + 1;
  attributes.magic = (attributes.magic || 0) + Math.floor(Math.random() * 3) + 1;

  pet.maxHealth = attributes.life;
  pet.currentHealth = Math.round(oldHealthPercentage * pet.maxHealth);

  console.log('Atributos aumentados:', attributes);
  console.log(
    `Vida ajustada: ${oldHealthPercentage * 100}% de ${oldLife} -> ${pet.currentHealth} de ${pet.maxHealth}`
  );
}

module.exports = {
  getRequiredXpForNextLevel,
  calculateXpGain,
  increaseAttributesOnLevelUp,
};
