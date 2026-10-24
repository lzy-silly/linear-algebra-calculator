export type Mode = "exact" | "float";

export type Op =
  | "det"
  | "transpose"
  | "scalar"
  | "add"
  | "sub"
  | "mul"
  | "inverse"
  | "rank"
  | "solve";

export const OP_LABEL: Record<Op, string> = {
  det: "行列式",
  transpose: "转置",
  scalar: "数乘",
  add: "矩阵加法",
  sub: "矩阵减法",
  mul: "矩阵乘法",
  inverse: "求逆",
  rank: "求秩",
  solve: "求解方程组",
};

export type CellError = {
  r: number;
  c: number;
  grid: "a" | "b";
  message: string;
};

export type ComputeRequest = {
  op: Op;
  mode: Mode;
  precision: number;
  a: string[][];
  b?: string[][];
  scalar?: string;
};

export type MatrixView = {
  primary: string[][];
  secondary?: string[][];
};

export type SolveView = {
  kind: "unique" | "infinite" | "none";
  particular?: string[];
  particularSecondary?: string[];
  free?: { index: number; direction: string[] }[];
};

export type ComputeSuccess = {
  ok: true;
  kind: "scalar" | "matrix" | "rank" | "solve";
  op: Op;
  display: string;
  matrix?: MatrixView;
  rank?: number;
  scalarPrimary?: string;
  scalarSecondary?: string;
  solve?: SolveView;
  steps: string[];
  singular?: boolean;
};

export type ComputeFailure = {
  ok: false;
  error: string;
  cellErrors?: CellError[];
};

export type ComputeResponse = ComputeSuccess | ComputeFailure;
