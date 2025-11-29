let pet = null;
let running = false;
let pointerPos = 0;
let direction = 1;
let ballFromRight = false;
let frameId = 0;
let attempts = 0;
const maxAttempts = 5;
const energyCostPerAttempt = 3; // 5 tentativas = 15 de energia
const tolerances = [40, 30, 20, 15, 10];
let xpDefesa = 0; // pontos de defesa ganhos
let initialAttributes = null;
let pointerSpeed = 0;
let basePointerSpeed = 0;
const speedFactor = 1.5;
const maxPointerSpeed = 1.5;
const maxDefenseGain = 5;

function closeWindow() {
    window.close();
}

function getPointerSpeed(level) {
    return 0.1; // Velocidade inicial reduzida para 0.5
}

function startPointer() {
    const pointer = document.getElementById('pointer');
    const container = document.getElementById('precision-container');
    const gameArea = document.getElementById('game-area');
    const ball = document.getElementById('ball');
    if (!pointer || !container) return;
    const containerWidth = container.offsetWidth;
    const pointerWidth = pointer.offsetWidth;
    const maxLeft = containerWidth - pointerWidth;
    running = true;
    pointerPos = ballFromRight ? 100 : 0;
    direction = ballFromRight ? -1 : 1;
    pointer.classList.toggle('flipped', ballFromRight);
    if (ball) {
        ball.classList.toggle('flipped', ballFromRight);
    }
    if (ball && gameArea) {
        const startRight = gameArea.offsetWidth - ball.offsetWidth;
        ball.style.left = ballFromRight ? `${startRight}px` : '0px';
    }
    const baseSpeed = pointerSpeed;

    function animate() {
        if (!running) return;
        const proximity = 1 - Math.abs(50 - pointerPos) / 50;
        const step = baseSpeed * (1 + proximity);
        pointerPos += step * direction;

        let reachedCenter = false;
        if (ballFromRight && pointerPos <= 50) {
            pointerPos = 50;
            reachedCenter = true;
        } else if (!ballFromRight && pointerPos >= 50) {
            pointerPos = 50;
            reachedCenter = true;
        }

        const left = (pointerPos / 100) * maxLeft;
        pointer.style.left = `${left}px`;

        if (ball && gameArea) {
            const center = (gameArea.offsetWidth - ball.offsetWidth) / 2;
            const startRight = gameArea.offsetWidth - ball.offsetWidth;
            let ballLeft;
            if (ballFromRight) {
                const progress = (100 - pointerPos) / 50; // 0 to 1
                ballLeft = startRight - progress * (startRight - center);
            } else {
                const progress = pointerPos / 50; // 0 to 1
                ballLeft = progress * center;
            }
            ball.style.left = `${ballLeft}px`;
        }

        if (reachedCenter) {
            ballFromRight = !ballFromRight;
            pointer.classList.toggle('flipped', ballFromRight);
            if (ball) ball.classList.toggle('flipped', ballFromRight);
            pointerPos = ballFromRight ? 100 : 0;
            direction = ballFromRight ? -1 : 1;
        }

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
        if (xpDefesa < maxDefenseGain) {
            xpDefesa += 1;
            if (pet) {
                window.electronAPI.send('increase-attribute', {
                    name: 'defense',
                    amount: 1
                });
            }
            showFeedback('Defesa bem-sucedida! +1 Defesa', true);
        } else {
            showFeedback('Defesa bem-sucedida!', true);
        }
        // Aumenta a velocidade em 0.03 a cada sucesso (mais cadenciado)
        pointerSpeed = Math.min(pointerSpeed + 0.03, maxPointerSpeed);
        if (shieldImg) shieldImg.src = '../../Assets/train/shield-2.png';
    } else {
        // Reduz a velocidade em 0.1 ao errar, mas não abaixo de 1.0 (base)
        pointerSpeed = Math.max(pointerSpeed - 0.1, 1.0);
        if (shieldImg) shieldImg.src = '../../Assets/train/shield-3.png';
        showFeedback('Errou o tempo!', false);
    }
    attempts += 1;
    updateCounters();
    if (pet) {
        window.electronAPI.send('use-move', { cost: energyCostPerAttempt });
        window.electronAPI.send('reward-pet', { kadirPoints: -1 });
    }
    if (attempts < maxAttempts) {
        setTimeout(() => {
            if (shieldImg) shieldImg.src = '../../Assets/train/shield-1.png';
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
        pointerSpeed = getPointerSpeed(pet?.level || 1);
        basePointerSpeed = pointerSpeed;
        if (checkEligibility()) {
            updateCounters();
            startPointer();
        }
    });
});
