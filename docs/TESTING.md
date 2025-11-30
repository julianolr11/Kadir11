# Testing Guide - Kadir11

## 📊 Métricas de Cobertura

Cobertura de testes atualizada em: **29 de novembro de 2025**

```
╔═══════════════════════════╦══════════╗
║ Métrica                   ║ Cobertura║
╠═══════════════════════════╬══════════╣
║ Statements                ║  99.7%   ║
║ Branches                  ║  87.42%  ║
║ Functions                 ║  99.04%  ║
║ Lines                     ║  100%    ║
╚═══════════════════════════╩══════════╝
```

### Cobertura por Módulo

| Módulo                         | Statements | Branches | Functions | Lines |
|--------------------------------|------------|----------|-----------|-------|
| **scripts/create-pet.js**      | 100%       | 93.33%   | 100%      | 100%  |
| **handlers/battleMechanics**   | 100%       | 84%      | 100%      | 100%  |
| **handlers/nestHandlers**      | 100%       | 80.95%   | 100%      | 100%  |
| **handlers/storeHandlers**     | 98.9%      | 86.02%   | 94.44%    | 100%  |
| **handlers/windowPositioning** | 100%       | 82.97%   | 100%      | 100%  |
| **logic/moveLearning**         | 100%       | 91.66%   | 100%      | 100%  |
| **logic/progression**          | 100%       | 88%      | 100%      | 100%  |
| **utils/logger**               | 100%       | 100%     | 100%      | 100%  |

## 🧪 Executando Testes

### Comandos Disponíveis

```bash
# Executar todos os testes
npm test

# Executar com relatório de cobertura
npm run coverage

# Executar testes específicos
npm test -- --grep "battleMechanics"

# Modo watch (re-executa ao salvar)
npm test -- --watch
```

### Estrutura de Testes

```
test/
├── battleMechanicsHandlers.*.test.js    # Testes de mecânicas de batalha
├── nestHandlers.*.test.js               # Testes de sistema de ninhos
├── storeHandlers.test.js                # Testes de loja e items
├── windowPositioningHandlers.*.test.js  # Testes de janelas
├── createPet.*.test.js                  # Testes de criação de pets
├── progression.*.test.js                # Testes de progressão/XP
├── logger.*.test.js                     # Testes de logging
└── logic.extra.test.js                  # Testes de lógica geral
```

**Total**: 137 testes passando

## 🏗️ Arquitetura de Testes

### Padrões Utilizados

1. **Dependency Injection**: Todos os handlers recebem dependências via parâmetros
   ```javascript
   setupBattleMechanicsHandlers({
     getCurrentPet,
     petManager,
     ipcMain,
     BrowserWindow
   });
   ```

2. **IPC Mocking**: Electron IPC é mockado via stub objects
   ```javascript
   const ipcStub = {
     handlers: {},
     emit: (ch, ...args) => handlers[ch]?.({}, ...args)
   };
   ```

3. **Window Broadcasting**: BrowserWindow.getAllWindows() mockado com arrays
   ```javascript
   BrowserWindow: {
     getAllWindows: () => mockWindows
   }
   ```

### Helpers Testados

#### battleMechanicsHandlers.js
- `broadcastPetData(pet)` - Envia dados do pet para todas as janelas

#### nestHandlers.js
- `broadcastToWindows(callback)` - Executa callback em todas as janelas com webContents

#### windowPositioningHandlers.js
- `setupWindow(createFn, failMsg, sendDataFn, alignOptions)` - Setup unificado de janelas

## 📝 Escrevendo Novos Testes

### Template Básico

```javascript
const assert = require('assert');
const { setupYourHandler } = require('../scripts/handlers/yourHandler');

describe('yourHandler', () => {
  let mockState;
  
  beforeEach(() => {
    mockState = { /* estado inicial */ };
  });

  it('deve fazer X quando Y acontece', () => {
    const handlers = {};
    const ipcMain = { on: (ch, fn) => handlers[ch] = fn };
    
    setupYourHandler({
      dependency1: () => mockState,
      ipcMain,
      BrowserWindow: { getAllWindows: () => [] }
    });
    
    handlers['seu-evento']({}, /* args */);
    
    assert.strictEqual(mockState.prop, expectedValue);
  });
});
```

### Boas Práticas

✅ **DO**
- Isole cada teste (use `beforeEach` para reset)
- Mock todas as dependências externas
- Teste um comportamento por caso
- Use nomes descritivos (`deve X quando Y`)
- Valide tanto sucesso quanto falha

❌ **DON'T**
- Compartilhe estado entre testes
- Dependa da ordem de execução
- Teste implementação (foque no comportamento)
- Ignore erros assíncronos

### Cobrindo Branches

Para aumentar branch coverage, foque em:

1. **Guards de validação**: teste com valores null/undefined
2. **Condições compostas**: teste cada branch do if/else
3. **Try/Catch**: force erros para cobrir catch blocks
4. **Loops**: teste com arrays vazios e não-vazios
5. **Operadores ternários**: teste ambos os lados

```javascript
// Exemplo: cobrindo guard
it('retorna early quando pet é null', () => {
  const deps = { getCurrentPet: () => null };
  // ... teste que valida early return
});

// Exemplo: cobrindo catch
it('faz rollback quando updatePet falha', async () => {
  const deps = {
    petManager: {
      updatePet: async () => { throw new Error('fail'); }
    }
  };
  // ... teste que valida rollback
});
```

## 🔍 Analisando Cobertura

### Gerando Relatório

```bash
npm run coverage
```

O relatório HTML é gerado em `coverage/lcov-report/index.html`

### Interpretando Resultados

- **Verde (E)**: Linha executada
- **Vermelho (I)**: Linha não executada  
- **Amarelo (E/I)**: Branch parcialmente coberto

### Gaps Conhecidos

Alguns branches intencionalmente não cobertos:

- **create-pet.js** (linhas 352-355, 396): Fallbacks de animação em DOM real
- **battleMechanicsHandlers** (6-11, 34): Guards de tipo/undefined em parâmetros opcionais
- **nestHandlers** (6-20, 103): Validação inicial de dependências
- **storeHandlers** (210-213): Error handling de gift codes

Estes representam ~12% dos branches não cobertos (edge cases raros ou código defensivo).

## 🚀 CI/CD

### GitHub Actions (futura integração)

```yaml
# .github/workflows/test.yml
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm test
      - run: npm run coverage
```

### Quality Gates

Mínimos recomendados:
- Statements: ≥ 95%
- Branches: ≥ 85%
- Functions: ≥ 95%
- Lines: ≥ 95%

## 📚 Referências

- [Mocha Documentation](https://mochajs.org/)
- [NYC Coverage Tool](https://github.com/istanbuljs/nyc)
- [Electron Testing Guide](https://www.electronjs.org/docs/latest/tutorial/testing-on-headless-ci)
