import { Frac } from "./fraction";
import { parseGrid, parseScalar } from "./parse";
import { floatRing, fracRing, type Ring } from "./ring";
import {
  add,
  basicOpSteps,
  determinantWithSteps,
  inverseWithSteps,
  mul,
  rankWithSteps,
  scalarMul,
  solveWithSteps,
  sub,
  transpose,
} from "./ops";
import { cols, formatMatrixFull, isSquare, matrixPlainText, rows } from "./matrix";
import type { ComputeRequest, ComputeResponse, MatrixView } from "./types";
import { OP_LABEL } from "./types";

function toFracMatrix(m: Frac[][]): Frac[][] {
  return m;
}

function toFloatMatrix(m: Frac[][]): number[][] {
  return m.map((row) => row.map((x) => x.toNumber()));
}

function viewOf<T>(m: T[][], ring: Ring<T>): MatrixView {
  return formatMatrixFull(m, ring);
}

function scalarText<T>(v: T, ring: Ring<T>): { primary: string; secondary?: string } {
  return ring.toDisplay(v);
}

function run<T>(
  req: ComputeRequest,
  a: T[][],
  b: T[][] | undefined,
  scalar: T | undefined,
  ring: Ring<T>
): ComputeResponse {
  const op = req.op;

  if (op === "det") {
    if (!isSquare(a)) {
      return { ok: false, error: "只有方阵才能计算行列式，请使行数等于列数。" };
    }
    const { value, steps, singular } = determinantWithSteps(a, ring);
    const d = scalarText(value, ring);
    return {
      ok: true,
      kind: "scalar",
      op,
      display: d.primary,
      scalarPrimary: d.primary,
      scalarSecondary: d.secondary,
      steps,
      singular,
    };
  }

  if (op === "transpose") {
    const result = transpose(a);
    const extra = `转置后规模变为 ${rows(result)}×${cols(result)}，元素 (i, j) 放到 (j, i)。`;
    return {
      ok: true,
      kind: "matrix",
      op,
      display: matrixPlainText(result, ring),
      matrix: viewOf(result, ring),
      steps: basicOpSteps(OP_LABEL.transpose, a, ring, extra),
    };
  }

  if (op === "scalar") {
    if (scalar === undefined) {
      return { ok: false, error: "请输入数乘的标量 k。" };
    }
    const result = scalarMul(a, scalar, ring);
    const extra = `每个元素乘以标量 ${ring.toString(scalar)}。`;
    return {
      ok: true,
      kind: "matrix",
      op,
      display: matrixPlainText(result, ring),
      matrix: viewOf(result, ring),
      steps: basicOpSteps(OP_LABEL.scalar, a, ring, extra),
    };
  }

  if (op === "add" || op === "sub") {
    if (!b) {
      return { ok: false, error: "请填写第二个矩阵。" };
    }
    if (rows(a) !== rows(b) || cols(a) !== cols(b)) {
      return {
        ok: false,
        error: `矩阵${op === "add" ? "加法" : "减法"}要求两个矩阵规模相同。当前为 ${rows(a)}×${cols(a)} 与 ${rows(b)}×${cols(b)}。`,
      };
    }
    const result = op === "add" ? add(a, b, ring) : sub(a, b, ring);
    const extra = `对应位置元素${op === "add" ? "相加" : "相减"}，结果规模仍为 ${rows(a)}×${cols(a)}。`;
    return {
      ok: true,
      kind: "matrix",
      op,
      display: matrixPlainText(result, ring),
      matrix: viewOf(result, ring),
      steps: basicOpSteps(OP_LABEL[op], a, ring, extra),
    };
  }

  if (op === "mul") {
    if (!b) {
      return { ok: false, error: "请填写第二个矩阵。" };
    }
    if (cols(a) !== rows(b)) {
      return {
        ok: false,
        error: `矩阵乘法要求左矩阵列数等于右矩阵行数。当前为 ${rows(a)}×${cols(a)} 与 ${rows(b)}×${cols(b)}。`,
      };
    }
    const result = mul(a, b, ring);
    const extra = `结果第 i 行第 j 列等于左矩阵第 i 行与右矩阵第 j 列的点积，结果规模为 ${rows(a)}×${cols(b)}。`;
    return {
      ok: true,
      kind: "matrix",
      op,
      display: matrixPlainText(result, ring),
      matrix: viewOf(result, ring),
      steps: basicOpSteps(OP_LABEL.mul, a, ring, extra),
    };
  }

  if (op === "inverse") {
    if (!isSquare(a)) {
      return { ok: false, error: "只有方阵才可能可逆，请使行数等于列数。" };
    }
    const inv = inverseWithSteps(a, ring);
    if (!inv.ok) {
      return { ok: false, error: inv.reason };
    }
    return {
      ok: true,
      kind: "matrix",
      op,
      display: matrixPlainText(inv.inverse, ring),
      matrix: viewOf(inv.inverse, ring),
      steps: inv.steps,
    };
  }

  if (op === "rank") {
    const { rank, steps } = rankWithSteps(a, ring);
    return {
      ok: true,
      kind: "rank",
      op,
      display: String(rank),
      rank,
      steps,
    };
  }

  if (op === "solve") {
    if (!b) {
      return { ok: false, error: "请填写常数向量 b。" };
    }
    if (cols(b) !== 1) {
      return { ok: false, error: "常数向量 b 必须为单列。" };
    }
    if (rows(a) !== rows(b)) {
      return {
        ok: false,
        error: `系数矩阵 A 的行数须等于 b 的行数。当前 A 为 ${rows(a)}×${cols(a)}，b 为 ${rows(b)}×${cols(b)}。`,
      };
    }
    const rhs = b.map((row) => row[0]);
    const solved = solveWithSteps(a, rhs, ring);
    if (solved.kind === "none") {
      return {
        ok: true,
        kind: "solve",
        op,
        display: "无解",
        solve: { kind: "none" },
        steps: solved.steps,
      };
    }
    const particular = solved.particular ?? [];
    const particularPrimary = particular.map((x) => ring.toDisplay(x).primary);
    const particularSecondary = particular.map((x) => ring.toDisplay(x).secondary ?? "");
    const hasSec = particular.some((x) => ring.toDisplay(x).secondary !== undefined);
    if (solved.kind === "unique") {
      return {
        ok: true,
        kind: "solve",
        op,
        display: particularPrimary.join("\n"),
        solve: {
          kind: "unique",
          particular: particularPrimary,
          particularSecondary: hasSec ? particularSecondary : undefined,
        },
        steps: solved.steps,
      };
    }
    const free = (solved.free ?? []).map((f) => ({
      index: f.index,
      direction: f.direction.map((x) => ring.toDisplay(x).primary),
    }));
    return {
      ok: true,
      kind: "solve",
      op,
      display: "无穷多解",
      solve: {
        kind: "infinite",
        particular: particularPrimary,
        particularSecondary: hasSec ? particularSecondary : undefined,
        free,
      },
      steps: solved.steps,
    };
  }

  return { ok: false, error: "未知运算。" };
}

export function compute(req: ComputeRequest): ComputeResponse {
  const parsedA = parseGrid(req.a, "a");
  if (!parsedA.ok) {
    return { ok: false, error: "矩阵 A 含有无法解析的单元格。", cellErrors: parsedA.cellErrors };
  }
  let parsedB: Frac[][] | undefined;
  if (req.b) {
    const pb = parseGrid(req.b, "b");
    if (!pb.ok) {
      return { ok: false, error: "矩阵 B 含有无法解析的单元格。", cellErrors: pb.cellErrors };
    }
    parsedB = pb.matrix;
  }
  let scalarFrac: Frac | undefined;
  if (req.op === "scalar") {
    const ps = parseScalar(req.scalar ?? "");
    if (!ps.ok) {
      return { ok: false, error: `标量 k ${ps.message}` };
    }
    scalarFrac = ps.value;
  }

  const precision = Math.min(10, Math.max(2, Math.round(req.precision)));

  try {
    if (req.mode === "exact") {
      const ring = fracRing(precision);
      return run(req, toFracMatrix(parsedA.matrix), parsedB, scalarFrac, ring);
    }
    const ring = floatRing(precision);
    const a = toFloatMatrix(parsedA.matrix);
    const b = parsedB ? toFloatMatrix(parsedB) : undefined;
    const scalar = scalarFrac ? scalarFrac.toNumber() : undefined;
    return run(req, a, b, scalar, ring);
  } catch (e) {
    const message = e instanceof Error ? e.message : "计算失败";
    return { ok: false, error: `计算失败：${message}` };
  }
}
