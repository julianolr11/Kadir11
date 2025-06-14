console.log('Script do start.js carregado');
console.log('window.electronAPI disponível:', typeof window.electronAPI !== 'undefined');

if (!window.electronAPI) {
    console.error('Erro crítico: window.electronAPI não está disponível. Verifique se o preload.js foi carregado corretamente.');
    alert('Erro: Não foi possível carregar a API do Electron. Verifique o console para mais detalhes.');
}

// Controle da música de fundo
const backgroundMusic = document.getElementById('background-music');
const muteButton = document.getElementById('mute-button');

if (backgroundMusic && muteButton) {
    // Definir volume inicial (0.3 = 30% do volume máximo)
    backgroundMusic.volume = 0.3;
    console.log('Volume inicial da música definido para:', backgroundMusic.volume);

    // Carregar o estado de mute via IPC
    let isMuted = false;
    window.electronAPI.getMuteState().then(state => {
        isMuted = state;
        backgroundMusic.muted = isMuted;
        console.log('Estado inicial de mute carregado via IPC:', isMuted);
        updateMuteButton();
    }).catch(err => {
        console.error('Erro ao carregar o estado de mute via IPC:', err);
        updateMuteButton();
    });

    // Função para atualizar o ícone do botão
    function updateMuteButton() {
        muteButton.textContent = isMuted ? '🔇' : '🔊';
    }

    // Evento de clique no botão de mute
    muteButton.addEventListener('click', () => {
        isMuted = !isMuted;
        backgroundMusic.muted = isMuted;
        // Salvar o estado via IPC
        window.electronAPI.send('set-mute-state', isMuted);
        console.log(`Música ${isMuted ? 'mutada' : 'desmutada'} - Estado enviado via IPC`);
        updateMuteButton();
    });
} else {
    console.error('Elementos de áudio ou botão de mute não encontrados');
}

// Eventos dos botões
document.getElementById('start-button').addEventListener('click', () => {
    console.log('Botão Iniciar clicado');
    if (window.electronAPI) {
        console.log('Enviando open-create-pet-window');
        window.electronAPI.send('open-create-pet-window');
    } else {
        console.error('electronAPI não está disponível para enviar open-create-pet-window');
    }
});

document.getElementById('load-button').addEventListener('click', () => {
    console.log('Botão Carregar clicado');
    if (window.electronAPI) {
        console.log('Enviando open-load-pet-window');
        window.electronAPI.send('open-load-pet-window');
    } else {
        console.error('electronAPI não está disponível para enviar open-load-pet-window');
    }
});

document.getElementById('exit-button').addEventListener('click', () => {
    console.log('Botão Sair clicado');
    if (window.electronAPI) {
        console.log('Enviando exit-app');
        window.electronAPI.send('exit-app');
    } else {
        console.error('electronAPI não está disponível para enviar exit-app');
    }
});

// Verificar se há pets salvos e mostrar o botão "Carregar"
if (window.electronAPI) {
    console.log('Listando pets...');
    window.electronAPI.listPets().then(pets => {
        console.log('Pets recebidos:', pets);
        if (pets.length > 0) {
            document.getElementById('load-button').style.display = 'block';
        }
    }).catch(err => {
        console.error('Erro ao listar pets:', err);
    });
} else {
    console.error('electronAPI não está disponível para listar pets');
}