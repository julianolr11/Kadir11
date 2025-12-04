// Pet Manager Admin - Frontend Script
console.log('Pet Manager Admin carregado');

let existingSpecies = {};
let existingAffinities = {};
let pendingChanges = { creates: [], updates: [], deletes: [] };

function getPendingCount() {
  return (pendingChanges.creates?.length || 0) + (pendingChanges.updates?.length || 0) + (pendingChanges.deletes?.length || 0);
}

function updatePendingBar() {
  const bar = document.getElementById('pending-bar');
  const countEl = document.getElementById('pending-count');
  const total = getPendingCount();
  if (total > 0) {
    bar.style.display = 'flex';
    countEl.textContent = `${total} alterações pendentes`;
  } else {
    bar.style.display = 'none';
    countEl.textContent = '0 alterações pendentes';
  }
}

function getVirtualSpecies() {
  // Aplica deletes, updates e creates em memória para renderização
  const map = { ...existingSpecies };
  // Remover deletados
  for (const del of pendingChanges.deletes) {
    delete map[del];
  }
  // Aplicar updates (rename + dex opcional)
  for (const upd of pendingChanges.updates) {
    const { oldName, newName, dexNumber } = upd;
    if (map[oldName]) {
      const data = { ...map[oldName] };
      if (Number.isInteger(dexNumber)) data.dexNumber = dexNumber;
      delete map[oldName];
      map[newName] = data;
    } else if (map[newName]) {
      // Caso o virtual já esteja com o nome novo por encadeamento
      if (Number.isInteger(dexNumber)) map[newName] = { ...map[newName], dexNumber };
    }
  }
  // Adicionar creates
  for (const cr of pendingChanges.creates) {
    const { pet } = cr;
    map[pet.name] = { dir: pet.dir, race: pet.race, element: pet.element, attackType: pet.attackType, dexNumber: pet.dexNumber, description: pet.description };
  }
  return map;
}

function refreshDexPlaceholder() {
  const next = getNextDexNumber();
  const dexInput = document.getElementById('pet-dex');
  if (dexInput) dexInput.placeholder = `Auto (próximo: ${next})`;
}

// Listener para atualização de espécies
window.electronAPI.on('species-updated', () => {
  console.log('Espécies atualizadas, recarregando lista...');
  loadExistingData();
});

// Carregar dados existentes
async function loadExistingData() {
  try {
    const speciesInfo = await window.electronAPI.invoke('get-species-info');
    existingSpecies = speciesInfo.specieData || {};
    
    const affinities = await window.electronAPI.invoke('get-species-affinities');
    existingAffinities = affinities || {};
    
    renderExistingPets();
  } catch (err) {
    console.error('Erro ao carregar dados:', err);
  }
}

// Renderizar lista de pets existentes (backend) com badges de alterações pendentes
async function renderExistingPets() {
  const container = document.getElementById('pet-list');
  container.innerHTML = '';
  updatePendingBar();

  // Mostrar pets do backend
  const entries = Object.entries(existingSpecies).map(([name, data]) => ({ name, dir: data.dir, element: data.element, race: data.race }));
  let extMap = {};
  try {
    extMap = await window.electronAPI.invoke('get-front-ext-batch', entries);
  } catch (e) {
    extMap = {};
  }

  // Renderizar pets do backend
  Object.entries(existingSpecies).forEach(([name, data]) => {
    // Verificar se está marcado para exclusão
    const markedForDelete = pendingChanges.deletes.includes(name);
    
    // Verificar se tem update pendente
    const updatePending = pendingChanges.updates.find(u => u.oldName === name);
    
    const card = document.createElement('div');
    card.className = 'pet-card' + (markedForDelete ? ' pending-delete' : '') + (updatePending ? ' pending-edit' : '');
    
    const baseImgPath = `../../Assets/Mons/${data.dir}/${data.element}/${data.race}/`;
    const ext = extMap && extMap[name] ? extMap[name] : null;
    const imgPath = ext ? `${baseImgPath}front.${ext}` : `../../Assets/Mons/eggsy.png`;
    
    let badge = '';
    if (markedForDelete) {
      badge = '<span class="badge badge-delete">🗑️ A EXCLUIR</span>';
    } else if (updatePending) {
      const newName = updatePending.newName;
      const newDex = updatePending.dexNumber;
      let changes = [];
      if (newName !== name) changes.push(`→ ${newName}`);
      if (Number.isInteger(newDex)) changes.push(`#${newDex}`);
      badge = `<span class="badge badge-edit">✏️ ${changes.join(' ')}</span>`;
    }
    
    card.innerHTML = `
      ${badge}
      <img src="${imgPath}" alt="${name}">
      <h4>${name}</h4>
      <p>${data.element} • ${data.attackType}</p>
      <p style="font-size: 0.75em; color: #666;">#${data.dexNumber}</p>
      <div style="display: flex; gap: 5px; margin-top: 10px;">
        <button class="edit-btn" onclick="renamePet('${name}')" ${markedForDelete ? 'disabled' : ''}>✏️ Editar</button>
        <button class="delete-btn" onclick="deletePet('${name}')" ${markedForDelete ? 'disabled' : ''}>🗑️ Excluir</button>
      </div>
    `;
    
    // Fallback único para eggsy caso o arquivo esteja ausente
    const imgEl = card.querySelector('img');
    imgEl.addEventListener('error', () => {
      imgEl.src = `../../Assets/Mons/eggsy.png`;
    }, { once: true });

    container.appendChild(card);
  });
  
  // Adicionar cards de criações pendentes
  for (const create of pendingChanges.creates) {
    const { pet } = create;
    const card = document.createElement('div');
    card.className = 'pet-card pending-create';
    
    const baseImgPath = `../../Assets/Mons/${pet.dir}/${pet.element}/${pet.race}/`;
    let ext = null;
    try {
      const extRes = await window.electronAPI.invoke('get-front-ext-batch', [{ name: pet.name, dir: pet.dir, element: pet.element, race: pet.race }]);
      ext = extRes && extRes[pet.name] ? extRes[pet.name] : null;
    } catch (e) {}
    const imgPath = ext ? `${baseImgPath}front.${ext}` : `../../Assets/Mons/eggsy.png`;
    
    card.innerHTML = `
      <span class="badge badge-create">✨ NOVO</span>
      <img src="${imgPath}" alt="${pet.name}">
      <h4>${pet.name}</h4>
      <p>${pet.element} • ${pet.attackType}</p>
      <p style="font-size: 0.75em; color: #666;">#${pet.dexNumber}</p>
      <div style="display: flex; gap: 5px; margin-top: 10px;">
        <button class="delete-btn" onclick="removeCreate('${pet.name}')">✖ Remover</button>
      </div>
    `;
    
    const imgEl = card.querySelector('img');
    imgEl.addEventListener('error', () => {
      imgEl.src = `../../Assets/Mons/eggsy.png`;
    }, { once: true });
    
    container.appendChild(card);
  }
}

// Renomear espécie
let petToRename = null;

function renamePet(oldName) {
  petToRename = oldName;
  const current = existingSpecies[oldName] || {};
  document.getElementById('rename-old-name').textContent = `Editando: ${oldName}`;
  document.getElementById('rename-input').value = oldName;
  document.getElementById('rename-dex').value = current.dexNumber || '';
    document.getElementById('rename-size').value = (typeof current.sizeMeters === 'number' && current.sizeMeters > 0) ? current.sizeMeters.toString().replace('.', ',') : '';
  document.getElementById('rename-modal').style.display = 'flex';
  document.getElementById('rename-input').focus();
}

function closeRenameModal() {
  document.getElementById('rename-modal').style.display = 'none';
  petToRename = null;
}

async function confirmRename() {
  if (!petToRename) return;
  
  const newName = document.getElementById('rename-input').value.trim();
  const newDex = parseInt(document.getElementById('rename-dex').value, 10);
  const newSize = parseFloat(document.getElementById('rename-size').value);
  if (!newName) {
    alert('O nome não pode estar vazio!');
    return;
  }
  
  if (newName === petToRename && !Number.isInteger(newDex)) {
    // Nenhuma mudança
    closeRenameModal();
    return;
  }

  // Bloquear apenas se newName existir no backend E não for o mesmo pet
  if (newName !== petToRename && existingSpecies[newName]) {
    alert(`Já existe uma espécie com o nome "${newName}" no backend!`);
    return;
  }
  
  // Verificar conflito com creates pendentes
  const createConflict = pendingChanges.creates.find(c => c.pet.name === newName);
  if (createConflict && newName !== petToRename) {
    alert(`Já existe uma criação pendente com o nome "${newName}"!`);
    return;
  }
  
  // Staging: se for um create pendente, atualiza o create; senão, adiciona update
  stageUpdate(petToRename, newName, Number.isInteger(newDex) ? newDex : undefined, Number.isFinite(newSize) ? newSize : undefined);
  let extra = '';
  if (Number.isInteger(newDex)) extra += ` (#${newDex})`;
  if (Number.isFinite(newSize)) extra += ` | ${newSize} m`;
  showValidationStatus('warning', `⏳ Alteração pendente: ${petToRename} → ${newName}${extra}`);
  closeRenameModal();
  await renderExistingPets();
}

// Excluir pet
async function deletePet(petName) {
  console.log('deletePet chamado para:', petName);
  if (!confirm(`Tem certeza que deseja excluir ${petName}?\n\nEsta ação não pode ser desfeita!`)) {
    console.log('Exclusão cancelada pelo usuário');
    return;
  }
  stageDelete(petName);
  showValidationStatus('warning', `⏳ Exclusão pendente: ${petName}`);
  await renderExistingPets();
}

// Validar assets
document.getElementById('validate-btn').addEventListener('click', async () => {
  const dir = document.getElementById('pet-dir').value;
  const element = document.getElementById('pet-element').value;
  const race = document.getElementById('pet-race').value;
  
  if (!dir || !element || !race) {
    showValidationStatus('error', 'Preencha Diretório, Elemento e Raça antes de validar!');
    return;
  }
  
  const basePath = `${dir}/${element}/${race}`;
  
  try {
    const result = await window.electronAPI.invoke('validate-pet-assets', basePath);
    
    if (result.valid) {
      const ext = result.frontExt || 'png';
      showValidationStatus('success', `✓ Assets encontrados! front.${ext} e idle.png existem.`);
      
      // Mostrar preview
      document.getElementById('preview-section').style.display = 'block';
      document.getElementById('preview-front').src = `../../Assets/Mons/${basePath}/front.${ext}?t=${Date.now()}`;
      document.getElementById('preview-idle').src = `../../Assets/Mons/${basePath}/idle.png?t=${Date.now()}`;
      
      document.getElementById('save-btn').disabled = false;
    } else {
      showValidationStatus('error', `✗ Assets não encontrados: ${result.missing.join(', ')}`);
      document.getElementById('preview-section').style.display = 'none';
      document.getElementById('save-btn').disabled = true;
    }
  } catch (err) {
    showValidationStatus('error', 'Erro ao validar assets: ' + err.message);
    document.getElementById('save-btn').disabled = true;
  }
});

// Mostrar status de validação
function showValidationStatus(type, message) {
  const status = document.getElementById('validation-status');
  status.className = `validation-status ${type}`;
  status.textContent = message;
}

// Salvar pet
document.getElementById('pet-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const race = document.getElementById('pet-race').value.trim();
  const sizeRaw = document.getElementById('pet-size').value;
  const sizeVal = typeof sizeRaw === 'string' ? parseFloat(sizeRaw.replace(',', '.')) : parseFloat(sizeRaw);
  const petData = {
    name: race, // Nome da espécie é igual ao nome da raça
    dir: document.getElementById('pet-dir').value,
    race: race,
    element: document.getElementById('pet-element').value,
    attackType: document.getElementById('pet-attack-type').value,
    dexNumber: parseInt(document.getElementById('pet-dex').value) || getNextDexNumber(),
    description: document.getElementById('pet-description').value.trim() || 'Sem descrição.',
    sizeMeters: Number.isFinite(sizeVal) ? sizeVal : null,
  };
  
  const affinityData = {
    attack: parseInt(document.getElementById('affinity-attack').value),
    defense: parseInt(document.getElementById('affinity-defense').value),
    speed: parseInt(document.getElementById('affinity-speed').value),
    magic: parseInt(document.getElementById('affinity-magic').value),
    life: parseInt(document.getElementById('affinity-life').value),
    description: `${petData.attackType} - ${petData.description.substring(0, 50)}`
  };
  
  // Confirmar
  if (!confirm(`Adicionar ${petData.name} (#${petData.dexNumber}) às alterações pendentes?`)) {
    return;
  }
  
  // Staging create
  const virtual = getVirtualSpecies();
  if (virtual[petData.name]) {
    showValidationStatus('error', `Já existe uma espécie com o nome "${petData.name}" (incluindo pendentes).`);
    return;
  }

  pendingChanges.creates.push({ pet: petData, affinity: affinityData });
  showValidationStatus('warning', `⏳ Criação pendente: ${petData.name} (#${petData.dexNumber})`);

  // Limpar form e preview, manter validação exigindo novo validate
  document.getElementById('pet-form').reset();
  document.getElementById('preview-section').style.display = 'none';
  document.getElementById('save-btn').disabled = true;
  refreshDexPlaceholder();
  await renderExistingPets();
});

// Calcular próximo dexNumber
function getNextDexNumber() {
  const numbers = [
    ...Object.values(existingSpecies).map(s => s.dexNumber || 0),
    ...pendingChanges.creates.map(c => c.pet.dexNumber || 0),
  ];
  return numbers.length > 0 ? Math.max(...numbers) + 1 : 1;
}

// Fechar janela
document.getElementById('close-btn').addEventListener('click', () => {
  window.close();
});

// Inicializar
document.addEventListener('DOMContentLoaded', () => {
  loadExistingData();
  
  // Auto-preencher dex number
  refreshDexPlaceholder();
  
  // Botões de aplicar/descartar alterações
  const applyBtn = document.getElementById('apply-changes-btn');
  const discardBtn = document.getElementById('discard-changes-btn');
  if (applyBtn) {
    applyBtn.addEventListener('click', async () => {
      if (getPendingCount() === 0) return;
      applyBtn.disabled = true;
      discardBtn.disabled = true;
      try {
        const payload = JSON.parse(JSON.stringify(pendingChanges));
        const res = await window.electronAPI.invoke('apply-species-changes', payload);
        showValidationStatus('success', `✓ Alterações aplicadas: +${res.applied.creates} / ~${res.applied.updates} / -${res.applied.deletes}`);
        pendingChanges = { creates: [], updates: [], deletes: [] };
        // Tenta recarregar dados; se não refletir, força reload da janela
        await loadExistingData();
        refreshDexPlaceholder();
        setTimeout(() => {
          try {
            // Verificação simples: se ainda houver badge pendente após aplicar, força reload
            const anyBadge = document.querySelector('.badge');
            if (anyBadge) {
              window.location.reload();
            }
          } catch {}
        }, 300);
        setTimeout(() => showValidationStatus('', ''), 3000);
      } catch (err) {
        console.error('Erro ao aplicar alterações:', err);
        showValidationStatus('error', 'Erro ao aplicar alterações: ' + err.message);
      } finally {
        applyBtn.disabled = false;
        discardBtn.disabled = false;
      }
    });
  }
  if (discardBtn) {
    discardBtn.addEventListener('click', () => {
      if (getPendingCount() === 0) return;
      pendingChanges = { creates: [], updates: [], deletes: [] };
      showValidationStatus('warning', 'Alterações pendentes descartadas.');
      renderExistingPets();
      refreshDexPlaceholder();
      setTimeout(() => showValidationStatus('', ''), 2000);
    });
  }
});

// Helpers de staging
function stageDelete(name) {
  // Se for um create pendente, apenas remove o create
  const idxCreate = pendingChanges.creates.findIndex(c => c.pet.name === name);
  if (idxCreate >= 0) {
    pendingChanges.creates.splice(idxCreate, 1);
    return;
  }
  // Se houver update pendente cujo newName seja este, remova-o e delete pelo oldName
  const updIdx = pendingChanges.updates.findIndex(u => u.newName === name);
  if (updIdx >= 0) {
    const old = pendingChanges.updates[updIdx].oldName;
    pendingChanges.updates.splice(updIdx, 1);
    if (!pendingChanges.deletes.includes(old)) pendingChanges.deletes.push(old);
    return;
  }
  // Evitar duplicatas
  if (!pendingChanges.deletes.includes(name)) pendingChanges.deletes.push(name);
}

function stageUpdate(oldName, newName, dexNumber, sizeMeters) {
  // Se for um create pendente, atualiza o create
  const idxCreate = pendingChanges.creates.findIndex(c => c.pet.name === oldName);
  if (idxCreate >= 0) {
    pendingChanges.creates[idxCreate].pet.name = newName;
    if (Number.isInteger(dexNumber)) pendingChanges.creates[idxCreate].pet.dexNumber = dexNumber;
    if (Number.isFinite(sizeMeters)) pendingChanges.creates[idxCreate].pet.sizeMeters = sizeMeters;
    return;
  }
  // Remover delete se existir (update invalida a deleção)
  pendingChanges.deletes = pendingChanges.deletes.filter(d => d !== oldName && d !== newName);
  // Substituir update existente para o mesmo oldName
  pendingChanges.updates = pendingChanges.updates.filter(u => u.oldName !== oldName);
  const upd = { oldName, newName };
  if (Number.isInteger(dexNumber)) upd.dexNumber = dexNumber;
  if (Number.isFinite(sizeMeters)) upd.sizeMeters = sizeMeters;
  pendingChanges.updates.push(upd);
}

function removeCreate(petName) {
  pendingChanges.creates = pendingChanges.creates.filter(c => c.pet.name !== petName);
  showValidationStatus('warning', `Criação de ${petName} removida das pendências.`);
  renderExistingPets();
  setTimeout(() => showValidationStatus('', ''), 2000);
}
