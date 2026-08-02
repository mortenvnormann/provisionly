import "server-only";

import { applyAiCategoryUpgrade } from "@/lib/categorisation/resolve";
import { normalizeItemName } from "@/lib/lists/normalize";
import { createServiceClient } from "@/lib/supabase/service";

type UpgradeAfterWriteInput = {
  itemName: string;
  locale: string;
  itemId: string;
  generalId: string;
  nameNormalized?: string;
};

/**
 * Run Gemini after a dictionary write landed on General.
 * Updates the written row and any other list_items with the same
 * name_normalized still on General. Soft-fails (logs, leaves General).
 */
export async function upgradeCategoryAfterWrite(
  input: UpgradeAfterWriteInput,
): Promise<void> {
  const nameNormalized =
    input.nameNormalized ?? normalizeItemName(input.itemName);
  if (!nameNormalized) return;

  const service = createServiceClient();

  try {
    const upgraded = await applyAiCategoryUpgrade(
      service,
      input.itemName,
      input.locale,
    );
    if (!upgraded || upgraded === input.generalId) return;

    const { error: itemError } = await service
      .from("list_items")
      .update({ category_id: upgraded })
      .eq("id", input.itemId);

    if (itemError) {
      console.error(
        "[categorisation] Failed to upgrade item category:",
        itemError.message,
      );
    }

    const { error: bulkError } = await service
      .from("list_items")
      .update({ category_id: upgraded })
      .eq("name_normalized", nameNormalized)
      .eq("category_id", input.generalId);

    if (bulkError) {
      console.error(
        "[categorisation] Failed to backfill same-name General items:",
        bulkError.message,
      );
    }
  } catch (error) {
    console.error("[categorisation] Background category upgrade failed:", error);
  }
}
