import { getAppErrorCode } from "@/lib/errors/app-error";
import { SHARE_ERROR_CODES } from "@/lib/errors/share-codes";

type JoinTranslator = (key: string) => string;

export function joinErrorMessage(
  err: unknown,
  tJoin: JoinTranslator,
): string {
  const code = getAppErrorCode(err);

  switch (code) {
    case SHARE_ERROR_CODES.expired:
      return tJoin("expiredLink");
    case SHARE_ERROR_CODES.listGone:
      return tJoin("listGone");
    case SHARE_ERROR_CODES.recipeGone:
      return tJoin("recipeGone");
    case SHARE_ERROR_CODES.invalid:
      return tJoin("invalidLink");
    default:
      return tJoin("invalidLink");
  }
}
