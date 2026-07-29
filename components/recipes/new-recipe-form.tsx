"use client";

import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { RecipePhotoField } from "@/components/recipes/recipe-photo-field";
import {
  createRecipeAction,
  uploadRecipePhotoAction,
} from "@/lib/recipes/actions";
import { useTranslations } from "next-intl";

const RecipeForm = dynamic(
  () =>
    import("@/components/recipes/recipe-form").then((m) => ({
      default: m.RecipeForm,
    })),
  { ssr: false },
);

export function NewRecipeForm() {
  const tRecipes = useTranslations("recipes");
  const router = useRouter();
  const [draftPhoto, setDraftPhoto] = useState<File | null>(null);

  return (
    <RecipeForm
      submitLabel={tRecipes("createRecipe")}
      photoSlot={
        <RecipePhotoField
          editable
          draftFile={draftPhoto}
          onDraftFileChange={setDraftPhoto}
        />
      }
      onSubmit={async (input) => {
        const recipe = await createRecipeAction(input);
        if (draftPhoto) {
          const formData = new FormData();
          formData.set("photo", draftPhoto);
          await uploadRecipePhotoAction(recipe.id, formData);
        }
        router.push(`/recipes/${recipe.id}`);
        router.refresh();
      }}
    />
  );
}
