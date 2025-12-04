const { ipcMain, BrowserWindow } = require('electron');
const fs = require('fs');
const path = require('path');

function registerPetManagerHandlers(deps) {
  const { createPetManagerWindow } = deps.windows;

  // Helper: calcula próximo dexNumber disponível lendo constants.mjs
  function getNextDexNumber() {
    try {
      const constantsPath = path.join(__dirname, '..', '..', 'scripts', 'constants.mjs');
      const content = fs.readFileSync(constantsPath, 'utf-8');
      const dexMatches = [...content.matchAll(/dexNumber:\s*(\d+)/g)];
      const numbers = dexMatches.map(m => parseInt(m[1], 10)).filter(n => Number.isInteger(n));
      const maxDex = numbers.length ? Math.max(...numbers) : 0;
      return maxDex + 1;
    } catch (err) {
      console.warn('Falha ao calcular próximo dexNumber, usando 1:', err);
      return 1;
    }
  }

  // Abrir janela de pet manager
  ipcMain.on('open-pet-manager', () => {
    console.log('Abrindo Pet Manager (Dev Mode)');
    createPetManagerWindow();
  });

  // Obter afinidades
  ipcMain.handle('get-species-affinities', async () => {
    try {
      const affinitiesPath = path.join(__dirname, '..', '..', 'data', 'species-affinities.json');
      const data = fs.readFileSync(affinitiesPath, 'utf-8');
      return JSON.parse(data);
    } catch (err) {
      console.error('Erro ao carregar afinidades:', err);
      return {};
    }
  });

  // Validar assets
  ipcMain.handle('validate-pet-assets', async (event, basePath) => {
    const assetsDir = path.join(__dirname, '..', '..', 'Assets', 'Mons', basePath);
    const frontPngPath = path.join(assetsDir, 'front.png');
    const frontGifPath = path.join(assetsDir, 'front.gif');
    const idlePath = path.join(assetsDir, 'idle.png');

    const missing = [];
    const hasFrontPng = fs.existsSync(frontPngPath);
    const hasFrontGif = fs.existsSync(frontGifPath);
    const hasFront = hasFrontPng || hasFrontGif;
    if (!hasFront) missing.push('front.png/front.gif');
    if (!fs.existsSync(idlePath)) missing.push('idle.png');

    return {
      valid: missing.length === 0,
      missing,
      frontExt: hasFrontPng ? 'png' : (hasFrontGif ? 'gif' : null)
    };
  });

  // Descobrir extensões de front (png/gif) em lote para evitar 404 na UI
  ipcMain.handle('get-front-ext-batch', async (event, items) => {
    try {
      const result = {};
      for (const it of items || []) {
        const { name, dir, element, race } = it || {};
        if (!name || !dir || !element || !race) continue;
        const assetsDir = path.join(__dirname, '..', '..', 'Assets', 'Mons', dir, element, race);
        const hasPng = fs.existsSync(path.join(assetsDir, 'front.png'));
        const hasGif = fs.existsSync(path.join(assetsDir, 'front.gif'));
        result[name] = hasPng ? 'png' : (hasGif ? 'gif' : null);
      }
      return result;
    } catch (err) {
      console.error('Erro em get-front-ext-batch:', err);
      return {};
    }
  });

  // Salvar novo pet
  ipcMain.handle('save-new-pet', async (event, { pet, affinity }) => {
    try {
      console.log('Salvando novo pet:', pet.name);
      // Gera dexNumber automaticamente se não fornecido
      if (!Number.isInteger(pet.dexNumber)) {
        pet.dexNumber = getNextDexNumber();
        console.log('dexNumber auto-gerado:', pet.dexNumber);
      }
      
      // 1. Atualizar constants.mjs
      const constantsPath = path.join(__dirname, '..', '..', 'scripts', 'constants.mjs');
      let constantsContent = fs.readFileSync(constantsPath, 'utf-8');

      // Adicionar em specieData
      const sizeProp = Number.isFinite(pet.sizeMeters) ? `, sizeMeters: ${pet.sizeMeters}` : '';
      const specieEntry = `  ${pet.name}: { dir: '${pet.dir}', race: '${pet.race}', element: '${pet.element}', attackType: '${pet.attackType}', dexNumber: ${pet.dexNumber}, description: '${pet.description}'${sizeProp} },\n`;
      
      // Encontrar o final do specieData e adicionar antes do último };
      const specieDataMatch = constantsContent.match(/(export const specieData = \{[\s\S]*?)(};)/);
      if (specieDataMatch) {
        constantsContent = constantsContent.replace(
          specieDataMatch[0],
          specieDataMatch[1] + specieEntry + specieDataMatch[2]
        );
      }

      // Adicionar em specieDirs
      const specieDirsEntry = `  ${pet.name}: '${pet.dir}',\n`;
      const specieDirsMatch = constantsContent.match(/(export const specieDirs = \{[\s\S]*?)(};)/);
      if (specieDirsMatch) {
        constantsContent = constantsContent.replace(
          specieDirsMatch[0],
          specieDirsMatch[1] + specieDirsEntry + specieDirsMatch[2]
        );
      }

      // Adicionar no eggSpecieMap baseado no elemento
      const eggMap = {
        'fogo': 'eggAve',
        'agua': 'eggFera',
        'terra': 'eggCriaturaMistica',
        'puro': 'eggDraconideo',
        'ar': 'eggAve'
      };
      const eggType = eggMap[pet.element] || 'eggAve';
      
      // Encontrar o egg correspondente e adicionar a espécie
      const eggRegex = new RegExp(`(${eggType}: \\[)([^\\]]*)(\\])`);
      const eggMatch = constantsContent.match(eggRegex);
      if (eggMatch) {
        const currentSpecies = eggMatch[2].trim();
        const newSpecies = currentSpecies ? `${currentSpecies}, '${pet.name}'` : `'${pet.name}'`;
        constantsContent = constantsContent.replace(eggRegex, `$1${newSpecies}$3`);
      }

      fs.writeFileSync(constantsPath, constantsContent, 'utf-8');
      console.log('constants.mjs atualizado');

      // 2. Atualizar species-affinities.json
      const affinitiesPath = path.join(__dirname, '..', '..', 'data', 'species-affinities.json');
      let affinities = {};
      if (fs.existsSync(affinitiesPath)) {
        affinities = JSON.parse(fs.readFileSync(affinitiesPath, 'utf-8'));
      }
      
      affinities[pet.name] = affinity;
      fs.writeFileSync(affinitiesPath, JSON.stringify(affinities, null, 2), 'utf-8');
      console.log('species-affinities.json atualizado');

      // Resetar cache de espécies para refletir mudanças imediatamente (usar URL correta)
      try {
        const { pathToFileURL } = require('url');
        const modUrl = pathToFileURL(path.join(__dirname, '..', '..', 'scripts', 'constants.mjs')).href;
        const constantsMod = await import(modUrl);
        if (constantsMod && typeof constantsMod.resetSpeciesCache === 'function') {
          constantsMod.resetSpeciesCache();
        }
      } catch (err) {
        console.warn('Não foi possível resetar cache via import ESM:', err);
      }

      // Notificar janelas para recarregar
      BrowserWindow.getAllWindows().forEach(win => {
        if (win && win.webContents) {
          win.webContents.send('species-updated');
        }
      });

      return { success: true };
    } catch (err) {
      console.error('Erro ao salvar pet:', err);
      throw new Error('Falha ao salvar: ' + err.message);
    }
  });

  // Excluir espécie do sistema
  ipcMain.handle('delete-species', async (event, petName) => {
    try {
      console.log('=== HANDLER delete-species INICIADO ===');
      console.log('Pet a excluir:', petName);
      
      // 1. Remover de constants.mjs
      const constantsPath = path.join(__dirname, '..', '..', 'scripts', 'constants.mjs');
      console.log('Caminho do constants.mjs:', constantsPath);
      let constantsContent = fs.readFileSync(constantsPath, 'utf-8');
      console.log('Arquivo constants.mjs lido, tamanho:', constantsContent.length);

      // Escapar caracteres especiais do nome
      const escapedName = petName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      console.log('Nome escapado:', escapedName);

      // Remover do specieData (captura a linha inteira incluindo vírgula e quebra)
      const specieRegex = new RegExp(`\\s*${escapedName}:\\s*\\{[^}]*\\},?\\s*\\n?`, 'g');
      const beforeSpecieData = constantsContent.length;
      constantsContent = constantsContent.replace(specieRegex, '\n');
      console.log('specieData - removeu', beforeSpecieData - constantsContent.length, 'caracteres');

      // Remover do specieDirs
      const dirRegex = new RegExp(`\\s*${escapedName}:\\s*'[^']*',?\\s*\\n?`, 'g');
      constantsContent = constantsContent.replace(dirRegex, '\n');

      // Remover do eggSpecieMap (com aspas simples ou sem, com vírgula antes ou depois)
      const eggMapRegex1 = new RegExp(`,\\s*'${escapedName}'`, 'g');
      const eggMapRegex2 = new RegExp(`'${escapedName}'\\s*,`, 'g');
      const eggMapRegex3 = new RegExp(`'${escapedName}'`, 'g');
      constantsContent = constantsContent.replace(eggMapRegex1, '');
      constantsContent = constantsContent.replace(eggMapRegex2, '');
      constantsContent = constantsContent.replace(eggMapRegex3, '');

      // Limpar linhas vazias extras, vírgulas duplas e trailing commas
      constantsContent = constantsContent.replace(/\n\s*\n\s*\n/g, '\n\n');
      constantsContent = constantsContent.replace(/,\s*,/g, ',');
      constantsContent = constantsContent.replace(/,(\s*[\]}])/g, '$1');
      constantsContent = constantsContent.replace(/\[\s*,/g, '[');

      fs.writeFileSync(constantsPath, constantsContent, 'utf-8');
      console.log('constants.mjs atualizado (pet removido)');

      // 2. Remover de species-affinities.json
      const affinitiesPath = path.join(__dirname, '..', '..', 'data', 'species-affinities.json');
      let affinities = {};
      if (fs.existsSync(affinitiesPath)) {
        affinities = JSON.parse(fs.readFileSync(affinitiesPath, 'utf-8'));
      }
      
      delete affinities[petName];
      fs.writeFileSync(affinitiesPath, JSON.stringify(affinities, null, 2), 'utf-8');
      console.log('species-affinities.json atualizado (pet removido)');

      // 3. Notificar janela Pet Manager para recarregar
      BrowserWindow.getAllWindows().forEach(win => {
        if (win && win.webContents) {
          win.webContents.send('species-updated');
        }
      });

      return { success: true };
    } catch (err) {
      console.error('Erro ao excluir pet:', err);
      throw new Error('Falha ao excluir: ' + err.message);
    }
  });

  // Renomear espécie
  ipcMain.handle('rename-species', async (event, { oldName, newName, dexNumber }) => {
    try {
      console.log(`Renomeando/Atualizando espécie: ${oldName} → ${newName}` + (Number.isInteger(dexNumber) ? ` (dex=${dexNumber})` : ''));
      
      // 1. Atualizar constants.mjs
      const constantsPath = path.join(__dirname, '..', '..', 'scripts', 'constants.mjs');
      let constantsContent = fs.readFileSync(constantsPath, 'utf-8');

      // Escapar caracteres especiais
      const escapedOld = oldName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const escapedNew = newName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

      // Substituir em specieData
      const specieDataRegex = new RegExp(`(\\s*)${escapedOld}:(\\s*\\{)`, 'g');
      constantsContent = constantsContent.replace(specieDataRegex, `$1${newName}:$2`);

      // Atualizar dexNumber dentro do objeto, se fornecido
      if (Number.isInteger(dexNumber)) {
        const dexRegex = new RegExp(`(${newName}:\\s*\\{[^}]*?dexNumber:\\s*)\\d+`);
        if (dexRegex.test(constantsContent)) {
          constantsContent = constantsContent.replace(dexRegex, `$1${dexNumber}`);
        }
      }

      // Substituir em specieDirs
      const specieDirsRegex = new RegExp(`(\\s*)${escapedOld}:(\\s*')`, 'g');
      constantsContent = constantsContent.replace(specieDirsRegex, `$1${newName}:$2`);

      // Substituir em eggSpecieMap
      const eggMapRegex = new RegExp(`'${escapedOld}'`, 'g');
      constantsContent = constantsContent.replace(eggMapRegex, `'${newName}'`);

      fs.writeFileSync(constantsPath, constantsContent, 'utf-8');
      console.log('constants.mjs atualizado (espécie renomeada)');

      // 2. Atualizar species-affinities.json
      const affinitiesPath = path.join(__dirname, '..', '..', 'data', 'species-affinities.json');
      let affinities = {};
      if (fs.existsSync(affinitiesPath)) {
        affinities = JSON.parse(fs.readFileSync(affinitiesPath, 'utf-8'));
      }
      
      if (affinities[oldName]) {
        affinities[newName] = affinities[oldName];
        delete affinities[oldName];
        fs.writeFileSync(affinitiesPath, JSON.stringify(affinities, null, 2), 'utf-8');
        console.log('species-affinities.json atualizado (espécie renomeada)');
      }

      // Notificar janelas para recarregar
      BrowserWindow.getAllWindows().forEach(win => {
        if (win && win.webContents) {
          win.webContents.send('species-updated');
        }
      });

      return { success: true };
    } catch (err) {
      console.error('Erro ao renomear espécie:', err);
      throw new Error('Falha ao renomear: ' + err.message);
    }
  });

  // Aplicar alterações em lote (staged changes)
  ipcMain.handle('apply-species-changes', async (event, changes) => {
    const { creates = [], updates = [], deletes = [] } = changes || {};
    try {
      // 1) Deletar espécies
      for (const name of deletes) {
        try {
          const constantsPath = path.join(__dirname, '..', '..', 'scripts', 'constants.mjs');
          let constantsContent = fs.readFileSync(constantsPath, 'utf-8');

          const escapedName = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

          const specieRegex = new RegExp(`\\s*${escapedName}:\\s*\\{[^}]*\\},?\\s*\\n?`, 'g');
          constantsContent = constantsContent.replace(specieRegex, '\n');

          const dirRegex = new RegExp(`\\s*${escapedName}:\\s*'[^']*',?\\s*\\n?`, 'g');
          constantsContent = constantsContent.replace(dirRegex, '\n');

          const eggMapRegex1 = new RegExp(`,\\s*'${escapedName}'`, 'g');
          const eggMapRegex2 = new RegExp(`'${escapedName}'\\s*,`, 'g');
          const eggMapRegex3 = new RegExp(`'${escapedName}'`, 'g');
          constantsContent = constantsContent.replace(eggMapRegex1, '');
          constantsContent = constantsContent.replace(eggMapRegex2, '');
          constantsContent = constantsContent.replace(eggMapRegex3, '');

          constantsContent = constantsContent.replace(/\n\s*\n\s*\n/g, '\n\n');
          constantsContent = constantsContent.replace(/,\s*,/g, ',');
          constantsContent = constantsContent.replace(/,(\s*[\]}])/g, '$1');
          constantsContent = constantsContent.replace(/\[\s*,/g, '[');

          fs.writeFileSync(constantsPath, constantsContent, 'utf-8');

          const affinitiesPath = path.join(__dirname, '..', '..', 'data', 'species-affinities.json');
          let affinities = {};
          if (fs.existsSync(affinitiesPath)) {
            affinities = JSON.parse(fs.readFileSync(affinitiesPath, 'utf-8'));
          }
          delete affinities[name];
          fs.writeFileSync(affinitiesPath, JSON.stringify(affinities, null, 2), 'utf-8');
        } catch (err) {
          console.error('Erro ao excluir em lote:', name, err);
          throw err;
        }
      }

      // 2) Atualizar/renomear espécies
      for (const upd of updates) {
        const { oldName, newName, dexNumber, sizeMeters } = upd;
        try {
          const constantsPath = path.join(__dirname, '..', '..', 'scripts', 'constants.mjs');
          let constantsContent = fs.readFileSync(constantsPath, 'utf-8');

          const escapedOld = oldName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          const specieDataRegex = new RegExp(`(\\s*)${escapedOld}:(\\s*\\{)`, 'g');
          constantsContent = constantsContent.replace(specieDataRegex, `$1${newName}:$2`);

          if (Number.isInteger(dexNumber)) {
            const dexRegex = new RegExp(`(${newName}:\\s*\\{[^}]*?dexNumber:\\s*)\\d+`);
            if (dexRegex.test(constantsContent)) {
              constantsContent = constantsContent.replace(dexRegex, `$1${dexNumber}`);
            }
          }

          // Atualiza/insere sizeMeters, se fornecido
          if (Number.isFinite(sizeMeters)) {
            const sizeRegexExisting = new RegExp(`(${newName}:\\s*\\{[^}]*?sizeMeters:\\s*)[0-9]+(\\.[0-9]+)?`);
            if (sizeRegexExisting.test(constantsContent)) {
              constantsContent = constantsContent.replace(sizeRegexExisting, `$1${sizeMeters}`);
            } else {
              // Inserir propriedade antes do fechamento }
              const objRegex = new RegExp(`(${newName}:\\s*\\{[\\s\\S]*?)}`);
              if (objRegex.test(constantsContent)) {
                constantsContent = constantsContent.replace(objRegex, `$1, sizeMeters: ${sizeMeters}}`);
              }
            }
          }

          const specieDirsRegex = new RegExp(`(\\s*)${escapedOld}:(\\s*')`, 'g');
          constantsContent = constantsContent.replace(specieDirsRegex, `$1${newName}:$2`);

          const eggMapRegex = new RegExp(`'${escapedOld}'`, 'g');
          constantsContent = constantsContent.replace(eggMapRegex, `'${newName}'`);

          fs.writeFileSync(constantsPath, constantsContent, 'utf-8');

          const affinitiesPath = path.join(__dirname, '..', '..', 'data', 'species-affinities.json');
          let affinities = {};
          if (fs.existsSync(affinitiesPath)) {
            affinities = JSON.parse(fs.readFileSync(affinitiesPath, 'utf-8'));
          }
          if (affinities[oldName]) {
            affinities[newName] = affinities[oldName];
            delete affinities[oldName];
            fs.writeFileSync(affinitiesPath, JSON.stringify(affinities, null, 2), 'utf-8');
          }
        } catch (err) {
          console.error('Erro ao atualizar em lote:', oldName, '->', newName, err);
          throw err;
        }
      }

      // 3) Criar novas espécies
      for (const create of creates) {
        const { pet, affinity } = create;
        try {
          // Gera dexNumber automaticamente se não fornecido
          if (!Number.isInteger(pet.dexNumber)) {
            pet.dexNumber = getNextDexNumber();
          }
          const constantsPath = path.join(__dirname, '..', '..', 'scripts', 'constants.mjs');
          let constantsContent = fs.readFileSync(constantsPath, 'utf-8');

          const sizeProp2 = Number.isFinite(pet.sizeMeters) ? `, sizeMeters: ${pet.sizeMeters}` : '';
          const specieEntry = `  ${pet.name}: { dir: '${pet.dir}', race: '${pet.race}', element: '${pet.element}', attackType: '${pet.attackType}', dexNumber: ${pet.dexNumber}, description: '${pet.description}'${sizeProp2} },\n`;
          const specieDataMatch = constantsContent.match(/(export const specieData = \{[\s\S]*?)(};)/);
          if (specieDataMatch) {
            constantsContent = constantsContent.replace(
              specieDataMatch[0],
              specieDataMatch[1] + specieEntry + specieDataMatch[2]
            );
          }

          const specieDirsEntry = `  ${pet.name}: '${pet.dir}',\n`;
          const specieDirsMatch = constantsContent.match(/(export const specieDirs = \{[\s\S]*?)(};)/);
          if (specieDirsMatch) {
            constantsContent = constantsContent.replace(
              specieDirsMatch[0],
              specieDirsMatch[1] + specieDirsEntry + specieDirsMatch[2]
            );
          }

          const eggMap = {
            'fogo': 'eggAve',
            'agua': 'eggFera',
            'terra': 'eggCriaturaMistica',
            'puro': 'eggDraconideo',
            'ar': 'eggAve'
          };
          const eggType = eggMap[pet.element] || 'eggAve';
          const eggRegex = new RegExp(`(${eggType}: \\[)([^\\]]*)(\\])`);
          const eggMatch = constantsContent.match(eggRegex);
          if (eggMatch) {
            const currentSpecies = eggMatch[2].trim();
            const newSpecies = currentSpecies ? `${currentSpecies}, '${pet.name}'` : `'${pet.name}'`;
            constantsContent = constantsContent.replace(eggRegex, `$1${newSpecies}$3`);
          }

          fs.writeFileSync(constantsPath, constantsContent, 'utf-8');

          const affinitiesPath = path.join(__dirname, '..', '..', 'data', 'species-affinities.json');
          let affinities = {};
          if (fs.existsSync(affinitiesPath)) {
            affinities = JSON.parse(fs.readFileSync(affinitiesPath, 'utf-8'));
          }
          affinities[pet.name] = affinity;
          fs.writeFileSync(affinitiesPath, JSON.stringify(affinities, null, 2), 'utf-8');
        } catch (err) {
          console.error('Erro ao criar em lote:', create?.pet?.name, err);
          throw err;
        }
      }

      // Resetar cache e notificar uma única vez
      try {
        const { pathToFileURL } = require('url');
        const modUrl = pathToFileURL(path.join(__dirname, '..', '..', 'scripts', 'constants.mjs')).href;
        const constantsMod = await import(modUrl);
        if (constantsMod && typeof constantsMod.resetSpeciesCache === 'function') {
          constantsMod.resetSpeciesCache();
        }
      } catch (err) {
        console.warn('Não foi possível resetar cache via import ESM (batch):', err);
      }

      BrowserWindow.getAllWindows().forEach(win => {
        if (win && win.webContents) {
          win.webContents.send('species-updated');
        }
      });

      return { success: true, applied: { deletes: deletes.length, updates: updates.length, creates: creates.length } };
    } catch (err) {
      console.error('Erro em apply-species-changes:', err);
      throw new Error('Falha ao aplicar alterações: ' + err.message);
    }
  });

  console.log('Pet Manager Handlers registrados');
}

module.exports = { registerPetManagerHandlers };
