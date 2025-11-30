// Pet generation & species loading abstraction - Fase 3 Refactor
const fs = require('fs');
const path = require('path');

let eggSpecieMap = {};
let specieData = {};
let specieImages = {};
let specieBioImages = {};
let loadSpeciesDataFn;

function generateRarity() {
  const roll = Math.floor(Math.random() * 100);
  if (roll < 40) return 'Comum';
  if (roll < 70) return 'Incomum';
  if (roll < 85) return 'Raro';
  if (roll < 95) return 'MuitoRaro';
  if (roll < 99) return 'Epico';
  return 'Lendario';
}

async function initSpecies(baseDir) {
  const constants = await import(path.join(baseDir, 'scripts', 'constants.mjs'));
  eggSpecieMap = constants.eggSpecieMap;
  specieData = constants.specieData;
  specieImages = constants.specieImages;
  specieBioImages = constants.specieBioImages;
  loadSpeciesDataFn = constants.loadSpeciesData;
  await loadSpeciesDataFn(baseDir);
}

function generatePetFromEgg(eggId, rarity) {
  const list = eggSpecieMap[eggId] || ['Ave'];
  const specie = Array.isArray(list) ? list[Math.floor(Math.random() * list.length)] : list;
  const info = specieData[specie] || {};
  const attributes = {
    attack: Math.floor(Math.random() * 5) + 1,
    defense: Math.floor(Math.random() * 5) + 1,
    speed: Math.floor(Math.random() * 5) + 1,
    magic: Math.floor(Math.random() * 5) + 1,
    life: (Math.floor(Math.random() * 5) + 1) * 10
  };

  let statusImage = '';
  let bioImage = '';
  if (info.race) {
    const base = info.element
      ? path.posix.join(info.dir, info.element, info.race)
      : path.posix.join(info.dir, info.race);
    const monsBase = path.join(__dirname, '..', '..', 'Assets', 'Mons');
    const frontGif = path.join(monsBase, base, 'front.gif');
    const raceGif = path.join(monsBase, base, `${info.race}.gif`);
    if (fs.existsSync(frontGif)) {
      statusImage = path.posix.join(base, 'front.gif');
    } else if (fs.existsSync(raceGif)) {
      statusImage = path.posix.join(base, `${info.race}.gif`);
    } else {
      statusImage = path.posix.join(base, `${info.race}.png`);
    }
    bioImage = path.posix.join(base, `${info.race}.png`);
  } else if (info.dir) {
    statusImage = `${info.dir}/${info.dir.toLowerCase()}.png`;
    bioImage = `${info.dir}/${info.dir.toLowerCase()}.png`;
  } else {
    statusImage = 'eggsy.png';
    bioImage = 'eggsy.png';
  }

  return {
    name: 'Eggsy',
    element: info.element || 'puro',
    attributes,
    specie,
    rarity: rarity || generateRarity(),
    level: 1,
    experience: 0,
    createdAt: new Date().toISOString(),
    image: statusImage,
    race: info.race || null,
    bio: '',
    bioImage,
    statusImage,
    hunger: 100,
    happiness: 100,
    currentHealth: attributes.life,
    maxHealth: attributes.life,
    energy: 100,
    kadirPoints: 10
  };
}

function getSpeciesData() {
  return { specieData, specieBioImages, specieImages };
}

module.exports = { initSpecies, generatePetFromEgg, generateRarity, getSpeciesData };
