function closeWindow() {
  window.close();
}

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('close-train-menu-window')?.addEventListener('click', closeWindow);
  document.getElementById('back-train-menu-window')?.addEventListener('click', () => {
    window.electronAPI.send('open-status-window');
    closeWindow();
  });
  document.getElementById('train-menu-moves')?.addEventListener('click', () => {
    window.electronAPI.send('train-pet');
    closeWindow();
  });
  document.getElementById('train-menu-attributes')?.addEventListener('click', () => {
    window.electronAPI.send('open-train-attributes-window');
    closeWindow();
  });
});
