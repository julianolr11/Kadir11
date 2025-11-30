console.log('journey-mode.js carregado');

// Mapa de níveis mínimos por nome de missão.
// O valor é definido pelo nome do arquivo de imagem em
// Assets/Modes/Journeys sem a extensão.
// Ordem e níveis de cada missão da jornada.
const journeyLevels = {
  forest: 1,
  lake: 4,
  mountain: 7,
  abyss: 10,
};

// Para garantir que a fase "Forest" seja sempre listada primeiro
// e que as demais venham na sequência correta, definimos a ordem
// explicitamente. Caso novas fases sejam adicionadas, basta
// acrescentar seus nomes neste array.
const missionOrder = ['forest', 'lake', 'mountain', 'abyss'];

let petLevel = 1;

function closeWindow() {
  console.log('Botão Fechar clicado na janela de jornada');
  window.close();
}

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('close-journey-mode')?.addEventListener('click', closeWindow);
  document.getElementById('back-journey-mode')?.addEventListener('click', () => {
    window.electronAPI.send('open-battle-mode-window');
    window.close();
  });

  const loading = document.getElementById('loading');
  const grid = document.getElementById('missions-grid');

  window.electronAPI.getJourneyImages().then((files) => {
    // Ordenar as imagens conforme a ordem definida em missionOrder
    const orderMap = missionOrder.reduce((acc, name, index) => {
      acc[name] = index;
      return acc;
    }, {});

    files.sort((a, b) => {
      const baseA = a
        .split(/[\\/]/)
        .pop()
        .replace(/\.[^.]+$/, '')
        .toLowerCase();
      const baseB = b
        .split(/[\\/]/)
        .pop()
        .replace(/\.[^.]+$/, '')
        .toLowerCase();
      const idxA = orderMap[baseA] ?? Number.MAX_SAFE_INTEGER;
      const idxB = orderMap[baseB] ?? Number.MAX_SAFE_INTEGER;
      return idxA - idxB;
    });

    const missions = files.map((img, idx) => {
      const base = img
        .split(/[\\/]/)
        .pop()
        .replace(/\.[^.]+$/, '');
      const formatted = base.replace(/[-_]+/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
      const mapped = journeyLevels[base.toLowerCase()];
      const min = mapped !== undefined ? mapped : idx * 3 + 1;
      const max = min + 2;
      const range = `${min}~${max}`;
      return { name: formatted, range, minLevel: min, maxLevel: max, image: img };
    });

    missions.forEach((mission) => {
      const tile = document.createElement('div');
      tile.className = 'mission-tile';
      const imgPath = mission.image.replace(/\\/g, '/');
      tile.style.backgroundImage = `url('${imgPath}')`;
      tile.dataset.minLevel = mission.minLevel;
      tile.dataset.maxLevel = mission.maxLevel;

      tile.addEventListener('click', () => {
        const min = parseInt(tile.dataset.minLevel, 10);
        if (petLevel < min) return;
        window.electronAPI.send('open-journey-scene-window', { background: imgPath });
      });

      const info = document.createElement('div');
      info.className = 'mission-info';
      info.innerHTML = `<div>${mission.name}</div><div>Nível ${mission.range}</div>`;
      tile.appendChild(info);

      const lock = document.createElement('div');
      lock.className = 'lock-overlay';
      lock.textContent = '🔒';
      tile.appendChild(lock);

      grid.appendChild(tile);
    });

    if (loading) loading.style.display = 'none';

    updateLocks();

    const container = document.getElementById('journey-container');
    const titleBar = document.getElementById('title-bar');
    const totalWidth = container.scrollWidth + 10; // small padding
    const totalHeight = titleBar.offsetHeight + container.scrollHeight + 10;
    window.electronAPI.send('resize-journey-window', { width: totalWidth, height: totalHeight });
  });
});

function updateLocks() {
  document.querySelectorAll('.mission-tile').forEach((tile) => {
    const min = parseInt(tile.dataset.minLevel, 10);
    if (petLevel < min) {
      tile.classList.add('locked');
    } else {
      tile.classList.remove('locked');
    }
  });
}

window.electronAPI.on('pet-data', (event, petData) => {
  if (petData && petData.level) {
    petLevel = petData.level;
    updateLocks();
  }
});
