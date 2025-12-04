/**
 * Battle System - Engine de lógica de combate
 * Cálculos de dano, efetividade, status effects
 */

class BattleEngine {
  constructor(playerPet, opponentPet) {
    this.playerPet = JSON.parse(JSON.stringify(playerPet)); // Deep copy
    this.opponentPet = JSON.parse(JSON.stringify(opponentPet));
    this.log = [];
    this.round = 1;
    this.playerSpeed = this.playerPet.speed || 5;
    this.opponentSpeed = this.opponentPet.speed || 5;
  }

  // Determine who attacks first based on speed
  getAttackOrder() {
    if (this.playerSpeed > this.opponentSpeed) {
      return ['player', 'opponent'];
    } else if (this.opponentSpeed > this.playerSpeed) {
      return ['opponent', 'player'];
    } else {
      return Math.random() > 0.5 ? ['player', 'opponent'] : ['opponent', 'player'];
    }
  }

  // Calcula dano de ataque
  calculateDamage(attacker, defender, move) {
    let baseDamage = move.power || 40;

    // Modificador de força
    const attackerForce = attacker.force || 5;
    const defenderDefense = defender.defense || 5;
    const forceModifier = (attackerForce / defenderDefense) * 1.2;

    // Efetividade de elemento
    const elementMultiplier = this.getElementMultiplier(
      attacker.element,
      defender.element
    );

    // Variação aleatória (-10% a +10%)
    const randomFactor = 0.9 + Math.random() * 0.2;

    let finalDamage = Math.floor(
      baseDamage * forceModifier * elementMultiplier * randomFactor
    );

    // Mínimo de dano
    finalDamage = Math.max(1, finalDamage);

    return {
      damage: finalDamage,
      elementMultiplier,
      forceModifier,
    };
  }

  // Tabela de efetividade
  getElementMultiplier(attackerElement, defenderElement) {
    const effectiveness = {
      fogo: { fogo: 0.9, agua: 0.8, terra: 1.2, ar: 0.9, puro: 0.9 },
      agua: { fogo: 1.2, agua: 0.9, terra: 0.8, ar: 1.2, puro: 0.9 },
      terra: { fogo: 0.8, agua: 1.2, terra: 0.9, ar: 0.8, puro: 0.9 },
      ar: { fogo: 1.2, agua: 0.8, terra: 1.2, ar: 0.9, puro: 0.9 },
      puro: { fogo: 1.2, agua: 1.2, terra: 1.2, ar: 1.2, puro: 1.2 },
    };

    return (
      effectiveness[attackerElement]?.[defenderElement] || 1.0
    );
  }

  // Executa um turno de batalha
  executeTurn(attacker, defender, moveIndex = 0) {
    const attackerName = attacker === this.playerPet ? 'Seu pet' : 'Oponente';
    const defenderName = defender === this.playerPet ? 'Seu pet' : 'Oponente';
    const move = this.getMove(attacker, moveIndex);

    if (!move) {
      this.log.push(`${attackerName} falhou no ataque!`);
      return;
    }

    const { damage, elementMultiplier } = this.calculateDamage(
      attacker,
      defender,
      move
    );

    defender.life = Math.max(0, defender.life - damage);

    let message = `${attackerName} usou ${move.name} e causou ${damage} de dano!`;

    if (elementMultiplier > 1.0) {
      message += ` ✨ (Super efetivo!)`;
    } else if (elementMultiplier < 1.0) {
      message += ` ⚡ (Pouco efetivo...)`;
    }

    this.log.push(message);
  }

  // Retorna movimento para ataque
  getMove(pet, index = 0) {
    const moves = pet.moves || ['Arranhão', 'Mordida', 'Ataque Rápido'];
    return {
      name: moves[Math.min(index, moves.length - 1)],
      power: 40 + Math.random() * 20,
      effect: 'nenhum',
    };
  }

  // Simula batalha completa
  simulateBattle() {
    const results = {
      winner: null,
      loser: null,
      rounds: 0,
      log: [],
      playerFinalHP: this.playerPet.life,
      opponentFinalHP: this.opponentPet.life,
    };

    let maxRounds = 100;
    let round = 0;

    while (
      this.playerPet.life > 0 &&
      this.opponentPet.life > 0 &&
      round < maxRounds
    ) {
      round++;
      const order = this.getAttackOrder();

      // Primeiro ataque
      const attacker1 = order[0] === 'player' ? this.playerPet : this.opponentPet;
      const defender1 = order[0] === 'player' ? this.opponentPet : this.playerPet;
      this.executeTurn(attacker1, defender1, Math.floor(Math.random() * 3));

      if (defender1.life <= 0) break;

      // Segundo ataque
      const attacker2 = order[1] === 'player' ? this.playerPet : this.opponentPet;
      const defender2 = order[1] === 'player' ? this.opponentPet : this.playerPet;
      this.executeTurn(attacker2, defender2, Math.floor(Math.random() * 3));
    }

    results.winner =
      this.playerPet.life > 0 ? 'player' : 'opponent';
    results.loser = results.winner === 'player' ? 'opponent' : 'player';
    results.rounds = round;
    results.log = this.log;
    results.playerFinalHP = Math.max(0, this.playerPet.life);
    results.opponentFinalHP = Math.max(0, this.opponentPet.life);

    return results;
  }

  // Retorna status atual da batalha
  getStatus() {
    return {
      playerHP: Math.max(0, this.playerPet.life),
      playerMaxHP: this.playerPet.maxLife || 100,
      opponentHP: Math.max(0, this.opponentPet.life),
      opponentMaxHP: this.opponentPet.maxLife || 100,
      round: this.round,
      log: this.log,
    };
  }
}

// Exportar para global
if (typeof window !== 'undefined') {
  window.BattleEngine = BattleEngine;
}
