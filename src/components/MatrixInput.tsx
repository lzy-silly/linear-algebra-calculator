import { useRef, useState } from "react";
import type { CellError } from "../engine/types";
import { looksLikeMatrixText, parseMatrixText, pasteBlock } from "../engine/importText";

type Props = {
  title: string;
  grid: string[][];
  onChange: (r: number, c: number, value: string) => void;
  onResize: (rows: number, cols: number) => void;
  onClear: () => void;
  onReplace: (grid: string[][]) => void;
  onIdentity?: () => void;
  onZero: () => void;
  cellErrors?: CellError[];
  lockCols?: number;
};

export default function MatrixInput({
  title,
  grid,
  onChange,
  onResize,
  onClear,
  onReplace,
  onIdentity,
  onZero,
  cellErrors = [],
  lockCols,
}: Props) {
  const r = grid.length;
  const c = grid[0]?.length ?? 0;
  const errAt = (i: number, j: number) => cellErrors.find((e) => e.r === i && e.c === j);
  const [pasteOpen, setPasteOpen] = useState(false);
  const [pasteText, setPasteText] = useState("");
  const [pasteError, setPasteError] = useState<string | null>(null);
  const inputRefs = useRef<(HTMLInputElement | null)[][]>([]);

  function focusCell(i: number, j: number) {
    const el = inputRefs.current[i]?.[j];
    if (el) {
      el.focus();
      el.select();
    }
  }

  function applyPaste(raw: string, startR: number, startC: number): boolean {
    const parsed = parseMatrixText(raw);
    if (!parsed.ok) {
      setPasteError(parsed.error);
      return false;
    }
    onReplace(pasteBlock(grid, startR, startC, parsed.grid, lockCols));
    setPasteError(null);
    setPasteOpen(false);
    setPasteText("");
    return true;
  }

  function handlePaste(e: React.ClipboardEvent<HTMLInputElement>, i: number, j: number) {
    const text = e.clipboardData.getData("text");
    if (!looksLikeMatrixText(text)) {
      return;
    }
    e.preventDefault();
    applyPaste(text, i, j);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>, i: number, j: number) {
    if (e.key === "ArrowUp") {
      e.preventDefault();
      focusCell(Math.max(0, i - 1), j);
    } else if (e.key === "ArrowDown" || e.key === "Enter") {
      e.preventDefault();
      focusCell(Math.min(r - 1, i + 1), j);
    } else if (e.key === "ArrowLeft" && e.currentTarget.selectionStart === 0) {
      e.preventDefault();
      focusCell(i, Math.max(0, j - 1));
    } else if (
      e.key === "ArrowRight" &&
      e.currentTarget.selectionStart === e.currentTarget.value.length
    ) {
      e.preventDefault();
      focusCell(i, Math.min(c - 1, j + 1));
    } else if (e.key === "Tab" && !e.shiftKey) {
      if (i === r - 1 && j === c - 1) {
        return;
      }
      e.preventDefault();
      if (j < c - 1) {
        focusCell(i, j + 1);
      } else {
        focusCell(i + 1, 0);
      }
    } else if (e.key === "Tab" && e.shiftKey) {
      if (i === 0 && j === 0) {
        return;
      }
      e.preventDefault();
      if (j > 0) {
        focusCell(i, j - 1);
      } else {
        focusCell(i - 1, c - 1);
      }
    }
  }

  return (
    <section className="card">
      <h2>{title}</h2>
      <div className="toolbar">
        <label className="field">
          行
          <input
            type="number"
            min={1}
            max={10}
            value={r}
            onChange={(e) => onResize(Number(e.target.value), c)}
          />
        </label>
        <label className="field">
          列
          <input
            type="number"
            min={1}
            max={lockCols ?? 10}
            value={c}
            disabled={lockCols !== undefined}
            onChange={(e) => onResize(r, Number(e.target.value))}
          />
        </label>
        {onIdentity ? (
          <button type="button" onClick={onIdentity}>
            单位阵
          </button>
        ) : null}
        <button type="button" onClick={onZero}>
          零矩阵
        </button>
        <button type="button" onClick={() => setPasteOpen((v) => !v)}>
          粘贴
        </button>
        <button type="button" className="danger" onClick={onClear}>
          清空
        </button>
      </div>
      {pasteOpen ? (
        <div className="paste-box">
          <textarea
            rows={4}
            value={pasteText}
            placeholder={"支持空格/制表符、MATLAB（1 2; 3 4）或 LaTeX（1 & 2 \\\\ 3 & 4）"}
            onChange={(e) => setPasteText(e.target.value)}
          />
          <div className="toolbar">
            <button
              type="button"
              className="primary"
              onClick={() => {
                if (!applyPaste(pasteText, 0, 0)) {
                  setPasteOpen(true);
                }
              }}
            >
              填入表格
            </button>
            <button
              type="button"
              onClick={() => {
                setPasteOpen(false);
                setPasteError(null);
              }}
            >
              取消
            </button>
          </div>
          {pasteError ? <p className="error">{pasteError}</p> : null}
        </div>
      ) : null}
      <div className="grid-wrap">
        <table className="matrix">
          <tbody>
            {grid.map((row, i) => (
              <tr key={i}>
                {row.map((cell, j) => {
                  const err = errAt(i, j);
                  return (
                    <td key={j}>
                      <input
                        type="text"
                        inputMode="decimal"
                        value={cell}
                        className={err ? "err" : undefined}
                        aria-label={`第${i + 1}行第${j + 1}列`}
                        ref={(el) => {
                          if (!inputRefs.current[i]) {
                            inputRefs.current[i] = [];
                          }
                          inputRefs.current[i][j] = el;
                        }}
                        onChange={(e) => onChange(i, j, e.target.value)}
                        onPaste={(e) => handlePaste(e, i, j)}
                        onKeyDown={(e) => handleKeyDown(e, i, j)}
                      />
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {cellErrors[0] ? (
        <p className="error">
          第 {cellErrors[0].r + 1} 行第 {cellErrors[0].c + 1} 列：{cellErrors[0].message}
        </p>
      ) : (
        <p className="hint">空单元格按 0 处理。方向键在格子间移动；可直接粘贴整段矩阵。</p>
      )}
    </section>
  );
}
