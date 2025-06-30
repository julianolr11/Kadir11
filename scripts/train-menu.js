function closeWindow() {
    window.close();
}

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('close-train-menu')?.addEventListener('click', closeWindow);
    document.getElementById('back-train-menu')?.addEventListener('click', () => {
        window.electronAPI.send('open-status-window');
        closeWindow();
    });
    document.getElementById('train-moves-button')?.addEventListener('click', () => {
        window.electronAPI.send('train-pet');
        closeWindow();
    });
    document.getElementById('train-stats-button')?.addEventListener('click', () => {
        window.electronAPI.send('train-stats');
        closeWindow();
    });
});
