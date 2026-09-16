import { useCallback, useEffect, useRef, useState } from "react";
import { openUrl } from "@tauri-apps/plugin-opener";
import {
  addItem,
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

const FIELD =
  "w-full rounded-md border border-stone-300 bg-white px-2.5 py-1.5 text-sm placeholder:text-stone-400 focus:border-sky-500 focus:outline-none dark:border-stone-700 dark:bg-stone-900 dark:placeholder:text-stone-600";

const listify = (value: string, separator: string | RegExp) =>
  value
    .split(separator)
    .map((part) => part.trim())
    .filter(Boolean);

function AddForm({ open, onAdd }: { open: boolean; onAdd: (item: Item) => string | null }) {
  const [link, setLink] = useState("");
  const [tags, setTags] = useState("");
  const [context, setContext] = useState("");
  const [reasons, setReasons] = useState("");
  const [problem, setProblem] = useState<string | null>(null);
  const linkInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) linkInput.current?.focus();
  }, [open]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = listify(reasons, "\n");
    const rejection = onAdd({
      link: link.trim(),
      tags: listify(tags, ","),
      context: context.trim(),
      ...(parsed.length > 0 && { reasons: parsed }),
    });
    setProblem(rejection);
    if (rejection) return;
    setLink("");
    setTags("");
    setContext("");
    setReasons("");
  };

  return (
    <form
      onSubmit={submit}
      className="space-y-2 border-b border-stone-200 px-5 pb-4 dark:border-stone-800"
    >
      <input
        ref={linkInput}
        type="url"
        required
        value={link}
        onChange={(e) => setLink(e.target.value)}
        placeholder="https://..."
        className={FIELD}
      />
      <input
        value={tags}
        onChange={(e) => setTags(e.target.value)}
        placeholder="Tags, comma separated"
        className={FIELD}
      />
      <input
        value={context}
        onChange={(e) => setContext(e.target.value)}
        placeholder="What it is"
        className={FIELD}
      />
      <textarea
        rows={2}
        value={reasons}
        onChange={(e) => setReasons(e.target.value)}
        placeholder="Why it is worth reading — one reason per line"
        className={`${FIELD} resize-none`}
      />
      <div className="flex items-center justify-between gap-3">
        <p className="text-[13px] text-rose-600 dark:text-rose-400">{problem}</p>
        <button
          type="submit"
          className="shrink-0 rounded-md bg-sky-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-sky-800 dark:bg-sky-600 dark:hover:bg-sky-500"
        >
          Add
        </button>
      </div>
    </form>
  );
}

export default function App() {
  const [list, setList] = useState<ReadingList | null>(null);
  const [showRead, setShowRead] = useState(false);
  const [showForm, setShowForm] = useState(false);
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

  const add = (item: Item): string | null => {
    if (!list) return null;
    if ([...list.unread, ...list.read].some((i) => i.link === item.link)) {
      return "Already on your list.";
    }
    apply(addItem(list, item));
    setShowRead(false);
    return null;
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
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setShowForm((v) => !v)}
            aria-label="Add a link"
            aria-expanded={showForm}
            className={`rounded-md px-2 py-1 text-lg leading-none text-stone-500 transition-transform hover:bg-stone-200 hover:text-stone-900 dark:text-stone-400 dark:hover:bg-stone-800 dark:hover:text-stone-100 ${showForm ? "rotate-45" : ""}`}
          >
            +
          </button>
          <button
            type="button"
            onClick={() => setShowRead((v) => !v)}
            className="rounded-md px-2.5 py-1 text-sm text-stone-500 hover:bg-stone-200 hover:text-stone-900 dark:text-stone-400 dark:hover:bg-stone-800 dark:hover:text-stone-100"
          >
            {showRead ? `Unread (${list.unread.length})` : `Read (${list.read.length})`}
          </button>
        </div>
      </header>

      <div
        className={`grid transition-[grid-template-rows] duration-200 ${showForm ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}
      >
        <div className="overflow-hidden">
          <AddForm open={showForm} onAdd={add} />
        </div>
      </div>

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
