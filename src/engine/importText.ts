import { MAX_DIM, MIN_DIM, emptyGrid } from "./grid";

export type ParseMatrixOk = { ok: true; grid: string[][] };
export type ParseMatrixErr = { ok: false; error: string };
export type ParseMatrixResult = ParseMatrixOk | ParseMatrixErr;

const TOKEN = /^[+-]?(?:\d+\.?\d*|\.\d+)(?:\/[+-]?(?:\d+\.?\d*|\.\d+))?$/;

function clampSize(n: number): number {
  return Math.min(MAX_DIM, Math.max(MIN_DIM, n));
}

function normalizeLatex(raw: string): string {
  let s = raw;
  s = s.replace(/\\(?:d|t)?frac\s*\{([^{}]+)\}\s*\{([^{}]+)\}/g, "$1/$2");
  s = s.replace(/\\begin\{[^}]+\}/g, "");
  s = s.replace(/\\end\{[^}]+\}/g, "");
  s = s.replace(/\\left\s*[\(\[\{]|\\right\s*[\)\]\}]/g, "");
  s = s.replace(/\\[a-zA-Z]+/g, " ");
  return s;
}

function splitTokens(row: string): string[] {
  return row
    .trim()
    .split(/[\s,，、\t]+/)
    .map((t) => t.trim())
    .filter((t) => t.length > 0);
}

function stripOuterBrackets(s: string): string {
  const t = s.trim();
  if (
    (t.startsWith("[") && t.endsWith("]")) ||
    (t.startsWith("(") && t.endsWith(")")) ||
    (t.startsWith("{") && t.endsWith("}"))
  ) {
    return t.slice(1, -1);
  }
  return t;
}

function rectangularize(rows: string[][]): string[][] {
  const width = Math.max(0, ...rows.map((r) => r.length));
  return rows.map((r) => {
    const next = r.slice();
    while (next.length < width) {
      next.push("");
    }
    return next;
  });
}

function clip(grid: string[][]): string[][] {
  const r = clampSize(grid.length);
  const c = clampSize(grid[0]?.length ?? 0);
  const out = emptyGrid(r, c);
  for (let i = 0; i < r; i++) {
    for (let j = 0; j < c; j++) {
      out[i][j] = grid[i]?.[j] ?? "";
    }
  }
  return out;
}

export function looksLikeMatrixText(raw: string): boolean {
  const s = raw.trim();
  if (!s) {
    return false;
  }
  if (/[;\n\r\t&]|\\\\/.test(s)) {
    return true;
  }
  const tokens = splitTokens(s);
  return tokens.length >= 2;
}

export function parseMatrixText(raw: string): ParseMatrixResult {
  let s = normalizeLatex(raw).trim();
  if (!s) {
    return { ok: false, error: "粘贴内容为空。" };
  }
  s = stripOuterBrackets(s).trim();
  s = s.replace(/\r\n/g, "\n").replace(/\r/g, "\n");

  let rows: string[][] = [];
  if (s.includes("&") || s.includes("\\\\")) {
    const lineRows = s.split(/\\\\|\n/).map((line) => line.trim()).filter((line) => line.length > 0);
    rows = lineRows.map((line) =>
      line
        .split("&")
        .map((cell) => cell.trim())
        .filter((cell) => cell.length > 0)
    );
  } else if (s.includes(";")) {
    rows = s
      .split(";")
      .map((line) => splitTokens(line))
      .filter((line) => line.length > 0);
  } else {
    rows = s
      .split("\n")
      .map((line) => splitTokens(line))
      .filter((line) => line.length > 0);
  }

  rows = rectangularize(rows).filter((row) => row.some((cell) => cell !== ""));
  if (rows.length === 0 || (rows[0]?.length ?? 0) === 0) {
    return { ok: false, error: "没有识别到矩阵元素。" };
  }

  const unknown = rows.flat().find((cell) => cell !== "" && !TOKEN.test(cell));
  if (unknown) {
    return { ok: false, error: `无法识别「${unknown}」，请使用整数、小数或分数。` };
  }

  if (rows.length > MAX_DIM || rows[0].length > MAX_DIM) {
    rows = clip(rows);
  }
  return { ok: true, grid: rows };
}

export function pasteBlock(
  grid: string[][],
  startR: number,
  startC: number,
  block: string[][],
  lockCols?: number
): string[][] {
  const useBlock =
    lockCols === 1 ? block.map((row) => [row[0] ?? ""]) : block;
  const needR = Math.min(MAX_DIM, Math.max(grid.length, startR + useBlock.length));
  const needC = lockCols === 1
    ? 1
    : Math.min(MAX_DIM, Math.max(grid[0]?.length ?? 0, startC + (useBlock[0]?.length ?? 0)));
  const next = emptyGrid(needR, needC);
  for (let i = 0; i < grid.length; i++) {
    for (let j = 0; j < (grid[i]?.length ?? 0); j++) {
      if (i < needR && j < needC) {
        next[i][j] = grid[i][j];
      }
    }
  }
  for (let i = 0; i < useBlock.length; i++) {
    const r = startR + i;
    if (r >= MAX_DIM) {
      break;
    }
    for (let j = 0; j < useBlock[i].length; j++) {
      const c = startC + j;
      if (c >= needC) {
        break;
      }
      next[r][c] = useBlock[i][j];
    }
  }
  return next;
}
