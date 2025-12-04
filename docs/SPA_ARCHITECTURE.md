# Arquitetura SPA (Single Page Application) - Kadir11

## Visão Geral
Refatoração do Kadir11 de um sistema multi-window para uma arquitetura SPA em uma única janela, melhorando performance, UX e manutenibilidade.

## Estado Atual (Multi-Window)
- **Estrutura**: Cada modo de jogo tem seu próprio HTML + BrowserWindow
- **Exemplos**: battle-mode.html, journey-mode.html, status.html, etc.
- **Comunicação**: IPC entre janelas principal e secundárias
- **Overhead**: Cada janela = novo contexto de navegador, mais memória

## Proposta SPA: Uma Única Janela

### 1. Estrutura Base
```
index.html (única janela principal)
├── scripts/router.js (controle de navegação)
├── scripts/pages/ (cada "página" como módulo)
│   ├── pages/home.js
│   ├── pages/battle.js
│   ├── pages/journey.js
│   ├── pages/status.js
│   └── ... (outros modos)
└── views/app-shell.html (layout com navbar/menu)
```

### 2. Roteamento (Client-Side)
- **Biblioteca**: Sem dependências externas (vanilla JS) ou lightweight (History API)
- **Estratégia**:
  ```javascript
  // router.js
  router.on('battle', () => {
    renderPage('battle', battlePageState)
  })
  router.on('journey', () => {
    renderPage('journey', journeyPageState)
  })
  ```
- **URLs**: `file://localhost/index.html#/battle`, `#/journey`, etc.

### 3. Estado Global (State Management)
```javascript
// scripts/state/gameState.js
export const gameState = {
  currentPet: null,
  currentPage: 'home',
  battleState: { ... },
  journeyState: { ... },
  // ... outros estados
}
```

**Vantagens**:
- ✅ Todos componentes acessam estado central
- ✅ Sem IPC necessário (mesma janela)
- ✅ Melhor para SPA

### 4. IPC Simplificado
- **Mantém**: Comunicação com main process (salvar dados, ícone taskbar)
- **Remove**: IPC para trocar de janela (agora é roteamento)
- **Exemplo**:
  ```javascript
  // Antes (multi-window)
  ipcRenderer.send('open-battle-window')
  
  // Depois (SPA)
  router.navigate('/battle')
  ```

### 5. Migração Gradual (3 Fases)

#### **FASE 1: Infraestrutura Base**
- [ ] Criar `router.js` e sistema de roteamento
- [ ] Criar estrutura de `pages/`
- [ ] Criar `gameState.js` centralizado
- [ ] Implementar renderização de páginas
- [ ] Main process: ajustar para janela única

#### **FASE 2: Portar Páginas Simples**
- [ ] Home/Status → primeira página
- [ ] Items/Store → segunda página
- [ ] Pen/Nests → terceira página
- Testar cada uma antes de avançar

#### **FASE 3: Portar Páginas Complexas**
- [ ] Battle (lógica complexa)
- [ ] Journey (cenas com canvas)
- [ ] Training (múltiplas sub-páginas)
- [ ] Integração com mini-mode

### 6. Benefícios

| Aspecto | Multi-Window | SPA |
|---------|-------------|-----|
| **Memória** | ~150MB (múltiplas janelas) | ~80MB (1 janela) |
| **Inicialização** | Lenta (criar janelas) | Rápida (só renderizar) |
| **Transições** | Brusca (trocar janela) | Suave (animações) |
| **Estado** | Espalhado (múltiplas janelas) | Centralizado |
| **IPC** | Complexo (cross-window) | Simples (apenas main) |
| **Código** | Duplicado (múltiplos HTML) | DRY (um HTML) |

### 7. Desafios

1. **Canvas/Rendering**: Journey e Battle usam canvas - precisam de re-arquitetura
2. **Performance**: Uma janela grande vs múltiplas pequenas
3. **Breakpoints**: Responsividade única vs múltiplas layouts
4. **DevTools**: Debug fica mais complexo (uma janela só)

### 8. Compatibilidade Mini-Mode

O mini-mode (50×350px) funcionará como:
- **Antes**: Transformação CSS do index.html em modo mini
- **Depois**: Mesma abordagem, mas com SPA roteando para "mini-home"

```javascript
// Em SPA
if (window.isMiniMode) {
  router.navigate('/mini-home')  // Renderiza versão compacta
}
```

## Próximos Passos

1. Escolher estratégia de roteamento (vanilla vs histórico API)
2. Criar prototipo router.js
3. Mover uma página simples (ex: Status) para SPA
4. Testar com main process
5. Avaliar performance
6. Decidir se prossegue com migração completa

## Referências

- [MDN History API](https://developer.mozilla.org/en-US/docs/Web/API/History_API)
- [SPA Patterns](https://developer.mozilla.org/en-US/docs/Glossary/SPA)
- [Electron + SPA Best Practices](https://www.electronjs.org/)
