console.log('journey-scene.js carregado');

document.addEventListener('DOMContentLoaded', () => {
    const bg = document.getElementById('scene-bg');
    const player = document.getElementById('player-pet');
    const enemy = document.getElementById('enemy-pet');
    const playerFront = document.getElementById('player-front');
    const enemyFront = document.getElementById('enemy-front');
    const enemyName = document.getElementById('enemy-name');

    window.electronAPI.on('scene-data', (event, data) => {
        if (data.background && bg) bg.src = data.background;
        if (data.playerPet && player) player.src = `Assets/Mons/${data.playerPet}`;
        if (data.enemyPet && enemy) enemy.src = data.enemyPet;
        if (data.playerPet && playerFront) playerFront.src = `Assets/Mons/${data.playerPet}`;
        if (data.enemyPet && enemyFront) {
            const frontPath = data.enemyPet.replace(/idle\.gif$/i, 'front.gif');
            enemyFront.src = frontPath;
        }
        if (data.enemyName && enemyName) enemyName.textContent = data.enemyName;
    });
});
