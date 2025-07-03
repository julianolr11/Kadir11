console.log('battle-mode.js carregado com sucesso');

function closeWindow() {
    console.log('Botão Fechar clicado na janela de modo de batalha');
    window.close();
}

document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM carregado na janela de modo de batalha');

    // Adicionar evento ao botão de fechar
    document.getElementById('close-battle-mode')?.addEventListener('click', closeWindow);
    document.getElementById('back-battle-mode')?.addEventListener('click', closeWindow);

    // Adicionar eventos pras divs de modo
    const modeJourney = document.getElementById('mode-journey');
    const modeLair = document.getElementById('mode-lair');
    const modePlaceholder2 = document.getElementById('mode-placeholder2');

    if (modeJourney) {
        modeJourney.addEventListener('click', () => {
            console.log('Modo Jornada selecionado');
            // Abrir a janela do modo jornada
            window.electronAPI.send('open-journey-mode-window');
            window.close();
        });
    }

    if (modeLair) {
        modeLair.addEventListener('click', () => {
            console.log('Modo Covil selecionado');
            window.electronAPI.send('open-lair-mode-window');
            window.close();
        });
    }

    if (modePlaceholder2) {
        modePlaceholder2.addEventListener('click', () => {
            console.log('Modo Placeholder 2 selecionado (futuro)');
            window.close(); // Fecha a janela por enquanto
        });
    }
});