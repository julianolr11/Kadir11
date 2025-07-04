console.log('lair-mode.js carregado');

const TILE_SIZE = 32;
const SCALE = 1.2;
const MAP_W = 26;
const MAP_H = 20;

const tileMapping = {
    "FLOOR": [1, 1],
    "WALL_TOP": [1, 2],
    "WALL_BOTTOM": [1, 0],
    "WALL_LEFT": [2, 1],
    "WALL_RIGHT": [0, 1],
    "CORNER_TOP_LEFT": [5, 7],
    "CORNER_TOP_RIGHT": [7, 7],
    "CORNER_BOTTOM_LEFT": [5, 8],
    "CORNER_BOTTOM_RIGHT": [7, 8],
    "WALL_SINGLE": [6, 1],
    "WALL_VERTICAL": [3, 1],
    "WALL_HORIZONTAL": [3, 2],
    "WALL_CROSS": [6, 2],
    "WALL_CORNER_TOP_LEFT": [0, 3],
    "WALL_CORNER_TOP_RIGHT": [1, 3],
    "WALL_CORNER_BOTTOM_LEFT": [2, 6],
    "WALL_CORNER_BOTTOM_RIGHT": [2, 3],
    "WALL_END_TOP": [4, 3],
    "WALL_END_BOTTOM": [5, 3],
    "WALL_END_LEFT": [6, 3],
    "WALL_END_RIGHT": [7, 3],
    "WALL_T_TOP": [0, 4],
    "WALL_T_BOTTOM": [1, 4],
    "WALL_T_LEFT": [2, 4],
    "WALL_T_RIGHT": [3, 4],
    "TORCH": [5, 2],
    "CHEST": [4, 4],
    "MONSTER": [5, 5],
    "WATER_LARGE": [0, 9],
    "WATER_SMALL": [0, 10],
    "DOOR": [3, 7],
    "BARRIL": [5, 4],
    "BOX": [4, 4],
    "CAGE": [4, 3]
};

const autotileMap = {
    0: "WALL_SINGLE",
    1: "WALL_END_BOTTOM",
    2: "WALL_END_LEFT",
    3: "WALL_CORNER_BOTTOM_LEFT",
    4: "WALL_END_TOP",
    5: "WALL_VERTICAL",
    6: "WALL_CORNER_TOP_LEFT",
    7: "WALL_T_LEFT",
    8: "WALL_END_RIGHT",
    9: "WALL_CORNER_BOTTOM_RIGHT",
    10: "WALL_HORIZONTAL",
    11: "WALL_T_BOTTOM",
    12: "WALL_CORNER_TOP_RIGHT",
    13: "WALL_T_TOP",
    14: "WALL_T_RIGHT",
    15: "WALL_CROSS"
};

let canvas, ctx, tileset, playerSprite, bravuraText, buyBtn;
let map = [];
let player = { x: 1, y: 1 };
let moves = 0;
let level = 1;

function placeRandom(type) {
    let x, y, attempts = 0;
    do {
        x = Math.floor(Math.random() * (MAP_W - 2)) + 1;
        y = Math.floor(Math.random() * (MAP_H - 2)) + 1;
        attempts++;
    } while ((map[y][x] !== 'FLOOR' || (x === player.x && y === player.y)) && attempts < 100);
    if (attempts < 100) map[y][x] = type;
}

function drawMap() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let y = 0; y < MAP_H; y++) {
        for (let x = 0; x < MAP_W; x++) {
            const tile = tileMapping[map[y][x]] || tileMapping.FLOOR;
            const sx = tile[0] * TILE_SIZE;
            const sy = tile[1] * TILE_SIZE;
            ctx.drawImage(tileset, sx, sy, TILE_SIZE, TILE_SIZE, x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
        }
    }
}

function drawPlayer() {
    playerSprite.style.left = (player.x * TILE_SIZE * SCALE) + 'px';
    playerSprite.style.top = (player.y * TILE_SIZE * SCALE) + 'px';
}

function updateUI() {
    if (bravuraText) bravuraText.textContent = `Bravura: ${moves}`;
}

function handleTile(tile) {
    if (tile === 'MONSTER') {
        window.electronAPI.send('open-journey-scene-window', {
            background: 'Assets/Modes/Journeys/cave_ruin.png'
        });
        map[player.y][player.x] = 'FLOOR';
    } else if (tile === 'BOX') {
        window.electronAPI.send('reward-pet', { item: 'meat', qty: 1 });
        map[player.y][player.x] = 'FLOOR';
    } else if (tile === 'DOOR') {
        if (level < 10) {
            level++;
            generateDungeon();
            drawMap();
            drawPlayer();
        } else {
            alert('Você completou o Covil!');
        }
    }
}

function attemptMove(dx, dy) {
    if (moves <= 0) return;
    const nx = player.x + dx, ny = player.y + dy;
    if (nx < 0 || ny < 0 || nx >= MAP_W || ny >= MAP_H) return;
    const tile = map[ny][nx];
    if (tile.startsWith('WALL') || tile.startsWith('CORNER')) return;
    player.x = nx;
    player.y = ny;
    moves--;
    window.electronAPI.send('use-bravura', 1);
    handleTile(tile);
    drawPlayer();
    updateUI();
}

function handleKey(e) {
    switch (e.key) {
        case 'ArrowUp': attemptMove(0, -1); break;
        case 'ArrowDown': attemptMove(0, 1); break;
        case 'ArrowLeft': attemptMove(-1, 0); break;
        case 'ArrowRight': attemptMove(1, 0); break;
    }
}

function handleClick(e) {
    const rect = canvas.getBoundingClientRect();
    const x = Math.floor((e.clientX - rect.left) / (TILE_SIZE * SCALE));
    const y = Math.floor((e.clientY - rect.top) / (TILE_SIZE * SCALE));
    if (Math.abs(x - player.x) + Math.abs(y - player.y) === 1) {
        attemptMove(x - player.x, y - player.y);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    canvas = document.getElementById('lair-canvas');
    ctx = canvas.getContext('2d');
    playerSprite = document.getElementById('player-sprite');
    bravuraText = document.getElementById('bravura-text');
    buyBtn = document.getElementById('buy-bravura');
    canvas.style.setProperty('--lair-scale', SCALE);
    canvas.style.transform = `scale(${SCALE})`;
    const container = document.getElementById('lair-container');
    container.style.width = (canvas.width * SCALE) + 'px';
    container.style.height = (canvas.height * SCALE) + 'px';
    if (playerSprite) playerSprite.style.transform = `scale(${SCALE})`;

    tileset = new Image();
    tileset.src = 'assets/tileset/dungeon-tileset.png';
    tileset.onload = () => { drawMap(); drawPlayer(); };
    generateDungeon();
    document.addEventListener('keydown', handleKey);
    canvas.addEventListener('click', handleClick);
    buyBtn?.addEventListener('click', () => {
        window.electronAPI.send('reward-pet', { bravura: 1, kadirPoints: -30 });
        moves++; updateUI();
    });
    document.getElementById('close-lair-mode')?.addEventListener('click', () => window.close());
    document.getElementById('back-lair-mode')?.addEventListener('click', () => {
        window.electronAPI.send('open-battle-mode-window');
        window.close();
    });

    const titleBar = document.getElementById('title-bar');
    const rect = container.getBoundingClientRect();
    const totalWidth = Math.round(rect.width) + 20;
    const totalHeight = Math.round(titleBar.offsetHeight + rect.height) + 20;
    window.electronAPI?.send('resize-lair-window', { width: totalWidth, height: totalHeight });
});

window.electronAPI.on('pet-data', (e, data) => {
    if (!data) return;
    moves = data.bravura || 10;
    if (playerSprite) {
        const img = data.statusImage || data.image || 'eggsy.png';
        playerSprite.src = `Assets/Mons/${img}`;
    }
    updateUI();
});

function getAutoTileType(x, y) {
    const isWall = (tx, ty) => {
        return map[ty]?.[tx]?.startsWith("WALL") || map[ty]?.[tx]?.startsWith("CORNER");
    };
    let code = 0;
    if (isWall(x, y - 1)) code += 1;
    if (isWall(x + 1, y)) code += 2;
    if (isWall(x, y + 1)) code += 4;
    if (isWall(x - 1, y)) code += 8;
    return autotileMap[code] || "WALL_SINGLE";
}

function applyAutoTiling() {
    for (let y = 1; y < MAP_H - 1; y++) {
        for (let x = 1; x < MAP_W - 1; x++) {
            if (map[y][x] === "WALL_PLACEHOLDER") {
                map[y][x] = getAutoTileType(x, y);
            }
        }
    }
}

function generateMaze() {
    map = Array.from({ length: MAP_H }, () => Array(MAP_W).fill("WALL_PLACEHOLDER"));
    function carve(x, y) {
        map[y][x] = "FLOOR";
        const dirs = [[0, -2], [2, 0], [0, 2], [-2, 0]].sort(() => Math.random() - 0.5);
        for (const [dx, dy] of dirs) {
            const nx = x + dx, ny = y + dy;
            if (nx > 0 && ny > 0 && nx < MAP_W - 1 && ny < MAP_H - 1 && map[ny][nx] === "WALL_PLACEHOLDER") {
                map[y + dy / 2][x + dx / 2] = "FLOOR";
                map[ny][nx] = "FLOOR";
                carve(nx, ny);
            }
        }
    }
    carve(1, 1);
}

function findStartPosition() {
    for (let y = 1; y < MAP_H - 1; y++) {
        for (let x = 1; x < MAP_W - 1; x++) {
            if (map[y][x] === "FLOOR") {
                return { x, y };
            }
        }
    }
    return { x: 1, y: 1 };
}

function generateDungeon() {
    generateMaze();

    for (let x = 0; x < MAP_W; x++) {
        map[0][x] = 'WALL_TOP';
        map[MAP_H - 1][x] = 'WALL_BOTTOM';
    }
    for (let y = 0; y < MAP_H; y++) {
        map[y][0] = 'WALL_LEFT';
        map[y][MAP_W - 1] = 'WALL_RIGHT';
    }

    map[0][0] = 'CORNER_TOP_LEFT';
    map[0][MAP_W - 1] = 'CORNER_TOP_RIGHT';
    map[MAP_H - 1][0] = 'CORNER_BOTTOM_LEFT';
    map[MAP_H - 1][MAP_W - 1] = 'CORNER_BOTTOM_RIGHT';

    applyAutoTiling();

    map[MAP_H - 2][MAP_W - 2] = 'DOOR';

    const start = findStartPosition();
    player.x = start.x;
    player.y = start.y;

    for (let i = 0; i < 5; i++) placeRandom('MONSTER');
    for (let i = 0; i < 3; i++) placeRandom('BOX');
}
