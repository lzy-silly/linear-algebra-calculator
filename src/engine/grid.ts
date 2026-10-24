export function emptyGrid(rows: number, cols: number, fill = ""): string[][] {
  return Array.from({ length: rows }, () => Array.from({ length: cols }, () => fill));
}

export function resizeGrid(grid: string[][], rows: number, cols: number): string[][] {
  const next = emptyGrid(rows, cols);
  for (let i = 0; i < Math.min(rows, grid.length); i++) {
    for (let j = 0; j < Math.min(cols, grid[i].length); j++) {
      next[i][j] = grid[i][j];
    }
  }
  return next;
}

export function identityGrid(n: number): string[][] {
  const size = Math.min(MAX_DIM, Math.max(MIN_DIM, n));
  return Array.from({ length: size }, (_, i) =>
    Array.from({ length: size }, (_, j) => (i === j ? "1" : "0"))
  );
}

export function zeroGrid(rows: number, cols: number): string[][] {
  return emptyGrid(rows, cols, "0");
}

export const MIN_DIM = 1;
export const MAX_DIM = 10;
