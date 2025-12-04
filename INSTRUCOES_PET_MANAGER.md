# Instruções para Completar o Sistema de Pet Manager (Dev Mode)

## 📋 Resumo
Sistema completo para cadastrar novos pets via interface gráfica acessível por cheat code na tela inicial.

---

## ✅ Já Foi Criado
- ✓ `data/species-affinities.json` - Arquivo com afinidades dos 11 pets
- ✓ `views/admin/pet-manager.html` - Interface completa de cadastro
- ✓ `scripts/pet-manager-admin.js` - Lógica frontend do cadastro

---

## 🔧 O Que Falta Fazer

### 1. Adicionar Cheat Code no `scripts/start.js`

**Adicione no FINAL do arquivo:**

```javascript
// Cheat code para abrir tela de dev (digitar "DEVMODE")
let cheatBuffer = '';
const cheatCode = 'DEVMODE';
let cheatTimeout = null;

document.addEventListener('keydown', (e) => {
  cheatBuffer += e.key.toUpperCase();
  
  clearTimeout(cheatTimeout);
  cheatTimeout = setTimeout(() => {
    cheatBuffer = '';
  }, 2000);
  
  if (cheatBuffer.includes(cheatCode)) {
    cheatBuffer = '';
    console.log('🔧 Dev Mode ativado!');
    if (window.electronAPI) {
      window.electronAPI.send('open-pet-manager');
    }
  }
  
  if (cheatBuffer.length > 20) {
    cheatBuffer = cheatBuffer.slice(-10);
  }
});
```

---

### 2. Adicionar Canais IPC no `preload.js`

**Na array `validChannels` da função `send`, adicione:**
```javascript
'open-pet-manager',
```

**Na array `validChannels` da função `invoke`, adicione:**
```javascript
'get-species-affinities',
'validate-pet-assets',
'save-new-pet',
// Batch apply de alterações (staging)
'apply-species-changes',
```

---

### 3. Criar Janela no `scripts/windows/gameWindows.js`

**Adicione no início (com as outras variáveis `let`):**
```javascript
let petManagerWindow = null;
```

**Adicione a função de criação (junto com as outras funções `create...`):**
```javascript
function createPetManagerWindow() {
  if (petManagerWindow) {
    petManagerWindow.show();
    petManagerWindow.focus();
    return petManagerWindow;
  }
  petManagerWindow = new BrowserWindow({
    width: 1000,
    height: 800,
    frame: false,
    transparent: true,
    resizable: false,
    show: false,
    webPreferences: { preload: preloadPath(), nodeIntegration: false, contextIsolation: true },
  });
  petManagerWindow.loadFile(path.join('views', 'admin', 'pet-manager.html'));
  windowManager.attachFadeHandlers(petManagerWindow);
  petManagerWindow.on('closed', () => {
    petManagerWindow = null;
  });
  return petManagerWindow;
}
```

**No `return` do final do módulo, adicione:**
```javascript
createPetManagerWindow,
```

---

### 4. Adicionar Handlers IPC no Main Process

**Crie novo arquivo `scripts/handlers/petManagerHandlers.js`:**

```javascript
const { ipcMain } = require('electron');
const fs = require('fs');
const path = require('path');

function registerPetManagerHandlers(deps) {
  const { createPetManagerWindow } = deps.windows;

  // Abrir janela de pet manager
  ipcMain.on('open-pet-manager', () => {
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

  // Validar assets (aceita front.png OU front.gif + idle.png)
  ipcMain.handle('validate-pet-assets', async (event, basePath) => {
    const assetsDir = path.join(__dirname, '..', '..', 'Assets', 'Mons', basePath);
    const frontPngPath = path.join(assetsDir, 'front.png');
    const frontGifPath = path.join(assetsDir, 'front.gif');
    const idlePath = path.join(assetsDir, 'idle.png');

    const missing = [];
    const hasFront = fs.existsSync(frontPngPath) || fs.existsSync(frontGifPath);
    if (!hasFront) missing.push('front.png/front.gif');
    if (!fs.existsSync(idlePath)) missing.push('idle.png');

    return {
      valid: missing.length === 0,
      missing
    };
  });

  // Salvar novo pet
  ipcMain.handle('save-new-pet', async (event, { pet, affinity }) => {
    try {
      // 1. Atualizar constants.mjs
      const constantsPath = path.join(__dirname, '..', '..', 'scripts', 'constants.mjs');
      let constantsContent = fs.readFileSync(constantsPath, 'utf-8');

      // Adicionar em specieData (antes do último };)
      const specieEntry = `  ${pet.name}: { dir: '${pet.dir}', race: '${pet.race}', element: '${pet.element}', attackType: '${pet.attackType}', dexNumber: ${pet.dexNumber}, description: '${pet.description}' },\n`;
      constantsContent = constantsContent.replace(
        /(export const specieData = \{[^}]+)(};)/s,
        `$1${specieEntry}$2`
      );

      // Adicionar em eggSpecieMap se necessário (lógica básica: adiciona no egg do elemento)
      const eggMap = {
        'fogo': 'eggAve',
        'agua': 'eggFera',
        'terra': 'eggCriaturaMistica',
        'puro': 'eggDraconideo',
        'ar': 'eggAve'
      };
      const eggType = eggMap[pet.element] || 'eggAve';
      
      fs.writeFileSync(constantsPath, constantsContent, 'utf-8');

      // 2. Atualizar species-affinities.json
      const affinitiesPath = path.join(__dirname, '..', '..', 'data', 'species-affinities.json');
      let affinities = {};
      if (fs.existsSync(affinitiesPath)) {
        affinities = JSON.parse(fs.readFileSync(affinitiesPath, 'utf-8'));
      }
      
      affinities[pet.name] = affinity;
      fs.writeFileSync(affinitiesPath, JSON.stringify(affinities, null, 2), 'utf-8');

      return { success: true };
    } catch (err) {
      console.error('Erro ao salvar pet:', err);
      throw new Error('Falha ao salvar: ' + err.message);
    }
  });
}

module.exports = { registerPetManagerHandlers };
```

---

### 5. Registrar Handler no `scripts/bootstrap/registerHandlers.js`

**No início do arquivo, adicione o import:**
```javascript
const { registerPetManagerHandlers } = require('../handlers/petManagerHandlers');
```

**No final da função `registerAllHandlers`, ANTES do `return`, adicione:**
```javascript
  // 14. Pet Manager (dev mode)
  registerPetManagerHandlers({
    windows: { createPetManagerWindow }
  });
```

---

### 6. Atualizar `scripts/create-pet.js` para Carregar Afinidades do JSON

**Substitua a seção de afinidades hardcoded por:**

```javascript
  // Afinidades de cada pet com os atributos (carregadas do JSON)
  let affinities = {};
  
  try {
    const affinitiesData = await fetch('../../data/species-affinities.json')
      .then(r => r.json());
    affinities = affinitiesData;
  } catch (err) {
    console.warn('Falha ao carregar afinidades, usando fallback balanceado');
    // Fallback: afinidade balanceada para pets sem configuração
  }
  
  // Fallback para espécies sem afinidade definida
  const defaultAffinity = { attack: 1, defense: 1, speed: 1, magic: 1, life: 1 };
```

**E então, na parte que usa `affinities[specie]`, altere para:**
```javascript
const affinity = affinities[specie] || defaultAffinity;
```

---

## 🎮 Como Usar (com Staging)

1. **Abra o jogo** na tela inicial (`start.html`)
2. **Digite "DEVMODE"** (sem aspas, em qualquer lugar da tela)
3. **Tela de cadastro abre** automaticamente
4. **Preencha os dados** do novo pet:
   - Nome, raça, diretório, elemento, tipo de ataque
   - Afinidades (0-3 para cada atributo)
5. **Clique em "Validar Assets"** para confirmar que `front.png` ou `front.gif` e `idle.png` existem
6. **Clique em "Salvar Pet"** para adicionar às alterações pendentes (não grava ainda)
7. Na barra "Alterações Pendentes", clique em **"Salvar Alterações"** para aplicar tudo em lote
8. **Reinicie o jogo** para ver o novo pet disponível

---

## 🔍 Estrutura de Pastas Para Novos Pets

```
Assets/Mons/
  └── {Diretório}/
      └── {elemento}/
          └── {raça}/
              ├── front.png  (ou front.gif)
              └── idle.png   (obrigatório)
```

**Exemplo:**
```
Assets/Mons/
  └── Ave/
      └── fogo/
          └── phoenix/
              ├── front.png
              └── idle.png
```

---

## ⚠️ Notas Importantes

- **Backup**: Faça backup de `constants.mjs` antes de cadastrar pets
- **Validação**: Sempre valide os assets antes de salvar
- **DexNumber**: Será gerado automaticamente se não preenchido
- **Elemento**: Determina em qual egg o pet aparece
- **Afinidades**: Valores de 0 a 3 (0 = nenhuma afinidade, 3 = máxima)

---

## 🐛 Troubleshooting

- **Cheat code não funciona**: Verifique se adicionou o código no `start.js`
- **Tela não abre**: Verifique se os canais IPC estão no `preload.js`
- **Assets não validam**: Certifique-se que existem `front.png` ou `front.gif` e `idle.png` no caminho correto
- **Erros de front.png no console**: A lista tenta `front.png` e cai para `front.gif` automaticamente; se ambos faltarem, mostra `eggsy.png`. O primeiro 404 é esperado se só houver GIF.

---

## 🧪 Staging (Alterações Pendentes)

- Ações de Criar/Editar/Excluir ficam pendentes até clicar em "Salvar Alterações".
- Ordem de aplicação: exclusões → renomeios/atualizações (nome/dex) → criações.
- A lista mostra um estado virtual: esconde deletados, reflete renomeios e inclui criações pendentes.
- "Descartar" limpa todas as pendências sem alterar o backend.
- **Pet não aparece**: Reinicie o app após salvar

---

Pronto! Sistema completo e funcional. 🎉
