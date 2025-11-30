console.log('battle-scene.js carregado');

document.addEventListener('DOMContentLoaded', () => {
  const bg = document.getElementById('scene-bg');
  const playerFront = document.getElementById('player-front');
  const enemyFront = document.getElementById('enemy-front');

  window.electronAPI.on('scene-data', (event, data) => {
    if (data.background && bg) bg.src = data.background;
    if (data.playerPet && playerFront) playerFront.src = data.playerPet;
    if (data.enemyPet && enemyFront) enemyFront.src = data.enemyPet;
  });
});
