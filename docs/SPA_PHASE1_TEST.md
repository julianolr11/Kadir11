# FASE 1: Guia de Teste Rápido

## Status: ✅ PRONTO PARA TESTE

### Como testar SPA no Kadir11

**1. Abra a aplicação**
```bash
npm start
```

**2. Abra DevTools (F12)**
- Vá até a aba "Console"

**3. No console, execute:**
```javascript
initSPA()
```

Você verá:
- Container SPA aparece (substitui tray)
- Página HOME renderizada
- Roteador ativo

**4. Teste navegação:**
```javascript
router.navigate('/test')     // Vai para TEST page
router.back()                // Volta para HOME
router.navigate('/debug')    // Vai para DEBUG page
```

**5. Teste estado compartilhado:**
```javascript
gameState.set('coins', 999)           // Muda moedas
gameState.get('coins')                // Lê valor
gameState.debug()                     // Mostra estado completo
```

**6. Veja o histórico:**
```javascript
router.getHistory()                   // ['home', 'test', 'home', 'debug', ...]
```

**7. Desativa SPA:**
```javascript
closeSPA()                            // Volta ao tray
```

---

## O que foi testado ✅

| Feature | Status | Teste |
|---------|--------|-------|
| Router carregando | ✅ | `router.navigate()` funciona |
| GameState acessível | ✅ | `gameState.get/set()` funciona |
| Páginas renderizando | ✅ | HOME, TEST, DEBUG aparecem |
| Histórico | ✅ | `router.getHistory()` mostra caminho |
| CSP resolvido | ✅ | Sem errors no console |
| initSPA() global | ✅ | Função disponível |

---

## Próximas Fases 🚀

**FASE 2**: Portar página Status (próxima)
- Integrar com petManager
- Mostrar dados do pet
- Navegar entre páginas com dados

**FASE 3-7**: Páginas simples → complexas

---

## Debug

Se algo quebrar:
```bash
git reset --hard HEAD    # Volta último commit
git log --oneline         # Vê histórico
```

Console mostra:
- `[Router]` - Eventos de roteamento
- `[GameState]` - Mudanças de estado
- Erros com stack trace

---

## Notas

- SPA não quebra tray (ambos coexistem)
- Estado persiste enquanto SPA ativo
- Sem windows sendo criadas
- Performance: ~0ms para navegar

**Pronto?** Vamo pro FASE 2!
