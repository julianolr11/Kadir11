// Bestiário - Frontend (dinâmico usando dados do backend)
let bestiaryData = {};
let dynamicSpeciesList = [];

function closeWindow() {
  window.close();
}

function loadBestiary() {
  // Busca status (seen/owned) e dados de espécies do backend
  Promise.all([
    window.electronAPI.invoke('get-bestiary'),
    window.electronAPI.invoke('get-species-info'),
  ]).then(([bData, sInfo]) => {
    bestiaryData = bData || {};
    const specieData = sInfo && sInfo.specieData ? sInfo.specieData : {};
    // Converte em lista e ordena por dexNumber
    dynamicSpeciesList = Object.values(specieData)
      .map(s => ({
        name: s.name || s.race,
        race: s.race,
        dir: `${s.dir}/${s.element}/${s.race}`,
        element: s.element,
        attackType: s.attackType,
        description: s.description,
        dexNumber: s.dexNumber || 0,
      }))
      .sort((a, b) => (a.dexNumber || 0) - (b.dexNumber || 0));
    renderGrid();
    updateProgress();
  }).catch(() => {
    // fallback: limpa grid
    dynamicSpeciesList = [];
    renderGrid();
    updateProgress();
  });
}

function renderGrid() {
  const grid = document.getElementById('bestiary-grid');
  grid.innerHTML = '';
  dynamicSpeciesList.forEach((creature, idx) => {
    const number = creature.dexNumber || (idx + 1);
    const status = bestiaryData[creature.name];
    const card = createCreatureCard(number, creature, status);
    grid.appendChild(card);
  });
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
    // tenta PNG/GIF com fallback para portrait
    const base = `../../Assets/Mons/${creature.dir}/`;
    visualBlock.src = `${base}front.png`;
    visualBlock.onerror = () => {
      visualBlock.src = `${base}front.gif`;
      visualBlock.onerror = () => {
        visualBlock.src = `${base}${creature.race}.png`;
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
    const base = `../../Assets/Mons/${creature.dir}/`;
    cardImg.src = `${base}${creature.race}.png`;
    cardImg.onerror = () => {
      cardImg.src = `${base}front.png`;
      cardImg.onerror = () => {
        cardImg.src = `${base}front.gif`;
      };
    };
    
      // Criar imagem do elemento
      const elementContainer = document.getElementById('modal-element');
      elementContainer.innerHTML = '';
    
      const elementImg = document.createElement('img');
      elementImg.src = `../../Assets/Elements/${creature.element}.png`;
      elementImg.alt = creature.element;
      elementImg.style.width = '20px';
      elementImg.style.height = '20px';
      elementImg.style.marginRight = '8px';
      elementImg.style.verticalAlign = 'middle';
      elementImg.onerror = () => {
        elementImg.src = '../../Assets/Elements/default.png';
      };
    
      const elementText = document.createTextNode(creature.element);
      elementContainer.appendChild(elementImg);
      elementContainer.appendChild(elementText);
    
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
    // Apenas fecha o bestiário, não reabre a tela inicial
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

  // Também atualizar quando espécies forem alteradas no Dev Mode
  window.electronAPI.on('species-updated', () => {
    loadBestiary();
  });
});

function updateProgress() {
  let seen = 0;
  let owned = 0;
  dynamicSpeciesList.forEach((creature) => {
    const status = bestiaryData[creature.name];
    if (status && status.status) {
      if (status.status === 'owned') {
        owned++;
        seen++;
      } else if (status.status === 'seen') {
        seen++;
      }
    }
  });
  const total = dynamicSpeciesList.length || 0;
  const percent = total > 0 ? ((owned / total) * 100).toFixed(0) : '0';
  const progressEl = document.getElementById('bestiary-progress');
  if (progressEl) {
    progressEl.textContent = `Progresso: ${seen}/${total} vistos | ${owned}/${total} capturados (${percent}%)`;
  }
}
