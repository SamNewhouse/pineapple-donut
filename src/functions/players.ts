import { Tables, Player } from "../types";
import * as Dynamodb from "../lib/dynamodb";
import { capitalize } from "../utils/helpers";

/**
 * Retrieve a single player profile by its unique identifier.
 *
 * @param playerId - The UUID or primary key of the player to retrieve.
 * @returns        - The Player object if found, or null if not found.
 *
 * @example
 *   const player = await getPlayer("player-uuid-123");
 *   if (!player) { ... handle not found ... }
 */
export async function getPlayer(playerId: string): Promise<Player | null> {
  return Dynamodb.get(Tables.Players, { id: playerId });
}

export async function getAllPlayers(): Promise<Player[]> {
  return Dynamodb.scan(Tables.Players);
}

/**
 * Patch a single allowed field on a player's profile.
 * Uses UpdateExpression—no get/put required.
 * Uniqueness is checked for specified fields.
 *
 * @param playerId   - The player's unique ID
 * @param fieldName  - The field to update
 * @param value      - The new value for the field
 * @returns          - Updated Player object
 */
export async function updatePlayerField(
  playerId: string,
  fieldName: string,
  value: any,
): Promise<Player> {
  const allowed = ["username"];
  if (!allowed.includes(fieldName)) throw new Error(`Cannot update field: ${fieldName}`);

  // Dynamically check for uniqueness only for fields requiring it
  const uniqueFields = ["username"];
  if (uniqueFields.includes(fieldName)) {
    const queryString = `${fieldName} = :${fieldName}`;
    const queryValues = { [`:${fieldName}`]: value };
    const indexName = `${capitalize(fieldName)}Index`;
    const existing = await Dynamodb.query(Tables.Players, queryString, queryValues, indexName);
    if (existing.length > 0 && existing[0].id !== playerId) {
      throw new Error(`${capitalize(fieldName)} already in use`);
    }
  }

  const UpdateExpression = `set #field = :value`;
  const ExpressionAttributeNames = { "#field": fieldName };
  const ExpressionAttributeValues = { ":value": value };

  const updated = await Dynamodb.update(
    Tables.Players,
    { id: playerId },
    UpdateExpression,
    ExpressionAttributeValues,
    ExpressionAttributeNames,
  );

  if (!updated) throw new Error("Player not found");
  return updated as Player;
}
