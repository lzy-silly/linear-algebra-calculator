export class Frac {
  readonly n: bigint;
  readonly d: bigint;

  constructor(n: bigint, d: bigint = 1n) {
    if (d === 0n) {
      throw new Error("分母不能为 0");
    }
    if (d < 0n) {
      n = -n;
      d = -d;
    }
    const g = gcd(abs(n), d);
    this.n = n / g;
    this.d = d / g;
  }

  static fromInt(n: number | bigint): Frac {
    return new Frac(BigInt(n), 1n);
  }

  static zero(): Frac {
    return new Frac(0n, 1n);
  }

  static one(): Frac {
    return new Frac(1n, 1n);
  }

  add(o: Frac): Frac {
    return new Frac(this.n * o.d + o.n * this.d, this.d * o.d);
  }

  sub(o: Frac): Frac {
    return new Frac(this.n * o.d - o.n * this.d, this.d * o.d);
  }

  mul(o: Frac): Frac {
    return new Frac(this.n * o.n, this.d * o.d);
  }

  div(o: Frac): Frac {
    if (o.n === 0n) {
      throw new Error("除数不能为 0");
    }
    return new Frac(this.n * o.d, this.d * o.n);
  }

  neg(): Frac {
    return new Frac(-this.n, this.d);
  }

  isZero(): boolean {
    return this.n === 0n;
  }

  eq(o: Frac): boolean {
    return this.n === o.n && this.d === o.d;
  }

  abs(): Frac {
    return new Frac(abs(this.n), this.d);
  }

  toNumber(): number {
    return Number(this.n) / Number(this.d);
  }

  toString(): string {
    if (this.d === 1n) {
      return this.n.toString();
    }
    return `${this.n.toString()}/${this.d.toString()}`;
  }

  toApprox(precision: number): string {
    const x = this.toNumber();
    if (!Number.isFinite(x)) {
      return "溢出";
    }
    const v = Math.abs(x) < 10 ** -(precision + 2) ? 0 : x;
    return v.toFixed(precision);
  }
}

export function abs(n: bigint): bigint {
  return n < 0n ? -n : n;
}

export function gcd(a: bigint, b: bigint): bigint {
  a = abs(a);
  b = abs(b);
  while (b !== 0n) {
    const t = a % b;
    a = b;
    b = t;
  }
  return a === 0n ? 1n : a;
}
