// Product values, kept together so a later balance change does not alter the motor.
export const economy = {
  maxLives: 5, initialLives: 5, initialSeeds: 0,
  regenerationMs: 30 * 60 * 1000, recoveryCorrect: 3,
  mission: 10, perfect: 5, unitFinal: 25,
  eliminate: 15, life: 20, refill: 60, valleyBag: 80,
} as const;
export type Purchase = "life" | "refill";
