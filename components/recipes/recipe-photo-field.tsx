"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  removeRecipePhotoAction,
  uploadRecipePhotoAction,
} from "@/lib/recipes/actions";
import type { RecipePhotoResult } from "@/lib/recipes/types";
import { useOnline } from "@/lib/pwa/use-online";
import { Button } from "@/components/ui/button";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { CameraIcon } from "@/components/ui/icons";
import { useTranslations } from "next-intl";

type RecipePhotoFieldProps = {
  recipeId?: string;
  imageUrl?: string | null;
  editable?: boolean;
  variant?: "form" | "hero";
  draftFile?: File | null;
  onDraftFileChange?: (file: File | null) => void;
  onPhotoUpdated?: (result: RecipePhotoResult | null) => void;
};

export function RecipePhotoField({
  recipeId,
  imageUrl = null,
  editable = false,
  variant = "form",
  draftFile = null,
  onDraftFileChange,
  onPhotoUpdated,
}: RecipePhotoFieldProps) {
  const tRecipes = useTranslations("recipes");
  const tCommon = useTranslations("common");
  const confirmDialog = useConfirm();
  const online = useOnline();
  const inputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(imageUrl);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isDraft = !recipeId;
  const displayUrl = previewUrl ?? imageUrl;

  useEffect(() => {
    if (!draftFile) {
      setPreviewUrl(imageUrl);
      return;
    }

    const objectUrl = URL.createObjectURL(draftFile);
    setPreviewUrl(objectUrl);
    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [draftFile, imageUrl]);

  const openPicker = useCallback(() => {
    inputRef.current?.click();
  }, []);

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setError(null);

    if (isDraft) {
      onDraftFileChange?.(file);
      return;
    }

    if (!recipeId) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.set("photo", file);
      const result = await uploadRecipePhotoAction(recipeId, formData);
      setPreviewUrl(result.imageUrl);
      onPhotoUpdated?.(result);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : tRecipes("photoUploadFailed"),
      );
    } finally {
      setUploading(false);
    }
  }

  async function handleRemove() {
    const ok = await confirmDialog(
      tRecipes("removePhotoConfirm"),
      tCommon("remove"),
    );
    if (!ok) return;

    setError(null);

    if (isDraft) {
      onDraftFileChange?.(null);
      setPreviewUrl(imageUrl);
      return;
    }

    if (!recipeId) return;

    setUploading(true);
    try {
      await removeRecipePhotoAction(recipeId);
      setPreviewUrl(null);
      onPhotoUpdated?.(null);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : tRecipes("photoUploadFailed"),
      );
    } finally {
      setUploading(false);
    }
  }

  if (!editable && !displayUrl) {
    return null;
  }

  const controlsDisabled = uploading || !online;

  if (variant === "hero") {
    if (!displayUrl && editable) {
      return (
        <div className="px-4 pt-3">
          <div className="flex flex-col items-center gap-3 py-4">
            <CameraIcon className="size-10 text-[var(--muted-foreground)]" />
            <Button
              type="button"
              variant="secondary"
              disabled={controlsDisabled}
              onClick={openPicker}
            >
              {uploading ? tRecipes("photoUploading") : tRecipes("addPhoto")}
            </Button>
          </div>
          {error ? (
            <p className="font-ui mt-2 text-center text-sm text-[var(--destructive)]">
              {error}
            </p>
          ) : null}
          {!online ? (
            <p className="font-ui mt-2 text-center text-xs text-[var(--muted-foreground)]">
              {tCommon("offline")}
            </p>
          ) : null}
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(event) => void handleFileChange(event)}
          />
        </div>
      );
    }

    return (
      <div className="px-4 pt-3">
        <div className="relative overflow-hidden rounded-2xl bg-[var(--muted)]">
          {displayUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={displayUrl}
              alt=""
              className="max-h-60 w-full object-cover"
            />
          ) : null}
          {editable && displayUrl ? (
            <div className="absolute inset-x-0 bottom-0 flex gap-2 bg-gradient-to-t from-black/50 to-transparent p-3">
              <Button
                type="button"
                variant="secondary"
                fullWidth
                disabled={controlsDisabled}
                onClick={openPicker}
              >
                {uploading
                  ? tRecipes("photoUploading")
                  : tRecipes("changePhoto")}
              </Button>
              <Button
                type="button"
                variant="secondary"
                disabled={controlsDisabled}
                onClick={() => void handleRemove()}
              >
                {tCommon("remove")}
              </Button>
            </div>
          ) : null}
        </div>
        {error ? (
          <p className="font-ui mt-2 text-sm text-[var(--destructive)]">{error}</p>
        ) : null}
        {editable && displayUrl ? (
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(event) => void handleFileChange(event)}
          />
        ) : null}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm font-medium text-[var(--foreground)]">
        {tRecipes("photo")}
      </span>
      <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)]">
        {displayUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={displayUrl}
            alt=""
            className="max-h-56 w-full object-cover"
          />
        ) : (
          <div className="flex h-40 items-center justify-center px-4 text-center text-sm text-[var(--muted-foreground)]">
            {tRecipes("addPhoto")}
          </div>
        )}
      </div>
      {editable ? (
        <div className="flex gap-2">
          <Button
            type="button"
            variant="secondary"
            fullWidth
            disabled={controlsDisabled}
            onClick={openPicker}
          >
            {uploading
              ? tRecipes("photoUploading")
              : displayUrl
                ? tRecipes("changePhoto")
                : tRecipes("addPhoto")}
          </Button>
          {displayUrl ? (
            <Button
              type="button"
              variant="secondary"
              disabled={controlsDisabled}
              onClick={() => void handleRemove()}
            >
              {tCommon("remove")}
            </Button>
          ) : null}
        </div>
      ) : null}
      {!online && editable ? (
        <p className="font-ui text-xs text-[var(--muted-foreground)]">
          {tCommon("offline")}
        </p>
      ) : null}
      {error ? (
        <p className="font-ui text-sm text-[var(--destructive)]">{error}</p>
      ) : null}
      {editable ? (
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(event) => void handleFileChange(event)}
        />
      ) : null}
    </div>
  );
}
