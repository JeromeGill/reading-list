import { useCallback, useEffect, useState } from "react";
import { openUrl } from "@tauri-apps/plugin-opener";
import {
  load,
  markRead,
  markUnread,
  save,
  type Item,
  type ReadItem,
  type ReadingList,
} from "./reading-list";

const TAG_COLOURS = [
  "bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300",
  "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
  "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
  "bg-violet-100 text-violet-800 dark:bg-violet-950 dark:text-violet-300",
  "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300",
  "bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300",
];

function tagColour(tag: string): string {
  let hash = 0;
  for (const char of tag) hash = (hash + char.charCodeAt(0)) % TAG_COLOURS.length;
  return TAG_COLOURS[hash];
}

function linkLabel(link: string): string {
  try {
    const url = new URL(link);
    return url.hostname.replace(/^www\./, "") + url.pathname.replace(/\/$/, "");
  } catch {
    return link;
  }
}

function Row({
  item,
  action,
  onAction,
  onError,
}: {
  item: Item | ReadItem;
  action: "read" | "unread";
  onAction: () => void;
  onError: (e: unknown) => void;
}) {
  return (
    <li className="flex items-start gap-3 border-b border-stone-200 px-5 py-4 last:border-0 dark:border-stone-800">
      <div className="min-w-0 flex-1">
        <div className="mb-1.5 flex flex-wrap items-center gap-2">
          {item.tags.map((tag) => (
            <span
              key={tag}
              className={`rounded px-1.5 py-0.5 text-[11px] font-medium tracking-wide uppercase ${tagColour(tag)}`}
            >
              {tag}
            </span>
          ))}
          {"readAt" in item && (
            <span className="text-[11px] text-stone-400 dark:text-stone-500">{item.readAt}</span>
          )}
        </div>

        <button
          type="button"
          onClick={() => openUrl(item.link).catch(onError)}
          className="block max-w-full truncate text-left text-[15px] font-medium text-sky-700 hover:underline dark:text-sky-400"
          title={item.link}
        >
          {linkLabel(item.link)}
        </button>

        <p className="mt-1 text-sm leading-snug text-stone-600 dark:text-stone-400">
          {item.context}
        </p>

        {item.reasons && item.reasons.length > 0 && (
          <ul className="mt-1.5 space-y-0.5">
            {item.reasons.map((reason) => (
              <li
                key={reason}
                className="text-[13px] leading-snug text-stone-500 before:mr-1.5 before:text-stone-300 before:content-['—'] dark:text-stone-500 dark:before:text-stone-600"
              >
                {reason}
              </li>
            ))}
          </ul>
        )}
      </div>

      <button
        type="button"
        onClick={onAction}
        aria-label={action === "read" ? "Mark as read" : "Move back to unread"}
        title={action === "read" ? "Mark as read" : "Move back to unread"}
        className="mt-0.5 shrink-0 rounded-md px-2 py-1 text-lg leading-none text-stone-300 transition-colors hover:bg-stone-200 hover:text-stone-700 dark:text-stone-600 dark:hover:bg-stone-800 dark:hover:text-stone-200"
      >
        {action === "read" ? "×" : "↺"}
      </button>
    </li>
  );
}

export default function App() {
  const [list, setList] = useState<ReadingList | null>(null);
  const [showRead, setShowRead] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(() => {
    load()
      .then((next) => {
        setList(next);
        setError(null);
      })
      .catch((e) => setError(String(e)));
  }, []);

  // Claude edits the file from other projects while this window is open.
  useEffect(() => {
    reload();
    window.addEventListener("focus", reload);
    return () => window.removeEventListener("focus", reload);
  }, [reload]);

  const apply = (next: ReadingList) => {
    setList(next);
    save(next).catch((e) => setError(String(e)));
  };

  if (error) {
    return (
      <div className="p-6 text-sm text-rose-600 dark:text-rose-400">
        <p className="font-medium">Something went wrong</p>
        <p className="mt-1 font-mono text-xs break-all">{error}</p>
      </div>
    );
  }

  if (!list) return null;

  const items = showRead ? list.read : list.unread;

  return (
    <div className="mx-auto flex h-full max-w-2xl flex-col">
      <header className="flex items-baseline justify-between px-5 pt-6 pb-4">
        <h1 className="text-xl font-semibold tracking-tight">
          {showRead ? "Read" : "Reading list"}
          <span className="ml-2 text-base font-normal text-stone-400 dark:text-stone-500">
            {items.length}
          </span>
        </h1>
        <button
          type="button"
          onClick={() => setShowRead((v) => !v)}
          className="rounded-md px-2.5 py-1 text-sm text-stone-500 hover:bg-stone-200 hover:text-stone-900 dark:text-stone-400 dark:hover:bg-stone-800 dark:hover:text-stone-100"
        >
          {showRead ? `Unread (${list.unread.length})` : `Read (${list.read.length})`}
        </button>
      </header>

      {items.length === 0 ? (
        <p className="px-5 py-10 text-center text-sm text-stone-400 dark:text-stone-500">
          {showRead ? "Nothing read yet." : "Nothing to read. Enjoy it."}
        </p>
      ) : (
        <ul className="flex-1 overflow-y-auto">
          {items.map((item, i) => (
            <Row
              key={`${item.link}-${i}`}
              item={item}
              action={showRead ? "unread" : "read"}
              onError={(e) => setError(String(e))}
              onAction={() =>
                apply(
                  showRead ? markUnread(list, item as ReadItem) : markRead(list, item as Item),
                )
              }
            />
          ))}
        </ul>
      )}
    </div>
  );
}
