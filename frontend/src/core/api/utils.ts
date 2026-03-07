export function asArray<T = any>(value: any): T[] {
  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.data)) return value.data;
  if (Array.isArray(value?.rows)) return value.rows;
  if (Array.isArray(value?.forecast)) return value.forecast;
  if (Array.isArray(value?.heatmap)) return value.heatmap;
  if (Array.isArray(value?.campaigns)) return value.campaigns;
  return [];
}
