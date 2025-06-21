const fs = require('fs').promises;
const fsSync = require('fs');
const path = require('path');

const petsDir = path.join(__dirname, '..', 'pets');
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
        if (!pet.statusImage) {
            const baseDir = path.join(__dirname, '..', 'Assets', 'Mons', relativeDir);
            const gifPath = path.join(baseDir, 'front.gif');
            const pngPath = path.join(baseDir, 'front.png');

            if (fsSync.existsSync(gifPath)) {
                pet.statusImage = path.posix.join(relativeDir, 'front.gif');
            } else if (fsSync.existsSync(pngPath)) {
                pet.statusImage = path.posix.join(relativeDir, 'front.png');
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
        pet.bioImage = `${pet.name}.png`;
    }
}

// Função para criar um novo pet
async function createPet(petData) {
    await ensurePetsDir();
    await loadPetCounter();

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
        coins: petData.coins || 20,
        kadirPoints: petData.kadirPoints || 5,
        currentHealth: petData.currentHealth || (petData.attributes?.life || 100),
        maxHealth: petData.maxHealth || (petData.attributes?.life || 100),
        moves: [],
        knownMoves: [],
        image: petData.image, // A propriedade image será salva aqui
        race: petData.race || null,
        bio: petData.bio || '',
        bioImage: petData.bioImage || null,
        statusImage: petData.statusImage || null,
        items: {},
        statusEffects: []
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
        const petFiles = files.filter(file => file.startsWith('pet_') && file.endsWith('.json'));

        const pets = await Promise.all(
            petFiles.map(async file => {
                const filePath = path.join(petsDir, file);
                try {
                    const data = await fs.readFile(filePath, 'utf8');
                    const pet = JSON.parse(data);
                    if (pet.kadirPoints === undefined) {
                        pet.kadirPoints = 5;
                    }
                    if (pet.coins === undefined) {
                        pet.coins = 20;
                    }
                    if (pet.items === undefined) {
                        pet.items = {};
                    }
                    if (pet.statusEffects === undefined) {
                        pet.statusEffects = [];
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

        return pets.filter(pet => pet !== null);
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
            pet.kadirPoints = 5;
        }
        if (pet.coins === undefined) {
            pet.coins = 20;
        }
        if (pet.items === undefined) {
            pet.items = {};
        }
        if (pet.statusEffects === undefined) {
            pet.statusEffects = [];
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

// Função para atualizar um pet
async function updatePet(petId, updates) {
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
        throw err;
    }
}

module.exports = {
    createPet,
    listPets,
    loadPet,
    updatePet,
    deletePet,
};