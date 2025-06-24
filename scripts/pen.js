const penCanvas = document.getElementById('pen-canvas');
const penCtx = penCanvas ? penCanvas.getContext('2d') : null;
const tileset = new Image();
tileset.src = 'assets/tileset/tileset.png';
let penInfo = { size: 'small', maxPets: 3 };
const sizeMap = { small: { w: 4, h: 3 }, medium: { w: 5, h: 4 }, large: { w: 7, h: 5 } };

let sprites = [];
let lastTime = 0;
let animationId = null;
const MOVE_SPEED = 16; // pixels per second

function drawPen() {
    if (!penCtx || !tileset.complete) return;
    const dims = sizeMap[penInfo.size] || sizeMap.small;
    const w = (dims.w + 2) * 32;
    const h = (dims.h + 2) * 32;
    penCanvas.width = w;
    penCanvas.height = h;
    penCtx.clearRect(0,0,w,h);
    for (let y=0; y<dims.h+2; y++) {
        for (let x=0; x<dims.w+2; x++) {
            let sx=32, sy=32;
            if (x===0 && y===0) { sx=0; sy=0; }
            else if (x===dims.w+1 && y===0) { sx=64; sy=0; }
            else if (x===0 && y===dims.h+1) { sx=0; sy=64; }
            else if (x===dims.w+1 && y===dims.h+1) { sx=64; sy=64; }
            else if (y===0) { sx=32; sy=0; }
            else if (y===dims.h+1) { sx=32; sy=64; }
            else if (x===0) { sx=0; sy=32; }
            else if (x===dims.w+1) { sx=64; sy=32; }
            penCtx.drawImage(tileset, sx, sy, 32, 32, x*32, y*32, 32, 32);
        }
    }
}

tileset.onload = drawPen;

function updateSprites(dt) {
    const dims = sizeMap[penInfo.size] || sizeMap.small;
    sprites.forEach(sp => {
        if (sp.pause > 0) {
            sp.pause -= dt;
            return;
        }
        if (!sp.moving) {
            const col = Math.floor(Math.random() * dims.w);
            const row = Math.floor(Math.random() * dims.h);
            sp.targetX = (col + 1) * 32;
            sp.targetY = (row + 1) * 32;
            sp.moving = true;
        }

        const dx = sp.targetX - sp.x;
        const dy = sp.targetY - sp.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const step = MOVE_SPEED * dt;
        if (dist <= step) {
            sp.x = sp.targetX;
            sp.y = sp.targetY;
            sp.moving = false;
            sp.pause = Math.random() * 2 + 0.5;
        } else {
            sp.x += (dx / dist) * step;
            sp.y += (dy / dist) * step;
        }
    });
}

function render() {
    if (!penCtx) return;
    drawPen();
    sprites.forEach(sp => {
        if (sp.img.complete)
            penCtx.drawImage(sp.img, sp.x, sp.y, 32, 32);
    });
}

function animate(timestamp) {
    const dt = (timestamp - lastTime) / 1000;
    lastTime = timestamp;
    updateSprites(dt);
    render();
    animationId = requestAnimationFrame(animate);
}

function drawPets(pets) {
    if (!penCtx) return;
    const dims = sizeMap[penInfo.size] || sizeMap.small;
    sprites = [];
    if (animationId) cancelAnimationFrame(animationId);
    pets.forEach((pet) => {
        const img = new Image();
        const src = pet.idleImage ? `Assets/Mons/${pet.idleImage}` :
            (pet.statusImage ? `Assets/Mons/${pet.statusImage}` :
                (pet.image ? `Assets/Mons/${pet.image}` : 'Assets/Mons/eggsy.png'));
        img.src = src;
        const col = Math.floor(Math.random() * dims.w);
        const row = Math.floor(Math.random() * dims.h);
        const x = (col + 1) * 32;
        const y = (row + 1) * 32;
        sprites.push({ img, x, y, targetX: x, targetY: y, moving: false, pause: Math.random() * 2 });
    });
    lastTime = performance.now();
    animationId = requestAnimationFrame(animate);
}

function loadPen() {
    if (window.electronAPI && window.electronAPI.getPenInfo && window.electronAPI.listPets) {
        Promise.all([
            window.electronAPI.getPenInfo(),
            window.electronAPI.listPets()
        ]).then(([info, pets]) => {
            penInfo = info;
            drawPen();
            drawPets(pets);
        });
    }
}

window.electronAPI?.on('pen-updated', () => loadPen());
window.addEventListener('DOMContentLoaded', () => {
    loadPen();
    document.getElementById('back-pen-window')?.addEventListener('click', () => {
        window.electronAPI?.send('close-pen-window');
    });
});
