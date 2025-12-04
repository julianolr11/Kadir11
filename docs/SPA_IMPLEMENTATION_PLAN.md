# Plano de Implementação SPA - Fases de Testes

## Visão Geral
Refatoração gradual de multi-window para SPA, testando cada fase antes de prosseguir.

---

## FASE 1: Infraestrutura Base ✅ (Começar aqui)

### Objetivo
Criar a base para roteamento, estado centralizado e renderização de páginas sem quebrar nada.

### Tarefas
- [ ] **1.1**: Criar `scripts/router.js` - sistema de roteamento vanilla
- [ ] **1.2**: Criar `scripts/state/gameState.js` - estado centralizado
- [ ] **1.3**: Criar `scripts/pages/` - estrutura de páginas
- [ ] **1.4**: Criar `scripts/pages/home.js` - página inicial simples
- [ ] **1.5**: Modificar `index.html` para aceitar renderização dinâmica
- [ ] **1.6**: Testar roteamento básico (home ↔ outro)
- [ ] **1.7**: Commit: "feat(spa): infraestrutura base de roteamento"

### Critério de Sucesso
✅ Roteador funcionando: `router.navigate('/home')` renderiza página
✅ Estado acessível de qualquer página
✅ Nenhuma window criada/destruída
✅ App iniciando sem erros

### Tempo Estimado
📅 2-3 horas

---

## FASE 2: Primeira Página Simples (Status)

### Objetivo
Portar a página Status para SPA mantendo funcionalidade 100%.

### Tarefas
- [ ] **2.1**: Criar `scripts/pages/status.js` com lógica do status.html
- [ ] **2.2**: Copiar CSS do status.html para style.css (namespace)
- [ ] **2.3**: Remover criação de window para status em main.js
- [ ] **2.4**: Testar navegação: home → status → home
- [ ] **2.5**: Testar carregamento de pet data em status
- [ ] **2.6**: Testar mini-mode com status
- [ ] **2.7**: Commit: "feat(spa): portar página status"

### Critério de Sucesso
✅ Status page renderiza com dados do pet
✅ Menu acessível de status
✅ Volta para home sem problemas
✅ Mini-mode funciona com status

### Tempo Estimado
📅 3-4 horas

---

## FASE 3: Páginas Simples (Items, Store, Nests)

### Objetivo
Portar 3 páginas simples juntas para validar padrão.

### Tarefas
- [ ] **3.1**: Criar `scripts/pages/items.js`
- [ ] **3.2**: Criar `scripts/pages/store.js`
- [ ] **3.3**: Criar `scripts/pages/nests.js`
- [ ] **3.4**: Consolidar CSS de todas
- [ ] **3.5**: Remover windows de main.js para essas 3
- [ ] **3.6**: Testar navegação completa entre 4 páginas
- [ ] **3.7**: Testar IPC (comprar item, etc.)
- [ ] **3.8**: Commit: "feat(spa): portar páginas items, store, nests"

### Critério de Sucesso
✅ Todas 4 páginas navegáveis
✅ Transições suaves
✅ IPC funcionando (compras, etc.)
✅ Menu funciona em todas

### Tempo Estimado
📅 4-5 horas

---

## FASE 4: Páginas Complexas - Parte 1 (Pen, Bestiary)

### Objetivo
Testar páginas com mais dados/complexidade.

### Tarefas
- [ ] **4.1**: Criar `scripts/pages/pen.js` (lista de pets)
- [ ] **4.2**: Criar `scripts/pages/bestiary.js` (dados complexos)
- [ ] **4.3**: Integrar com petManager
- [ ] **4.4**: Testar seleção de pet
- [ ] **4.5**: Testar bestiary com filtros
- [ ] **4.6**: Commit: "feat(spa): portar páginas pen e bestiary"

### Critério de Sucesso
✅ Lista de pets renderiza
✅ Seleção de pet muda estado
✅ Bestiary carrega dados
✅ Sem freezes/lags

### Tempo Estimado
📅 3-4 horas

---

## FASE 5: Páginas Complexas - Parte 2 (Training)

### Objetivo
Portar training com múltiplas sub-páginas.

### Tarefas
- [ ] **5.1**: Criar `scripts/pages/training/` (sub-roteador)
- [ ] **5.2**: Criar `training/menu.js`, `force.js`, `defense.js`, `attributes.js`
- [ ] **5.3**: Testar navegação entre sub-páginas
- [ ] **5.4**: Testar incrementos e animações
- [ ] **5.5**: Commit: "feat(spa): portar training com sub-rotas"

### Critério de Sucesso
✅ Sub-roteamento funciona
✅ Animações funcionam
✅ Estado de training persiste
✅ Transições suaves

### Tempo Estimado
📅 4-5 horas

---

## FASE 6: Canvas Pages - Parte 1 (Battle)

### Objetivo
Portar battle com canvas e lógica complexa.

### Tarefas
- [ ] **6.1**: Criar `scripts/pages/battle.js` com canvas
- [ ] **6.2**: Copiar lógica de battle-scene.js
- [ ] **6.3**: Renderizar canvas em container único
- [ ] **6.4**: Testar battle completo
- [ ] **6.5**: Testar resultados e updates
- [ ] **6.6**: Commit: "feat(spa): portar battle com canvas"

### Critério de Sucesso
✅ Battle renderiza corretamente
✅ Combate funciona
✅ Animações suaves
✅ Resultados salvos

### Tempo Estimado
📅 5-6 horas

---

## FASE 7: Canvas Pages - Parte 2 (Journey)

### Objetivo
Portar journey - a mais complexa.

### Tarefas
- [ ] **7.1**: Criar `scripts/pages/journey.js` com tileset
- [ ] **7.2**: Copiar lógica de journey-scene.js
- [ ] **7.3**: Testar movement e encounters
- [ ] **7.4**: Testar transitions
- [ ] **7.5**: Commit: "feat(spa): portar journey com tileset"

### Critério de Sucesso
✅ Mapa renderiza
✅ Movimento funciona
✅ Encounters disparam
✅ Sem lag/stutter

### Tempo Estimado
📅 6-7 horas

---

## FASE 8: Cleanup & Otimização

### Objetivo
Remover código obsoleto e otimizar.

### Tarefas
- [ ] **8.1**: Remover todos HTMLs antigos (não usados mais)
- [ ] **8.2**: Remover windows obsoletas de main.js
- [ ] **8.3**: Limpar IPC obsoleto
- [ ] **8.4**: Remover preload obsoleto
- [ ] **8.5**: Consolidar e minificar CSS
- [ ] **8.6**: Testar performance (memória, CPU)
- [ ] **8.7**: Commit: "refactor(spa): cleanup e otimização"

### Critério de Sucesso
✅ App roda com ~40MB (vs 150MB antes)
✅ Nenhuma warning no console
✅ Startup < 2s (vs 4s antes)
✅ Transições suaves (60fps)

### Tempo Estimado
📅 3-4 horas

---

## FASE 9: Mini-Mode SPA Integration

### Objetivo
Integrar mini-mode com arquitetura SPA.

### Tarefas
- [ ] **9.1**: Adaptar mini-mode para SPA
- [ ] **9.2**: Criar "mini-home" renderization
- [ ] **9.3**: Testar menu mini-mode
- [ ] **9.4**: Testar transições mini ↔ normal
- [ ] **9.5**: Commit: "feat(spa): integrar mini-mode"

### Critério de Sucesso
✅ Mini-mode renderiza corretamente
✅ Menu funciona em mini
✅ Transições suaves
✅ Sem quebras

### Tempo Estimado
📅 2-3 horas

---

## FASE 10: QA & Testes Finais

### Objetivo
Garantir que tudo funciona como antes.

### Tarefas
- [ ] **10.1**: Teste completo: criar pet
- [ ] **10.2**: Teste completo: treinar pet
- [ ] **10.3**: Teste completo: batalhar
- [ ] **10.4**: Teste completo: jornada
- [ ] **10.5**: Teste completo: compras
- [ ] **10.6**: Teste completo: mini-mode
- [ ] **10.7**: Performance profiling
- [ ] **10.8**: Commit: "test(spa): suite de testes SPA"

### Critério de Sucesso
✅ 100% das features originais funcionando
✅ Performance melhorada
✅ Nenhum bug novo
✅ Pronto para produção

### Tempo Estimado
📅 4-5 horas

---

## FASE 11: Merge & Deploy

### Objetivo
Mesclar com main e preparar release.

### Tarefas
- [ ] **11.1**: Code review
- [ ] **11.2**: Merge feat/one-window → main
- [ ] **11.3**: Tag version (ex: v2.0.0)
- [ ] **11.4**: Build & test
- [ ] **11.5**: Deploy

### Critério de Sucesso
✅ Merge sem conflitos
✅ Build sucesso
✅ App funcionando

### Tempo Estimado
📅 1-2 horas

---

## Cronograma Total

| Fase | Descrição | Horas | Status |
|------|-----------|-------|--------|
| 1 | Infraestrutura | 2-3 | ⏳ Próxima |
| 2 | Status | 3-4 | ⏳ |
| 3 | Items, Store, Nests | 4-5 | ⏳ |
| 4 | Pen, Bestiary | 3-4 | ⏳ |
| 5 | Training | 4-5 | ⏳ |
| 6 | Battle | 5-6 | ⏳ |
| 7 | Journey | 6-7 | ⏳ |
| 8 | Cleanup | 3-4 | ⏳ |
| 9 | Mini-mode | 2-3 | ⏳ |
| 10 | QA | 4-5 | ⏳ |
| 11 | Deploy | 1-2 | ⏳ |

**Total: ~45-55 horas** (5-7 dias de trabalho full-time)

---

## Como Usar Este Plano

### Para cada fase:
1. ✅ Ler objetivos e tarefas
2. ✅ Fazer commits progressivos
3. ✅ Testar ANTES de passar próxima
4. ✅ Se quebrar, volta commit anterior
5. ✅ Marca tarefa como concluída

### Rollback seguro:
```bash
git checkout main  # volta se necessário
git branch -D feat/one-window  # deleta se erro crítico
git checkout -b feat/one-window  # recria
```

---

## Notas Importantes

⚠️ **Não pule fases** - Cada uma depende da anterior
⚠️ **Teste sempre antes de commit** - Não queremos regressões
⚠️ **Se quebrar algo, volta imediatamente** - Use `git revert`
✅ **Documente bugs encontrados** - Cria issues no git

---

## Próxima Ação

🚀 **Comece FASE 1**: Criar infraestrutura de roteamento
