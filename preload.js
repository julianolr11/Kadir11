const { contextBridge, ipcRenderer } = require('electron');
// Evite importar módulos nativos quando o preload for empacotado em um sandbox
// pois alguns ambientes podem não disponibilizar o módulo `fs`. As operações
// de leitura de arquivos serão tratadas no processo principal via IPC.

console.log('preload.js sendo executado');

// Recupera as informações de espécie através do processo principal
async function getSpeciesInfo() {
  return ipcRenderer.invoke('get-species-info');
}

// Expor o electronAPI com os canais IPC
contextBridge.exposeInMainWorld('electronAPI', {
  send: (channel, data) => {
    const validChannels = [
      'exit-app',
      'open-create-pet-window',
      'open-load-pet-window',
      'open-pen-window',
      'close-pen-window',
      'close-create-pet-window',
      'close-load-pet-window',
      'create-pet',
      'select-pet',
      'open-status-window',
      'care-pet',
      'battle-pet',
      'itens-pet',
      'store-pet',
      'buy-item',
      'use-item',
      'unequip-item',
      'train-pet',
      'learn-move',
      'rename-pet',
      'open-battle-mode-window',
      'open-lair-mode-window',
      'open-journey-mode-window',
      'open-journey-scene-window',
      'resize-journey-window',
      'resize-pen-window',
      'resize-lair-window',
      'set-mute-state',
      'set-difficulty',
      'get-journey-images',
      'reward-pet',
      'journey-complete',
      'place-egg-in-nest',
      'hatch-egg',
      'open-hatch-window',
      'close-hatch-window',
      'open-train-menu-window',
      'open-train-attributes-window',
      'open-train-force-window',
      'open-train-defense-window',
      'open-bestiary-window',
      'mark-creature-seen',
      'mark-creature-owned',
      'open-items-window', // adicionado para corrigir erro de canal não permitido
      'open-pet-manager',
      'use-move',
      'use-bravura',
      'update-health',
      'increase-attribute',
      'kadirfull',
      'battle-result',
      'animation-finished', // Novo canal pra sinalizar o fim da animação
      'close-start-window', // Fechar a janela de start
      'open-start-window', // Abrir a janela de start
      'open-tray-window', // Abrir a janela da bandeja
      'open-gift-window', // Abrir a janela de presentes
      'redeem-gift-code', // Resgatar código de presente
      'use-essence-on-pet', // Usar essência para evoluir raridade
      'craft-essence', // Fazer craft de essências
      'open-essence-window', // Abrir janela de inventário de essências
      'close-essence-window', // Fechar janela de inventário de essências
      'open-mini-mode', // Abrir mini-mode
      'close-mini-mode', // Fechar mini-mode
      'mini-state-changed', // Mudança de estado do mini-mode (expanded/collapsed)
      'request-pet-data', // Solicitar dados do pet para mini-mode
      'set-ignore-mouse-events', // Controlar click-through do mini-mode
      'resize-mini-mode', // Redimensionar mini-mode
      'set-mini-mode-layout', // Transformar layout para mini-mode
      'toggle-mini-mode', // Ativar/desativar mini-mode
      'mini-menu-action', // Ação do menu do mini-mode
      'open-mini-menu', // Abrir janela de menu do mini-mode
    ];
    if (validChannels.includes(channel)) {
      console.log(`Enviando canal IPC: ${channel}`, data);
      ipcRenderer.send(channel, data);
    } else {
      console.error(`Canal IPC não permitido: ${channel}`);
    }
  },
  on: (channel, callback) => {
    const validChannels = [
      'pet-data',
      'show-battle-error',
      'show-train-error',
      'show-store-error',
      'create-pet-error',
      'delete-pet-error',
      'pet-created', // Novo canal pra receber a confirmação do pet criado
      'scene-data',
      'fade-out-start-music', // Sinalizar o fade-out da música de start
      'pen-updated',
      'nest-updated',
      'nests-data-updated',
      'bestiary-updated',
      'stat-updated', // Atualização de stat individual para mini-mode
      'activate-status-tab',
      'gift-redeemed', // Presente resgatado com sucesso
      'gift-error', // Erro ao resgatar presente
      'boss-defeated', // Evento de recompensa especial do boss
      'essence-used', // Essência usada em pet
      'essence-crafted', // Essência craftada
      'essence-reward', // Recompensa de essência ao deletar pet
      'craft-essence-error', // Erro ao fazer craft
      'pet-deleted', // Pet deletado (broadcast)
      'species-updated', // Espécies atualizadas (Dev Mode)
      'nest-full-error', // Ninhos cheios ao tentar chocar ovo
      'mini-menu-action', // Ação do menu mini-mode
      'coins-updated', // Moedas atualizadas (SPA FASE 9)
      'inventory-updated', // Inventário atualizado (SPA FASE 9)
      'pets-list-updated', // Lista de pets atualizada (SPA FASE 9)
    ];
    if (validChannels.includes(channel)) {
      console.log(`Registrando listener para o canal: ${channel}`);
      ipcRenderer.on(channel, (event, ...args) => callback(event, ...args));
    } else {
      console.error(`Canal IPC não permitido para on: ${channel}`);
    }
  },
  createPet: (petData) => {
    console.log('Enviando create-pet via createPet:', petData);
    ipcRenderer.send('create-pet', petData);
  },
  hatchEgg: (index) => {
    console.log('Enviando hatch-egg para o index:', index);
    ipcRenderer.send('hatch-egg', index);
  },
  onPetCreated: (callback) => {
    console.log('Registrando listener para pet-created');
    ipcRenderer.on('pet-created', (event, newPet) => callback(newPet));
  },
  animationFinished: () => {
    console.log('Enviando animation-finished');
    ipcRenderer.send('animation-finished');
  },
  listPets: () => {
    console.log('Enviando list-pets');
    return ipcRenderer.invoke('list-pets');
  },
  selectPet: (petId) => {
    console.log('Enviando select-pet:', petId);
    ipcRenderer.send('select-pet', petId);
  },
  deletePet: (petId) => {
    console.log('Enviando delete-pet:', petId);
    return ipcRenderer.invoke('delete-pet', petId);
  },
  closeCreatePetWindow: () => {
    console.log('Enviando close-create-pet-window');
    ipcRenderer.send('close-create-pet-window');
  },
  openStartWindow: () => {
    console.log('Enviando open-start-window');
    ipcRenderer.send('open-start-window');
  },
  getMuteState: () => {
    console.log('Enviando get-mute-state');
    return ipcRenderer.invoke('get-mute-state');
  },
  getJourneyImages: () => {
    console.log('Enviando get-journey-images');
    return ipcRenderer.invoke('get-journey-images');
  },
  getPenInfo: () => {
    console.log('Enviando get-pen-info');
    return ipcRenderer.invoke('get-pen-info');
  },
  getNestCount: () => {
    console.log('Enviando get-nest-count');
    return ipcRenderer.invoke('get-nest-count');
  },
  getNestPrice: () => {
    console.log('Enviando get-nest-price');
    return ipcRenderer.invoke('get-nest-price');
  },
  getNestsData: () => {
    console.log('Enviando get-nests-data');
    return ipcRenderer.invoke('get-nests-data');
  },
  getDifficulty: () => {
    console.log('Enviando get-difficulty');
    return ipcRenderer.invoke('get-difficulty');
  },
  setDifficulty: (value) => {
    console.log('Enviando set-difficulty', value);
    return ipcRenderer.invoke('set-difficulty', value);
  },
  openHatchWindow: () => {
    console.log('Enviando open-hatch-window');
    ipcRenderer.send('open-hatch-window');
  },
  closeHatchWindow: () => {
    console.log('Enviando close-hatch-window');
    ipcRenderer.send('close-hatch-window');
  },
  useItem: (id) => ipcRenderer.invoke('use-item', id),
  getEssenceInventory: () => ipcRenderer.invoke('get-essence-inventory'),
  getValidEssenceForPet: (pet) => ipcRenderer.invoke('get-valid-essence-for-pet', pet),
  invoke: (channel, ...args) => {
    const validChannels = [
      'get-current-pet',
      'use-item',
      'list-pets',
      'delete-pet',
      'get-mute-state',
      'get-journey-images',
      'get-pen-info',
      'get-nest-count',
      'get-nest-price',
      'get-nests-data',
      'get-difficulty',
      'set-difficulty',
      'get-species-info',
      'get-bestiary',
      'get-gift-history',
      'get-essence-inventory',
      'get-valid-essence-for-pet',
      'get-all-pets',
      'use-essence-on-pet',
      'cheat-add-essences',
      'get-species-affinities',
      'validate-pet-assets',
      'save-new-pet',
      'delete-species',
      'rename-species',
      'apply-species-changes',
      'get-front-ext-batch',
      'get-store-data', // SPA FASE 9
      'update-pet', // SPA FASE 9
      'update-coins', // SPA FASE 9
      'create-pet-spa', // SPA FASE 9
      'select-pet-spa', // SPA FASE 9
    ];
    if (validChannels.includes(channel)) {
      console.log(`Invocando canal IPC: ${channel}`, ...args);
      return ipcRenderer.invoke(channel, ...args);
    } else {
      console.error(`Canal IPC não permitido para invoke: ${channel}`);
      return Promise.reject(new Error(`Canal não permitido: ${channel}`));
    }
  },
  getSpeciesInfo,
});
console.log('electronAPI exposto com sucesso');
