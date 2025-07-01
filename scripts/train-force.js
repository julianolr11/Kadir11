let pet = null;
let running = false;
let pointerPos = 0;
let direction = 1;
let frameId = 0;
let attempts = 0;
const maxAttempts = 5;
let totalXp = 0; // acumulado de força ganha

function closeWindow() {
    window.close();
}

function getPointerSpeed(level) {
    const base = 0.4; // velocidade inicial mais lenta
    const tier = Math.floor(((level || 1) - 1) / 5);
    return Math.min(base + tier * 0.1, 1.2);
}

function startPointer() {
    const pointer = document.getElementById('pointer');
    const container = document.getElementById('precision-container');
    if (!pointer || !container) return;
    const containerWidth = container.offsetWidth;
    const rangeStart = 15; // limites laterais
    const rangeWidth = containerWidth - 30;
    const pointerWidth = pointer.offsetWidth;
    running = true;
    const step = getPointerSpeed(pet?.level || 1);
    function animate() {
        if (!running) return;
        pointerPos += step * direction;
        if (pointerPos >= 100) { pointerPos = 100; direction = -1; }
        if (pointerPos <= 0) { pointerPos = 0; direction = 1; }
        const center = rangeStart + (pointerPos / 100) * rangeWidth;
        pointer.style.left = `${center - pointerWidth / 2}px`;
        frameId = requestAnimationFrame(animate);
    }
    frameId = requestAnimationFrame(animate);
}

function stopPointer() {
    running = false;
    cancelAnimationFrame(frameId);
}

function showHitEffect() {
    const effect = document.getElementById('hit-effect');
    if (!effect) return;
    effect.style.display = 'block';
    setTimeout(() => { effect.style.display = 'none'; }, 300);
}

function showFeedback(text, success) {
    const fb = document.getElementById('feedback');
    if (!fb) return;
    fb.textContent = text;
    fb.style.color = success ? 'lime' : '#ff4444';
    fb.style.opacity = '1';
    fb.style.animation = 'none';
    // trigger reflow
    void fb.offsetWidth;
    fb.style.animation = 'floatUp 1s forwards';
}

function updateCounters() {
    const counter = document.getElementById('attempt-counter');
    const total = document.getElementById('xp-total');
    if (counter) counter.textContent = `Tentativa ${attempts}/${maxAttempts}`;
    if (total) total.textContent = attempts >= maxAttempts ? `Força total: ${totalXp}` : '';
}

function getAttrGain(high) {
    const base = high ? 2 : 1;
    const bonus = Math.floor((pet?.level || 1) / 20);
    return base + bonus;
}

function evaluateHit() {
    stopPointer();
    showHitEffect();
    let result = 'Errou!';
    let attrGain = 0;
    const logImg = document.getElementById('log');
    if (pointerPos >= 90) {
        attrGain = getAttrGain(true);
        result = `+${attrGain} Força`;
        if (logImg) logImg.src = 'Assets/train/wood-3.png';
    } else if (pointerPos >= 70) {
        attrGain = getAttrGain(false);
        result = `+${attrGain} Força`;
        if (logImg) logImg.src = 'Assets/train/wood-2.png';
    } else {
        if (logImg) logImg.src = 'Assets/train/wood-1.png';
    }
    if (attrGain > 0) totalXp += attrGain;
    showFeedback(result, attrGain > 0);
    attempts += 1;
    updateCounters();
    if (pet) {
        window.electronAPI.send('use-move', { cost: 15 });
        if (attrGain > 0) {
            window.electronAPI.send('increase-attribute', { name: 'attack', amount: attrGain });
        }
        window.electronAPI.send('reward-pet', { kadirPoints: -1 });
    }
    if (attempts < maxAttempts) {
        setTimeout(() => {
            if (logImg) logImg.src = 'Assets/train/wood-1.png';
            pointerPos = 0;
            direction = 1;
            startPointer();
        }, 500);
    }
}

function handleInput() {
    if (!running || attempts >= maxAttempts) return;
    evaluateHit();
}

function checkEligibility() {
    const alertEl = document.getElementById('force-alert');
    if (!pet || !alertEl) return false;
    const lifePct = (pet.currentHealth / pet.maxHealth) * 100;
    if (pet.energy < 15 || lifePct < 15) {
        alertEl.textContent = 'Seu pet não tem energia ou vida suficiente para treinar.';
        alertEl.style.display = 'block';
        return false;
    }
    alertEl.style.display = 'none';
    return true;
}

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('close-train-force-window')?.addEventListener('click', closeWindow);
    const backFn = () => { window.electronAPI.send('open-train-attributes-window'); closeWindow(); };
    document.getElementById('back-train-force-window')?.addEventListener('click', backFn);
    document.getElementById('force-back')?.addEventListener('click', backFn);
    document.addEventListener('keydown', e => { if (e.code === 'Space') handleInput(); });
    document.addEventListener('mousedown', handleInput);
    window.electronAPI.on('pet-data', (event, data) => {
        pet = data;
        if (checkEligibility()) {
            updateCounters();
            startPointer();
        }
    });
});
