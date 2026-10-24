import type { Op } from "./types";

export type Example = {
  id: string;
  name: string;
  op: Op;
  a: string[][];
  b?: string[][];
  scalar?: string;
};

export const EXAMPLES: Example[] = [
  {
    id: "det-2",
    name: "2×2 行列式",
    op: "det",
    a: [
      ["1", "2"],
      ["3", "4"],
    ],
  },
  {
    id: "inv-2",
    name: "2×2 求逆",
    op: "inverse",
    a: [
      ["1", "2"],
      ["3", "4"],
    ],
  },
  {
    id: "mul-2",
    name: "矩阵乘法",
    op: "mul",
    a: [
      ["1", "2"],
      ["3", "4"],
    ],
    b: [
      ["0", "1"],
      ["1", "0"],
    ],
  },
  {
    id: "rank-dep",
    name: "相关行求秩",
    op: "rank",
    a: [
      ["1", "2", "3"],
      ["2", "4", "6"],
      ["1", "1", "1"],
    ],
  },
  {
    id: "solve-unique",
    name: "方程组唯一解",
    op: "solve",
    a: [
      ["1", "1"],
      ["0", "1"],
    ],
    b: [["3"], ["1"]],
  },
  {
    id: "solve-inf",
    name: "方程组无穷解",
    op: "solve",
    a: [
      ["1", "1"],
      ["2", "2"],
    ],
    b: [["1"], ["2"]],
  },
  {
    id: "solve-none",
    name: "方程组无解",
    op: "solve",
    a: [
      ["1", "1"],
      ["2", "2"],
    ],
    b: [["1"], ["3"]],
  },
];
