/** HomeUP listings tracker — public CSV export. */
export const LISTINGS_SHEET_ID = "1CpaVMBfq6fJRb2ymeeBOfLYYeyfJ2hB8QzdlxdZN0io";
export const LISTINGS_SHEET_GID = "550958788";

export function listingsSheetCsvUrl(): string {
  return `https://docs.google.com/spreadsheets/d/${LISTINGS_SHEET_ID}/export?format=csv&gid=${LISTINGS_SHEET_GID}`;
}
