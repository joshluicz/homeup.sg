export type MrtLineCode = "NS" | "EW" | "NE" | "CC" | "CE" | "DT" | "TE" | "CG" | "BP" | "SK" | "PG";

export type ParsedMrtCode = {
  line: MrtLineCode | string;
  number: string;
  full: string;
};

export type MrtLineStyle = {
  bg: string;
  border: string;
};

/** Colours aligned with the official Singapore MRT system map. */
export const MRT_LINE_STYLES: Record<string, MrtLineStyle> = {
  NS: { bg: "#D42E12", border: "#B52710" },
  EW: { bg: "#009645", border: "#007A38" },
  NE: { bg: "#9900AA", border: "#7A0088" },
  CC: { bg: "#FF8F1C", border: "#E57810" },
  CE: { bg: "#FF8F1C", border: "#E57810" },
  DT: { bg: "#005EC4", border: "#004A9A" },
  TE: { bg: "#9D5B25", border: "#7D491D" },
  CG: { bg: "#009645", border: "#007A38" },
  BP: { bg: "#748477", border: "#5C696B" },
  SK: { bg: "#748477", border: "#5C696B" },
  PG: { bg: "#748477", border: "#5C696B" },
};

const DEFAULT_LINE_STYLE: MrtLineStyle = { bg: "#4B5563", border: "#374151" };

export function parseMrtCode(code: string): ParsedMrtCode {
  const match = code.trim().match(/^([A-Z]{2})(\d+)$/);
  if (!match) return { line: code, number: "", full: code };
  return { line: match[1], number: match[2], full: code };
}

export function lineStyleForCode(code: string): MrtLineStyle {
  const { line } = parseMrtCode(code);
  return MRT_LINE_STYLES[line] ?? DEFAULT_LINE_STYLE;
}
