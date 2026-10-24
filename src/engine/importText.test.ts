import { describe, expect, it } from "vitest";
import { parseMatrixText, pasteBlock } from "./importText";
import { identityGrid, zeroGrid } from "./grid";

describe("parseMatrixText", () => {
  it("解析空格与换行", () => {
    const r = parseMatrixText("1 2 3\n4 5 6");
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.grid).toEqual([
        ["1", "2", "3"],
        ["4", "5", "6"],
      ]);
    }
  });

  it("解析 MATLAB 分号", () => {
    const r = parseMatrixText("[1 2; 3 4]");
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.grid).toEqual([
        ["1", "2"],
        ["3", "4"],
      ]);
    }
  });

  it("解析 LaTeX", () => {
    const r = parseMatrixText("\\begin{pmatrix} 1 & 1/2 \\\\ 3 & -4 \\end{pmatrix}");
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.grid).toEqual([
        ["1", "1/2"],
        ["3", "-4"],
      ]);
    }
  });

  it("拒绝无法识别的记号", () => {
    const r = parseMatrixText("1 a; 2 3");
    expect(r.ok).toBe(false);
  });
});

describe("pasteBlock", () => {
  it("从指定格子起覆盖并扩展规模", () => {
    const next = pasteBlock(
      [
        ["1", ""],
        ["", ""],
      ],
      0,
      0,
      [
        ["7", "8", "9"],
        ["1", "0", "0"],
      ]
    );
    expect(next).toEqual([
      ["7", "8", "9"],
      ["1", "0", "0"],
    ]);
  });
});

describe("identity and zero", () => {
  it("生成单位阵与零矩阵", () => {
    expect(identityGrid(2)).toEqual([
      ["1", "0"],
      ["0", "1"],
    ]);
    expect(zeroGrid(1, 3)).toEqual([["0", "0", "0"]]);
  });
});
