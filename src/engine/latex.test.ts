import { describe, expect, it } from "vitest";
import { exportLatex, latexMatrix, latexNumber } from "./latex";
import type { ComputeSuccess } from "./types";

describe("latexNumber", () => {
  it("分数转为 frac", () => {
    expect(latexNumber("1/2")).toBe("\\frac{1}{2}");
    expect(latexNumber("-3/4")).toBe("-\\frac{3}{4}");
    expect(latexNumber("5/1")).toBe("5");
  });

  it("整数与小数保持原样", () => {
    expect(latexNumber("-2")).toBe("-2");
    expect(latexNumber("0.25")).toBe("0.25");
  });
});

describe("latexMatrix", () => {
  it("输出 pmatrix", () => {
    const s = latexMatrix([
      ["1", "1/2"],
      ["3", "-4"],
    ]);
    expect(s).toContain("\\begin{pmatrix}");
    expect(s).toContain("1 & \\frac{1}{2}");
    expect(s).toContain("3 & -4");
    expect(s).toContain("\\end{pmatrix}");
  });
});

describe("exportLatex", () => {
  it("导出行列式", () => {
    const r: ComputeSuccess = {
      ok: true,
      kind: "scalar",
      op: "det",
      display: "-2",
      scalarPrimary: "-2",
      steps: [],
    };
    expect(exportLatex(r)).toBe("\\det = -2");
  });

  it("导出矩阵", () => {
    const r: ComputeSuccess = {
      ok: true,
      kind: "matrix",
      op: "transpose",
      display: "1\t2",
      matrix: { primary: [["1", "2"], ["3", "4"]] },
      steps: [],
    };
    expect(exportLatex(r)).toContain("1 & 2");
  });

  it("导出无解", () => {
    const r: ComputeSuccess = {
      ok: true,
      kind: "solve",
      op: "solve",
      display: "无解",
      solve: { kind: "none" },
      steps: [],
    };
    expect(exportLatex(r)).toBe("\\text{无解}");
  });

  it("导出唯一解列向量", () => {
    const r: ComputeSuccess = {
      ok: true,
      kind: "solve",
      op: "solve",
      display: "1\n2",
      solve: { kind: "unique", particular: ["1", "1/2"] },
      steps: [],
    };
    const s = exportLatex(r);
    expect(s.startsWith("x = ")).toBe(true);
    expect(s).toContain("\\frac{1}{2}");
  });
});
