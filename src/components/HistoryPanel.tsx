import { formatHistoryTime, historyLabel, type HistoryRecord } from "../engine/history";

type Props = {
  records: HistoryRecord[];
  onLoad: (record: HistoryRecord) => void;
  onRemove: (id: string) => void;
  onClear: () => void;
};

export default function HistoryPanel({ records, onLoad, onRemove, onClear }: Props) {
  return (
    <section className="card history">
      <div className="result-head">
        <h2>本地历史</h2>
        {records.length > 0 ? (
          <button type="button" className="danger" onClick={onClear}>
            清空历史
          </button>
        ) : null}
      </div>
      {records.length === 0 ? (
        <p className="muted">成功计算会保存在本机浏览器中，最多 20 条，刷新后仍可载入。</p>
      ) : (
        <ul className="history-list">
          {records.map((item) => (
            <li key={item.id}>
              <div>
                <div className="history-title">{historyLabel(item)}</div>
                <div className="muted">
                  {formatHistoryTime(item.createdAt)} · {item.display.replace(/\s+/g, " ").slice(0, 48)}
                </div>
              </div>
              <div className="toolbar" style={{ marginBottom: 0 }}>
                <button type="button" onClick={() => onLoad(item)}>
                  载入
                </button>
                <button type="button" className="danger" onClick={() => onRemove(item.id)}>
                  删除
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
