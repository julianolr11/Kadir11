const MAX_ATTEMPTS = 5;
const ENERGY_COST = 15; // porcentagem por tentativa
const KP_COST = 1; // custo fictício

let pointer, bar, logImg, hitImg, counterText, finalResult;
let barWidth, pointerWidth;
let position = 0;
let direction = 1;
let running = false;
let attempts = 0;
let totalXp = 0;
let energy = 100; // valores simulados
let life = 100;
let kadirPoints = 10;

function closeWindow() {
    window.close();
}

function updateCounter() {
    if (counterText) {
        counterText.textContent = `Tentativa ${attempts + 1}/${MAX_ATTEMPTS}`;
    }
}

function movePointer() {
    if (!running) return;
    position += direction * 2;
    if (position <= 0) {
        position = 0;
        direction = 1;
    }
    if (position >= barWidth - pointerWidth) {
        position = barWidth - pointerWidth;
        direction = -1;
    }
    pointer.style.left = `${position}px`;
    requestAnimationFrame(movePointer);
}

function showFloatingText(text) {
    const div = document.createElement('div');
    div.className = 'floating-text';
    div.textContent = text;
    document.getElementById('force-container').appendChild(div);
    setTimeout(() => div.remove(), 800);
}

function applyResult(ratio) {
    let xp = 0;
    if (ratio >= 0.85) {
        xp = 3;
        logImg.src = 'Assets/train/wood-3.png';
    } else if (ratio >= 0.6) {
        xp = 1;
        logImg.src = 'Assets/train/wood-2.png';
    } else {
        logImg.src = 'Assets/train/wood-1.png';
    }

    totalXp += xp;

    hitImg.style.display = 'block';
    logImg.classList.add('shake');
    showFloatingText(xp > 0 ? `+${xp} XP` : 'Errou!');
    setTimeout(() => {
        hitImg.style.display = 'none';
        logImg.classList.remove('shake');
        logImg.src = 'Assets/train/wood-1.png';
    }, 400);
}

function endGame() {
    running = false;
    pointer.style.display = 'none';
    if (finalResult) {
        finalResult.style.display = 'block';
        finalResult.textContent = `Total ganho: ${totalXp} XP`;
    }
}

function evaluate() {
    if (!running) return;
    running = false;
    attempts++;

    energy = Math.max(0, energy - ENERGY_COST);
    kadirPoints = Math.max(0, kadirPoints - KP_COST);

    const ratio = position / (barWidth - pointerWidth);
    applyResult(ratio);

    if (attempts >= MAX_ATTEMPTS || energy < ENERGY_COST || life < ENERGY_COST) {
        setTimeout(endGame, 500);
        return;
    }

    setTimeout(() => {
        position = 0;
        direction = 1;
        updateCounter();
        running = true;
        requestAnimationFrame(movePointer);
    }, 600);
}

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('close-train-force')?.addEventListener('click', closeWindow);
    document.getElementById('back-train-force')?.addEventListener('click', () => {
        window.electronAPI.send('train-stats');
        closeWindow();
    });

    pointer = document.getElementById('pointer');
    bar = document.getElementById('bar');
    logImg = document.getElementById('log');
    hitImg = document.getElementById('hit-effect');
    counterText = document.getElementById('attempt-counter');
    finalResult = document.getElementById('final-result');

    if (energy < ENERGY_COST || life < ENERGY_COST) {
        if (finalResult) {
            finalResult.style.display = 'block';
            finalResult.textContent = 'Seu pet está cansado ou ferido.';
        }
        pointer.style.display = 'none';
        return;
    }

    barWidth = bar.clientWidth;
    pointerWidth = pointer.clientWidth;
    running = true;
    requestAnimationFrame(movePointer);

    document.addEventListener('keydown', (e) => {
        if (e.code === 'Space') {
            e.preventDefault();
            evaluate();
        }
    });

    document.addEventListener('click', () => {
        evaluate();
    });

    updateCounter();
});
