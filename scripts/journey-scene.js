console.log('journey-scene.js carregado');

document.addEventListener('DOMContentLoaded', () => {
    const bg = document.getElementById('scene-bg');
    const player = document.getElementById('player-pet');
    const enemy = document.getElementById('enemy-pet');
    const playerHudImg = document.getElementById('player-hud-img');
    const enemyHudImg = document.getElementById('enemy-hud-img');

    const playerHealthFill = document.getElementById('player-health-fill');
    const playerEnergyFill = document.getElementById('player-energy-fill');
    const enemyHealthFill = document.getElementById('enemy-health-fill');
    const enemyEnergyFill = document.getElementById('enemy-energy-fill');
    window.electronAPI.on('scene-data', (event, data) => {
        if (data.background && bg) bg.src = data.background;
        if (data.playerPet && player) player.src = data.playerPet;
        if (data.enemyPet && enemy) enemy.src = data.enemyPet;

        if (data.playerFront && playerHudImg) playerHudImg.src = data.playerFront;
        if (data.enemyFront && enemyHudImg) enemyHudImg.src = data.enemyFront;

        if (playerHealthFill) playerHealthFill.style.width = '100%';
        if (playerEnergyFill) playerEnergyFill.style.width = '100%';
        if (enemyHealthFill) enemyHealthFill.style.width = '100%';
        if (enemyEnergyFill) enemyEnergyFill.style.width = '100%';
    });
});
