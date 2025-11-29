const rarityMultipliers = {
    'Comum': 1.0,
    'Incomum': 1.05,
    'Raro': 1.1,
    'MuitoRaro': 1.2,
    'Epico': 1.35,
    'Lendario': 1.55
};

export function calculateXpGain(baseXp, rarity) {
    const multiplier = rarityMultipliers[rarity] || 1.0;
    return Math.round(baseXp * multiplier);
}
