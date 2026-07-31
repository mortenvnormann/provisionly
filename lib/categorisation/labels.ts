export function getCategoryLabel(
  category: { labels: Record<string, string>; slug: string },
  locale: string,
): string {
  return (
    category.labels[locale] ??
    category.labels.en ??
    category.slug.replace(/_/g, " ")
  );
}
