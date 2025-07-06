export const rarityGradients = {
    'Comum': 'linear-gradient(135deg, #808080, #A9A9A9)',
    'Incomum': 'linear-gradient(135deg, #D3D3D3, #E0E0E0)',
    'Raro': 'linear-gradient(135deg, #32CD32, #228B22)',
    'MuitoRaro': 'linear-gradient(135deg, #4682B4, #1E90FF)',
    'Epico': 'linear-gradient(135deg, #800080, #DA70D6)',
    'Lendario': 'linear-gradient(135deg, #FFD700, #FFA500)'
};

export const rarityColors = {
    'Comum': '#808080',
    'Incomum': '#D3D3D3',
    'Raro': '#32CD32',
    'MuitoRaro': '#4682B4',
    'Epico': '#800080',
    'Lendario': '#FFD700'
};

// Mapeia o nome da espécie para o nome da pasta correspondente em Assets/Mons
export const specieDirs = {
    'Draconídeo': 'Draconideo',
    'Reptilóide': 'Reptiloide',
    'Ave': 'Ave',
    'Criatura Mística': 'CriaturaMistica',
    'Criatura Sombria': 'CriaturaSombria',
    'Monstro': 'Monstro',
    'Fera': 'Fera'
};

// Caminho da imagem em alta resolução de cada espécie para ser exibida na aba
// "Sobre". Utilizada como fallback quando o pet não define uma imagem de bio
// específica.
export const specieBioImages = {
    'Draconídeo': 'Draconideo/draconideo.png',
    'Reptilóide': 'Reptiloide/puro/viborom/reptiloide.png',
    'Ave': 'Ave/ave.png',
    'Criatura Mística': 'CriaturaMistica/CriaturaMistica.png',
    'Criatura Sombria': 'CriaturaSombria/criaturasombria.png',
    'Monstro': 'Monstro/monstro.png',
    'Fera': 'Fera/fera.png'
};

// Caminho da imagem de destaque de cada espécie para ser exibida na seleção
// de pets. É preenchido pela função loadSpeciesData usando o sistema de
// arquivos do processo principal.
export let specieImages = {};

export const specieData = {
    'Draconídeo': { dir: 'Draconideo', race: 'draak', element: 'puro' },
    'Reptilóide': { dir: 'Reptiloide', race: 'viborom', element: 'puro' },
    'Ave': { dir: 'Ave', race: 'pidgly' },
    'Criatura Mística': { dir: 'CriaturaMistica' },
    'Criatura Sombria': { dir: 'CriaturaSombria' },
    'Monstro': { dir: 'Monstro' },
    'Fera': { dir: 'Fera', race: 'Foxyl' }
};

export const eggSpecieMap = {
    eggAve: 'Ave',
    eggCriaturaMistica: 'Criatura Mística',
    eggCriaturaSombria: 'Criatura Sombria',
    eggDraconideo: 'Draconídeo',
    eggFera: 'Fera',
    eggMonstro: 'Monstro',
    eggReptiloide: 'Reptilóide'
};

let specieLoaded = false;

export async function loadSpeciesData(baseDir = '.') {
    if (specieLoaded) return;
    specieLoaded = true;
    try {
        const fs = await import('fs');
        const path = await import('path');
        const monsDir = path.join(baseDir, 'Assets', 'Mons');
        const entries = fs.readdirSync(monsDir, { withFileTypes: true });
        for (const entry of entries) {
            if (!entry.isDirectory()) continue;
            const dir = entry.name;
            const existing = Object.keys(specieData).find(k => specieData[k].dir === dir);
            const name = existing || dir;
            if (!specieData[name]) {
                specieData[name] = { dir };
            }
            const baseName = dir.toLowerCase();
            const gifPath = path.join(monsDir, dir, `${baseName}.gif`);
            const img = fs.existsSync(gifPath)
                ? path.posix.join(dir, `${baseName}.gif`)
                : path.posix.join(dir, `${baseName}.png`);
            specieImages[name] = img.replace(/\\/g, '/');
        }
    } catch (err) {
        console.error('Erro ao carregar espécies:', err);
    }
}
