const nestsContainer = document.getElementById('nests-container');
const eggIcons = {
    eggAve: '../../Assets/tileset/ave_egg.png',
    eggCriaturaMistica: '../../Assets/tileset/criaturamistica_egg.png',
    eggCriaturaSombria: '../../Assets/tileset/criaturasombria_egg.png',
    eggDraconideo: '../../Assets/tileset/draconideo_egg.png',
    eggFera: '../../Assets/tileset/fera_egg.png',
    eggMonstro: '../../Assets/tileset/monster_egg.png',
    eggReptiloide: '../../Assets/tileset/reptiloide_egg.png'
};

const eggIds = Object.keys(eggIcons);

let nestsData = [];
let pet = null;
let cheatBuffer = '';
const hatchOverlay = document.getElementById('hatch-overlay');
const hatchVideo = document.getElementById('hatch-video');
const hatchVideoGif = document.getElementById('hatch-video-gif');
const hatchName = document.getElementById('hatch-name');
const hatchGif = document.getElementById('hatch-gif');
const hatchInput = document.getElementById('hatch-name-input');
const hatchOk = document.getElementById('hatch-ok');
let hatchedPet = null;
const HATCH_DURATIONS = {
    Comum: 20 * 60 * 1000,
    Incomum: 35 * 60 * 1000,
    Raro: 50 * 60 * 1000,
    MuitoRaro: 80 * 60 * 1000,
    Epico: 120 * 60 * 1000,
    Lendario: 180 * 60 * 1000
};

function getHatchDuration(rarity) {
    return HATCH_DURATIONS[rarity] || HATCH_DURATIONS.Comum;
}

let itemsInfo = {};
const eggSelectOverlay = document.getElementById('egg-select-overlay');
const eggListEl = document.getElementById('egg-list');
const eggSelectCancel = document.getElementById('egg-select-cancel');

function createHatchButton(index) {
    const btn = document.createElement('button');
    btn.className = 'button small-button hatch-button';
    btn.textContent = 'Chocar';
    btn.addEventListener('click', () => {
        window.electronAPI.send('open-hatch-window');
        window.electronAPI.hatchEgg(index);
    });
    return btn;
}
let progressInterval = null;

function showHatchAnimation(newPet) {
    if (!hatchOverlay || !hatchVideo || !hatchVideoGif || !hatchName || !hatchGif || !hatchInput) return;
    hatchedPet = newPet;
    hatchGif.src = newPet.statusImage ? `../../Assets/Mons/${newPet.statusImage}` : (newPet.image ? `../../Assets/Mons/${newPet.image}` : '../../Assets/Mons/eggsy.png');
    hatchInput.value = '';
    hatchName.style.display = 'none';
    hatchOverlay.style.display = 'flex';
    hatchVideo.style.display = 'block';
    hatchVideo.style.opacity = '1';
    hatchVideoGif.style.display = 'none';
    hatchVideoGif.style.opacity = '1';
    hatchGif.style.opacity = '0';
    hatchGif.style.transform = 'scale(0.5)';
    hatchVideo.currentTime = 0;
    const playPromise = hatchVideo.play();
    if (playPromise !== undefined) {
        playPromise.catch(() => {
            hatchVideo.style.display = 'none';
            hatchVideoGif.style.display = 'block';
        });
    }
    hatchVideo.onerror = () => {
        hatchVideo.style.display = 'none';
        hatchVideoGif.style.display = 'block';
    };
    const showPet = () => {
        hatchVideo.removeEventListener('ended', showPet);
        hatchVideo.style.opacity = '0';
        hatchVideoGif.style.opacity = '0';
        setTimeout(() => {
            hatchVideo.style.display = 'none';
            hatchVideoGif.style.display = 'none';
            hatchName.style.display = 'flex';
            hatchGif.style.opacity = '1';
            hatchGif.style.transform = 'scale(1)';
            setTimeout(() => {
                hatchGif.style.transition = 'transform 0.2s ease';
                hatchGif.style.transform = 'scale(1) translateY(-20px)';
                setTimeout(() => {
                    hatchGif.style.transform = 'scale(1) translateY(0)';
                }, 200);
            }, 500);
            hatchInput.focus();
        }, 500);
    };
    hatchVideo.addEventListener('ended', showPet);
    setTimeout(showPet, 7000); // fallback
}

function hasEggInInventory() {
    if (!pet || !pet.items) return false;
    return Object.keys(pet.items).some(id => id.startsWith('egg') && pet.items[id] > 0);
}

async function loadItemsInfo() {
    try {
        const resp = await fetch('../../data/items.json');
        const data = await resp.json();
        itemsInfo = {};
        data.forEach(it => { itemsInfo[it.id] = it; });
    } catch (err) {
        console.error('Erro ao carregar itens:', err);
    }
}

function showEggSelect() {
    if (!pet || !eggSelectOverlay || !eggListEl) return;
    eggListEl.innerHTML = '';
    const items = pet.items || {};
    Object.keys(items).forEach(id => {
        if (!id.startsWith('egg')) return;
        const qty = items[id];
        if (qty <= 0) return;
        const info = itemsInfo[id] || {};
        const div = document.createElement('div');
        div.className = 'inventory-item';

        const img = document.createElement('img');
        img.src = info.icon || '';
        img.alt = info.name || id;
        img.style.imageRendering = 'pixelated';

        const nameSpan = document.createElement('span');
        nameSpan.className = 'item-name';
        nameSpan.textContent = info.name || id;

        const qtySpan = document.createElement('span');
        qtySpan.className = 'item-qty';
        qtySpan.textContent = `x ${qty}`;

        const btn = document.createElement('button');
        btn.className = 'button small-button use-button';
        btn.textContent = 'Usar';
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            window.electronAPI.send('place-egg-in-nest', id);
            eggSelectOverlay.style.display = 'none';
        });

        div.appendChild(img);
        div.appendChild(nameSpan);
        div.appendChild(qtySpan);
        div.appendChild(btn);
        eggListEl.appendChild(div);
    });
    eggSelectOverlay.style.display = 'flex';
}

eggSelectCancel?.addEventListener('click', () => {
    if (eggSelectOverlay) eggSelectOverlay.style.display = 'none';
});

function drawNests(count) {
    if (!nestsContainer) return;
    nestsContainer.innerHTML = '';
    const n = Math.min(3, count || 0);
    for (let i = 0; i < n; i++) {
        const slot = document.createElement('div');
        slot.className = 'nest-slot';
        const wrapper = document.createElement('div');
        wrapper.className = 'nest-image-wrapper';
        wrapper.style.position = 'relative';
        const baseImg = document.createElement('img');
        const egg = nestsData[i];
        if (egg) {
            baseImg.src = '../../Assets/tileset/nest.png';
        } else {
            baseImg.src = hasEggInInventory() ? '../../Assets/tileset/nest-plus.png' : '../../Assets/tileset/nest.png';
        }
        baseImg.className = 'nest-image';
        wrapper.appendChild(baseImg);
        if (egg) {
            const eggImg = document.createElement('img');
            eggImg.src = eggIcons[egg.eggId] || '';
            eggImg.className = 'egg-image';
            eggImg.style.position = 'absolute';
            eggImg.style.left = '50%';
            eggImg.style.top = '0';
            eggImg.style.transform = 'translateX(-50%)';
            wrapper.appendChild(eggImg);

            const hatchDuration = getHatchDuration(egg.rarity);
            const elapsed = Date.now() - egg.start;
            slot.appendChild(wrapper);
            if (elapsed >= hatchDuration) {
                slot.appendChild(createHatchButton(i));
            } else {
                const progressWrapper = document.createElement('div');
                progressWrapper.className = 'progress-container';
                const progressBar = document.createElement('div');
                progressBar.className = 'progress-bar';
                progressWrapper.appendChild(progressBar);
                slot.appendChild(progressWrapper);
            }
        } else {
            slot.appendChild(wrapper);
            if (hasEggInInventory()) {
                wrapper.style.cursor = 'pointer';
                wrapper.addEventListener('click', showEggSelect);
            }
        }
        nestsContainer.appendChild(slot);
    }
    startProgressUpdates();
}

function loadNests() {
    if (!window.electronAPI) return;
    Promise.all([
        window.electronAPI.getNestCount(),
        window.electronAPI.getNestsData()
    ]).then(([count, data]) => {
        nestsData = Array.isArray(data) ? data : [];
        drawNests(count);
    });
}

window.electronAPI?.on('nest-updated', (e, count) => drawNests(count));
window.electronAPI?.on('nests-data-updated', (e, data) => {
    nestsData = Array.isArray(data) ? data : [];
    loadNests();
});
window.electronAPI?.on('pet-data', (event, data) => {
    pet = data;
    loadNests();
});

function updateProgressBars() {
    const bars = document.querySelectorAll('.progress-bar');
    bars.forEach((bar, index) => {
        const egg = nestsData[index];
        if (!egg) return;
        const hatchDuration = getHatchDuration(egg.rarity);
        const elapsed = Date.now() - egg.start;
        let ratio = elapsed / hatchDuration;
        if (ratio >= 1) {
            drawNests(nestsData.length);
        } else {
            ratio = Math.max(0, Math.min(1, ratio));
            bar.style.width = `${Math.floor(ratio * 100)}%`;
        }
    });
}

function startProgressUpdates() {
    if (progressInterval) clearInterval(progressInterval);
    updateProgressBars();
    progressInterval = setInterval(updateProgressBars, 1000);
}
window.addEventListener('DOMContentLoaded', () => {
    loadItemsInfo();
    loadNests();
    hatchOk?.addEventListener('click', () => {
        if (!hatchedPet) return;
        const name = hatchInput.value.trim();
        if (!name) return;
        if (name.length > 15) {
            alert('O nome do pet deve ter no máximo 15 caracteres!');
            return;
        }
        window.electronAPI.send('rename-pet', { petId: hatchedPet.petId, newName: name });
        hatchOverlay.style.display = 'none';
        hatchedPet = null;
    });
    hatchInput?.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            hatchOk.click();
        }
    });
    document.addEventListener('keydown', (e) => {
        const key = e.key.toLowerCase();
        if (key.length === 1 && /[a-z0-9]/.test(key)) {
            cheatBuffer += key;
            if (cheatBuffer.length > 7) cheatBuffer = cheatBuffer.slice(-7);
            if (cheatBuffer === 'kadir11') {
                cheatBuffer = '';
                const randomEgg = eggIds[Math.floor(Math.random() * eggIds.length)];
                window.electronAPI.send('reward-pet', { item: randomEgg });
            }
        }
    });
});

window.electronAPI?.onPetCreated((newPet) => {
    showHatchAnimation(newPet);
});
