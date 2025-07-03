console.log('lair-mode.js carregado');

const TILE_SIZE = 32;
// Dimensões do mapa ajustadas para caber na janela ao escalar o canvas
// Cada tile possui 32px, então 26x20 resulta em 832x640 (escala 1.2 ≈ 1000x768)
const MAP_W = 26;
const MAP_H = 20;

const tileMapping = {
    "FLOOR": [1, 1],
    "WALL_TOP": [1, 0],
    "WALL_BOTTOM": [1, 2],
    "WALL_LEFT": [0, 1],
    "WALL_RIGHT": [2, 1],
    "CORNER_TOP_LEFT": [0, 0],
    "CORNER_TOP_RIGHT": [2, 0],
    "CORNER_BOTTOM_LEFT": [0, 2],
    "CORNER_BOTTOM_RIGHT": [2, 2],
    "TORCH": [5, 2],
    "CHEST": [4, 4],
    "MONSTER": [5, 5],
    "WATER_LARGE": [0, 9],
    "WATER_SMALL": [0, 10],
    "DOOR": [3, 7],
    "BARRIL": [5, 4],
    "BOX": [5, 3],
    "CAGE": [4, 3]
};

let canvas, ctx, tileset, playerSprite, bravuraText, buyBtn;
let map = [];
let player = {x:1,y:1};
let moves = 0;
let level = 1;

function placeRandom(type){
    let x,y; let attempts=0;
    do{
        x=Math.floor(Math.random()*(MAP_W-2))+1;
        y=Math.floor(Math.random()*(MAP_H-2))+1;
        attempts++;
    }while(map[y][x] !== 'FLOOR' && attempts<100);
    if(attempts<100) map[y][x]=type;
}

function generateDungeon(){
    map = Array.from({length:MAP_H}, ()=>Array(MAP_W).fill('FLOOR'));
    for(let x=0;x<MAP_W;x++){ map[0][x]='WALL_TOP'; map[MAP_H-1][x]='WALL_BOTTOM'; }
    for(let y=0;y<MAP_H;y++){ map[y][0]='WALL_LEFT'; map[y][MAP_W-1]='WALL_RIGHT'; }
    map[0][0]='CORNER_TOP_LEFT';
    map[0][MAP_W-1]='CORNER_TOP_RIGHT';
    map[MAP_H-1][0]='CORNER_BOTTOM_LEFT';
    map[MAP_H-1][MAP_W-1]='CORNER_BOTTOM_RIGHT';
    map[MAP_H-2][MAP_W-2]='DOOR';
    for(let i=0;i<5;i++) placeRandom('MONSTER');
    for(let i=0;i<3;i++) placeRandom('BOX');
    player.x=1; player.y=1;
}

function drawMap(){
    ctx.clearRect(0,0,canvas.width,canvas.height);
    for(let y=0;y<MAP_H;y++){
        for(let x=0;x<MAP_W;x++){
            const tile=tileMapping[map[y][x]] || tileMapping.FLOOR;
            const sx=tile[0]*TILE_SIZE; const sy=tile[1]*TILE_SIZE;
            ctx.drawImage(tileset,sx,sy,TILE_SIZE,TILE_SIZE,x*TILE_SIZE,y*TILE_SIZE,TILE_SIZE,TILE_SIZE);
        }
    }
}

function drawPlayer(){
    playerSprite.style.left = (player.x*TILE_SIZE)+'px';
    playerSprite.style.top = (player.y*TILE_SIZE)+'px';
}

function updateUI(){
    if(bravuraText) bravuraText.textContent = `Bravura: ${moves}`;
}

function handleTile(tile){
    if(tile==='MONSTER'){
        window.electronAPI.send('open-journey-scene-window', {
            background: 'Assets/Modes/Journeys/cave_ruin.png'
        });
        map[player.y][player.x]='FLOOR';
    }else if(tile==='BOX'){
        window.electronAPI.send('reward-pet',{item:'meat',qty:1});
        map[player.y][player.x]='FLOOR';
    }else if(tile==='DOOR'){
        if(level<10){
            level++;
            generateDungeon();
            drawMap();
            drawPlayer();
            return;
        }else{
            alert('Você completou o Covil!');
        }
    }
}

function attemptMove(dx,dy){
    if(moves<=0) return;
    const nx=player.x+dx, ny=player.y+dy;
    if(nx<0||ny<0||nx>=MAP_W||ny>=MAP_H) return;
    const tile=map[ny][nx];
    if(tile.startsWith('WALL')||tile.startsWith('CORNER')) return;
    player.x=nx; player.y=ny; moves--; window.electronAPI.send('use-bravura',1);
    handleTile(tile);
    drawPlayer(); updateUI();
}

function handleKey(e){
    switch(e.key){
        case 'ArrowUp': attemptMove(0,-1); break;
        case 'ArrowDown': attemptMove(0,1); break;
        case 'ArrowLeft': attemptMove(-1,0); break;
        case 'ArrowRight': attemptMove(1,0); break;
    }
}

function handleClick(e){
    const rect = canvas.getBoundingClientRect();
    const x=Math.floor((e.clientX-rect.left)/TILE_SIZE);
    const y=Math.floor((e.clientY-rect.top)/TILE_SIZE);
    if(Math.abs(x-player.x)+Math.abs(y-player.y)===1){
        attemptMove(x-player.x,y-player.y);
    }
}

document.addEventListener('DOMContentLoaded',()=>{
    canvas=document.getElementById('lair-canvas');
    ctx=canvas.getContext('2d');
    playerSprite=document.getElementById('player-sprite');
    bravuraText=document.getElementById('bravura-text');
    buyBtn=document.getElementById('buy-bravura');
    tileset=new Image();
    tileset.src='assets/tileset/dungeon-tileset.png';
    tileset.onload=()=>{ drawMap(); drawPlayer(); };
    generateDungeon();
    document.addEventListener('keydown',handleKey);
    canvas.addEventListener('click',handleClick);
    buyBtn?.addEventListener('click',()=>{
        window.electronAPI.send('reward-pet',{bravura:1,kadirPoints:-30});
        moves++; updateUI();
    });
    document.getElementById('close-lair-mode')?.addEventListener('click',()=>window.close());
    document.getElementById('back-lair-mode')?.addEventListener('click',()=>{window.electronAPI.send('open-battle-mode-window');window.close();});
});

window.electronAPI.on('pet-data',(e,data)=>{
    if(!data) return;
    moves=data.bravura||10;
    if(playerSprite){
        const img=data.statusImage||data.image||'eggsy.png';
        playerSprite.src=`Assets/Mons/${img}`;
    }
    updateUI();
});
