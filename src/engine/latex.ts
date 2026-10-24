import type { ComputeSuccess } from "./types";

export function latexNumber(raw: string): string {
  const s = raw.trim();
  if (!s) {
    return "0";
  }
  const frac = s.match(/^([+-]?\d+)\/([+-]?\d+)$/);
  if (frac) {
    const n = frac[1].startsWith("+") ? frac[1].slice(1) : frac[1];
    const d = frac[2].startsWith("+") ? frac[2].slice(1) : frac[2];
    if (d === "1") {
      return n;
    }
    if (n.startsWith("-")) {
      return `-\\frac{${n.slice(1)}}{${d}}`;
    }
    return `\\frac{${n}}{${d}}`;
  }
  return s.replace(/([{}%#$&_])/g, "\\$1");
}

export function latexMatrix(grid: string[][]): string {
  const body = grid.map((row) => row.map(latexNumber).join(" & ")).join(" \\\\\n");
  return `\\begin{pmatrix}\n${body}\n\\end{pmatrix}`;
}

export function latexVector(values: string[]): string {
  return latexMatrix(values.map((v) => [v]));
}

export function exportLatex(result: ComputeSuccess): string {
  if (result.kind === "scalar") {
    const v = latexNumber(result.scalarPrimary ?? result.display);
    if (result.op === "det") {
      return `\\det = ${v}`;
    }
    return v;
  }
  if (result.kind === "rank") {
    return `\\mathrm{rank} = ${result.rank ?? result.display}`;
  }
  if (result.kind === "matrix" && result.matrix) {
    return latexMatrix(result.matrix.primary);
  }
  if (result.kind === "solve" && result.solve) {
    const s = result.solve;
    if (s.kind === "none") {
      return "\\text{无解}";
    }
    if (s.kind === "unique" && s.particular) {
      return `x = ${latexVector(s.particular)}`;
    }
    const parts: string[] = [];
    if (s.particular) {
      parts.push(`x_{p} = ${latexVector(s.particular)}`);
    }
    for (const f of s.free ?? []) {
      parts.push(
        `x_{${f.index + 1}}\\text{ 自由，方向 } ${latexVector(f.direction)}`
      );
    }
    return parts.join(" \\\\\n");
  }
  return result.display;
}
