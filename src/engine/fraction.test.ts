import { describe, expect, it } from "vitest";
import { Frac, gcd } from "./fraction";
import { parseScalar } from "./parse";
import { compute } from "./compute";

describe("Frac", () => {
  it("约分并保持分母为正", () => {
    const f = new Frac(2n, 4n);
    expect(f.n).toBe(1n);
    expect(f.d).toBe(2n);
    const g = new Frac(1n, -2n);
    expect(g.n).toBe(-1n);
    expect(g.d).toBe(2n);
  });

  it("四则运算", () => {
    const a = new Frac(1n, 2n);
    const b = new Frac(1n, 3n);
    expect(a.add(b).toString()).toBe("5/6");
    expect(a.sub(b).toString()).toBe("1/6");
    expect(a.mul(b).toString()).toBe("1/6");
    expect(a.div(b).toString()).toBe("3/2");
  });

  it("gcd", () => {
    expect(gcd(12n, 8n)).toBe(4n);
  });
});

describe("parseScalar", () => {
  it("解析整数、小数、分数与空值", () => {
    const empty = parseScalar("");
    expect(empty.ok && empty.value.toString()).toBe("0");
    const neg = parseScalar("-3");
    expect(neg.ok && neg.value.toString()).toBe("-3");
    const half = parseScalar("1/2");
    expect(half.ok && half.value.toString()).toBe("1/2");
    const dec = parseScalar("0.5");
    expect(dec.ok && dec.value.toString()).toBe("1/2");
    expect(parseScalar("abc").ok).toBe(false);
  });
});

describe("compute", () => {
  it("2x2 行列式", () => {
    const r = compute({
      op: "det",
      mode: "exact",
      precision: 4,
      a: [
        ["1", "2"],
        ["3", "4"],
      ],
    });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.scalarPrimary).toBe("-2");
      expect(r.singular).toBe(false);
    }
  });

  it("矩阵乘法", () => {
    const r = compute({
      op: "mul",
      mode: "exact",
      precision: 4,
      a: [
        ["1", "2"],
        ["3", "4"],
      ],
      b: [
        ["0", "1"],
        ["1", "0"],
      ],
    });
    expect(r.ok).toBe(true);
    if (r.ok && r.matrix) {
      expect(r.matrix.primary).toEqual([
        ["2", "1"],
        ["4", "3"],
      ]);
    }
  });

  it("2x2 逆矩阵", () => {
    const r = compute({
      op: "inverse",
      mode: "exact",
      precision: 4,
      a: [
        ["1", "2"],
        ["3", "4"],
      ],
    });
    expect(r.ok).toBe(true);
    if (r.ok && r.matrix) {
      expect(r.matrix.primary).toEqual([
        ["-2", "1"],
        ["3/2", "-1/2"],
      ]);
    }
  });

  it("奇异矩阵不可逆", () => {
    const r = compute({
      op: "inverse",
      mode: "exact",
      precision: 4,
      a: [
        ["1", "2"],
        ["2", "4"],
      ],
    });
    expect(r.ok).toBe(false);
  });

  it("方程组唯一解", () => {
    const r = compute({
      op: "solve",
      mode: "exact",
      precision: 4,
      a: [
        ["1", "1"],
        ["0", "1"],
      ],
      b: [["3"], ["1"]],
    });
    expect(r.ok).toBe(true);
    if (r.ok && r.solve) {
      expect(r.solve.kind).toBe("unique");
      expect(r.solve.particular).toEqual(["2", "1"]);
    }
  });

  it("方程组无解", () => {
    const r = compute({
      op: "solve",
      mode: "exact",
      precision: 4,
      a: [
        ["1", "1"],
        ["2", "2"],
      ],
      b: [["1"], ["3"]],
    });
    expect(r.ok).toBe(true);
    if (r.ok && r.solve) {
      expect(r.solve.kind).toBe("none");
    }
  });

  it("非方阵求行列式报错", () => {
    const r = compute({
      op: "det",
      mode: "exact",
      precision: 4,
      a: [["1", "2", "3"]],
    });
    expect(r.ok).toBe(false);
  });

  it("方程组无穷多解", () => {
    const r = compute({
      op: "solve",
      mode: "exact",
      precision: 4,
      a: [
        ["1", "1"],
        ["2", "2"],
      ],
      b: [["1"], ["2"]],
    });
    expect(r.ok).toBe(true);
    if (r.ok && r.solve) {
      expect(r.solve.kind).toBe("infinite");
      expect(r.solve.particular).toEqual(["1", "0"]);
    }
  });

  it("求秩", () => {
    const r = compute({
      op: "rank",
      mode: "exact",
      precision: 4,
      a: [
        ["1", "2"],
        ["2", "4"],
      ],
    });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.rank).toBe(1);
    }
  });
});
