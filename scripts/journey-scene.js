console.log('journey-scene.js carregado');

document.addEventListener('DOMContentLoaded', () => {
    const bg = document.getElementById('scene-bg');
    const player = document.getElementById('player-pet');
    const enemy = document.getElementById('enemy-pet');
    const playerFront = document.getElementById('player-front');
    const enemyFront = document.getElementById('enemy-front');

    window.electronAPI.on('scene-data', (event, data) => {
        if (data.background && bg) bg.src = data.background;
        if (data.playerPet && player) player.src = data.playerPet;
        if (data.enemyPet && enemy) enemy.src = data.enemyPet;
        if (data.playerFront && playerFront) playerFront.src = data.playerFront;
        if (data.enemyFront && enemyFront) enemyFront.src = data.enemyFront;
    });
});
