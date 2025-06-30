function closeWindow() {
    window.close();
}

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('close-train-force-window')?.addEventListener('click', closeWindow);
    document.getElementById('back-train-force-window')?.addEventListener('click', () => {
        window.electronAPI.send('open-train-attributes-window');
        closeWindow();
    });
});
