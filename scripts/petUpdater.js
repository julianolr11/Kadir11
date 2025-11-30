const { BrowserWindow } = require('electron');
const petManager = require('./petManager');

let lastRecovery = Date.now();
let lastHungerUpdate = Date.now();
let lastHappinessUpdate = Date.now();
let lastKadirUpdate = Date.now();

function resetTimers() {
  lastRecovery = Date.now();
  lastHungerUpdate = Date.now();
  lastHungerUpdate = Date.now();
  lastHappinessUpdate = Date.now();
  lastKadirUpdate = Date.now();
}

function startPetUpdater(getCurrentPet) {
  setInterval(async () => {
    const currentPet = getCurrentPet();
    console.log('setInterval rodando, currentPet:', currentPet ? 'definido' : 'null');
    if (currentPet) {
      const now = Date.now();

      const elapsedHungerSeconds = Math.floor((now - lastHungerUpdate) / 1000);
      const elapsedHappinessSeconds = Math.floor((now - lastHappinessUpdate) / 1000);
      const elapsedRecoverySeconds = Math.floor((now - lastRecovery) / 1000);

      console.log(
        'Tempo decorrido (segundos) - Hunger:',
        elapsedHungerSeconds,
        'Happiness:',
        elapsedHappinessSeconds
      );
      console.log('Valores antes do decaimento:', {
        hunger: currentPet.hunger,
        happiness: currentPet.happiness,
      });

      const hungerDecay = Math.floor(elapsedHungerSeconds / 180);
      const happinessDecay = Math.floor(elapsedHappinessSeconds / 300);
      console.log('Decaimento calculado:', { hungerDecay, happinessDecay });

      let decayApplied = false;

      if (hungerDecay > 0 || happinessDecay > 0) {
        const oldHunger = currentPet.hunger;
        const oldHappiness = currentPet.happiness;
        currentPet.hunger = Math.max(currentPet.hunger - hungerDecay, 0);
        currentPet.happiness = Math.max(currentPet.happiness - happinessDecay, 0);
        console.log(
          `Decaimento aplicado: Fome ${oldHunger} -> ${currentPet.hunger}, Felicidade ${oldHappiness} -> ${currentPet.happiness}`
        );

        if (hungerDecay > 0) {
          console.log('Fome decaiu! Novo valor:', currentPet.hunger);
        }

        try {
          await petManager.updatePet(currentPet.petId, {
            hunger: currentPet.hunger,
            happiness: currentPet.happiness,
            currentHealth: currentPet.currentHealth,
            energy: currentPet.energy,
            level: currentPet.level,
            experience: currentPet.experience,
            attributes: currentPet.attributes,
            maxHealth: currentPet.maxHealth,
          });
          console.log('Pet atualizado no banco de dados com sucesso');
          decayApplied = true;
        } catch (err) {
          console.error('Erro ao atualizar pet:', err);
        }

        if (hungerDecay > 0) lastHungerUpdate = now;
        if (happinessDecay > 0) lastHappinessUpdate = now;
      } else {
        console.log('Nenhum decaimento aplicado (hungerDecay e happinessDecay são 0)');
      }

      if (
        elapsedRecoverySeconds >= 90 &&
        (currentPet.currentHealth < currentPet.maxHealth || currentPet.energy < 100)
      ) {
        const oldHealth = currentPet.currentHealth;
        const oldEnergy = currentPet.energy;
        currentPet.currentHealth = Math.min(currentPet.currentHealth + 1, currentPet.maxHealth);
        currentPet.energy = Math.min(currentPet.energy + 1, 100);
        console.log(
          `Recuperação aplicada: Vida ${oldHealth} -> ${currentPet.currentHealth}, Energia ${oldEnergy} -> ${currentPet.energy}`
        );

        try {
          await petManager.updatePet(currentPet.petId, {
            currentHealth: currentPet.currentHealth,
            energy: currentPet.energy,
            level: currentPet.level,
            experience: currentPet.experience,
            attributes: currentPet.attributes,
            maxHealth: currentPet.maxHealth,
          });
        } catch (err) {
          console.error('Erro ao atualizar pet na recuperação:', err);
        }

        lastRecovery = now;

        BrowserWindow.getAllWindows().forEach((window) => {
          if (window.webContents) {
            window.webContents.send('pet-data', currentPet);
          }
        });
      }

      const elapsedKadirSeconds = Math.floor((now - lastKadirUpdate) / 1000);
      if (currentPet.happiness >= 80 && elapsedKadirSeconds >= 600) {
        // 10 minutos
        currentPet.kadirPoints = (currentPet.kadirPoints || 0) + 1;
        console.log(`Ganho de Kadir Point por felicidade! Total: ${currentPet.kadirPoints}`);

        try {
          await petManager.updatePet(currentPet.petId, {
            kadirPoints: currentPet.kadirPoints,
          });
        } catch (err) {
          console.error('Erro ao atualizar Kadir Points:', err);
        }

        lastKadirUpdate = now;

        BrowserWindow.getAllWindows().forEach((window) => {
          if (window.webContents) {
            window.webContents.send('pet-data', currentPet);
          }
        });
      }

      if (decayApplied) {
        BrowserWindow.getAllWindows().forEach((window) => {
          if (window.webContents) {
            window.webContents.send('pet-data', currentPet);
          }
        });
      }
    } else {
      console.log('Nenhum pet selecionado (currentPet é null)');
    }
  }, 1000);
}

module.exports = { startPetUpdater, resetTimers };
