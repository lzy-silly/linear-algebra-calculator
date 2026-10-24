import type { Ring } from "./ring";

export type Matrix<T> = T[][];

export function clone<T>(m: Matrix<T>): Matrix<T> {
  return m.map((row) => row.slice());
}

export function rows<T>(m: Matrix<T>): number {
  return m.length;
}

export function cols<T>(m: Matrix<T>): number {
  return m.length === 0 ? 0 : m[0].length;
}

export function isSquare<T>(m: Matrix<T>): boolean {
  return rows(m) === cols(m);
}

export function transpose<T>(m: Matrix<T>): Matrix<T> {
  const r = rows(m);
  const c = cols(m);
  const out: Matrix<T> = [];
  for (let j = 0; j < c; j++) {
    const row: T[] = [];
    for (let i = 0; i < r; i++) {
      row.push(m[i][j]);
    }
    out.push(row);
  }
  return out;
}

export function scalarMul<T>(m: Matrix<T>, k: T, ring: Ring<T>): Matrix<T> {
  return m.map((row) => row.map((x) => ring.mul(k, x)));
}

export function add<T>(a: Matrix<T>, b: Matrix<T>, ring: Ring<T>): Matrix<T> {
  return a.map((row, i) => row.map((x, j) => ring.add(x, b[i][j])));
}

export function sub<T>(a: Matrix<T>, b: Matrix<T>, ring: Ring<T>): Matrix<T> {
  return a.map((row, i) => row.map((x, j) => ring.sub(x, b[i][j])));
}

export function mul<T>(a: Matrix<T>, b: Matrix<T>, ring: Ring<T>): Matrix<T> {
  const m = rows(a);
  const n = cols(a);
  const p = cols(b);
  const out: Matrix<T> = [];
  for (let i = 0; i < m; i++) {
    const row: T[] = [];
    for (let j = 0; j < p; j++) {
      let s = ring.zero;
      for (let k = 0; k < n; k++) {
        s = ring.add(s, ring.mul(a[i][k], b[k][j]));
      }
      row.push(s);
    }
    out.push(row);
  }
  return out;
}

export function formatMatrix<T>(m: Matrix<T>, ring: Ring<T>): string[][] {
  return m.map((row) => row.map((x) => ring.toDisplay(x).primary));
}

export function formatMatrixFull<T>(
  m: Matrix<T>,
  ring: Ring<T>
): { primary: string[][]; secondary?: string[][] } {
  const primary = m.map((row) => row.map((x) => ring.toDisplay(x).primary));
  const hasSec = m.some((row) => row.some((x) => ring.toDisplay(x).secondary !== undefined));
  if (!hasSec) {
    return { primary };
  }
  const secondary = m.map((row) => row.map((x) => ring.toDisplay(x).secondary ?? ""));
  return { primary, secondary };
}

export function matrixPlainText<T>(m: Matrix<T>, ring: Ring<T>): string {
  return m.map((row) => row.map((x) => ring.toDisplay(x).primary).join("\t")).join("\n");
}

export function idx(i: number): string {
  return String(i + 1);
}
