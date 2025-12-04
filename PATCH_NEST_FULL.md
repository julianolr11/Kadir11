# Patch: Mensagem de ninhos cheios

## Arquivos já modificados:
1. ✅ `preload.js` - Canal 'nest-full-error' adicionado
2. ✅ `scripts/handlers/nestHandlers.js` - Envia erro quando ninhos cheios

## Arquivo a modificar manualmente:

### `scripts/items.js`

Adicionar no início do arquivo (após linha 9, antes de `// Gradientes de raridade`):

```javascript
// Escutar evento de ninhos cheios
if (window.electronAPI) {
  window.electronAPI.on('nest-full-error', (event, message) => {
    showToast(message || 'Todos os ninhos estão cheios, aguarde', 'error');
  });
}

function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  toast.className = 'toast toast-' + type;
  toast.textContent = message;
  toast.style.position = 'fixed';
  toast.style.bottom = '20px';
  toast.style.right = '20px';
  toast.style.padding = '12px 20px';
  toast.style.backgroundColor = type === 'error' ? '#e74c3c' : '#3498db';
  toast.style.color = '#fff';
  toast.style.borderRadius = '8px';
  toast.style.zIndex = '9999';
  toast.style.boxShadow = '0 4px 8px rgba(0,0,0,0.3)';
  toast.style.fontSize = '14px';
  toast.style.fontWeight = 'bold';
  toast.style.animation = 'slideInRight 0.3s ease-out';
  document.body.appendChild(toast);
  setTimeout(() => {
    toast.style.animation = 'slideOutRight 0.3s ease-in';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}
```

---

**Funcionamento:**
- Quando usuário tenta chocar ovo e todos os 3 ninhos estão ocupados, backend envia `nest-full-error`
- Frontend exibe toast no canto inferior direito: "Todos os ninhos estão cheios, aguarde"
- Toast desaparece após 3 segundos com animação
