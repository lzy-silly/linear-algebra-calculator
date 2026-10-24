import { useMemo, useState } from "react";
import MatrixInput from "./components/MatrixInput";
import ResultPanel from "./components/ResultPanel";
import { compute } from "./engine/compute";
import { EXAMPLES } from "./engine/examples";
import { emptyGrid, identityGrid, MAX_DIM, MIN_DIM, resizeGrid, zeroGrid } from "./engine/grid";
import type { CellError, ComputeSuccess, Mode, Op } from "./engine/types";
import { OP_LABEL } from "./engine/types";

const BINARY: Op[] = ["add", "sub", "mul"];
const ALL_OPS: Op[] = [
  "det",
  "transpose",
  "scalar",
  "add",
  "sub",
  "mul",
  "inverse",
  "rank",
  "solve",
];

function clampDim(n: number): number {
  if (!Number.isFinite(n)) {
    return MIN_DIM;
  }
  return Math.min(MAX_DIM, Math.max(MIN_DIM, Math.round(n)));
}

export default function App() {
  const [mode, setMode] = useState<Mode>("exact");
  const [precision, setPrecision] = useState(4);
  const [op, setOp] = useState<Op>("det");
  const [a, setA] = useState(() => emptyGrid(3, 3));
  const [b, setB] = useState(() => emptyGrid(3, 3));
  const [scalar, setScalar] = useState("2");
  const [result, setResult] = useState<ComputeSuccess | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cellErrors, setCellErrors] = useState<CellError[]>([]);
  const [copied, setCopied] = useState(false);

  const needB = BINARY.includes(op) || op === "solve";

  const aErrors = useMemo(() => cellErrors.filter((e) => e.grid === "a"), [cellErrors]);
  const bErrors = useMemo(() => cellErrors.filter((e) => e.grid === "b"), [cellErrors]);

  function run(nextMode = mode, nextOp = op, nextA = a, nextB = b, nextScalar = scalar) {
    const reqB =
      nextOp === "solve"
        ? (nextB[0] ? nextB.map((row) => [row[0] ?? ""]) : [["0"]])
        : BINARY.includes(nextOp)
          ? nextB
          : undefined;
    const res = compute({
      op: nextOp,
      mode: nextMode,
      precision,
      a: nextA,
      b: reqB,
      scalar: nextScalar,
    });
    setCopied(false);
    if (!res.ok) {
      setResult(null);
      setError(res.error);
      setCellErrors(res.cellErrors ?? []);
      return;
    }
    setError(null);
    setCellErrors([]);
    setResult(res);
  }

  function changeA(r: number, c: number, value: string) {
    setA((prev) => prev.map((row, i) => row.map((cell, j) => (i === r && j === c ? value : cell))));
  }

  function changeB(r: number, c: number, value: string) {
    setB((prev) => prev.map((row, i) => row.map((cell, j) => (i === r && j === c ? value : cell))));
  }

  function pickOp(next: Op) {
    setOp(next);
    if (next === "solve") {
      setB((prev) => resizeGrid(prev, a.length, 1));
    }
  }

  function loadExample(id: string) {
    const ex = EXAMPLES.find((item) => item.id === id);
    if (!ex) {
      return;
    }
    setOp(ex.op);
    setA(ex.a.map((row) => row.slice()));
    if (ex.b) {
      setB(ex.b.map((row) => row.slice()));
    } else if (ex.op === "solve") {
      setB(emptyGrid(ex.a.length, 1));
    }
    if (ex.scalar) {
      setScalar(ex.scalar);
    }
    setError(null);
    setCellErrors([]);
    setResult(null);
  }

  async function copyResult() {
    if (!result) {
      return;
    }
    try {
      await navigator.clipboard.writeText(result.display);
      setCopied(true);
    } catch {
      setError("复制失败，请手动选中结果。");
    }
  }

  function fillBack() {
    if (!result?.matrix) {
      return;
    }
    setA(result.matrix.primary.map((row) => row.slice()));
  }

  return (
    <div className="app">
      <header className="hero">
        <div>
          <div className="badge">Linear Algebra</div>
          <h1>线性代数计算器</h1>
          <p>行列式、矩阵运算、求逆、求秩、求解 Ax = b。支持精确分数与浮点两种模式，并给出计算步骤。</p>
        </div>
        <div className="toolbar">
          <div className="mode-switch">
            <button
              type="button"
              className={mode === "exact" ? "active" : undefined}
              onClick={() => {
                setMode("exact");
                if (result) {
                  run("exact");
                }
              }}
            >
              精确分数
            </button>
            <button
              type="button"
              className={mode === "float" ? "active" : undefined}
              onClick={() => {
                setMode("float");
                if (result) {
                  run("float");
                }
              }}
            >
              浮点小数
            </button>
          </div>
          <label className="field">
            小数位
            <input
              type="number"
              min={2}
              max={10}
              value={precision}
              onChange={(e) => setPrecision(Math.min(10, Math.max(2, Number(e.target.value) || 2)))}
            />
          </label>
        </div>
      </header>

      <div className="layout">
        <div>
          <section className="card" style={{ marginBottom: 12 }}>
            <h2>例题预设</h2>
            <div className="ops">
              {EXAMPLES.map((ex) => (
                <button key={ex.id} type="button" onClick={() => loadExample(ex.id)}>
                  {ex.name}
                </button>
              ))}
            </div>
          </section>
          <MatrixInput
            title="矩阵 A"
            grid={a}
            onChange={changeA}
            onResize={(r, c) => setA((prev) => resizeGrid(prev, clampDim(r), clampDim(c)))}
            onClear={() => setA(emptyGrid(a.length, a[0]?.length ?? 3))}
            onReplace={setA}
            onIdentity={() => setA(identityGrid(Math.min(a.length, a[0]?.length ?? 3)))}
            onZero={() => setA(zeroGrid(a.length, a[0]?.length ?? 3))}
            cellErrors={aErrors}
          />
          {needB ? <div style={{ height: 12 }} /> : null}
          {needB ? (
            <MatrixInput
              title={op === "solve" ? "常数向量 b" : "矩阵 B"}
              grid={op === "solve" ? b.map((row) => [row[0] ?? ""]) : b}
              onChange={changeB}
              onResize={(r, c) =>
                setB((prev) => resizeGrid(prev, clampDim(r), op === "solve" ? 1 : clampDim(c)))
              }
              onClear={() => setB(emptyGrid(b.length, op === "solve" ? 1 : (b[0]?.length ?? 3)))}
              onReplace={(next) => setB(op === "solve" ? next.map((row) => [row[0] ?? ""]) : next)}
              onZero={() => setB(zeroGrid(b.length, op === "solve" ? 1 : (b[0]?.length ?? 3)))}
              cellErrors={bErrors}
              lockCols={op === "solve" ? 1 : undefined}
            />
          ) : null}

          <section className="card" style={{ marginTop: 12 }}>
            <h2>选择运算</h2>
            <div className="ops">
              {ALL_OPS.map((item) => (
                <button
                  key={item}
                  type="button"
                  className={op === item ? "active" : undefined}
                  onClick={() => pickOp(item)}
                >
                  {OP_LABEL[item]}
                </button>
              ))}
            </div>
            {op === "scalar" ? (
              <label className="field">
                标量 k
                <input type="text" value={scalar} onChange={(e) => setScalar(e.target.value)} />
              </label>
            ) : null}
            <div className="toolbar" style={{ marginTop: 12 }}>
              <button type="button" className="primary" onClick={() => run()}>
                计算
              </button>
            </div>
          </section>
        </div>
        <ResultPanel
          result={result}
          error={error}
          onCopy={copyResult}
          onFillBack={fillBack}
          copied={copied}
        />
      </div>
      <p className="footer">
        矩阵规模 1×1 到 10×10。空单元格视为 0。可粘贴空格分隔、MATLAB 或 LaTeX 矩阵。
      </p>
    </div>
  );
}
