import type { Mode, Op } from "./types";
import { OP_LABEL } from "./types";

export const HISTORY_KEY = "la-calc-history-v1";
export const HISTORY_LIMIT = 20;

export type HistoryRecord = {
  id: string;
  createdAt: number;
  op: Op;
  mode: Mode;
  precision: number;
  a: string[][];
  b?: string[][];
  scalar?: string;
  display: string;
};

const OPS: Op[] = [
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

function isGrid(v: unknown): v is string[][] {
  return (
    Array.isArray(v) &&
    v.length > 0 &&
    v.every((row) => Array.isArray(row) && row.every((cell) => typeof cell === "string"))
  );
}

function isRecord(v: unknown): v is HistoryRecord {
  if (!v || typeof v !== "object") {
    return false;
  }
  const r = v as HistoryRecord;
  return (
    typeof r.id === "string" &&
    typeof r.createdAt === "number" &&
    OPS.includes(r.op) &&
    (r.mode === "exact" || r.mode === "float") &&
    typeof r.precision === "number" &&
    isGrid(r.a) &&
    (r.b === undefined || isGrid(r.b)) &&
    (r.scalar === undefined || typeof r.scalar === "string") &&
    typeof r.display === "string"
  );
}

export function newHistoryId(now = Date.now()): string {
  return `${now}-${Math.random().toString(36).slice(2, 8)}`;
}

export function pushHistory(list: HistoryRecord[], record: HistoryRecord): HistoryRecord[] {
  return [record, ...list.filter((item) => item.id !== record.id)].slice(0, HISTORY_LIMIT);
}

export function removeHistory(list: HistoryRecord[], id: string): HistoryRecord[] {
  return list.filter((item) => item.id !== id);
}

export function parseHistoryJson(raw: string | null): HistoryRecord[] {
  if (!raw) {
    return [];
  }
  try {
    const data = JSON.parse(raw) as unknown;
    if (!Array.isArray(data)) {
      return [];
    }
    return data.filter(isRecord);
  } catch {
    return [];
  }
}

export function loadHistory(storage: Pick<Storage, "getItem"> | null = defaultStorage()): HistoryRecord[] {
  if (!storage) {
    return [];
  }
  try {
    return parseHistoryJson(storage.getItem(HISTORY_KEY));
  } catch {
    return [];
  }
}

export function saveHistory(
  list: HistoryRecord[],
  storage: Pick<Storage, "setItem"> | null = defaultStorage()
): boolean {
  if (!storage) {
    return false;
  }
  try {
    storage.setItem(HISTORY_KEY, JSON.stringify(list));
    return true;
  } catch {
    return false;
  }
}

export function formatHistoryTime(ts: number): string {
  const d = new Date(ts);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function historyLabel(record: HistoryRecord): string {
  const mode = record.mode === "exact" ? "精确" : "浮点";
  return `${OP_LABEL[record.op]} · ${mode}`;
}

function defaultStorage(): Storage | null {
  try {
    if (typeof localStorage === "undefined") {
      return null;
    }
    return localStorage;
  } catch {
    return null;
  }
}
