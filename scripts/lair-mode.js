console.log('lair-mode.js carregado');

const TILE_SIZE = 32;
const SCALE = 1.2; // mesma escala aplicada ao canvas
// Dimensões do mapa ajustadas para caber na janela ao escalar o canvas
// Cada tile possui 32px, então 26x20 resulta em 832x640 (escala 1.2 ≈ 1000x768)
const MAP_W = 26;
const MAP_H = 20;

const tileMapping = {
    FLOOR: [3,6],
    WALL_TOP: [0,1],
    WALL_BOTTOM: [1,2],
    WALL_LEFT: [1,0],
    WALL_RIGHT: [1,11],
    CORNER_TOP_LEFT: [0,0],
    CORNER_TOP_RIGHT: [0,11],
    CORNER_BOTTOM_LEFT: [4,0],
    CORNER_BOTTOM_RIGHT: [4,11],
    TORCH: [1,6],
    CHEST: [3,4],
    MONSTER: [5,5],
    WATER_LARGE: [0,9],
    WATER_SMALL: [0,10],
    DOOR: [6,5],
    BARRIL: [3,6],
    TABLE: [3,3],
    CHAIR: [3,2],
    BOX: [3,5],
    CAGE: [6,6],
    PILLAR: [5,0],
    GRATE: [2,4],
    WALL_CENTER: [2,1]
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


function shuffle(arr){
    for(let i=arr.length-1;i>0;i--){
        const j=Math.floor(Math.random()*(i+1));
        [arr[i],arr[j]]=[arr[j],arr[i]];
    }
    return arr;
}

function carve(x,y){
    map[y][x]='FLOOR';
    const dirs=shuffle([[0,-2],[0,2],[-2,0],[2,0]]);
    for(const [dx,dy] of dirs){
        const nx=x+dx, ny=y+dy;
        const mx=x+dx/2, my=y+dy/2;
        if(nx<=0||ny<=0||nx>=MAP_W-1||ny>=MAP_H-1) continue;
        if(map[ny][nx]==='WALL'){
            map[my][mx]='FLOOR';
            carve(nx,ny);
        }
    }
}

function assignWallTiles(){
    const isWall=(x,y)=>{
        if(x<0||y<0||x>=MAP_W||y>=MAP_H) return false;
        const t=map[y][x];
        return t==='WALL'||t.startsWith('WALL')||t.startsWith('CORNER');
    };
    for(let y=0;y<MAP_H;y++){
        for(let x=0;x<MAP_W;x++){
            if(map[y][x]!=='WALL') continue;
            const u=isWall(x,y-1), d=isWall(x,y+1), l=isWall(x-1,y), r=isWall(x+1,y);
            if(u && d && l && r){
                map[y][x] = 'WALL_CENTER';
            }else if(!u && !l && r && d){
                map[y][x] = 'CORNER_TOP_LEFT';
            }else if(!u && !r && l && d){
                map[y][x] = 'CORNER_TOP_RIGHT';
            }else if(!d && !l && r && u){
                map[y][x] = 'CORNER_BOTTOM_LEFT';
            }else if(!d && !r && l && u){
                map[y][x] = 'CORNER_BOTTOM_RIGHT';
            }else if(!u && d && l && r){
                map[y][x] = 'WALL_TOP';
            }else if(!d && u && l && r){
                map[y][x] = 'WALL_BOTTOM';
            }else if(!l && u && d && r){
                map[y][x] = 'WALL_LEFT';
            }else if(!r && u && d && l){
                map[y][x] = 'WALL_RIGHT';
            }else if(l && r && !u && !d){
                map[y][x] = 'WALL_TOP';
            }else if(u && d && !l && !r){
                map[y][x] = 'WALL_LEFT';
            }else{
                map[y][x] = 'WALL_CENTER';
            }
        }
    }
    // bordas externas
    for(let x=0;x<MAP_W;x++){ map[0][x]='WALL_TOP'; map[MAP_H-1][x]='WALL_BOTTOM'; }
    for(let y=0;y<MAP_H;y++){ map[y][0]='WALL_LEFT'; map[y][MAP_W-1]='WALL_RIGHT'; }
    map[0][0]='CORNER_TOP_LEFT';
    map[0][MAP_W-1]='CORNER_TOP_RIGHT';
    map[MAP_H-1][0]='CORNER_BOTTOM_LEFT';
    map[MAP_H-1][MAP_W-1]='CORNER_BOTTOM_RIGHT';
}

function fillWallRect(x,y,w,h,hollow=false){
    for(let j=y;j<y+h;j++){
        if(j<0||j>=MAP_H) continue;
        for(let i=x;i<x+w;i++){
            if(i<0||i>=MAP_W) continue;
            if(hollow && j>y && j<y+h-1 && i>x && i<x+w-1) continue;
            map[j][i]='WALL';
        }
    }
}

function hasPath(){
    const start = {x:1, y:1};
    const goal = {x:MAP_W-2, y:MAP_H-2};
    const visited = Array.from({length:MAP_H}, ()=>Array(MAP_W).fill(false));
    const queue=[start];
    visited[start.y][start.x]=true;
    while(queue.length){
        const {x,y}=queue.shift();
        if(x===goal.x && y===goal.y) return true;
        const neighbors=[
            {x:x+1,y},
            {x:x-1,y},
            {x,y:y+1},
            {x,y:y-1}
        ];
        for(const n of neighbors){
            if(n.x<0||n.y<0||n.x>=MAP_W||n.y>=MAP_H) continue;
            if(visited[n.y][n.x]) continue;
            const tile=map[n.y][n.x];
            if(tile.startsWith('WALL')||tile.startsWith('CORNER')) continue;
            visited[n.y][n.x]=true;
            queue.push(n);
        }
    }
    return false;
}

function generateDungeon(){
    map = Array.from({length:MAP_H}, ()=>Array(MAP_W).fill('WALL'));
    carve(1,1);
    // estruturas internas
    fillWallRect(Math.floor(MAP_W/2)-2, Math.floor(MAP_H/2)-2, 5, 5, true);
    // pequena parede em "L" no canto superior esquerdo
    [[0,0],[2,0],[0,1],[2,1],[0,2],[2,2]].forEach(([x,y])=>{ if(y<MAP_H && x<MAP_W) map[y][x]='WALL'; });
    // garante caminho para a porta
    map[MAP_H-2][MAP_W-2]='FLOOR';
    map[MAP_H-2][MAP_W-3]='FLOOR';
    map[MAP_H-3][MAP_W-2]='FLOOR';
    assignWallTiles();
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
    playerSprite.style.left = (player.x * TILE_SIZE * SCALE) + 'px';
    playerSprite.style.top = (player.y * TILE_SIZE * SCALE) + 'px';
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
    tileset.src='Assets/tileset/dungeon-tileset.png';
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
});
