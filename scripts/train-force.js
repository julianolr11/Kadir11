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

function startPointer() {
    const pointer = document.getElementById('pointer');
    if (!pointer) return;
    running = true;
    const step = 0.75; // percent per frame (slightly faster)
    function animate() {
        if (!running) return;
        pointerPos += step * direction;
        if (pointerPos >= 100) { pointerPos = 100; direction = -1; }
        if (pointerPos <= 0) { pointerPos = 0; direction = 1; }
        pointer.style.left = `calc(${pointerPos}% - 8px)`;
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

function showFeedback(text) {
    const fb = document.getElementById('feedback');
    if (!fb) return;
    fb.textContent = text;
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

function evaluateHit() {
    stopPointer();
    showHitEffect();
    let result = 'Errou!';
    let attrGain = 0;
    const logImg = document.getElementById('log');
    if (pointerPos >= 90) {
        result = '+3 Força';
        attrGain = 3;
        if (logImg) logImg.src = 'Assets/train/wood-3.png';
    } else if (pointerPos >= 70) {
        result = '+1 Força';
        attrGain = 1;
        if (logImg) logImg.src = 'Assets/train/wood-2.png';
    } else {
        if (logImg) logImg.src = 'Assets/train/wood-1.png';
    }
    totalXp += attrGain;
    showFeedback(result);
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
