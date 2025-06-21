const { contextBridge, ipcRenderer } = require('electron');

console.log('preload.js sendo executado');

// Expor o electronAPI com os canais IPC
contextBridge.exposeInMainWorld('electronAPI', {
    send: (channel, data) => {
        const validChannels = [
            'exit-app',
            'open-create-pet-window',
            'open-load-pet-window',
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
            'train-pet',
            'learn-move',
            'rename-pet',
            'open-battle-mode-window',
            'open-journey-mode-window',
            'open-journey-scene-window',
            'resize-journey-window',
            'set-mute-state',
            'get-journey-images',
            'reward-pet',
            'use-move',
            'battle-result',
            'animation-finished', // Novo canal pra sinalizar o fim da animação
            'close-start-window', // Fechar a janela de start
            'open-options-window',
            'set-view-mode',
            'get-view-mode',
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
            'pet-created', // Novo canal pra receber a confirmação do pet criado
            'scene-data',
            'fade-out-start-music', // Sinalizar o fade-out da música de start
            'navigate-to'
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
    getMuteState: () => {
        console.log('Enviando get-mute-state');
        return ipcRenderer.invoke('get-mute-state');
    },
    getJourneyImages: () => {
        console.log('Enviando get-journey-images');
        return ipcRenderer.invoke('get-journey-images');
    },
    openOptionsWindow: () => { ipcRenderer.send('open-options-window'); },
    setViewMode: (mode) => { ipcRenderer.invoke('set-view-mode', mode); },
    getViewMode: () => ipcRenderer.invoke('get-view-mode'),
    getCurrentPet: () => ipcRenderer.invoke('get-current-pet')
});

console.log('electronAPI exposto com sucesso');