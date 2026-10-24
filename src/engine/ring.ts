import { Frac } from "./fraction";

export interface Ring<T> {
  zero: T;
  one: T;
  add(a: T, b: T): T;
  sub(a: T, b: T): T;
  mul(a: T, b: T): T;
  div(a: T, b: T): T;
  neg(a: T): T;
  isZero(a: T): boolean;
  absCmp(a: T, b: T): number;
  toString(a: T): string;
  toDisplay(a: T): { primary: string; secondary?: string };
}

export function fracRing(approxPrecision: number): Ring<Frac> {
  return {
    zero: Frac.zero(),
    one: Frac.one(),
    add: (a, b) => a.add(b),
    sub: (a, b) => a.sub(b),
    mul: (a, b) => a.mul(b),
    div: (a, b) => a.div(b),
    neg: (a) => a.neg(),
    isZero: (a) => a.isZero(),
    absCmp: (a, b) => {
      const av = a.abs().toNumber();
      const bv = b.abs().toNumber();
      return av === bv ? 0 : av > bv ? 1 : -1;
    },
    toString: (a) => a.toString(),
    toDisplay: (a) => ({
      primary: a.toString(),
      secondary: a.toApprox(approxPrecision),
    }),
  };
}

const EPS = 1e-10;

export function floatRing(precision: number): Ring<number> {
  const fmt = (x: number): string => {
    if (!Number.isFinite(x)) {
      return "溢出";
    }
    const v = Math.abs(x) < 10 ** -(precision + 2) ? 0 : x;
    return v.toFixed(precision);
  };
  return {
    zero: 0,
    one: 1,
    add: (a, b) => a + b,
    sub: (a, b) => a - b,
    mul: (a, b) => a * b,
    div: (a, b) => a / b,
    neg: (a) => -a,
    isZero: (a) => Math.abs(a) < EPS,
    absCmp: (a, b) => {
      const av = Math.abs(a);
      const bv = Math.abs(b);
      return av === bv ? 0 : av > bv ? 1 : -1;
    },
    toString: fmt,
    toDisplay: (a) => ({ primary: fmt(a) }),
  };
}
