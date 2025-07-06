console.log('lair-mode.js carregado');

const TILE_SIZE = 32;
const SCALE = 1.2; // mesma escala aplicada ao canvas
// Dimensões do mapa ajustadas para caber na janela ao escalar o canvas
// Cada tile possui 32px, então 26x20 resulta em 832x640 (escala 1.2 ≈ 1000x768)
const MAP_W = 26;
const MAP_H = 20;

const tileMapping = {
    "FLOOR": [1, 1],
    "WALL_TOP": [1, 2],
    "WALL_BOTTOM": [5, 0],
    "WALL_LEFT": [2, 1],
    "WALL_RIGHT": [0, 1],
    "CORNER_TOP_LEFT": [5, 7],
    "CORNER_TOP_RIGHT": [6, 7],
    "CORNER_BOTTOM_LEFT": [5, 8],
    "CORNER_BOTTOM_RIGHT": [6, 8],
    "TORCH": [5, 2],
    "CHEST": [8, 6],
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

const CONSUMABLES = ['healthPotion','meat','staminaPotion','chocolate'];
const ACCESSORIES = ['finger','turtleShell','feather','orbe'];
const EGGS = [
    'eggAve','eggCriaturaMistica','eggCriaturaSombria',
    'eggDraconideo','eggFera','eggMonstro','eggReptiloide'
];

function placeRandom(type){
    let x,y; let attempts=0;
    do{
        x=Math.floor(Math.random()*(MAP_W-2))+1;
        y=Math.floor(Math.random()*(MAP_H-2))+1;
        attempts++;
    }while(map[y][x] !== 'FLOOR' && attempts<100);
    if(attempts<100) map[y][x]=type;
}

function shuffle(array){
    for(let i=array.length-1;i>0;i--){
        const j=Math.floor(Math.random()*(i+1));
        [array[i],array[j]]=[array[j],array[i]];
    }
    return array;
}

function generateMazePaths(){
    map = Array.from({length:MAP_H},()=>Array(MAP_W).fill('WALL'));

    function carve(x,y){
        map[y][x]='FLOOR';
        const dirs=shuffle([[0,-1],[1,0],[0,1],[-1,0]]);
        for(const [dx,dy] of dirs){
            const nx=x+dx*2, ny=y+dy*2;
            if(nx>0 && ny>0 && nx<MAP_W-1 && ny<MAP_H-1 && map[ny][nx]==='WALL'){
                map[y+dy][x+dx]='FLOOR';
                carve(nx,ny);
            }
        }
    }

    carve(1,1);
}

function orientWalls(){
    // bordas externas
    for(let x=0;x<MAP_W;x++){ map[0][x]='WALL_TOP'; map[MAP_H-1][x]='WALL_BOTTOM'; }
    for(let y=0;y<MAP_H;y++){ map[y][0]='WALL_LEFT'; map[y][MAP_W-1]='WALL_RIGHT'; }
    map[0][0]='CORNER_TOP_LEFT';
    map[0][MAP_W-1]='CORNER_TOP_RIGHT';
    map[MAP_H-1][0]='CORNER_BOTTOM_LEFT';
    map[MAP_H-1][MAP_W-1]='CORNER_BOTTOM_RIGHT';

    // paredes internas
    for(let y=1;y<MAP_H-1;y++){
        for(let x=1;x<MAP_W-1;x++){
            if(map[y][x]!=='WALL') continue;
            const up=map[y-1][x]==='FLOOR';
            const down=map[y+1][x]==='FLOOR';
            const left=map[y][x-1]==='FLOOR';
            const right=map[y][x+1]==='FLOOR';

            if(up && left && !down && !right) map[y][x]='CORNER_BOTTOM_RIGHT';
            else if(up && right && !down && !left) map[y][x]='CORNER_BOTTOM_LEFT';
            else if(down && left && !up && !right) map[y][x]='CORNER_TOP_RIGHT';
            else if(down && right && !up && !left) map[y][x]='CORNER_TOP_LEFT';
            else if((left||right)&&!(up||down)) map[y][x]='WALL_TOP';
            else if((up||down)&&!(left||right)) map[y][x]='WALL_LEFT';
            else if(left && !up && !down && !right) map[y][x]='WALL_RIGHT';
            else if(right && !up && !down && !left) map[y][x]='WALL_LEFT';
            else if(up && !left && !right && !down) map[y][x]='WALL_BOTTOM';
            else if(down && !left && !right && !up) map[y][x]='WALL_TOP';
            else map[y][x]='WALL_TOP';
        }
    }
}

function generateDungeon(){
    generateMazePaths();
    orientWalls();
    map[MAP_H-2][MAP_W-2]='DOOR';
    for(let i=0;i<5;i++) placeRandom('MONSTER');
    for(let i=0;i<3;i++) placeRandom('BOX');
    const chestCount=Math.floor(Math.random()*2)+1; // 1 a 2 baús
    for(let i=0;i<chestCount;i++) placeRandom('CHEST');
    const torchCount=Math.floor(Math.random()*3)+1; // 1 a 3 tochas
    for(let i=0;i<torchCount;i++) placeRandom('TORCH');
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
    playerSprite.style.left = (player.x * TILE_SIZE * SCALE) + 'px';
    playerSprite.style.top = (player.y * TILE_SIZE * SCALE) + 'px';
}

function updateUI(){
    if(bravuraText) bravuraText.textContent = `Bravura: ${moves}`;
}

function openChest(){
    if(Math.random()<0.5){
        const coins=Math.floor(Math.random()*4)+1;
        window.electronAPI.send('reward-pet',{coins});
    }
    if(Math.random()<0.25){
        const id=CONSUMABLES[Math.floor(Math.random()*CONSUMABLES.length)];
        window.electronAPI.send('reward-pet',{item:id,qty:1});
    }
    if(Math.random()<0.2){
        const coins=Math.floor(Math.random()*6)+5;
        window.electronAPI.send('reward-pet',{coins});
    }
    if(Math.random()<0.04){
        const id=ACCESSORIES[Math.floor(Math.random()*ACCESSORIES.length)];
        window.electronAPI.send('reward-pet',{item:id,qty:1});
    }
    if(Math.random()<0.01){
        const id=EGGS[Math.floor(Math.random()*EGGS.length)];
        window.electronAPI.send('reward-pet',{item:id,qty:1});
    }
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
    }else if(tile==='CHEST'){
        openChest();
        map[player.y][player.x]='FLOOR';
    }else if(tile==='TORCH'){
        window.electronAPI.send('reward-pet',{bravura:10});
        moves += 10;
        map[player.y][player.x]='FLOOR';
        updateUI();
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
    if(moves<=0){
        alert('Lhe falta bravura para prosseguir');
        window.close();
        return;
    }
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
    const x=Math.floor((e.clientX - rect.left) / (TILE_SIZE * SCALE));
    const y=Math.floor((e.clientY - rect.top) / (TILE_SIZE * SCALE));
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
    canvas.style.setProperty('--lair-scale', SCALE);
    canvas.style.transform = `scale(${SCALE})`;
    const container=document.getElementById('lair-container');
    container.style.width = (canvas.width * SCALE) + 'px';
    container.style.height = (canvas.height * SCALE) + 'px';
    if (playerSprite) playerSprite.style.transform = `scale(${SCALE})`;

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

    const titleBar=document.getElementById('title-bar');
    const rect=container.getBoundingClientRect();
    const totalWidth=Math.round(rect.width)+20;
    const totalHeight=Math.round(titleBar.offsetHeight+rect.height)+20;
    window.electronAPI?.send('resize-lair-window',{width:totalWidth,height:totalHeight});
});

window.electronAPI.on('pet-data',(e,data)=>{
    if(!data) return;
    moves=data.bravura||10;
    if(playerSprite){
        const img=data.statusImage||data.image||'eggsy.png';
        playerSprite.src=`Assets/Mons/${img}`;
    }
    updateUI();
    if(moves<=0){
        alert('Lhe falta bravura para prosseguir');
        window.close();
    }
});