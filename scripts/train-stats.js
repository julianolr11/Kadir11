function closeWindow() {
    window.close();
}

function comingSoon() {
    alert('Em breve');
}

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('close-train-stats')?.addEventListener('click', closeWindow);
    document.getElementById('back-train-stats')?.addEventListener('click', () => {
        window.electronAPI.send('open-train-menu');
        closeWindow();
    });
    document.getElementById('train-force-button')?.addEventListener('click', () => {
        window.electronAPI.send('train-force');
        closeWindow();
    });
    document.getElementById('train-defense-button')?.addEventListener('click', comingSoon);
    document.getElementById('train-speed-button')?.addEventListener('click', comingSoon);
    document.getElementById('train-magic-button')?.addEventListener('click', comingSoon);
});
