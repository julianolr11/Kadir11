# Kadir11 - Guia de Uso (Normal vs SPA)

## Versão Normal (Legacy)
A versão tradicional com múltiplas windows segue funcionando normalmente:

1. **Iniciar o app**: `npm start`
2. **Usar como sempre**: Clique nos ícones do tray (canto inferior direito)
3. **Funcionalidades**:
   - ✅ Criar pet
   - ✅ Status window
   - ✅ Batalha
   - ✅ Treino
   - ✅ Jornada
   - ✅ Mini-mode
   - ✅ Todas as features originais

---

## Versão SPA (Single Page Application)
Nova arquitetura com 23 rotas em uma única window.

### Como Ativar

**Opção 1: Via Console DevTools**
```javascript
// Abrir DevTools: Ctrl+Shift+D
initSPA()  // Ativa o SPA
```

**Opção 2: Via Botão na Tray**
Haverá um botão "Abrir SPA" no tray quando implementarmos UI dedicated.

### Funcionalidades SPA
- ✅ Home (Hub de navegação)
- ✅ Status (Pet stats completo)
- ✅ Items, Store, Nests
- ✅ Pen (Seleção de pets)
- ✅ Bestiary (Descoberta com progresso)
- ✅ Training (Força, Defesa, Atributos)
- ✅ Battle (Seleção e arena com engine)
- ✅ Journey (3 jornadas com progresso real-time)
- ✅ Hatch Egg (Chocagem de ovos)
- ✅ Settings (Configurações + stats)

### Como Voltar para Normal
```javascript
closeSPA()  // Volta para versão normal
```

---

## Comparação: Normal vs SPA

| Feature | Normal | SPA |
|---------|--------|-----|
| Windows Múltiplas | ✅ | ❌ (1 window) |
| Roteamento | Carga de arquivos HTML | Hash-based (#/rota) |
| Estado | Múltiplas fontes | Centralizado (localStorage) |
| Performance | ~150MB RAM | ~80MB RAM (estimado) |
| Load Time | ~4s | ~2s (estimado) |
| Desenvolvimento | Legacy | Moderno |
| Suporte | Full | Em construção |

---

## Dados Sincronizados

### Versão Normal
- Pets salvos em `userData/pets/` (filesystem)
- Moedas em `electron-store`
- Inventário em `electron-store`

### Versão SPA (FASE 9+)
- Sincronização automática com main.js via IPC
- Dados em localStorage (local)
- Backup em filesystem automático
- **Todos os dados compartilhados entre versões**

---

## Próximas Fases

### FASE 9: Integração IPC
- [ ] Criar bridge IPC para petManager
- [ ] Carregar pets reais na inicialização
- [ ] Salvar mudanças em tempo real
- [ ] Sincronizar moedas e inventário

### FASE 10: Mini-Mode SPA
- [ ] Adaptar mini-mode para SPA
- [ ] Renderização compacta

### FASE 11: Cleanup
- [ ] Remover código obsoleto
- [ ] Otimizações finais

---

## Troubleshooting

**SPA não aparece ao chamar `initSPA()`**
- Verificar se console tem erros (F12)
- Garantir que `gameState` está acessível

**Dados não carregam**
- Criar um pet na versão normal primeiro
- Usar `gameState.get('currentPet')` para verificar

**Volta para normal não funciona**
- Chamar `closeSPA()` explicitamente
- Recarregar a página

---

**Desenvolvido**: Dezembro 2025  
**Status**: SPA Funcional (v1.0)  
**Próxima**: FASE 9 - Integração IPC
