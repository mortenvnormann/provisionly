import { z } from "zod";
import {
  addRecipeToListSchema,
  deleteConfirmationSchema,
  guestListsSchema,
  itemIdSchema,
  listIdSchema,
  listItemInputSchema,
  listItemUpdateSchema,
  listTitleSchema,
  profileUpdateSchema,
  recipeIdSchema,
  recipeInputSchema,
  shareTokenSchema,
} from "@/lib/validation/schemas";

function formatZodError(error: z.ZodError): string {
  const first = error.issues[0];
  if (!first) return "Invalid input";
  const path = first.path.length > 0 ? `${first.path.join(".")}: ` : "";
  return `${path}${first.message}`;
}

export function parseOrThrow<T>(schema: z.ZodType<T>, value: unknown): T {
  const result = schema.safeParse(value);
  if (!result.success) {
    throw new Error(formatZodError(result.error));
  }
  return result.data;
}

export function parseListTitle(title: string) {
  return parseOrThrow(listTitleSchema, title);
}

export function parseListId(listId: string) {
  return parseOrThrow(listIdSchema, listId);
}

export function parseItemId(itemId: string) {
  return parseOrThrow(itemIdSchema, itemId);
}

export function parseListItemInput(input: {
  name: string;
  quantity?: number | null;
  unit?: string | null;
  existingSortKeys: string[];
}) {
  return parseOrThrow(listItemInputSchema, input);
}

export function parseListItemUpdate(input: {
  name: string;
  quantity?: number | null;
  unit?: string | null;
}) {
  return parseOrThrow(listItemUpdateSchema, input);
}

export function parseRecipeInput(input: unknown) {
  return parseOrThrow(recipeInputSchema, input);
}

export function parseRecipeId(recipeId: string) {
  return parseOrThrow(recipeIdSchema, recipeId);
}

export function parseAddRecipeToListOptions(options: {
  targetServings: number;
  selectedIngredientIds: string[];
}) {
  return parseOrThrow(addRecipeToListSchema, options);
}

export function parseProfileUpdate(input: {
  firstName: string;
  lastName: string;
  locale?: string;
}) {
  return parseOrThrow(profileUpdateSchema, input);
}

export function parseDeleteConfirmation(confirmation: string) {
  return parseOrThrow(deleteConfirmationSchema, confirmation);
}

export function parseShareToken(token: string) {
  return parseOrThrow(shareTokenSchema, token);
}

export function parseGuestLists(lists: unknown) {
  return parseOrThrow(guestListsSchema, lists);
}
