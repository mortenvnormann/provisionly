import { z } from "zod";
import { SUPPORTED_LOCALES } from "@/lib/i18n/locales";

export const LIMITS = {
  listTitle: 200,
  itemName: 500,
  unit: 50,
  recipeTitle: 200,
  recipeDescription: 10_000,
  recipeInstructions: 50_000,
  recipeTag: 50,
  recipeTags: 30,
  profileName: 100,
  guestLists: 50,
  guestItemsPerList: 500,
  sortKeys: 1000,
  ingredientIds: 200,
} as const;

const uuid = z.string().uuid();

export const listTitleSchema = z
  .string()
  .trim()
  .min(1)
  .max(LIMITS.listTitle);

export const listIdSchema = uuid;

export const itemIdSchema = uuid;

export const listItemInputSchema = z.object({
  name: z.string().trim().min(1).max(LIMITS.itemName),
  quantity: z
    .number()
    .finite()
    .nonnegative()
    .max(1_000_000)
    .nullable()
    .optional(),
  unit: z.string().trim().max(LIMITS.unit).nullable().optional(),
  existingSortKeys: z.array(z.string().max(32)).max(LIMITS.sortKeys),
});

export const listItemUpdateSchema = z.object({
  name: z.string().trim().min(1).max(LIMITS.itemName),
  quantity: z
    .number()
    .finite()
    .nonnegative()
    .max(1_000_000)
    .nullable()
    .optional(),
  unit: z.string().trim().max(LIMITS.unit).nullable().optional(),
});

export const recipeIngredientInputSchema = z.object({
  name: z.string().trim().min(1).max(LIMITS.itemName),
  quantity: z
    .number()
    .finite()
    .nonnegative()
    .max(1_000_000)
    .nullable()
    .optional(),
  unit: z.string().trim().max(LIMITS.unit).nullable().optional(),
});

export const recipeInputSchema = z.object({
  title: z.string().trim().min(1).max(LIMITS.recipeTitle),
  description: z.string().trim().max(LIMITS.recipeDescription),
  instructions: z.string().trim().max(LIMITS.recipeInstructions),
  tags: z
    .array(z.string().trim().min(1).max(LIMITS.recipeTag))
    .max(LIMITS.recipeTags),
  defaultServings: z.number().int().min(1).max(1000),
  ingredients: z.array(recipeIngredientInputSchema).max(200),
});

export const recipeIdSchema = uuid;

export const addRecipeToListSchema = z.object({
  targetServings: z.number().int().min(1).max(1000),
  selectedIngredientIds: z.array(uuid).max(LIMITS.ingredientIds),
});

export const profileUpdateSchema = z.object({
  firstName: z.string().trim().max(LIMITS.profileName),
  lastName: z.string().trim().max(LIMITS.profileName),
  locale: z.enum(SUPPORTED_LOCALES).optional(),
});

export const deleteConfirmationSchema = z.literal("delete my account");

export const shareTokenSchema = z.string().trim().min(16).max(128);

export const guestListItemSchema = z.object({
  name: z.string().trim().min(1).max(LIMITS.itemName),
  quantity: z.number().finite().nonnegative().max(1_000_000).nullable().optional(),
  unit: z.string().trim().max(LIMITS.unit).nullable().optional(),
  checked: z.boolean().optional(),
  sortKey: z.string().max(32).optional(),
  categoryId: z.string().uuid().nullable().optional(),
});

export const guestListSchema = z.object({
  id: z.string().max(64),
  title: z.string().trim().min(1).max(LIMITS.listTitle),
  items: z.array(guestListItemSchema).max(LIMITS.guestItemsPerList).optional(),
  groupByCategory: z.boolean().optional(),
});

export const guestListsSchema = z.array(guestListSchema).max(LIMITS.guestLists);
