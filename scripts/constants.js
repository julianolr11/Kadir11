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
    'Reptiloide': 'Reptiloide',
    'Pidgly': 'Ave',
    'Ashfang': 'Fera',
    'Ignis': 'Ave',
    'Mawthorn': 'Monstro',
    'Owlberoth': 'CriaturaMistica',
    'Digitama': 'CriaturaMistica',
    'Kael': 'Fera',
    'Leoracal': 'Fera',
    'Drazraq': 'Draconideo'
};

// Caminho da imagem em alta resolução de cada espécie para ser exibida na aba
// "Sobre". Utilizada como fallback quando o pet não define uma imagem de bio
// específica.
export const specieBioImages = {
    'Draconídeo': 'Draconideo/draconideo.png',
    'Reptiloide': 'Reptiloide/puro/viborom/reptiloide.png',
    'Ave': 'Ave/ave.png',
    'Besta': 'Besta/besta.png',
    'Criatura Mística': 'CriaturaMistica/CriaturaMistica.png',
    'Criatura Sombria': 'CriaturaSombria/criaturasombria.png',
    'Monstro': 'Monstro/monstro.png',
    'Fera': 'Fera/fera.png',
    // Usa a imagem padrão de Draconídeo como imagem do Drazraq
    'Drazraq': 'Draconideo/draconideo.png'
};

// Caminho da imagem de destaque de cada espécie para ser exibida na seleção
// de pets. É preenchido pela função loadSpeciesData usando o sistema de
// arquivos do processo principal.
export let specieImages = {};

export const specieData = {
    'Draconídeo': { dir: 'Draconideo', race: 'draak', element: 'puro' },
    'Reptiloide': { dir: 'Reptiloide', race: 'viborom', element: 'puro' },
    'Besta': { dir: 'Besta', race: 'besta', element: 'puro' },
    'Pidgly': { dir: 'Ave', race: 'Pidgly', element: 'terra' },
    'Ashfang': { dir: 'Fera', race: 'Ashfang', element: 'fogo' },
    'Ignis': { dir: 'Ave', race: 'ignis', element: 'fogo' },
    'Mawthorn': { dir: 'Monstro', race: 'Mawthorn', element: 'agua' },
    'Owlberoth': { dir: 'CriaturaMistica', race: 'Owlberoth', element: 'terra' },
    'Digitama': { dir: 'CriaturaMistica', race: 'Digitama', element: 'fogo' },
    'Kael': { dir: 'Fera', race: 'Kael', element: 'agua' },
    'Leoracal': { dir: 'Fera', race: 'Kael', element: 'terra' },
    'Drazraq': { dir: 'Draconideo', race: 'drazraq', element: 'puro' },
    'Foxyl': { dir: 'Fera/Foxyl', race: 'foxyl', element: 'ar' }  // Espécie de ar
};

export const eggSpecieMap = {
    eggAve: ['Pidgly', 'Ignis'],
    eggCriaturaMistica: ['Owlberoth', 'Digitama'],
    eggCriaturaSombria: ['Criatura Sombria'],
    eggDraconideo: ['Draconídeo', 'Drazraq'],
    eggFera: ['Ashfang', 'Kael', 'Leoracal', 'Foxyl'],
    eggMonstro: ['Mawthorn'],
    eggReptiloide: ['Reptiloide']
};

let specieLoaded = false;

export async function loadSpeciesData(baseDir = '.') {
    if (specieLoaded) return;
    specieLoaded = true;
    try {
        const fs = await import('fs');
        const path = await import('path');
        const monsDir = path.join(baseDir, 'Assets', 'Mons');
        for (const [name, info] of Object.entries(specieData)) {
            const dirPath = path.join(monsDir, info.dir);
            if (!fs.existsSync(dirPath)) continue;
            const baseName = info.dir.toLowerCase();
            const gifPath = path.join(dirPath, `${baseName}.gif`);
            const img = fs.existsSync(gifPath)
                ? path.posix.join(info.dir, `${baseName}.gif`)
                : path.posix.join(info.dir, `${baseName}.png`);
            specieImages[name] = img.replace(/\\/g, '/');
        }
    } catch (err) {
        console.error('Erro ao carregar espécies:', err);
    }
}
