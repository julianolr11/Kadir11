# 🧪 Teste de Balanceamento de Poder - Estilo Pokémon

## 📋 Checklist de Testes

### ✅ **REBALANCEAMENTO CONCLUÍDO**
- ✅ Script de rebalanceamento criado e executado
- ✅ 68 golpes atualizados com poder estilo Pokémon
- ✅ Golpes básicos (nível 1): 40-50 poder
- ✅ Golpes avançados (nível 4-5): 100-120 poder

---

## 🎯 Comparação de Poderes (Antes vs Depois)

### **Golpes Básicos (Nível 1)**
| Golpe | Antes | Depois | Diferença |
|-------|-------|--------|-----------|
| Arranhão | 10 | 40 | +300% |
| Faísca | 10 | 40 | +300% |
| Mordida | 10 | 40 | +300% |

### **Golpes Avançados (Nível 4-5)**
| Golpe | Antes | Depois | Diferença |
|-------|-------|--------|-----------|
| Explosão Ígnea (Nv4 Raro) | 26 | **105** | +304% |
| Terremoto (Nv5 Raro) | 26 | **120** | +362% |
| Furacão Devastador (Nv5 Raro) | 26 | **120** | +362% |

---

## 🔬 Teste Prático no Jogo

### **Passo 1: Verificar Tabela de Treino**
1. ✅ Carregue um pet (preferencialmente de fogo para testar STAB)
2. ✅ Abra a janela de Status (já aberta)
3. 📝 Vá até a aba de **Treinamento/Golpes**
4. 📝 Compare os valores de poder exibidos:
   - **Faísca (Nv1 Comum)**: Deve mostrar ~40-50 poder base
   - **Explosão Ígnea (Nv4 Raro)**: Deve mostrar ~105-130 poder (base 105 + bônus de raridade/elemento)

### **Passo 2: Teste de Batalha Real**
1. 📝 Vá para o modo **Jornada** (Journey)
2. 📝 Inicie uma batalha comum (não boss)
3. 📝 Use **Faísca** (golpe básico) e anote o dano causado
4. 📝 Use **Explosão Ígnea** (golpe avançado) e anote o dano causado
5. 📝 Compare: **Explosão Ígnea** deve causar ~2-3x mais dano que Faísca

### **Passo 3: Teste de STAB Bonus**
1. 📝 Se seu pet é de **fogo**, use um golpe de **fogo** → deve ter +20% poder
2. 📝 Use um golpe de **outro elemento** → sem bônus
3. 📝 Compare os danos e confirme diferença de ~20%

---

## 📊 Tabela de Poder Esperado por Nível/Raridade

| Nível | Comum | Incomum | Raro | Muito Raro | Épico | Lendário |
|-------|-------|---------|------|------------|-------|----------|
| 1 | 40 | 50 | 60 | 70 | 80 | 90 |
| 2 | 55 | 65 | 75 | 85 | 95 | 105 |
| 3 | 70 | 80 | 90 | 100 | 110 | 120 |
| 4 | 85 | 95 | **105** | 115 | 125 | 135 |
| 5 | 100 | 110 | **120** | 130 | 140 | 150 |
| 6 | 115 | 125 | 135 | 145 | 155 | 165 |
| 7 | 130 | 140 | 150 | 160 | 170 | 180 |

---

## 🎮 Golpes com Efeito de Status

Golpes com efeitos (queimado, envenenamento, paralisia, etc.) têm **-10% poder** como compensação:
- **Asas de Brasa** (Nv5 Raro + queimado): 120 × 0.9 = **108 poder**
- **Choque Elétrico** (Nv4 Raro + paralisia): 105 × 0.9 = **95 poder**

---

## ✨ Validação Final

### **Comparação com Pokémon:**
- ✅ **Arranhão** (Scratch): 40 poder base → Similar ao Pokémon
- ✅ **Explosão Ígnea** (Flamethrower): 105 poder → Comparável aos 90 do Pokémon original
- ✅ **Terremoto** (Earthquake): 120 poder → Similar aos 100 do Pokémon original
- ✅ **Furacão Devastador** (Hurricane): 120 poder → Comparável aos 110 do Pokémon original

### **Diferenciação Clara:**
- ✅ Golpe básico (40) vs Golpe avançado (105) = **2.6x mais dano**
- ✅ Diferença visível e significativa (como no Pokémon)
- ✅ Sistema de poder realista e balanceado

---

## 🏆 Resultado Esperado

Após os testes, você deve observar:
1. ✅ **Tabela de Treino** mostra poderes muito diferentes entre níveis
2. ✅ **Batalhas** mostram dano proporcional (básico ≠ avançado)
3. ✅ **STAB Bonus** visível em golpes do mesmo elemento do pet
4. ✅ **Golpes raros** claramente mais fortes que comuns do mesmo nível

---

## 📝 Registro de Testes (Preencha aqui)

### Teste 1: Tabela de Treino
- Faísca (Nv1): ____ poder exibido
- Explosão Ígnea (Nv4): ____ poder exibido
- Diferença: ____x

### Teste 2: Dano Real em Batalha
- Faísca causou: ____ de dano
- Explosão Ígnea causou: ____ de dano
- Diferença: ____x

### Teste 3: STAB Bonus
- Golpe de fogo (com pet fogo): ____ dano
- Golpe de água (com pet fogo): ____ dano
- Diferença: ____% (esperado: ~20%)

---

**✅ Sistema pronto para testes práticos!**
