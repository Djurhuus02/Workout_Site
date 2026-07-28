export const BAR_WEIGHT_KG = 20
export const AVAILABLE_PLATES_KG = [25, 20, 15, 10, 5, 2.5, 1.25]

export interface PlateBreakdown {
  platesPerSide: number[]
  remainder: number
}

/** Greedy plate breakdown for one side of the bar, on the same 1.25kg grid the weight stepper uses */
export function calculatePlates(targetWeightKg: number, barWeightKg: number = BAR_WEIGHT_KG): PlateBreakdown {
  let perSide = Math.max(0, (targetWeightKg - barWeightKg) / 2)
  const platesPerSide: number[] = []

  for (const plate of AVAILABLE_PLATES_KG) {
    while (perSide + 1e-9 >= plate) {
      platesPerSide.push(plate)
      perSide -= plate
    }
  }

  return { platesPerSide, remainder: Math.round(perSide * 100) / 100 }
}
