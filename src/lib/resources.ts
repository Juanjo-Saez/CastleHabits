export const SYSTEM_RESOURCES = {
  postponeToken: {
    description: 'Mueve una obligación de hoy a mañana.',
    packPrices: [
      { quantity: 1, cost: 5 },
      { quantity: 3, cost: 12 },
      { quantity: 5, cost: 18 },
    ],
  },
  vitalityPotion: {
    description: 'Recupera 10 vitalidad.',
    cost: 15,
    recovery: 10,
  },
  streakFreeze: {
    description: 'Protege un fallo de obligación.',
    cost: 20,
  },
} as const