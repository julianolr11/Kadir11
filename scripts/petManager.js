const fs = require('fs').promises;
const fsSync = require('fs');
const path = require('path');
const { app } = require('electron');
const Store = require('electron-store');
const store = new Store();

// Diretório onde os arquivos de pets serão armazenados
const petsDir = path.join(app.getPath('userData'), 'pets');
let petCounter = 0;

// Função para garantir que o diretório de pets exista
async function ensurePetsDir() {
  try {
    await fs.mkdir(petsDir, { recursive: true });
  } catch (err) {
    console.error('Erro ao criar diretório de pets:', err);
    throw err;
  }
}

// Função para carregar o contador de pets
async function loadPetCounter() {
  const counterFile = path.join(petsDir, 'counter.json');
  try {
    const data = await fs.readFile(counterFile, 'utf8');
    petCounter = parseInt(data, 10) || 0;
  } catch (err) {
    if (err.code !== 'ENOENT') {
      console.error('Erro ao carregar contador de pets:', err);
      throw err;
    }
    petCounter = 0;
  }
}

// Função para salvar o contador de pets
async function savePetCounter() {
  const counterFile = path.join(petsDir, 'counter.json');
  try {
    await fs.writeFile(counterFile, petCounter.toString(), 'utf8');
  } catch (err) {
    console.error('Erro ao salvar contador de pets:', err);
    throw err;
  }
}

function ensureStatusImage(pet) {
  const basePath = pet.statusImage || pet.image;
  const relativeDir = basePath ? path.posix.dirname(basePath) : null;

  if (relativeDir && relativeDir !== '.') {
    const baseDir = path.join(__dirname, '..', 'Assets', 'Mons', relativeDir);
    const candidates = ['front.gif', 'front.png', 'idle.gif', 'idle.png'];
    for (const file of candidates) {
      const full = path.join(baseDir, file);
      if (fsSync.existsSync(full)) {
        pet.statusImage = path.posix.join(relativeDir, file);
        break;
      }
    }
  }

  if (!pet.statusImage && pet.image) {
    pet.statusImage = pet.image;
  }

  if (pet.statusImage) {
    pet.image = pet.statusImage;
  }

  if (!pet.bioImage) {
    // Usa portrait se existir; fallback para eggsy
    const portraitPath = relativeDir
      ? path.join(__dirname, '..', 'Assets', 'Mons', relativeDir, `${pet.name}.png`)
      : null;
    pet.bioImage = fsSync.existsSync(portraitPath) ? `${pet.name}.png` : 'eggsy.png';
  }
}

// Função para criar um novo pet
async function createPet(petData) {
  await ensurePetsDir();
  await loadPetCounter();

  // Verificar limite máximo de pets baseado no tamanho do cercado
  const files = await fs.readdir(petsDir);
  const petFiles = files.filter((file) => file.startsWith('pet_') && file.endsWith('.json'));
  const size = store.get('penSize', 'small');
  const limits = { small: 3, medium: 6, large: 10 };
  const maxPets = limits[size] || 3;
  if (petFiles.length >= maxPets) {
    throw new Error(`Limite de ${maxPets} pets atingido`);
  }

  petCounter++;
  const petId = petCounter.toString().padStart(6, '0');
  const petFileName = `pet_${petId}.json`;
  const petFilePath = path.join(petsDir, petFileName);

  const newPet = {
    petId,
    name: petData.name,
    element: petData.element,
    attributes: petData.attributes,
    specie: petData.specie,
    rarity: petData.rarity,
    level: petData.level || 1,
    experience: petData.experience || 0,
    createdAt: petData.createdAt || new Date().toISOString(),
    lastAccessed: new Date().toISOString(),
    fileName: petFileName,
    hunger: petData.hunger || 100,
    happiness: petData.happiness || 100,
    energy: petData.energy || 100,
    kadirPoints: petData.kadirPoints || 10,
    bravura: petData.bravura || 10,
    winStreak: 0,
    lossStreak: 0,
    currentHealth: petData.currentHealth || petData.attributes?.life || 100,
    maxHealth: petData.maxHealth || petData.attributes?.life || 100,
    moves: [],
    knownMoves: [],
    image: petData.image, // A propriedade image será salva aqui
    race: petData.race || null,
    bio: petData.bio || '',
    bioImage: petData.bioImage || null,
    statusImage: petData.statusImage || null,
    items: {},
    statusEffects: [],
    equippedItem: null,
  };

  ensureStatusImage(newPet);

  try {
    await fs.writeFile(petFilePath, JSON.stringify(newPet, null, 2), 'utf8');
    await savePetCounter();
    return newPet;
  } catch (err) {
    console.error('Erro ao criar pet:', err);
    throw err;
  }
}

// Função para listar todos os pets
async function listPets() {
  await ensurePetsDir();
  try {
    const files = await fs.readdir(petsDir);
    const petFiles = files.filter((file) => file.startsWith('pet_') && file.endsWith('.json'));

    const pets = await Promise.all(
      petFiles.map(async (file) => {
        const filePath = path.join(petsDir, file);
        try {
          const data = await fs.readFile(filePath, 'utf8');
          const pet = JSON.parse(data);
          if (pet.kadirPoints === undefined) {
            pet.kadirPoints = 10;
          }
          if (pet.bravura === undefined) {
            pet.bravura = 10;
          }
          if (pet.items === undefined) {
            pet.items = {};
          }
          if (pet.statusEffects === undefined) {
            pet.statusEffects = [];
          }
          if (pet.equippedItem === undefined) {
            pet.equippedItem = null;
          }
          if (pet.winStreak === undefined) {
            pet.winStreak = 0;
          }
          if (pet.lossStreak === undefined) {
            pet.lossStreak = 0;
          }
          pet.fileName = file; // Garantir que o fileName esteja atualizado
          ensureStatusImage(pet);
          if (!pet.knownMoves) {
            pet.knownMoves = pet.moves ? [...pet.moves] : [];
          }
          return pet;
        } catch (err) {
          console.error(`Erro ao ler pet do arquivo ${file}:`, err);
          return null;
        }
      })
    );

    return pets.filter((pet) => pet !== null);
  } catch (err) {
    console.error('Erro ao listar pets:', err);
    throw err;
  }
}

// Função para carregar um pet específico
async function loadPet(petId) {
  const petFileName = `pet_${petId}.json`;
  const petFilePath = path.join(petsDir, petFileName);

  try {
    const data = await fs.readFile(petFilePath, 'utf8');
    const pet = JSON.parse(data);
    if (pet.kadirPoints === undefined) {
      pet.kadirPoints = 10;
    }
    if (pet.bravura === undefined) {
      pet.bravura = 10;
    }
    if (pet.items === undefined) {
      pet.items = {};
    }
    if (pet.statusEffects === undefined) {
      pet.statusEffects = [];
    }
    if (pet.equippedItem === undefined) {
      pet.equippedItem = null;
    }
    if (pet.winStreak === undefined) {
      pet.winStreak = 0;
    }
    if (pet.lossStreak === undefined) {
      pet.lossStreak = 0;
    }
    ensureStatusImage(pet);
    if (!pet.knownMoves) {
      pet.knownMoves = pet.moves ? [...pet.moves] : [];
    }
    pet.lastAccessed = new Date().toISOString();
    pet.fileName = petFileName; // Garantir que o fileName esteja atualizado
    await fs.writeFile(petFilePath, JSON.stringify(pet, null, 2), 'utf8');
    return pet;
  } catch (err) {
    console.error(`Erro ao carregar pet ${petId}:`, err);
    throw err;
  }
}

const locks = {};

async function withLock(petId, fn) {
  if (!locks[petId]) {
    locks[petId] = Promise.resolve();
  }
  const currentLock = locks[petId];
  const nextLock = currentLock.then(() => fn());
  locks[petId] = nextLock.catch(() => {});
  return nextLock;
}

// Função para atualizar um pet
async function updatePet(petId, updates) {
  return withLock(petId, async () => {
    const petFileName = `pet_${petId}.json`;
    const petFilePath = path.join(petsDir, petFileName);

    try {
      const data = await fs.readFile(petFilePath, 'utf8');
      const pet = JSON.parse(data);
      const updatedPet = { ...pet, ...updates, fileName: petFileName };
      await fs.writeFile(petFilePath, JSON.stringify(updatedPet, null, 2), 'utf8');
      return updatedPet;
    } catch (err) {
      console.error(`Erro ao atualizar pet ${petId}:`, err);
      throw err;
    }
  });
}

// Função para deletar um pet
async function deletePet(petId) {
  const petFileName = `pet_${petId}.json`;
  const petFilePath = path.join(petsDir, petFileName);

  try {
    await fs.unlink(petFilePath);
    return { success: true };
  } catch (err) {
    console.error(`Erro ao deletar pet ${petId}:`, err);
    throw new Error(err.message);
  }
}

// Função opcional para limpar arquivos de pets órfãos ou corrompidos
async function cleanupOrphanPets() {
  await ensurePetsDir();
  const validPets = await listPets();
  const validFiles = new Set(validPets.map((p) => p.fileName));
  const files = await fs.readdir(petsDir);
  const petFiles = files.filter((f) => f.startsWith('pet_') && f.endsWith('.json'));
  const removals = [];
  for (const file of petFiles) {
    if (!validFiles.has(file)) {
      try {
        await fs.unlink(path.join(petsDir, file));
        removals.push(file);
      } catch (err) {
        console.error(`Erro ao remover arquivo órfão ${file}:`, err);
      }
    }
  }
  return removals;
}

async function addItem(petId, itemId, amount = 1) {
  return withLock(petId, async () => {
    const petFileName = `pet_${petId}.json`;
    const petFilePath = path.join(petsDir, petFileName);
    try {
      const data = await fs.readFile(petFilePath, 'utf8');
      const pet = JSON.parse(data);
      if (!pet.items) pet.items = {};
      pet.items[itemId] = (pet.items[itemId] || 0) + amount;
      await fs.writeFile(petFilePath, JSON.stringify(pet, null, 2), 'utf8');
      return pet;
    } catch (err) {
      console.error(`Erro ao adicionar item ao pet ${petId}:`, err);
      throw err;
    }
  });
}

async function getPet(petId) {
  return loadPet(petId);
}

module.exports = {
  createPet,
  listPets,
  loadPet,
  getPet,
  updatePet,
  deletePet,
  cleanupOrphanPets,
  addItem,
};
