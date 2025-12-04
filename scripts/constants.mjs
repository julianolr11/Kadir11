export const rarityGradients = {
  Comum: 'linear-gradient(135deg, #808080, #A9A9A9)',
  Incomum: 'linear-gradient(135deg, #D3D3D3, #E0E0E0)',
  Raro: 'linear-gradient(135deg, #32CD32, #228B22)',
  MuitoRaro: 'linear-gradient(135deg, #4682B4, #1E90FF)',
  Epico: 'linear-gradient(135deg, #800080, #DA70D6)',
  Lendario: 'linear-gradient(135deg, #FFD700, #FFA500)'
};

export const rarityColors = {
  Comum: '#808080',
  Incomum: '#D3D3D3',
  Raro: '#32CD32',
  MuitoRaro: '#4682B4',
  Epico: '#800080',
  Lendario: '#FFD700'
};

export const specieDirs = {
  Draak: 'Draconideo',
  Reptiloide: 'Reptiloide',
  Pidgly: 'Ave',
  Ashfang: 'Fera',
  Ignis: 'Ave',
  Mawthorn: 'Monstro',
  Owlberoth: 'CriaturaMistica',
  Digitama: 'CriaturaMistica',
  Kael: 'Fera',
  Leoracal: 'Fera',
  Drazraq: 'Draconideo',
  Virideer: 'CriaturaMistica',
  Ekeranth: 'Draconideo',
  Griffor: 'Ave',
  Ashfang: 'Fera',
};

export const specieBioImages = {
  Draak: 'Draconideo/draconideo.png',
  Reptiloide: 'Reptiloide/puro/viborom/reptiloide.png',
  Ave: 'Ave/ave.png',
'Criatura Mística': 'CriaturaMistica/CriaturaMistica.png',
  'Criatura Sombria': 'CriaturaSombria/criaturasombria.png',
  Monstro: 'Monstro/monstro.png',
  Fera: 'Fera/fera.png',
  Drazraq: 'Draconideo/draconideo.png'
};

export let specieImages = {};

export const specieData = {
  Draak: { dir: 'Draconideo', race: 'draak', element: 'puro', attackType: 'Híbrido', dexNumber: 1, description: 'Senhor ancestral das montanhas, combina força bruta com energia arcana inata.' , sizeMeters: 2.3},
  Drazraq: { dir: 'Draconideo', race: 'drazraq', element: 'puro', attackType: 'Físico', dexNumber: 1, description: 'Guerreiro dracônico de reflexos rápidos e investidas cortantes.' },
  Reptiloide: { dir: 'Reptiloide', race: 'viborom', element: 'puro', attackType: 'Físico', dexNumber: 3, description: 'Predador rastejante que observa silencioso antes de atacar.' , sizeMeters: 0.7},
  Pidgly: { dir: 'Ave', race: 'Pidgly', element: 'terra', attackType: 'Físico', dexNumber: 4, description: 'Ave territorial que defende seu ninho com bicadas certeiras.' , sizeMeters: 0.8},
  Ignis: { dir: 'Ave', race: 'ignis', element: 'fogo', attackType: 'Mágico', dexNumber: 5, description: 'Espírito ígneo emplumado; suas chamas nunca se apagam.' , sizeMeters: 1.4},
  Mawthorn: { dir: 'Monstro', race: 'Mawthorn', element: 'agua', attackType: 'Físico', dexNumber: 6, description: 'Criatura lacustre coberta por placas e espinhos orgânicos.' , sizeMeters: 3.3},
  Owlberoth: { dir: 'CriaturaMistica', race: 'Owlberoth', element: 'terra', attackType: 'Mágico', dexNumber: 7, description: 'Guardião da clareira; olhos que enxergam através da névoa.' , sizeMeters: 3},
  Digitama: { dir: 'CriaturaMistica', race: 'Digitama', element: 'fogo', attackType: 'Mágico', dexNumber: 8, description: 'Essência incubada de fogo puro em forma de casulo vivo.' , sizeMeters: 0.6},
  Kael: { dir: 'Fera', race: 'Kael', element: 'agua', attackType: 'Mágico', dexNumber: 9, description: 'Ser fluido e sereno, domina correntes e névoas profundas.' , sizeMeters: 1.9},
  Leoracal: { dir: 'Fera', race: 'Leoracal', element: 'terra', attackType: 'Físico', dexNumber: 10, description: 'Felino oracular que ruge antes de qualquer mudança climática.' , sizeMeters: 1.8},
  Virideer: { dir: 'CriaturaMistica', race: 'Virideer', element: 'terra', attackType: 'Físico', dexNumber: 11, description: 'Guardião da floresta de chifres musgosos, protetor dos ciclos naturais.' , sizeMeters: 1.9},
    Ekeranth: { dir: 'Draconideo', race: 'Ekeranth', element: 'fogo', attackType: 'Mágico', dexNumber: 12, description: 'Uma criatura que habita as profundezas do submundo, forjado pelo fogo e caos, seu nome e Akeranth - O tirano ardente' , sizeMeters: 2.9},
  Griffor: { dir: 'Ave', race: 'Griffor', element: 'puro', attackType: 'Físico', dexNumber: 13, description: 'Um griffo que circunda reinos em busca de tudo que reluz', sizeMeters: 2.7 },
  Ashfang: { dir: 'Fera', race: 'Ashfang', element: 'fogo', attackType: 'Físico', dexNumber: 14, description: 'Em meio as sombras de uma calmaria de um vulcão adormecido surge uma fera em brasas guiado pela noite calma mas com o poder de um vulcão prestes a despertar', sizeMeters: 1.9 },
};

export const eggSpecieMap = {
  eggAve: ['Pidgly', 'Ignis', 'Ekeranth', 'Griffor', 'Ashfang'],
  eggCriaturaMistica: ['Owlberoth', 'Digitama', 'Virideer'],
  eggDraconideo: ['Draak', 'Drazraq'],
  eggFera: ['Kael', 'Leoracal'],
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

// Força limpeza de cache para recarregar espécies
export function resetSpeciesCache() {
  try {
    specieLoaded = false;
    // Limpa imagens cacheadas
    specieImages = {};
    console.log('Species cache resetado com sucesso');
  } catch (err) {
    console.error('Erro ao resetar cache de espécies:', err);
  }
}
