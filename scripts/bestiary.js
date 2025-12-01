// Bestiário - Frontend
const specieData = {
  1: { name: 'Draconídeo', race: 'draak', dir: 'Draconideo/puro/draak', element: 'puro', attackType: 'Híbrido', description: 'Senhor ancestral das montanhas, combina força bruta com energia arcana inata.' },
  2: { name: 'Drazraq', race: 'drazraq', dir: 'Draconideo/puro/drazraq', element: 'puro', attackType: 'Físico', description: 'Guerreiro dracônico de reflexos rápidos e investidas cortantes.' },
  3: { name: 'Reptiloide', race: 'viborom', dir: 'Reptiloide/puro/viborom', element: 'puro', attackType: 'Físico', description: 'Predador rastejante que observa silencioso antes de atacar.' },
  4: { name: 'Pidgly', race: 'Pidgly', dir: 'Ave/terra/Pidgly', element: 'terra', attackType: 'Físico', description: 'Ave territorial que defende seu ninho com bicadas certeiras.' },
  5: { name: 'Ignis', race: 'ignis', dir: 'Ave/fogo/ignis', element: 'fogo', attackType: 'Mágico', description: 'Espírito ígneo emplumado; suas chamas nunca se apagam.' },
  6: { name: 'Mawthorn', race: 'Mawthorn', dir: 'Monstro/agua/Mawthorn', element: 'agua', attackType: 'Físico', description: 'Criatura lacustre coberta por placas e espinhos orgânicos.' },
  7: { name: 'Owlberoth', race: 'Owlberoth', dir: 'CriaturaMistica/terra/Owlberoth', element: 'terra', attackType: 'Mágico', description: 'Guardião da clareira; olhos que enxergam através da névoa.' },
  8: { name: 'Digitama', race: 'Digitama', dir: 'CriaturaMistica/fogo/digitama', element: 'fogo', attackType: 'Mágico', description: 'Essência incubada de fogo puro em forma de casulo vivo.' },
  9: { name: 'Kael', race: 'Kael', dir: 'Fera/agua/Kael', element: 'agua', attackType: 'Mágico', description: 'Ser fluido e sereno, domina correntes e névoas profundas.' },
  10: { name: 'Leoracal', race: 'Kael', dir: 'Fera/terra/Leoracal', element: 'terra', attackType: 'Físico', description: 'Felino oracular que ruge antes de qualquer mudança climática.' },
};

const elementIcons = {
  fogo: '🔥',
  agua: '💧',
  terra: '🌍',
  ar: '💨',
  puro: '✨',
};

let bestiaryData = {};

function closeWindow() {
  window.close();
}

function loadBestiary() {
  window.electronAPI.invoke('get-bestiary').then(data => {
    bestiaryData = data || {};
    renderGrid();
    updateProgress();
  });
}

function renderGrid() {
  const grid = document.getElementById('bestiary-grid');
  grid.innerHTML = '';

  for (let i = 1; i <= 10; i++) {
    const creature = specieData[i];
    const status = bestiaryData[creature.name];
    const card = createCreatureCard(i, creature, status);
    grid.appendChild(card);
  }
}

function createCreatureCard(number, creature, status) {
  const card = document.createElement('div');
  card.className = 'creature-card';
  
  const numDiv = document.createElement('div');
  numDiv.className = 'creature-number';
  numDiv.textContent = `#${String(number).padStart(3, '0')}`;
  card.appendChild(numDiv);

  let visualBlock;
  if (!status || !status.status) {
    // Não descoberto
    visualBlock = document.createElement('div');
    visualBlock.className = 'creature-unknown';
    visualBlock.textContent = '?';
    card.appendChild(visualBlock);
  } else {
    // Descoberto (seen ou owned)
    visualBlock = document.createElement('img');
    visualBlock.className = 'creature-image';
    visualBlock.src = `../../Assets/Mons/${creature.dir}/front.gif`;
    visualBlock.onerror = () => {
      visualBlock.src = `../../Assets/Mons/${creature.dir}/front.png`;
      visualBlock.onerror = () => {
        visualBlock.src = `../../Assets/Mons/${creature.dir}/${creature.race}.png`;
      };
    };
    if (status.status === 'seen') {
      visualBlock.classList.add('creature-seen');
    }
    card.appendChild(visualBlock);
  }

  // Nome (placeholder mantém altura)
  const nameDiv = document.createElement('div');
  nameDiv.className = 'creature-name';
  if (status && status.status === 'owned') {
    nameDiv.textContent = creature.name;
  } else {
    nameDiv.textContent = ''; // vazio, mas espaço reservado
  }
  card.appendChild(nameDiv);

  // Tipo (placeholder)
  const typeDiv = document.createElement('div');
  typeDiv.className = 'creature-type';
  if (status && status.status === 'owned') {
    typeDiv.textContent = creature.attackType;
  } else {
    typeDiv.textContent = '';
  }
  card.appendChild(typeDiv);

  card.addEventListener('click', () => openModal(number, creature, status));
  return card;
}

function openModal(number, creature, status) {
  const modal = document.getElementById('creature-modal');
  
  document.getElementById('modal-number').textContent = `#${String(number).padStart(3, '0')}`;
  
  if (!status || !status.status) {
    // Não descoberto
    document.getElementById('modal-name').textContent = '???';
    document.getElementById('modal-image').src = '../../Assets/Icons/question-mark.png';
    document.getElementById('modal-image').onerror = () => {
      document.getElementById('modal-image').style.display = 'none';
    };
    document.getElementById('modal-element').textContent = '???';
    document.getElementById('modal-attack-type').textContent = '???';
    document.getElementById('modal-status').textContent = 'Não descoberto';
    document.getElementById('modal-date').textContent = '---';
    document.getElementById('modal-description').textContent = 'Descubra e capture esta criatura para revelar sua descrição.';
  } else {
    // Descoberto
    document.getElementById('modal-name').textContent = creature.name;
    
    const cardImg = document.getElementById('modal-image');
    cardImg.style.display = 'block';
    cardImg.src = `../../Assets/Mons/${creature.dir}/${creature.race}.png`;
    cardImg.onerror = () => {
      cardImg.src = `../../Assets/Mons/${creature.dir}/front.png`;
    };
    
    const elementIcon = elementIcons[creature.element] || '';
    document.getElementById('modal-element').textContent = `${elementIcon} ${creature.element}`;
    document.getElementById('modal-attack-type').textContent = creature.attackType;
    
    if (status.status === 'owned') {
      document.getElementById('modal-status').textContent = '✅ Capturado';
      document.getElementById('modal-description').textContent = creature.description || 'Sem descrição.';
    } else {
      document.getElementById('modal-status').textContent = '👁️ Visto em batalha';
      document.getElementById('modal-description').textContent = 'Capture para revelar a descrição completa.';
    }
    
    const date = status.firstSeen ? new Date(status.firstSeen).toLocaleDateString('pt-BR') : '---';
    document.getElementById('modal-date').textContent = date;
  }
  
  modal.style.display = 'block';
}

document.addEventListener('DOMContentLoaded', () => {
  loadBestiary();

  document.getElementById('back-button').addEventListener('click', () => {
    window.electronAPI.send('open-start-window');
    closeWindow();
  });

  document.getElementById('close-modal').addEventListener('click', () => {
    document.getElementById('creature-modal').style.display = 'none';
  });

  window.addEventListener('click', (e) => {
    const modal = document.getElementById('creature-modal');
    if (e.target === modal) {
      modal.style.display = 'none';
    }
  });

  window.electronAPI.on('bestiary-updated', () => {
    loadBestiary();
  });
});

function updateProgress() {
  let seen = 0;
  let owned = 0;
  for (let i = 1; i <= 10; i++) {
    const creature = specieData[i];
    const status = bestiaryData[creature.name];
    if (status && status.status) {
      if (status.status === 'owned') {
        owned++;
        seen++; // capturado implica visto
      } else if (status.status === 'seen') {
        seen++;
      }
    }
  }
  const percent = ((owned / 10) * 100).toFixed(0);
  const progressEl = document.getElementById('bestiary-progress');
  if (progressEl) {
    progressEl.textContent = `Progresso: ${seen}/10 vistos | ${owned}/10 capturados (${percent}%)`;
  }
}
