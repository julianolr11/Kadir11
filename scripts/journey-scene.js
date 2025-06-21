console.log('journey-scene.js carregado');

function closeWindow() {
    window.close();
}

function assetPath(relative) {
    if (!relative) return '';
    const cleaned = relative.replace(/^[Aa]ssets[\/][Mm]ons[\/]/, '');
    return `Assets/Mons/${cleaned}`;
}

let pet = null;
let itemsInfo = {};
let statusEffectsInfo = {};
let playerStatusEffects = [];
let playerHealth = 100;
let playerMaxHealth = 100;
let enemyHealth = 100;
let currentTurn = 'player';
let playerIdleSrc = '';
let playerAttackSrc = '';
let enemyIdleSrc = '';
let enemyAttackSrc = '';

async function loadItemsInfo() {
    try {
        const resp = await fetch('data/items.json');
        const data = await resp.json();
        itemsInfo = {};
        data.forEach(it => { itemsInfo[it.id] = it; });
        updateItems();
    } catch (err) {
        console.error('Erro ao carregar info dos itens:', err);
    }
}

async function loadStatusEffectsInfo() {
    try {
        const resp = await fetch('data/status-effects.json');
        const data = await resp.json();
        statusEffectsInfo = {};
        data.forEach(se => { statusEffectsInfo[se.id] = se; });
    } catch (err) {
        console.error('Erro ao carregar info dos status effects:', err);
    }
}

function hideMenus() {
    document.getElementById('moves-menu').style.display = 'none';
    document.getElementById('items-menu').style.display = 'none';
}

function showMessage(text) {
    const box = document.getElementById('message-box');
    if (!box) return;
    box.textContent = text;
    box.style.display = 'block';
    setTimeout(() => { box.style.display = 'none'; }, 2000);
}

function updateMoves() {
    const menu = document.getElementById('moves-menu');
    if (!menu) return;
    menu.innerHTML = '';
    if (!pet || !Array.isArray(pet.moves) || pet.moves.length === 0) {
        const span = document.createElement('span');
        span.textContent = 'Você não aprendeu nenhum movimento! Tente fugir!';
        menu.appendChild(span);
        return;
    }
    pet.moves.forEach(move => {
        const btn = document.createElement('button');
        btn.className = 'button small-button';
        btn.textContent = move.name;
        btn.addEventListener('click', () => {
            performPlayerMove(move);
        });
        menu.appendChild(btn);
    });
}

function updateItems() {
    const menu = document.getElementById('items-menu');
    if (!menu) return;
    menu.innerHTML = '';
    if (!pet || !pet.items || Object.keys(pet.items).length === 0) {
        const span = document.createElement('span');
        span.textContent = 'Você não tem itens! Tente fugir!';
        menu.appendChild(span);
        return;
    }
    Object.keys(pet.items).forEach(id => {
        const qty = pet.items[id];
        if (qty <= 0) return;
        const info = itemsInfo[id] || { name: id };
        const btn = document.createElement('button');
        btn.className = 'button small-button item-button';

        const img = document.createElement('img');
        img.src = info.icon;
        img.alt = info.name;

        const label = document.createElement('span');
        label.textContent = `${info.name} x ${qty}`;

        btn.appendChild(img);
        btn.appendChild(label);

        btn.addEventListener('click', () => {
            if (currentTurn !== 'player') return;
            hideMenus();
            window.electronAPI.send('use-item', id);
            endPlayerTurn();
        });

        menu.appendChild(btn);
    });
}

function updateStatusIcons() {
    const container = document.getElementById('player-status-icons');
    if (!container) return;
    container.innerHTML = '';
    if (!Array.isArray(playerStatusEffects) || playerStatusEffects.length === 0) {
        container.style.display = 'none';
        return;
    }
    playerStatusEffects.forEach(id => {
        const info = statusEffectsInfo[id];
        if (!info) return;
        const img = document.createElement('img');
        img.src = info.icon;
        img.alt = info.name;
        img.title = info.name;
        container.appendChild(img);
    });
    container.style.display = 'flex';
}

function attemptFlee() {
    if (currentTurn !== 'player') return;
    hideMenus();
    let chance = 0.5;
    if (playerHealth >= enemyHealth) chance += 0.25; else chance -= 0.25;
    chance = Math.max(0.1, Math.min(0.9, chance));
    if (Math.random() < chance) {
        showMessage('Fuga bem-sucedida!');
        setTimeout(closeWindow, 1500);
    } else {
        showMessage('Fuga falhou!');
        endPlayerTurn();
    }
}

function updateHealthBars() {
    const playerFill = document.getElementById('player-health-fill');
    if (playerFill) {
        const percent = (playerHealth / playerMaxHealth) * 100;
        playerFill.style.width = `${percent}%`;
    }
    const enemyFill = document.getElementById('enemy-health-fill');
    if (enemyFill) {
        const percent = (enemyHealth / 100) * 100;
        enemyFill.style.width = `${percent}%`;
    }
}

function playAttackAnimation(img, idle, attack, cb) {
    if (!img) { if (cb) cb(); return; }
    img.src = attack;
    setTimeout(() => {
        img.src = idle;
        if (cb) cb();
    }, 1000);
}

function applyStatusEffects() {
    if (playerStatusEffects.includes('poison')) {
        const dmg = Math.ceil(playerMaxHealth * (Math.random() * 0.01 + 0.01));
        playerHealth = Math.max(0, playerHealth - dmg);
    }
    if (playerStatusEffects.includes('burn')) {
        const dmg = Math.ceil(playerMaxHealth * (Math.random() * 0.01 + 0.02));
        playerHealth = Math.max(0, playerHealth - dmg);
    }
    if (playerStatusEffects.includes('bleed')) {
        const dmg = Math.ceil(playerHealth * 0.03);
        playerHealth = Math.max(0, playerHealth - dmg);
    }
    updateHealthBars();
}

function generateReward() {
    const types = ['experience', 'kadirPoints', 'coins', 'item'];
    const choice = types[Math.floor(Math.random() * types.length)];
    if (choice === 'experience') {
        return { experience: Math.floor(Math.random() * 10) + 5 };
    }
    if (choice === 'kadirPoints') {
        return { kadirPoints: 1 };
    }
    if (choice === 'coins') {
        return { coins: Math.floor(Math.random() * 5) + 1 };
    }
    const ids = Object.keys(itemsInfo);
    if (ids.length === 0) return { coins: 1 };
    const id = ids[Math.floor(Math.random() * ids.length)];
    return { item: id, qty: 1 };
}

function showVictoryModal(reward) {
    const modal = document.getElementById('victory-modal');
    const rewardBox = document.getElementById('victory-reward');
    const closeBtn = document.getElementById('victory-close');
    if (!modal || !rewardBox || !closeBtn) return;

    let text = '';
    if (reward.experience) text = `Você recebeu ${reward.experience} XP!`;
    else if (reward.kadirPoints) text = `Você recebeu ${reward.kadirPoints} DNA Kadir!`;
    else if (reward.coins) text = `Você recebeu ${reward.coins} moedas!`;
    else if (reward.item) {
        const info = itemsInfo[reward.item] || { name: reward.item };
        text = `Você recebeu 1 ${info.name}!`;
    }
    rewardBox.textContent = text;
    modal.style.display = 'flex';
    closeBtn.onclick = () => {
        modal.style.display = 'none';
        window.electronAPI.send('open-journey-mode-window');
        closeWindow();
    };
}

function concludeBattle(playerWon) {
    currentTurn = 'ended';
    hideMenus();
    if (playerWon) {
        const reward = generateReward();
        window.electronAPI.send('reward-pet', reward);
        showVictoryModal(reward);
    } else {
        showMessage('Você perdeu!');
        setTimeout(() => { window.electronAPI.send('open-journey-mode-window'); closeWindow(); }, 2000);
    }
}

function endPlayerTurn() {
    applyStatusEffects();
    if (playerHealth <= 0) {
        concludeBattle(false);
    } else {
        currentTurn = 'enemy';
        setTimeout(enemyAction, 800);
    }
}

function performPlayerMove(move) {
    if (currentTurn !== 'player') return;
    if (playerStatusEffects.includes('paralyze') && Math.random() < 0.5) {
        showMessage('Paralisado!');
        endPlayerTurn();
        return;
    }
    if (playerStatusEffects.includes('sleep') || playerStatusEffects.includes('freeze')) {
        showMessage('Incapaz de agir!');
        endPlayerTurn();
        return;
    }
    hideMenus();
    const playerImg = document.getElementById('player-pet');
    playAttackAnimation(playerImg, playerIdleSrc, playerAttackSrc, () => {
        enemyHealth = Math.max(0, enemyHealth - 10);
        updateHealthBars();
        if (enemyHealth <= 0) {
            concludeBattle(true);
        } else {
            endPlayerTurn();
        }
    });
}

function enemyAction() {
    const enemyImg = document.getElementById('enemy-pet');
    playAttackAnimation(enemyImg, enemyIdleSrc, enemyAttackSrc, () => {
        playerHealth = Math.max(0, playerHealth - 8);
        updateHealthBars();
        if (playerHealth <= 0) {
            concludeBattle(false);
        } else {
            currentTurn = 'player';
            applyStatusEffects();
        }
    });
}

document.addEventListener('DOMContentLoaded', () => {
    const bg = document.getElementById('scene-bg');
    const player = document.getElementById('player-pet');
    const enemy = document.getElementById('enemy-pet');
    const playerFront = document.getElementById('player-front');
    const enemyFront = document.getElementById('enemy-front');
    const enemyName = document.getElementById('enemy-name');
    loadItemsInfo();
    loadStatusEffectsInfo().then(updateStatusIcons);

    document.getElementById('close-journey-scene')?.addEventListener('click', closeWindow);
    document.getElementById('back-journey-scene')?.addEventListener('click', () => {
        window.electronAPI.send('open-journey-mode-window');
        closeWindow();
    });

    const fightBtn = document.getElementById('fight-btn');
    const itemsBtn = document.getElementById('items-btn');
    const runBtn = document.getElementById('run-btn');

    fightBtn?.addEventListener('click', () => {
        const menu = document.getElementById('moves-menu');
        if (!menu) return;
        if (!pet || !Array.isArray(pet.moves) || pet.moves.length === 0) {
            showMessage('Você não aprendeu nenhum movimento! Tente fugir!');
            return;
        }
        if (menu.style.display === 'none' || menu.style.display === '') {
            hideMenus();
            updateMoves();
            menu.style.display = 'flex';
        } else {
            menu.style.display = 'none';
        }
    });

    itemsBtn?.addEventListener('click', () => {
        const menu = document.getElementById('items-menu');
        if (!menu) return;
        if (!pet || !pet.items || !Object.values(pet.items).some(qty => qty > 0)) {
            showMessage('Você não tem itens! Tente fugir!');
            return;
        }
        if (menu.style.display === 'none' || menu.style.display === '') {
            hideMenus();
            updateItems();
            menu.style.display = 'flex';
        } else {
            menu.style.display = 'none';
        }
    });

    runBtn?.addEventListener('click', attemptFlee);

    window.electronAPI.on('scene-data', (event, data) => {
        if (data.background && bg) bg.src = data.background;
        if (data.playerPet && player) {
            playerIdleSrc = assetPath(data.playerPet);
            playerAttackSrc = assetPath(data.playerPet.replace(/idle\.gif$/i, 'attack.gif'));
            player.src = playerIdleSrc;
        }
        if (data.enemyPet && enemy) {
            enemyIdleSrc = assetPath(data.enemyPet);
            enemyAttackSrc = assetPath(data.enemyPet.replace(/idle\.gif$/i, 'attack.gif'));
            enemy.src = enemyIdleSrc;
        }

        if (data.playerPet && playerFront) {
            const frontPath = data.playerPet.replace(/idle\.gif$/i, 'front.gif');
            playerFront.src = assetPath(frontPath);
        }

        if (data.enemyPet && enemyFront) {
            const frontPath = data.enemyPet.replace(/idle\.gif$/i, 'front.gif');
            enemyFront.src = assetPath(frontPath);
        }

        if (data.enemyName && enemyName) enemyName.textContent = data.enemyName;
        playerStatusEffects = Array.isArray(data.statusEffects) ? data.statusEffects : [];
        updateStatusIcons();
        updateHealthBars();
    });

    window.electronAPI.on('pet-data', (event, data) => {
        if (!data) return;
        pet = data;
        playerHealth = data.currentHealth ?? playerHealth;
        playerMaxHealth = data.maxHealth ?? playerMaxHealth;
        const healthFill = document.getElementById('player-health-fill');
        const energyFill = document.getElementById('player-energy-fill');
        if (healthFill) {
            const percent = (playerHealth / playerMaxHealth) * 100;
            healthFill.style.width = `${percent}%`;
        }
        if (energyFill) {
            const percent = (data.energy || 0);
            energyFill.style.width = `${percent}%`;
        }
        updateHealthBars();
        if (Array.isArray(data.statusEffects)) {
            playerStatusEffects = data.statusEffects;
            updateStatusIcons();
        }
        updateMoves();
        updateItems();
    });
});
