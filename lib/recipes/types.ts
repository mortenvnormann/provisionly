export type RecipeSummary = {
  id: string;
  title: string;
  defaultServings: number;
  updatedAt: string;
  isOwner: boolean;
};

export type RecipeIngredientRow = {
  id: string;
  recipeId: string;
  name: string;
  quantity: number | null;
  unit: string | null;
  categoryId: string | null;
  position: number;
};

export type RecipeDetail = {
  id: string;
  title: string;
  description: string;
  instructions: string;
  tags: string[];
  defaultServings: number;
  prepMinutes: number | null;
  cookMinutes: number | null;
  updatedAt: string;
  ownerId: string;
  isOwner: boolean;
  imagePath: string | null;
  imageUrl: string | null;
  ingredients: RecipeIngredientRow[];
};

export type RecipePhotoResult = {
  imagePath: string;
  imageUrl: string;
};

export type RecipeIngredientInput = {
  name: string;
  quantity?: number | null;
  unit?: string | null;
};

export type RecipeInput = {
  title: string;
  description: string;
  instructions: string;
  tags: string[];
  defaultServings: number;
  prepMinutes?: number | null;
  cookMinutes?: number | null;
  ingredients: RecipeIngredientInput[];
};

export type AddToListResult = {
  added: number;
  merged: number;
};
