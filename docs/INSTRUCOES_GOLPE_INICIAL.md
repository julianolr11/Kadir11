# Como Adicionar Golpe Inicial aos Pets

## Opção 1: Script Automático para Pets Existentes

Execute o script `add-moves-to-pets.js` para adicionar golpes a todos os pets que já existem:

```bash
electron add-moves-to-pets.js
```

Este script:
- Lê todos os pets salvos
- Verifica quais não têm golpes
- Adiciona o primeiro golpe correspondente ao elemento de cada pet
- Mostra um resumo do que foi feito

## Opção 2: Edição Manual do main.js (para novos pets)

Abra o arquivo `main.js` e faça as seguintes alterações:

### Passo 1: Adicionar código de carregamento de golpes

Na função `generatePetFromEgg`, **APÓS a linha 170** (que fecha o último `else`), adicione:

```javascript
    // Carregar golpes e encontrar o primeiro golpe do elemento
    let initialMove = null;
    try {
        const movesData = fs.readFileSync(path.join(__dirname, 'data', 'moves.json'), 'utf8');
        const allMoves = JSON.parse(movesData);
        initialMove = allMoves.find(move => move.elements && move.elements.includes(info.element || 'puro'));
    } catch (err) {
        console.error('Erro ao carregar golpes:', err);
    }
```

### Passo 2: Adicionar moves ao objeto retornado

Na mesma função, no objeto `return` (linha 172-192), **APÓS a linha 191** (`kadirPoints: 10`), adicione uma vírgula e:

```javascript
        kadirPoints: 10,
        moves: initialMove ? [initialMove] : [],
        knownMoves: initialMove ? [initialMove] : []
```

## Resultado Esperado

Depois dessas mudanças:
- **Pets existentes**: Execute o script `add-moves-to-pets.js` para adicionar golpes
- **Novos pets**: Automaticamente receberão o primeiro golpe do seu elemento ao serem criados

## Teste

1. Crie um novo pet
2. Verifique se ele tem um golpe na tela de batalha ou treino
3. O golpe deve corresponder ao elemento do pet
