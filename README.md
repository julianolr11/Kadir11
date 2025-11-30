# Kadir11

[![CI](https://github.com/julianolr11/Kadir11/actions/workflows/test.yml/badge.svg)](https://github.com/julianolr11/Kadir11/actions/workflows/test.yml)
![Coverage Statements](https://img.shields.io/badge/statements-99.7%25-brightgreen)
![Coverage Branches](https://img.shields.io/badge/branches-87.42%25-yellow)
![Coverage Lines](https://img.shields.io/badge/lines-100%25-brightgreen)
![Coverage Functions](https://img.shields.io/badge/functions-99.04%25-brightgreen)

Kadir11 é um jogo estilo Tamagotchi escrito em [Electron](https://electronjs.org/).

## Instalação

1. Certifique‑se de ter o [Node.js](https://nodejs.org/) instalado.
2. Execute `npm install` para baixar as dependências.

```bash
npm install
```

## Como iniciar

Após instalar as dependências, inicie o jogo com:

```bash
npm start
```

O comando `npm start` executa `electron .` abrindo a janela inicial (`start.html`).

## Resumo do funcionamento

- Na tela inicial é possível **criar** um novo pet ou **carregar** um existente.
- Os dados dos pets ficam salvos no diretório `pets/` dentro da pasta de dados do usuário (`userData`).
- As imagens de cada pet ficam organizadas em pastas dentro de `Assets/Mons/`. Caso não exista uma pasta específica para um pet, a imagem `eggsy.png` é utilizada como padrão.
- O atalho `Ctrl+Shift+D` abre as ferramentas de desenvolvedor do Electron.

O projeto utiliza `electron-store` para persistência de algumas informações e
mantém diversas janelas HTML para as funções de criação, batalha e status do seu
pet.

## Principais comandos

- `npm install` – instalação das dependências.
- `npm start` – inicia a aplicação.
- `npm test` – executa os testes automatizados.
- `npm run coverage` – gera relatório de cobertura de testes.

## 🧪 Testes e Qualidade

O projeto possui **137 testes automatizados** cobrindo handlers IPC, lógica de progressão, criação de pets, e sistema de batalha.

### Métricas de Cobertura Atual

```
Statements  : 99.7%  
Branches    : 87.42%
Functions   : 99.04%
Lines       : 100%
```

### Guia de Testes

Para informações detalhadas sobre a suite de testes, padrões de teste, e como escrever novos casos, consulte:

- **[docs/TESTING.md](docs/TESTING.md)** - Guia completo de testes e cobertura
- **[docs/API.md](docs/API.md)** - Documentação dos handlers e helpers

**Executar testes:**
```bash
npm test                    # Executa todos os testes
npm run coverage            # Gera relatório HTML em coverage/lcov-report/
npm test -- --grep "battle" # Executa apenas testes de batalha
```

## Efeitos de Status

Alguns golpes podem aplicar condições especiais durante as batalhas. Os efeitos disponíveis são:

- **Queimadura**: dano de 2% a 3% da vida total por turno durante 2 a 3 turnos.
- **Envenenamento**: dano de 1% a 2% da vida total por turno durante 3 a 5 turnos.
- **Sangramento**: dano de 3% da vida atual por turno por 2 turnos.
- **Dormência**: impede o pet de agir por 1 a 3 turnos; receber dano desperta o pet.
- **Congelamento**: paralisa o pet por 1 a 3 turnos e só é removido por cura ou calor.
- **Paralisia**: 50% de chance de não agir por 1 a 2 turnos, reduzindo um pouco a velocidade.

Os ícones desses efeitos estão em `Assets/Icons`.

## Arquitetura (Fase 3)

A aplicação passou por uma refatoração modular significativa na Fase 3 para reduzir o tamanho e acoplamento de `main.js`.

### Principais Módulos
- `scripts/windows/gameWindows.js`: Fábricas centralizadas de todas as janelas (battle, journey, lair, train, items, store, nests, hatch) + utilidades (`updateNestsPosition`, getters e fechamento em lote).
- `scripts/managers/stateManager.js`: Fonte única de verdade para `currentPet` e registro de janelas (eliminou estado duplicado em `main.js`).
- `scripts/state/storeState.js`: Encapsula `electron-store` (moedas, itens, pen, nests) e funções de broadcast.
- `scripts/logic/petGeneration.js`: Inicialização de espécies e geração de pets / raridade.
- `scripts/bootstrap/registerHandlers.js`: Bootstrap único que registra todos os handlers IPC de forma ordenada.
- `scripts/handlers/*.js`: Cada concern isolado (store, pet, moves, battle mechanics, nests, positioning, lifecycle, assets, game).
- `scripts/utils/idleAssets.js`: Resolução de assets (idle gifs) usada por handlers de jogo.

### Fluxo de Inicialização
1. Electron inicializa e cria `storeState` + `stateManager`.
2. Carrega espécies via `initSpecies()`.
3. Cria janelas base via `initGameWindows()`.
4. Invoca `registerAllHandlers()` que orquestra o registro de todos os canais IPC.
5. `stateManager` gerencia seleção de pet e dispara broadcasts de atualização.

### Nova Assinatura de Bootstrap

Exemplo da nova chamada agrupada em `main.js`:
```js
registerAllHandlers({
	electron: { ipcMain, BrowserWindow },
	managers: { windowManager, appState, petManager },
	store: { store },
	stateAccessors: { getCoins, setCoins, getItems, setItems, getPenInfo, getNestCount, getNestPrice, getNestsData, setNestsData, broadcastPenUpdate, broadcastNestUpdate, getDifficulty, setDifficulty },
	petGeneration: { generateRarity, generatePetFromEgg, getSpeciesData, baseDir: __dirname },
	cache: { journeyImagesCacheRef },
	windows: { createBattleModeWindow, createJourneyModeWindow, createJourneySceneWindow, createLairModeWindow, createTrainWindow, createTrainMenuWindow, createTrainAttributesWindow, createTrainForceWindow, createTrainDefenseWindow, createItemsWindow, createStoreWindow, createNestsWindow, createHatchWindow, updateNestsPosition, getStoreWindow, getItemsWindow, getHatchWindow, closeAllGameWindows },
	xp: { xpUtils: { calculateXpGain, getRequiredXpForNextLevel, increaseAttributesOnLevelUp } },
	handlers: { /* requires dos handlers */ }
});
```

### Benefícios da Refatoração
- Redução substancial de linhas em `main.js`.
- Facilidade para adicionar/remover handlers sem mexer no núcleo.
- Testes permanecem 100% funcionais (137 passando) garantindo paridade comportamental.
- Estrutura pronta para futura aplicação de ESLint/Prettier e divisão em pacotes.

### Próximos Passos Sugeridos
- Adicionar seção de arquitetura ao `docs/` com diagrama visual.
- Introduzir ESLint + Prettier.
- Consolidar objetos de configuração avançados (ex: agrupar funções de broadcast em um sub‑objeto `broadcast`).

## Lint & Formatação

O projeto agora inclui configuração de **ESLint** e **Prettier** para padronizar estilo e qualidade de código.

### Scripts
```bash
npm run lint       # Analisa todo o projeto
npm run lint:fix   # Tenta corrigir problemas automaticamente
npm run format     # Aplica formatação Prettier
```

### Configurações
- Arquivo `.eslintrc.json` com regras recomendadas + plugins: import, promise, node, prettier.
- `.prettierrc` define estilo (singleQuote, trailingComma, printWidth=100).
- Pastas ignoradas: `coverage/`, `Assets/`, `pets/`, `frontend/`.

### Convenções Principais
- `no-console` liberado (logs são úteis para depuração).
- Suporte a `.mjs` com `sourceType: module`.
- Regras de import relaxadas para permitir requires dinâmicos do Electron.

Execute `npm install` se ainda não tiver as novas dependências instaladas.

