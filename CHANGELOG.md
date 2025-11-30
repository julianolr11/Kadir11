# Changelog - Kadir11

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

---

## [Unreleased]

### 🚧 Phase 3: Main.js Modularization (2025-11-30)

#### Added
- `scripts/state/storeState.js`: Encapsula acesso ao electron-store (moedas, itens, pen, nests, broadcasts)
- `scripts/logic/petGeneration.js`: Inicialização de species e geração de pets/raridade isoladas
- `scripts/windows/gameWindows.js`: Fábrica central de todas as BrowserWindows de jogo + getters e fechamento em lote

#### Changed
- `main.js` agora importa módulos de estado, lógica e janelas em vez de definir tudo inline
- Removidas ~300+ linhas de funções duplicadas de criação de janelas (shadowing evitava uso do módulo)
- Centralizada lógica de posicionamento de `nestsWindow` via `updateNestsPosition()` do módulo de janelas
- Mantida assinatura dos handlers através de proxies (`getStoreWindow`, `getItemsWindow`, `getHatchWindow`)

#### Fixed
- Conflito de shadowing: funções locais sobrescreviam exports de `gameWindows` (agora removidas)

#### Impact
- Redução do tamanho e complexidade de `main.js`, preparando extração do estado do `currentPet` e bootstrap único de handlers
- Mantidos todos os 137 testes passando após cada etapa de extração

#### Next Steps (Planejado)
- Extrair gerenciamento de `currentPet` (get/set/broadcast/resetTimers) para `scripts/state/currentPet.js`
- Criar `scripts/bootstrap/registerHandlers.js` para registrar todos os handlers em sequência única
- Atualizar documentação (README + CHANGELOG) após conclusão da fase

### 🎯 Phase 2: Modularization & Test Coverage (2025-11-29)

#### Added
- **Test Coverage Infrastructure**
  - 137 comprehensive automated tests covering handlers, logic, and utilities
  - NYC coverage reporting with text and lcov HTML outputs
  - Test suites for: battle mechanics, nests, store, windows, pet creation, progression, move learning, logger
  - Branch-specific test files covering edge cases, error paths, and rollback scenarios
  
- **Documentation**
  - `docs/TESTING.md` - Complete testing guide with coverage metrics, best practices, and CI/CD recommendations
  - `docs/API.md` - API documentation for handlers and helper functions
  - Enhanced README.md with testing commands and coverage badges
  
- **Handler Modularization** (Migrated from main.js)
  - `scripts/handlers/battleMechanicsHandlers.js` - Combat stat updates (energy, health, bravura)
  - `scripts/handlers/nestHandlers.js` - Egg placement and hatching with rollback
  - `scripts/handlers/storeHandlers.js` - Shop economy, items, gift codes, terrain upgrades
  - `scripts/handlers/windowPositioningHandlers.js` - Window creation, alignment, and resizing
  - `scripts/handlers/journeyHandlers.js` - Journey scene management
  - `scripts/handlers/idleAssets.js` - Idle mode asset management

- **Helper Functions**
  - `broadcastPetData(pet)` in battleMechanicsHandlers - Unified pet data broadcasting
  - `broadcastToWindows(callback)` in nestHandlers - WebContents-safe iteration
  - `setupWindow(createFn, failMsg, sendDataFn, alignOptions)` in windowPositioningHandlers - Window setup abstraction

- **Utility Modules**
  - `scripts/utils/logger.js` - Namespaced logging with enable/disable toggle
  - `scripts/logic/moveLearning.js` - Isolated move learning logic
  - `scripts/logic/progression.js` - Battle and journey progression systems

#### Changed
- **Refactored for Maintainability**
  - Consolidated duplicate guard conditions (`!pet || !move` patterns)
  - Replaced optional chaining (`?.`) for safer property access
  - Inline conditionals in `applyJourneyRewards` (reduced branch count)
  - Dependency injection pattern for all handlers (improved testability)
  - Extracted broadcast logic from forEach loops into reusable helpers

- **Test Architecture**
  - Custom electron mocking via `Module.prototype.require` patching
  - IPC stub pattern with handler registration tracking
  - Window mock arrays with webContents objects
  - Consistent beforeEach/afterEach cleanup for test isolation

#### Fixed
- Electron stubbing conflicts resolved with per-file stub injection
- Async handler tests corrected with proper await usage
- Test isolation improved with IPC stub resets between cases
- Branch coverage measurement corrected after refactoring (denominator reduction)

#### Metrics
- **Coverage Achieved**: 99.7% statements, 87.42% branches, 99.04% functions, 100% lines
- **Tests Added**: 0 → 137 passing tests
- **Branch Reduction**: ~15 branches eliminated through refactoring
- **Code Quality**: All handlers now follow dependency injection pattern

---

## [Phase 1] - Initial Development

### Features
- Electron-based Tamagotchi RPG game
- Pet creation with species and elements
- Battle system with elemental effectiveness
- Training modes (attributes, force, defense)
- Journey system with random encounters
- Egg hatching and nest management
- Item shop and economy
- Status effects and move learning
- Persistent pet storage with JSON files
- Multi-window architecture with IPC communication

### Architecture
- Main process coordination in `main.js`
- BrowserWindow management with fade animations
- Pet data flow via `petManager.js`
- Asset organization in `Assets/Mons/{Species}/{element}/{race}/`
- Electron-store for coins and settings persistence

---

## Future Plans

### Proposed Enhancements
- **CI/CD Integration**: GitHub Actions workflow with automated test runs and coverage gates
- **Coverage Goal**: Reach 90%+ branch coverage through additional edge case testing
- **Performance**: Optimize pet updater timers and broadcast efficiency
- **Testing**: Add integration tests for multi-window scenarios
- **Documentation**: Add JSDoc comments to all exported functions

### Known Limitations
- Some defensive programming branches intentionally not covered (~12% of uncovered branches)
- DOM-dependent animation fallbacks in create-pet.js not testable in headless environment
- Electron native modules require stubbing in test environment

---

**Contributors**: Julia (primary development and testing implementation)

**Last Updated**: November 29, 2025
