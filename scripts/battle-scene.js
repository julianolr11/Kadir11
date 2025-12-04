console.log('battle-scene.js carregado');

document.addEventListener('DOMContentLoaded', () => {
  const bg = document.getElementById('scene-bg');
  const playerFront = document.getElementById('player-front');
  const enemyFront = document.getElementById('enemy-front');

  window.electronAPI.on('scene-data', (event, data) => {
    if (data.background && bg) bg.src = data.background;
    if (data.playerPet && playerFront) playerFront.src = data.playerPet;
    if (data.enemyPet && enemyFront) enemyFront.src = data.enemyPet;

    // Ajustar tamanho com base em sizeMeters (3 m = 450 px => 150 px por metro)
    const PX_PER_METER = 150;

    function extractInfoFromPath(imgPath) {
      // Espera formato: Assets/Mons/{dir}/{element}/{race}/front.xxx
      try {
        const parts = imgPath.replace(/\\/g, '/').split('/');
        const idx = parts.findIndex(p => p === 'Assets');
        if (idx >= 0 && parts[idx+1] === 'Mons') {
          const dir = parts[idx+2];
          const element = parts[idx+3];
          const race = parts[idx+4];
          return { dir, element, race };
        }
      } catch {}
      return null;
    }

    async function applySize(el, imgPath) {
      if (!el || !imgPath) return;
      // Se já vier no payload, usa direto
      const explicitMeters = data.sizeMetersMap && typeof data.sizeMetersMap[imgPath] === 'number'
        ? data.sizeMetersMap[imgPath]
        : null;
      if (explicitMeters && explicitMeters > 0) {
        el.style.width = `${Math.round(explicitMeters * PX_PER_METER)}px`;
        return;
      }
      // Caso contrário, tenta derivar pelo species
      const info = extractInfoFromPath(imgPath);
      if (!info) return;
      try {
        const speciesInfo = await window.electronAPI.invoke('get-species-info');
        const map = speciesInfo && speciesInfo.specieData ? speciesInfo.specieData : {};
        // Encontrar espécie que bate com dir/element/race
        const match = Object.values(map).find(s => s.dir === info.dir && s.element === info.element && s.race === info.race);
        const meters = match && typeof match.sizeMeters === 'number' ? match.sizeMeters : null;
        if (meters && meters > 0) {
          el.style.width = `${Math.round(meters * PX_PER_METER)}px`;
        }
      } catch {}
    }

    applySize(playerFront, data.playerPet);
    applySize(enemyFront, data.enemyPet);
  });
});
