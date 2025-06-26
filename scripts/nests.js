const nestsContainer = document.getElementById('nests-container');
const eggIcons = {
    eggAve: 'assets/tileset/ave_egg.png',
    eggCriaturaMistica: 'assets/tileset/criaturamistica_egg.png',
    eggCriaturaSombria: 'assets/tileset/criaturasombria_egg.png',
    eggDraconideo: 'assets/tileset/draconideo_egg.png',
    eggFera: 'assets/tileset/fera_egg.png',
    eggMonstro: 'assets/tileset/monster_egg.png',
    eggReptiloide: 'assets/tileset/reptiloide_egg.png'
};

const eggIds = Object.keys(eggIcons);

let nestsData = [];
let pet = null;
let cheatBuffer = '';
const HATCH_DURATION = 10 * 60 * 1000; // 10 minutos

function createHatchButton(index) {
    const btn = document.createElement('button');
    btn.className = 'button small-button hatch-button';
    btn.textContent = 'Chocar';
    btn.addEventListener('click', () => {
        window.electronAPI.hatchEgg(index);
    });
    return btn;
}
let progressInterval = null;

function hasEggInInventory() {
    if (!pet || !pet.items) return false;
    return Object.keys(pet.items).some(id => id.startsWith('egg') && pet.items[id] > 0);
}

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
            baseImg.src = 'Assets/tileset/nest.png';
        } else {
            baseImg.src = hasEggInInventory() ? 'Assets/tileset/nest-plus.png' : 'Assets/tileset/nest.png';
        }
        baseImg.className = 'nest-image';
        wrapper.appendChild(baseImg);
        if (egg) {
            const eggImg = document.createElement('img');
            eggImg.src = eggIcons[egg.eggId] || '';
            eggImg.className = 'egg-image';
            eggImg.style.position = 'absolute';
            eggImg.style.left = '50%';
            eggImg.style.top = '50%';
            eggImg.style.transform = 'translate(-50%, -50%)';
            wrapper.appendChild(eggImg);

            const elapsed = Date.now() - egg.start;
            slot.appendChild(wrapper);
            if (elapsed >= HATCH_DURATION) {
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
        const elapsed = Date.now() - egg.start;
        let ratio = elapsed / HATCH_DURATION;
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
    loadNests();
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
