# INSTRUÇÕES PARA ADICIONAR O SISTEMA DE PRESENTES

## Arquivos já criados:
✅ gift.html - Interface de presentes
✅ scripts/gift.js - Lógica do frontend
✅ index.html - Menu atualizado (Cuidar → Presentes)
✅ scripts/tray.js - Handler para abrir janela de presentes

## PENDENTE - Adicionar ao preload.js:

### 1. Na linha 66, adicione estes dois canais ao array validChannels (dentro da função send):

```javascript
'open-gift-window',    // Abrir a janela de presentes
'redeem-gift-code'     // Resgatar código de presente
```

IMPORTANTE: Adicione DEPOIS de 'open-tray-window' e ANTES do fechamento do array ]

### 2. Na linha 89, adicione estes dois canais ao array validChannels (dentro da função on):

```javascript
'gift-redeemed',       // Presente resgatado com sucesso
'gift-error'           // Erro ao resgatar presente
```

IMPORTANTE: Adicione DEPOIS de 'activate-status-tab' e ANTES do fechamento do array ]

## PENDENTE - Adicionar ao main.js:

Veja o arquivo GIFT_CODE_TO_ADD.txt para o código completo que precisa ser adicionado ao main.js

### Resumo do que adicionar:

1. Linha 42: Adicionar variável `let giftWindow = null;`

2. Após a função createStoreWindow (linha ~1088): Adicionar funções:
   - createGiftWindow()
   - closeGiftWindow()

3. Após o handler 'store-pet' (linha ~634): Adicionar:
   - Handler 'open-gift-window'
   - Objeto giftCodes com os códigos
   - Handler 'redeem-gift-code'

## Códigos de Presente Disponíveis:
- KADIR5 → 5 Kadir Points
- KADIR2025 → 50 Kadir Points
- WELCOME → 100 Moedas
- STARTER → 5x Poção de Vida
- ENERGY → 3x Poção de Energia
- RARE → Garra do Predador
- NEWPET → Ovo de Fera
