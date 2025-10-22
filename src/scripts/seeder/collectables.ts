import { Collectable, Rarity } from "../../types";
import { rarityTiers } from "../../functions/rarities";
import { faker } from "@faker-js/faker";
import { capitalize } from "../../utils/helpers";

function generateFantasyCollectableName(): string {
  return `${faker.word.adjective({ strategy: "any-length" })} ${faker.word.noun({ strategy: "any-length" })}`.replace(
    /\b\w/g,
    (c) => c.toUpperCase(),
  );
}

export function generateFantasyDescription(rarity: string): string {
  const seasons = ["spring", "summer", "autumn", "winter"];
  const eras = [
    `Long ago`,
    `Last ${faker.date.weekday()}`,
    `During ${faker.date.month()} in the year ${faker.number.int({ min: 1032, max: 2024 })}`,
    `Recently`,
    `Centuries back`,
    `Once upon a ${faker.word.adjective()} ${faker.word.noun()}`,
    `Just the other day`,
    `In a forgotten era of the ${faker.word.noun().toUpperCase()}s`,
    `On ${faker.date.weekday()}, legend says`,
    `One ${faker.word.adjective()} ${faker.helpers.arrayElement(seasons)} morning`,
    `Sometime after ${faker.number.int({ min: 1200, max: 2030 })}`,
    `Beneath a ${faker.word.adjective()} ${faker.word.noun()}`,
    `Right before dawn at the ${faker.word.adjective()} ${faker.word.noun()} cliffs`,
    `After the great ${faker.word.noun()} Rebellion`,
    `In the shadow of the ${faker.word.adjective()} ${faker.word.noun()}`,
  ];

  const finders = [
    `a ${faker.word.adjective()} ${faker.word.adjective()} ${rarity.toLowerCase()} ${faker.word.noun()}`,
    `an ancient ${faker.word.noun()} from the ${faker.word.adjective()} ${faker.word.noun()}`,
    `the ${faker.word.noun()} of ${faker.location.country()} and ${faker.location.country()}`,
    `${faker.word.adjective()} ${faker.word.noun()} rumored in ${faker.location.city()} and ${faker.location.city()}`,
    `a ${faker.word.noun()} lost by ${faker.person.fullName()} during the ${faker.word.adjective()} ${faker.word.noun()}`,
    `the prized artifact of ${faker.person.fullName()}, a renowned ${faker.word.adjective()} ${faker.word.noun()}`,
    `an object from the reign of ${faker.person.fullName()} and the ${faker.word.noun()}`,
    `a legendary ${faker.color.human()} ${faker.word.adjective()} ${faker.word.noun()} from ${faker.location.country()}`,
    `the creation of ${faker.person.fullName()} and their ${faker.word.adjective()} ${faker.word.noun()}`,
  ];

  const events = [
    `surfaced after a ${faker.word.adjective()} ${faker.word.noun()}`,
    `was stumbled upon by a wandering ${faker.word.adjective()} ${faker.word.noun()}`,
    `became legend in ${faker.location.country()} and ${faker.location.country()}`,
    `caught the attention of ${faker.word.adjective()} adventurers on ${faker.date.weekday()}`,
    `whispered into the dreams of ${faker.person.fullName()} and the ${faker.word.noun()} Council`,
    `was mailed to a random ${faker.word.noun()} in ${faker.location.city()}`,
    `got lost during a ${faker.word.adjective()} ${faker.word.noun()} festival`,
    `was traded for ${faker.number.int({ min: 10, max: 500 })} ${faker.word.noun()} tokens`,
    `graced the ${faker.word.adjective()} courts of ${faker.location.city()}`,
    `was celebrated with ${faker.number.int({ min: 10, max: 200 })} days of ${faker.word.noun()}`,
    `remained hidden after the ${faker.word.noun()} War`,
    `was bound to an ancient ${faker.word.adjective()} ${faker.word.noun()}`,
  ];

  const transitions = [
    `It can`,
    `They say it will someday`,
    `Some report it might`,
    `Legends claim it can`,
    `It might one day`,
    `At rare times, it will`,
    `Those who possess it may find it will`,
  ];

  const effects = [
    `${faker.word.verb()} the fate of ${faker.word.adjective()} ${faker.word.noun()}s`,
    `whisper secrets into the ${faker.word.adjective()} night`,
    `transform ${faker.word.adjective()} ${faker.word.noun()}s into pure ${faker.color.human()}`,
    `grant ${faker.word.adjective()} visions of the ${faker.location.city()} ${faker.word.noun()}`,
    `summon the ${faker.word.adjective()} ${faker.color.human()} spirits of ${faker.date.month()}`,
    `open portals to ${faker.location.city()} or ${faker.location.country()}`,
    `curse those who ${faker.word.verb()} the ${faker.word.noun()}`,
    `bring fortune every ${faker.date.weekday()} or misery on ${faker.date.weekday()}`,
    `cause ${faker.word.noun()}s to appear at ${faker.location.street()} and ${faker.location.city()}`,
    `make its bearer ${faker.word.verb()} unexpectedly in times of ${faker.word.adjective()} trouble`,
  ];

  const addenda = [
    `Historians in ${faker.location.city()} and ${faker.location.country()} debate its ${faker.word.adjective()} ${faker.word.noun()}.`,
    `None have dared claim it since ${faker.person.fullName()} and the ${faker.word.noun()} tried.`,
    `It vanished after a ${faker.word.adjective()} ${faker.word.noun()} festival in ${faker.location.city()}.`,
    `The ancients left cryptic warnings about its ${faker.word.adjective()} ${faker.word.noun()}.`,
    `It re-emerges every ${faker.number.int({ min: 10, max: 900 })} years in ${faker.location.country()} under a ${faker.color.human()} moon.`,
    `Only on ${faker.date.month()} does its true power show under the ${faker.color.human()} sky.`,
    `Many want to ${faker.word.verb()} it, but none have succeeded since ${faker.number.int({ min: 1400, max: 2100 })}.`,
    `Its last owner now haunts the ${faker.word.adjective()} ${faker.word.noun()} of ${faker.location.city()}.`,
    `Rumor has it, the item once belonged to ${faker.person.fullName()} and the ${faker.word.noun()}.`,
    `Would you dare seek its ${faker.word.adjective()} ${faker.word.noun()}?`,
    `So the bards sing every ${faker.date.weekday()}, though few ${faker.word.verb()}.`,
    `It is said to have once ${faker.word.verb()}ed the mighty ${faker.word.adjective()} ${faker.word.noun()}.`,
    `If found, return to the ${faker.word.adjective()} ${faker.word.noun()} Guild in ${faker.location.city()}.`,
    `Those who ${faker.word.verb()} upon it must ${faker.word.verb()} until the next ${faker.date.weekday()}.`,
  ];

  return [
    capitalize(faker.helpers.arrayElement(eras)),
    faker.helpers.arrayElement(finders),
    faker.helpers.arrayElement(events) + ".",
    faker.helpers.arrayElement(transitions),
    faker.helpers.arrayElement(effects) + ".",
    faker.helpers.arrayElement(addenda),
  ].join(" ");
}

// Pick weighted rarity id by session chance (unchanged)
function pickWeightedRarityId(sessionTiers: Array<{ id: number; chance: number }>): number {
  const total = sessionTiers.reduce((sum, tier) => sum + tier.chance, 0);
  const r = Math.random() * total;
  let acc = 0;
  for (const tier of sessionTiers) {
    acc += tier.chance;
    if (r <= acc) return tier.id;
  }
  return sessionTiers[sessionTiers.length - 1].id; // fallback
}

export function generateCollectables(
  sessionTiers: Array<{ id: number; chance: number }>,
  totalCollectables: number,
): Collectable[] {
  const collectables: Collectable[] = [];

  // One guaranteed item per rarity tier
  sessionTiers.forEach((tier) => {
    const rarityName = rarityTiers.find((rt: Rarity) => rt.id === tier.id)?.name ?? "Unknown";
    collectables.push({
      id: crypto.randomUUID(),
      name: generateFantasyCollectableName(),
      description: generateFantasyDescription(rarityName),
      rarity: tier.id,
      createdAt: new Date().toISOString(),
    });
  });

  // Remaining items, weighted random rarity
  for (let i = sessionTiers.length; i < totalCollectables; i++) {
    const rarityId = pickWeightedRarityId(sessionTiers);
    const rarityName = rarityTiers.find((rt: Rarity) => rt.id === rarityId)?.name ?? "Unknown";
    collectables.push({
      id: crypto.randomUUID(),
      name: generateFantasyCollectableName(),
      description: generateFantasyDescription(rarityName),
      rarity: rarityId,
      createdAt: new Date().toISOString(),
    });
  }

  return collectables;
}
