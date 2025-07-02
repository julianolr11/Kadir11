let pet = null;
let running = false;
let pointerPos = 0;
let direction = 1;
let frameId = 0;
let attempts = 0;
const maxAttempts = 5;
const energyCostPerAttempt = 3; // 5 tentativas = 15 de energia
const tolerances = [40, 30, 20, 15, 10];
let xpDefesa = 0; // pontos de defesa ganhos
let initialAttributes = null;

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
    const pointerWidth = pointer.offsetWidth;
    const maxLeft = containerWidth - pointerWidth;
    running = true;
    const step = getPointerSpeed(pet?.level || 1);
    function animate() {
        if (!running) return;
        pointerPos += step * direction;
        if (pointerPos >= 100) { pointerPos = 100; direction = -1; }
        if (pointerPos <= 0) { pointerPos = 0; direction = 1; }
        const left = (pointerPos / 100) * maxLeft;
        pointer.style.left = `${left}px`;
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
    if (counter) counter.textContent = `Tentativa ${attempts}/${maxAttempts}`;
}

function showResults() {
    const overlay = document.getElementById('defense-results');
    const content = document.getElementById('defense-results-content');
    if (!overlay || !content) return;
    content.innerHTML =
        `<p>Você ganhou <span class="gain">+${xpDefesa}</span> pontos de Defesa!</p>` +
        `<button class="button small-button" id="defense-results-ok">Ok</button>`;
    overlay.style.display = 'flex';
    const okBtn = document.getElementById('defense-results-ok');
    okBtn?.addEventListener('click', closeWindow);
    document.getElementById('close-defense-results')?.addEventListener('click', closeWindow);
}

function evaluateHit() {
    stopPointer();
    showHitEffect();
    const pointer = document.getElementById('pointer');
    const container = document.getElementById('precision-container');
    const shieldImg = document.getElementById('shield');
    if (!pointer || !container) return;
    const pointerLeft = parseFloat(pointer.style.left) || 0;
    const containerWidth = container.offsetWidth;
    const pointerWidth = pointer.offsetWidth;
    const target = containerWidth / 2 - pointerWidth / 2;
    const diff = Math.abs(pointerLeft - target);
    const tolerance = tolerances[Math.min(attempts, tolerances.length - 1)];
    const success = diff <= tolerance;
    if (success) {
        xpDefesa += 1;
        if (shieldImg) shieldImg.src = 'Assets/train/shield-2.png';
        showFeedback('Defesa bem-sucedida! +1 Defesa', true);
    } else {
        if (shieldImg) shieldImg.src = 'Assets/train/shield-3.png';
        showFeedback('Errou o tempo!', false);
    }
    attempts += 1;
    updateCounters();
    if (pet) {
        window.electronAPI.send('use-move', { cost: energyCostPerAttempt });
        if (success) {
            window.electronAPI.send('increase-attribute', { name: 'defense', amount: 1 });
        }
        window.electronAPI.send('reward-pet', { kadirPoints: -1 });
    }
    if (attempts < maxAttempts) {
        setTimeout(() => {
            if (shieldImg) shieldImg.src = 'Assets/train/shield-1.png';
            pointerPos = 0;
            direction = 1;
            startPointer();
        }, 500);
    } else {
        setTimeout(showResults, 500);
    }
}

function handleInput() {
    if (!running || attempts >= maxAttempts) return;
    evaluateHit();
}

function checkEligibility() {
    const alertEl = document.getElementById('defense-alert');
    if (!pet || !alertEl) return false;
    const lifePct = (pet.currentHealth / pet.maxHealth) * 100;
    if (pet.energy < 15 || lifePct < 15) {
        alertEl.textContent = 'Seu pet não tem energia ou vida suficiente para treinar.';
        alertEl.style.display = 'block';
        return false;
    }
    if ((pet.kadirPoints || 0) < 1) {
        alertEl.textContent = 'Seu pet não tem DNA Kadir suficiente para treinar.';
        alertEl.style.display = 'block';
        return false;
    }
    alertEl.style.display = 'none';
    return true;
}

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('close-train-defense-window')?.addEventListener('click', closeWindow);
    const backFn = () => { window.electronAPI.send('open-train-attributes-window'); closeWindow(); };
    document.getElementById('back-train-defense-window')?.addEventListener('click', backFn);
    document.getElementById('defense-back')?.addEventListener('click', backFn);
    document.addEventListener('keydown', e => { if (e.code === 'Space') handleInput(); });
    document.addEventListener('mousedown', handleInput);
    window.electronAPI.on('pet-data', (event, data) => {
        pet = data;
        if (!initialAttributes && pet) {
            initialAttributes = {
                attack: pet.attributes?.attack || 0,
                defense: pet.attributes?.defense || 0,
                speed: pet.attributes?.speed || 0,
                magic: pet.attributes?.magic || 0
            };
        }
        if (checkEligibility()) {
            updateCounters();
            startPointer();
        }
    });
});
