import * as Dynamodb from "../lib/dynamodb";
import { Tables, Collectable } from "../types";

/**
 * Get all Collectables from the DB.
 *
 * @returns Array of Collectable items
 */
export async function getAllCollectables(): Promise<Collectable[]> {
  return Dynamodb.scan(Tables.Collectables);
}
