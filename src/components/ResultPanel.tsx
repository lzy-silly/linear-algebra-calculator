import type { ComputeSuccess } from "../engine/types";
import { OP_LABEL } from "../engine/types";

type Props = {
  result: ComputeSuccess | null;
  error: string | null;
  onCopy: () => void;
  onFillBack: () => void;
  copied: boolean;
};

export default function ResultPanel({ result, error, onCopy, onFillBack, copied }: Props) {
  return (
    <section className="card">
      <div className="result-head">
        <h2>计算结果</h2>
        {result ? <span className="tag">{OP_LABEL[result.op]}</span> : null}
      </div>
      {error ? <p className="error">{error}</p> : null}
      {!result && !error ? <p className="muted">选择一种运算后，结果会显示在这里。</p> : null}
      {result ? (
        <>
          {result.kind === "scalar" ? (
            <p>
              {result.scalarPrimary}
              {result.scalarSecondary ? (
                <span className="muted"> （约 {result.scalarSecondary}）</span>
              ) : null}
              {result.singular ? <span className="tag">奇异矩阵</span> : null}
            </p>
          ) : null}
          {result.kind === "rank" ? <p>秩 = {result.rank}</p> : null}
          {result.kind === "matrix" && result.matrix ? <MatrixTable view={result.matrix} /> : null}
          {result.kind === "solve" && result.solve ? <SolveView result={result} /> : null}
          <div className="toolbar">
            <button type="button" onClick={onCopy}>
              {copied ? "已复制" : "复制结果"}
            </button>
            {result.kind === "matrix" ? (
              <button type="button" onClick={onFillBack}>
                将结果填入输入
              </button>
            ) : null}
          </div>
          <details className="steps">
            <summary>计算步骤</summary>
            <ol>
              {result.steps.map((s, i) => (
                <li key={i}>{s}</li>
              ))}
            </ol>
          </details>
        </>
      ) : null}
    </section>
  );
}

function MatrixTable({
  view,
}: {
  view: { primary: string[][]; secondary?: string[][] };
}) {
  return (
    <div className="grid-wrap">
      <table className="matrix-out">
        <tbody>
          {view.primary.map((row, i) => (
            <tr key={i}>
              {row.map((cell, j) => (
                <td key={j}>
                  {cell}
                  {view.secondary?.[i]?.[j] ? (
                    <span className="sec">{view.secondary[i][j]}</span>
                  ) : null}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SolveView({ result }: { result: ComputeSuccess }) {
  const s = result.solve;
  if (!s) {
    return null;
  }
  if (s.kind === "none") {
    return <p>方程组无解。</p>;
  }
  if (s.kind === "unique") {
    return (
      <div>
        <p>唯一解</p>
        <ul>
          {s.particular?.map((v, i) => (
            <li key={i}>
              x{i + 1} = {v}
              {s.particularSecondary?.[i] ? (
                <span className="muted"> （约 {s.particularSecondary[i]}）</span>
              ) : null}
            </li>
          ))}
        </ul>
      </div>
    );
  }
  return (
    <div>
      <p>无穷多解。特解（自由变量取 0）：</p>
      <ul>
        {s.particular?.map((v, i) => (
          <li key={i}>
            x{i + 1} = {v}
          </li>
        ))}
      </ul>
      {s.free?.map((f) => (
        <p key={f.index}>
          自由变量 x{f.index + 1} 的方向向量：[ {f.direction.join(", ")} ]
        </p>
      ))}
    </div>
  );
}
