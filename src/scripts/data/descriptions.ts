/**
 * Templates for generating rich, fantasy-inspired item descriptions.
 *
 * Each template is a function accepting a rarity string (e.g. "epic", "legendary"),
 * which gets interpolated into the sentence. This produces lore-appropriate flavor
 * text for each item's rarity.
 *
 * Usage: Called randomly during catalog item generation to diversify descriptions
 * across items and rarities for more immersive game data.
 */
export const descriptionTemplates = [
  (r: string) => `A ${r} artifact discovered in the depths of forgotten dungeons.`,
  (r: string) => `This ${r} item pulses with mysterious energy.`,
  (r: string) => `Legends speak of this ${r} treasure's incredible power.`,
  (r: string) => `A ${r} relic from a bygone era of heroes and magic.`,
  (r: string) => `This ${r} piece was forged by master craftsmen of old.`,
  (r: string) => `Wielded by champions, a ${r} item feared and coveted.`,
  (r: string) => `Once lost to myth, this ${r} item has resurfaced against all odds.`,
  (r: string) => `Forged during an ancient war, the ${r} essence still lingers.`,
  (r: string) => `Said to be touched by the gods, this ${r} item reflects fate itself.`,
  (r: string) => `Many have fallen seeking this elusive ${r} object of legend.`,
  (r: string) => `Whispered tales attribute incredible feats to owners of this ${r} item.`,
  (r: string) => `Artisans labored for years to imbue this ${r} treasure with its power.`,
  (r: string) => `A ${r} relic prized by collectors and adventurers alike.`,
  (r: string) => `The runes on this ${r} piece shift and glow in moonlight.`,
  (r: string) => `This ${r} heirloom has been passed through royal bloodlines.`,
  (r: string) => `Scholars debate whether this ${r} item is truly of this world.`,
  (r: string) => `This ${r} object is rumored to choose its wielder.`,
  (r: string) => `Hidden for centuries, this ${r} artifact now emerges to the world.`,
  (r: string) => `Its ${r} origin is shrouded in secrecy and magic.`,
  (r: string) => `To hold this ${r} item is to carry a piece of legend itself.`,
  (r: string) => `Born of celestial fire, this ${r} relic radiates pure potential.`,
  (r: string) => `Long ago, this ${r} object altered the fate of kingdoms.`,
  (r: string) => `In songs of old, heroes claimed this ${r} instrument wielded destiny.`,
  (r: string) => `Little is known about the rituals that grant this ${r} item its unique aura.`,
  (r: string) => `Only those deemed worthy by prophecy may master this ${r} artifact.`,
  (r: string) => `The power sealed within this ${r} treasure is said to exceed mortal law.`,
  (r: string) => `Eclipsed in shadow for centuries, this ${r} relic has returned to legend.`,
  (r: string) => `Its ${r} essence shifts unpredictably, challenging adventurers' resolve.`,
  (r: string) => `Forged on the night of a blood moon, this ${r} item offers dark promise.`,
  (r: string) => `Some believe this ${r} artifact opens portals to forgotten realms.`,
  (r: string) => `Cursed and blessed in equal measure, the ${r} stone confounds scholars.`,
  (r: string) => `Centuries of envy have surrounded this ${r} item, hidden from rivals.`,
  (r: string) => `At midnight, this ${r} talisman glows with foreboding light.`,
  (r: string) => `Riddles carved upon this ${r} object have yet to be deciphered.`,
  (r: string) => `The ethereal song of this ${r} item haunts those who dare listen.`,
  (r: string) => `A relic of the abyss, this ${r} prize is both temptation and trial.`,
  (r: string) => `This ${r} shard echoes with voices from before the dawn.`,
  (r: string) => `Wherever this ${r} amulet resides, fortune or ruin swiftly follows.`,
  (r: string) => `Legends claim this ${r} blade may sever fate itself.`,
  (r: string) => `Under starlit skies, this ${r} scroll reveals secret wisdom.`,
  (r: string) => `Stained by tears and blood, this ${r} ring bears the mark of history.`,
];

/**
 * Generates a randomized description for a given item rarity.
 *
 * Selects a template at random and interpolates the lowercased rarity string,
 * ensuring every item feels unique and story-driven.
 *
 * @param rarity - Rarity label (e.g. "Legendary", "Epic")
 * @returns      - A descriptive string suitable for item lore
 *
 * Usage: Use during catalog seeding or item generation to add flavor to game items.
 */
export function generateDescription(rarity: string): string {
  const r = rarity.toLowerCase();
  const idx = Math.floor(Math.random() * descriptionTemplates.length);
  return descriptionTemplates[idx](r);
}
