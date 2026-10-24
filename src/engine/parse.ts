import { Frac } from "./fraction";

export type CellError = {
  r: number;
  c: number;
  grid: "a" | "b";
  message: string;
};

const TOKEN = /^[+-]?(?:\d+\.?\d*|\.\d+)(?:\/[+-]?(?:\d+\.?\d*|\.\d+))?$/;

export function parseDecimalToken(raw: string): Frac {
  const sign = raw.startsWith("-") ? -1n : 1n;
  const t = raw.replace(/^[+-]/, "");
  const [ip, fp = ""] = t.split(".");
  const intPart = ip === "" ? "0" : ip;
  const n = BigInt(intPart + fp);
  const d = 10n ** BigInt(fp.length);
  return new Frac(sign * n, d);
}

export function parseScalar(raw: string): { ok: true; value: Frac } | { ok: false; message: string } {
  const s = raw.trim();
  if (s === "") {
    return { ok: true, value: Frac.zero() };
  }
  if (!TOKEN.test(s)) {
    return { ok: false, message: `无法解析「${s}」为有限实数` };
  }
  try {
    if (s.includes("/")) {
      const [p, q] = s.split("/");
      const num = parseDecimalToken(p);
      const den = parseDecimalToken(q);
      if (den.isZero()) {
        return { ok: false, message: "分母不能为 0" };
      }
      return { ok: true, value: num.div(den) };
    }
    return { ok: true, value: parseDecimalToken(s) };
  } catch {
    return { ok: false, message: `无法解析「${s}」为有限实数` };
  }
}

export function parseGrid(
  grid: string[][],
  which: "a" | "b"
): { ok: true; matrix: Frac[][] } | { ok: false; cellErrors: CellError[] } {
  const cellErrors: CellError[] = [];
  const matrix: Frac[][] = [];
  for (let r = 0; r < grid.length; r++) {
    const row: Frac[] = [];
    for (let c = 0; c < grid[r].length; c++) {
      const parsed = parseScalar(grid[r][c]);
      if (!parsed.ok) {
        cellErrors.push({ r, c, grid: which, message: parsed.message });
        row.push(Frac.zero());
      } else {
        row.push(parsed.value);
      }
    }
    matrix.push(row);
  }
  if (cellErrors.length > 0) {
    return { ok: false, cellErrors };
  }
  return { ok: true, matrix };
}
