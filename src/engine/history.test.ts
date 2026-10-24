import { describe, expect, it } from "vitest";
import {
  HISTORY_LIMIT,
  parseHistoryJson,
  pushHistory,
  removeHistory,
  type HistoryRecord,
} from "./history";

function rec(id: string, n = 0): HistoryRecord {
  return {
    id,
    createdAt: n,
    op: "det",
    mode: "exact",
    precision: 4,
    a: [["1", "0"], ["0", "1"]],
    display: "1",
  };
}

describe("history", () => {
  it("新记录插到最前并截断到 20", () => {
    let list: HistoryRecord[] = [];
    for (let i = 0; i < 25; i++) {
      list = pushHistory(list, rec(String(i), i));
    }
    expect(list.length).toBe(HISTORY_LIMIT);
    expect(list[0].id).toBe("24");
    expect(list[19].id).toBe("5");
  });

  it("按 id 删除", () => {
    const list = removeHistory([rec("a"), rec("b")], "a");
    expect(list.map((x) => x.id)).toEqual(["b"]);
  });

  it("损坏 JSON 返回空列表", () => {
    expect(parseHistoryJson("not-json")).toEqual([]);
    expect(parseHistoryJson('{"x":1}')).toEqual([]);
    expect(parseHistoryJson(null)).toEqual([]);
  });

  it("过滤缺少字段的记录", () => {
    const raw = JSON.stringify([rec("ok"), { id: "bad" }]);
    const list = parseHistoryJson(raw);
    expect(list.length).toBe(1);
    expect(list[0].id).toBe("ok");
  });
});
