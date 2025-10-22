import { Achievement } from "../../types";
import { faker } from "@faker-js/faker";
import { capitalize } from "../../utils/helpers";

/**
 * Generates realistic achievements for Pineapple Donut using your actual game mechanics.
 * Achievements cover: item discovery, item collection, rarity milestones, scan streaks,
 * trades, trading partners, player level, and fun/funky actions.
 */
export function generateAchievements(count: number): Achievement[] {
  const achievements: Achievement[] = [];

  for (let i = 0; i < count; i++) {
    // Match real game events/entities, not just generic verbs/nouns
    const pattern = faker.helpers.arrayElement([
      "first_scan",
      "scan_streak",
      "own_items",
      "collect_rarity",
      "full_catalogue",
      "first_trade",
      "trade_count",
      "active_trader",
      "trade_partners",
      "big_quality",
      "inventory_quality",
      "legendary_luck",
      "player_level",
      "profile_custom",
      "misc_fun",
    ]);

    let name: string, description: string;

    switch (pattern) {
      case "first_scan": {
        name = "Scanner Beginner";
        description = `Scan your very first item and add it to your inventory.`;
        break;
      }
      case "scan_streak": {
        const days = faker.number.int({ min: 3, max: 14 });
        name = `${days}-Day Scanning Streak`;
        description = `Scan at least one new code every day for ${days} days in a row.`;
        break;
      }
      case "own_items": {
        const num = faker.number.int({ min: 10, max: 250 });
        name = `Pack Rat ${num}`;
        description = `Own ${num} items in your inventory.`;
        break;
      }
      case "collect_rarity": {
        // Rarity can be "Rare", "Epic", "Legendary" etc. -- use faker color for variety here!
        const rarity = capitalize(faker.color.human());
        name = `${rarity} Collector`;
        description = `Obtain your first ${rarity.toLowerCase()} collectable.`;
        break;
      }
      case "full_catalogue": {
        name = "Catalogue Completionist";
        description = `Collect one of every collectable item available in the game.`;
        break;
      }
      case "first_trade": {
        name = "First Exchange";
        description = `Complete your first successful trade with another player.`;
        break;
      }
      case "trade_count": {
        const trades = faker.number.int({ min: 3, max: 30 });
        name = `Wheeler Dealer #${trades}`;
        description = `Complete ${trades} trades with any players.`;
        break;
      }
      case "active_trader": {
        const session = faker.number.int({ min: 2, max: 8 });
        name = `Trade Session Frenzy (${session})`;
        description = `Initiate or accept ${session} trades in a single play session.`;
        break;
      }
      case "trade_partners": {
        const partners = faker.number.int({ min: 3, max: 15 });
        name = `Networker (${partners} Partners)`;
        description = `Trade with ${partners} unique people.`;
        break;
      }
      case "big_quality": {
        const quality = faker.number.int({ min: 80, max: 120 });
        name = `Top Quality Find`;
        description = `Obtain an item with quality rating of ${quality} or better.`;
        break;
      }
      case "inventory_quality": {
        const q = faker.number.int({ min: 300, max: 1500 });
        name = `Treasure Hoard`;
        description = `Reach a combined item quality of ${q} across your entire inventory.`;
        break;
      }
      case "legendary_luck": {
        name = "Legendary Luck";
        description = `Find a legendary item from a scan.`;
        break;
      }
      case "player_level": {
        const level = faker.helpers.arrayElement([5, 10, 15, 25, 50, 100]);
        name = `Level ${level} Milestone`;
        description = `Reach player level ${level}.`;
        break;
      }
      case "profile_custom": {
        name = "Fashion Statement";
        description = `Customize your player profile with a new username or bio.`;
        break;
      }
      default: {
        // Misc/fun/unexpected
        name = `${capitalize(faker.word.verb())} the ${faker.word.adjective()} ${faker.word.noun()}`;
        description = `Perform a unique action involving ${faker.word.noun()} for a surprise!`;
      }
    }

    achievements.push({
      id: i,
      name,
      description,
      createdAt: new Date().toISOString(),
    });
  }

  return achievements;
}
