const AD_ITEM_TYPE = "inline_ad" as const;

export type AdItem = { _type: typeof AD_ITEM_TYPE; key: string };

export function isAdItem(item: any): item is AdItem {
  return item != null && item._type === AD_ITEM_TYPE;
}

export function insertInlineAds<T>(
  items: T[],
  interval: number = 8
): (T | AdItem)[] {
  if (items.length === 0) return items;

  const result: (T | AdItem)[] = [];
  items.forEach((item, index) => {
    result.push(item);
    if ((index + 1) % interval === 0 && index < items.length - 1) {
      result.push({ _type: AD_ITEM_TYPE, key: `inline-ad-${index}` });
    }
  });
  return result;
}
