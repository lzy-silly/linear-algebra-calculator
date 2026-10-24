import type { Ring } from "./ring";
import {
  type Matrix,
  add,
  clone,
  cols,
  idx,
  isSquare,
  mul,
  rows,
  scalarMul,
  sub,
  transpose,
} from "./matrix";

export type SolveKind = "unique" | "infinite" | "none";

export interface SolveResult<T> {
  kind: SolveKind;
  particular?: T[];
  free?: { index: number; direction: T[] }[];
  steps: string[];
}

function swapRows<T>(m: Matrix<T>, i: number, j: number): void {
  const t = m[i];
  m[i] = m[j];
  m[j] = t;
}

function findPivot<T>(m: Matrix<T>, ring: Ring<T>, col: number, fromRow: number): number {
  let best = fromRow;
  for (let i = fromRow + 1; i < rows(m); i++) {
    if (ring.absCmp(m[i][col], m[best][col]) > 0) {
      best = i;
    }
  }
  return best;
}

export function determinantWithSteps<T>(
  a: Matrix<T>,
  ring: Ring<T>
): { value: T; steps: string[]; singular: boolean } {
  const n = rows(a);
  const m = clone(a);
  const steps: string[] = [`对 ${n}×${n} 方阵做高斯消元求行列式，行列式等于各主元之积再乘行交换符号。`];
  let sign = 1;
  let det = ring.one;

  for (let k = 0; k < n; k++) {
    const piv = findPivot(m, ring, k, k);
    if (ring.isZero(m[piv][k])) {
      steps.push(`第 ${idx(k)} 列从第 ${idx(k)} 行起全为 0，主元不存在，行列式为 0，该方阵为奇异矩阵。`);
      return { value: ring.zero, steps, singular: true };
    }
    if (piv !== k) {
      swapRows(m, k, piv);
      sign = -sign;
      steps.push(`交换第 ${idx(k)} 行与第 ${idx(piv)} 行，行列式变号。`);
    }
    const pivot = m[k][k];
    steps.push(`第 ${idx(k)} 步主元为 ${ring.toString(pivot)}。`);
    for (let i = k + 1; i < n; i++) {
      if (ring.isZero(m[i][k])) {
        continue;
      }
      const factor = ring.div(m[i][k], pivot);
      steps.push(
        `第 ${idx(i)} 行减去 ${ring.toString(factor)} 倍第 ${idx(k)} 行，消去位置 (${idx(i)}, ${idx(k)})。`
      );
      for (let j = k; j < n; j++) {
        m[i][j] = ring.sub(m[i][j], ring.mul(factor, m[k][j]));
      }
    }
  }

  for (let i = 0; i < n; i++) {
    det = ring.mul(det, m[i][i]);
  }
  if (sign < 0) {
    det = ring.neg(det);
    steps.push(`发生奇数次行交换，最终行列式取相反数。`);
  }
  steps.push(`上三角主元连乘得到行列式 = ${ring.toString(det)}。`);
  return { value: det, steps, singular: ring.isZero(det) };
}

export function inverseWithSteps<T>(
  a: Matrix<T>,
  ring: Ring<T>
): { ok: true; inverse: Matrix<T>; steps: string[] } | { ok: false; reason: string; steps: string[] } {
  const n = rows(a);
  if (!isSquare(a)) {
    return { ok: false, reason: "只有方阵才可能可逆。", steps: [] };
  }
  const steps: string[] = [`构造 ${n}×${2 * n} 增广矩阵 [A | I]，用高斯-约当消元把左侧化为单位矩阵。`];
  const m: Matrix<T> = a.map((row, i) => {
    const extra: T[] = [];
    for (let j = 0; j < n; j++) {
      extra.push(i === j ? ring.one : ring.zero);
    }
    return row.concat(extra);
  });

  for (let k = 0; k < n; k++) {
    const piv = findPivot(m, ring, k, k);
    if (ring.isZero(m[piv][k])) {
      steps.push(`第 ${idx(k)} 列找不到非零主元，A 为奇异矩阵，不可逆。`);
      return { ok: false, reason: "该方阵为奇异矩阵（行列式为 0），不可逆。", steps };
    }
    if (piv !== k) {
      swapRows(m, k, piv);
      steps.push(`交换第 ${idx(k)} 行与第 ${idx(piv)} 行。`);
    }
    const pivot = m[k][k];
    if (!ring.isZero(ring.sub(pivot, ring.one))) {
      steps.push(`第 ${idx(k)} 行除以主元 ${ring.toString(pivot)}，使主元变为 1。`);
      for (let j = 0; j < 2 * n; j++) {
        m[k][j] = ring.div(m[k][j], pivot);
      }
    }
    for (let i = 0; i < n; i++) {
      if (i === k || ring.isZero(m[i][k])) {
        continue;
      }
      const factor = m[i][k];
      steps.push(`第 ${idx(i)} 行减去 ${ring.toString(factor)} 倍第 ${idx(k)} 行。`);
      for (let j = 0; j < 2 * n; j++) {
        m[i][j] = ring.sub(m[i][j], ring.mul(factor, m[k][j]));
      }
    }
  }

  const inverse: Matrix<T> = m.map((row) => row.slice(n));
  steps.push("左侧已化为单位矩阵，右侧即为 A 的逆矩阵。");
  return { ok: true, inverse, steps };
}

export function rankWithSteps<T>(a: Matrix<T>, ring: Ring<T>): { rank: number; steps: string[] } {
  const r = rows(a);
  const c = cols(a);
  const m = clone(a);
  const steps: string[] = [`对 ${r}×${c} 矩阵做行变换化为行阶梯形，非零行的个数即为秩。`];
  let rank = 0;
  let row = 0;
  for (let col = 0; col < c && row < r; col++) {
    const piv = findPivot(m, ring, col, row);
    if (ring.isZero(m[piv][col])) {
      steps.push(`第 ${idx(col)} 列从第 ${idx(row)} 行起全为 0，跳过该列。`);
      continue;
    }
    if (piv !== row) {
      swapRows(m, row, piv);
      steps.push(`交换第 ${idx(row)} 行与第 ${idx(piv)} 行。`);
    }
    const pivot = m[row][col];
    steps.push(`以 (${idx(row)}, ${idx(col)}) 处 ${ring.toString(pivot)} 为主元。`);
    for (let i = row + 1; i < r; i++) {
      if (ring.isZero(m[i][col])) {
        continue;
      }
      const factor = ring.div(m[i][col], pivot);
      steps.push(`第 ${idx(i)} 行减去 ${ring.toString(factor)} 倍第 ${idx(row)} 行。`);
      for (let j = col; j < c; j++) {
        m[i][j] = ring.sub(m[i][j], ring.mul(factor, m[row][j]));
      }
    }
    rank += 1;
    row += 1;
  }
  steps.push(`行阶梯形中非零行共 ${rank} 行，因此秩 = ${rank}。`);
  return { rank, steps };
}

export function solveWithSteps<T>(
  a: Matrix<T>,
  b: T[],
  ring: Ring<T>
): SolveResult<T> {
  const r = rows(a);
  const c = cols(a);
  const m: Matrix<T> = a.map((row, i) => row.concat([b[i]]));
  const steps: string[] = [`对 ${r}×${c + 1} 增广矩阵 [A | b] 做高斯消元，判断解的情况。`];
  const pivotColOfRow: number[] = Array(r).fill(-1);
  let row = 0;
  const usedCols: number[] = [];

  for (let col = 0; col < c && row < r; col++) {
    const piv = findPivot(m, ring, col, row);
    if (ring.isZero(m[piv][col])) {
      steps.push(`第 ${idx(col)} 列从第 ${idx(row)} 行起无非零主元，x${idx(col)} 可能为自由变量。`);
      continue;
    }
    if (piv !== row) {
      swapRows(m, row, piv);
      steps.push(`交换第 ${idx(row)} 行与第 ${idx(piv)} 行。`);
    }
    const pivot = m[row][col];
    steps.push(`以 (${idx(row)}, ${idx(col)}) 处 ${ring.toString(pivot)} 为主元。`);
    for (let i = 0; i < r; i++) {
      if (i === row || ring.isZero(m[i][col])) {
        continue;
      }
      const factor = ring.div(m[i][col], pivot);
      steps.push(`第 ${idx(i)} 行减去 ${ring.toString(factor)} 倍第 ${idx(row)} 行。`);
      for (let j = col; j <= c; j++) {
        m[i][j] = ring.sub(m[i][j], ring.mul(factor, m[row][j]));
      }
    }
    pivotColOfRow[row] = col;
    usedCols.push(col);
    row += 1;
  }

  for (let i = row; i < r; i++) {
    let allZero = true;
    for (let j = 0; j < c; j++) {
      if (!ring.isZero(m[i][j])) {
        allZero = false;
        break;
      }
    }
    if (allZero && !ring.isZero(m[i][c])) {
      steps.push(`出现 0 = ${ring.toString(m[i][c])} 的矛盾方程，方程组无解。`);
      return { kind: "none", steps };
    }
  }

  const bound = new Set(usedCols);
  const freeIdx: number[] = [];
  for (let j = 0; j < c; j++) {
    if (!bound.has(j)) {
      freeIdx.push(j);
    }
  }

  const particular: T[] = Array(c).fill(ring.zero);
  for (let i = 0; i < r; i++) {
    const pc = pivotColOfRow[i];
    if (pc < 0) {
      continue;
    }
    particular[pc] = ring.div(m[i][c], m[i][pc]);
  }

  if (freeIdx.length === 0) {
    steps.push("每个未知数都有主元，方程组有唯一解。");
    return { kind: "unique", particular, steps };
  }

  const free: { index: number; direction: T[] }[] = freeIdx.map((fi) => {
    const direction: T[] = Array(c).fill(ring.zero);
    direction[fi] = ring.one;
    for (let i = 0; i < r; i++) {
      const pc = pivotColOfRow[i];
      if (pc < 0) {
        continue;
      }
      const coeff = ring.div(m[i][fi], m[i][pc]);
      direction[pc] = ring.neg(coeff);
    }
    return { index: fi, direction };
  });

  const freeNames = freeIdx.map((i) => `x${idx(i)}`).join("、");
  steps.push(`自由变量为 ${freeNames}，方程组有无穷多解。特解取全部自由变量为 0。`);
  return { kind: "infinite", particular, free, steps };
}

export function basicOpSteps<T>(
  name: string,
  a: Matrix<T>,
  ring: Ring<T>,
  extra?: string
): string[] {
  const steps = [`运算：${name}。左矩阵规模 ${rows(a)}×${cols(a)}。`];
  if (extra) {
    steps.push(extra);
  }
  const sample = ring.toString(a[0][0]);
  steps.push(`以左上角元素 ${sample} 为例说明元素级计算规则。`);
  return steps;
}

export { add, mul, scalarMul, sub, transpose };
