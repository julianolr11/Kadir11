function closeWindow() {
    window.close();
}

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('close-train-force')?.addEventListener('click', closeWindow);
    document.getElementById('back-train-force')?.addEventListener('click', () => {
        window.electronAPI.send('train-stats');
        closeWindow();
    });
});
