let pet = null;
let running = false;
let pointerPos = 0;
let direction = 1;
let frameId = 0;
let attempts = 0;
const maxAttempts = 5;
const energyCostPerAttempt = 3; // 5 tentativas = 15 de energia
const maxTotalGain = 3; // limite de ganho de ataque por sessão
let totalXp = 0; // acumulado de força ganha
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
    const overlay = document.getElementById('force-results');
    const content = document.getElementById('force-results-content');
    if (!overlay || !content || !pet) return;
    const atk = pet.attributes?.attack ?? initialAttributes?.attack ?? 0;
    const def = pet.attributes?.defense ?? initialAttributes?.defense ?? 0;
    const spd = pet.attributes?.speed ?? initialAttributes?.speed ?? 0;
    const mag = pet.attributes?.magic ?? initialAttributes?.magic ?? 0;
    content.innerHTML =
        `<p>Ataque: ${atk} <span class="gain">+${totalXp}</span></p>` +
        `<p>Defesa: ${def}</p>` +
        `<p>Velocidade: ${spd}</p>` +
        `<p>Magia: ${mag}</p>` +
        `<p>Força total: ${totalXp}</p>` +
        `<button class="button small-button" id="force-results-ok">Ok</button>`;
    overlay.style.display = 'flex';
    const okBtn = document.getElementById('force-results-ok');
    okBtn?.addEventListener('click', closeWindow);
    document.getElementById('close-force-results')?.addEventListener('click', closeWindow);
}

function getAttrGain(high) {
    return 1; // ganho máximo de 1 ponto
}

function evaluateHit() {
    stopPointer();
    showHitEffect();
    let result = 'Errou!';
    let success = false;
    let attrGain = 0;
    const logImg = document.getElementById('log');
    if (pointerPos >= 90) {
        if (Math.random() < 0.5) {
            attrGain = getAttrGain(true);
            success = true;
        }
        if (logImg) logImg.src = 'Assets/train/wood-3.png';
    } else if (pointerPos >= 70) {
        if (Math.random() < 0.3) {
            attrGain = getAttrGain(false);
            success = true;
        }
        if (logImg) logImg.src = 'Assets/train/wood-2.png';
    } else {
        if (logImg) logImg.src = 'Assets/train/wood-1.png';
    }
    if (success) {
        if (totalXp < maxTotalGain) {
            attrGain = Math.min(attrGain, maxTotalGain - totalXp);
            if (attrGain > 0) {
                result = `+${attrGain} Força`;
                totalXp += attrGain;
            } else {
                success = false;
            }
        } else {
            success = false;
        }
    }
    showFeedback(result, success);
    attempts += 1;
    updateCounters();
    if (pet) {
        window.electronAPI.send('use-move', { cost: energyCostPerAttempt });
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
    } else {
        setTimeout(showResults, 500);
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
