import { BaseDirectory, exists, readTextFile, writeTextFile } from "@tauri-apps/plugin-fs";
import { parse, stringify } from "yaml";

/** Path is relative to $HOME — see the fs scope in src-tauri/capabilities/default.json. */
const FILE = ".claude/reading-list.yaml";
const opts = { baseDir: BaseDirectory.Home } as const;

export type Item = {
  link: string;
  tags: string[];
  context: string;
  /** Absent on entries added before reasons existed. */
  reasons?: string[];
};

export type ReadItem = Item & { readAt: string };

export type ReadingList = {
  unread: Item[];
  read: ReadItem[];
};

export async function load(): Promise<ReadingList> {
  if (!(await exists(FILE, opts))) return { unread: [], read: [] };
  const doc = parse(await readTextFile(FILE, opts)) ?? {};
  return { unread: doc.unread ?? [], read: doc.read ?? [] };
}

export async function save(list: ReadingList): Promise<void> {
  await writeTextFile(FILE, stringify(list, { lineWidth: 0 }), opts);
}

/** en-CA formats as YYYY-MM-DD, in local time rather than UTC. */
export function today(): string {
  return new Date().toLocaleDateString("en-CA");
}

export function markRead(list: ReadingList, item: Item): ReadingList {
  return {
    unread: list.unread.filter((i) => i !== item),
    read: [{ ...item, readAt: today() }, ...list.read],
  };
}

export function markUnread(list: ReadingList, item: ReadItem): ReadingList {
  const { readAt: _readAt, ...rest } = item;
  return {
    unread: [rest, ...list.unread],
    read: list.read.filter((i) => i !== item),
  };
}

export function addItem(list: ReadingList, item: Item): ReadingList {
  return { ...list, unread: [item, ...list.unread] };
}
