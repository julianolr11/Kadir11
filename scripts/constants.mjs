export const rarityGradients = {
  Comum: 'linear-gradient(135deg, #808080, #A9A9A9)',
  Incomum: 'linear-gradient(135deg, #D3D3D3, #E0E0E0)',
  Raro: 'linear-gradient(135deg, #32CD32, #228B22)',
  MuitoRaro: 'linear-gradient(135deg, #4682B4, #1E90FF)',
  Epico: 'linear-gradient(135deg, #800080, #DA70D6)',
  Lendario: 'linear-gradient(135deg, #FFD700, #FFA500)',
};

export const rarityColors = {
  Comum: '#808080',
  Incomum: '#D3D3D3',
  Raro: '#32CD32',
  MuitoRaro: '#4682B4',
  Epico: '#800080',
  Lendario: '#FFD700',
};

export const specieDirs = {
  Draconídeo: 'Draconideo',
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
};

export const specieBioImages = {
  Draconídeo: 'Draconideo/draconideo.png',
  Reptiloide: 'Reptiloide/puro/viborom/reptiloide.png',
  Ave: 'Ave/ave.png',
  Besta: 'Besta/besta.png',
  'Criatura Mística': 'CriaturaMistica/CriaturaMistica.png',
  'Criatura Sombria': 'CriaturaSombria/criaturasombria.png',
  Monstro: 'Monstro/monstro.png',
  Fera: 'Fera/fera.png',
  Drazraq: 'Draconideo/draconideo.png',
};

export let specieImages = {};

export const specieData = {
  Draconídeo: { dir: 'Draconideo', race: 'draak', element: 'puro', attackType: 'Híbrido', dexNumber: 1, description: 'Senhor ancestral das montanhas, combina força bruta com energia arcana inata.' },
  Drazraq: { dir: 'Draconideo', race: 'drazraq', element: 'puro', attackType: 'Físico', dexNumber: 2, description: 'Guerreiro dracônico de reflexos rápidos e investidas cortantes.' },
  Reptiloide: { dir: 'Reptiloide', race: 'viborom', element: 'puro', attackType: 'Físico', dexNumber: 3, description: 'Predador rastejante que observa silencioso antes de atacar.' },
  Pidgly: { dir: 'Ave', race: 'Pidgly', element: 'terra', attackType: 'Físico', dexNumber: 4, description: 'Ave territorial que defende seu ninho com bicadas certeiras.' },
  Ignis: { dir: 'Ave', race: 'ignis', element: 'fogo', attackType: 'Mágico', dexNumber: 5, description: 'Espírito ígneo emplumado; suas chamas nunca se apagam.' },
  Mawthorn: { dir: 'Monstro', race: 'Mawthorn', element: 'agua', attackType: 'Físico', dexNumber: 6, description: 'Criatura lacustre coberta por placas e espinhos orgânicos.' },
  Owlberoth: { dir: 'CriaturaMistica', race: 'Owlberoth', element: 'terra', attackType: 'Mágico', dexNumber: 7, description: 'Guardião da clareira; olhos que enxergam através da névoa.' },
  Digitama: { dir: 'CriaturaMistica', race: 'Digitama', element: 'fogo', attackType: 'Mágico', dexNumber: 8, description: 'Essência incubada de fogo puro em forma de casulo vivo.' },
  Kael: { dir: 'Fera', race: 'Kael', element: 'agua', attackType: 'Mágico', dexNumber: 9, description: 'Ser fluido e sereno, domina correntes e névoas profundas.' },
  Leoracal: { dir: 'Fera', race: 'Kael', element: 'terra', attackType: 'Físico', dexNumber: 10, description: 'Felino oracular que ruge antes de qualquer mudança climática.' },
  Besta: { dir: 'Besta', race: 'Besta', element: 'terra', attackType: 'Físico', dexNumber: 11, description: 'Criatura selvagem de força bruta, habitante de vales e florestas.' },
};

export const eggSpecieMap = {
  eggAve: ['Pidgly', 'Ignis'],
  eggCriaturaMistica: ['Owlberoth', 'Digitama'],
  eggDraconideo: ['Draconídeo', 'Drazraq'],
  eggFera: ['Kael', 'Leoracal'],
  eggMonstro: ['Mawthorn'],
  eggReptiloide: ['Reptiloide'],
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
