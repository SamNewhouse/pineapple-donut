const rarityChances = [0.7, 0.2, 0.07, 0.025, 0.005];

function determineRarityChance(barcodeHash: number): number {
  const randDecimal = (barcodeHash % 1000) / 1000; // deterministic "random" [0,1)
  let total = 0;
  for (const chance of rarityChances) {
    total += chance;
    if (randDecimal < total) {
      return chance;
    }
  }
  return rarityChances[0]; // fallback to most common
}

export function generateItemFromBarcode(barcode: string) {
  const hash = barcode.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const rarityChance = determineRarityChance(hash);

  return {
    itemId: `item-${barcode}`,
    name: `Item from ${barcode}`,
    rarityChance, // e.g., 0.07 (7%)
    value: Math.round(100 * rarityChance), // Value is proportional to chance (example)
    quantity: 1
  };
}
