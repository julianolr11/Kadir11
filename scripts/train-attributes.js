function closeWindow() {
    window.close();
}

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('close-attributes-window')?.addEventListener('click', closeWindow);
    document.getElementById('back-attributes-window')?.addEventListener('click', () => {
        window.electronAPI.send('open-train-menu-window');
        closeWindow();
    });
    document.getElementById('train-force-button')?.addEventListener('click', () => {
        window.electronAPI.send('open-train-force-window');
        closeWindow();
    });
    document.getElementById('train-defense-button')?.addEventListener('click', () => {
        window.electronAPI.send('open-train-defense-window');
        closeWindow();
    });
});
