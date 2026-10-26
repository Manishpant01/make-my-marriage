import { expect, test } from "vitest";
import { blockHistoryNavigation, installNavigationHistory } from "@/lib/navigation-history";

function browser() {
  const target = new EventTarget();
  const entries: Record<string, unknown>[] = [{}];
  let index = 0;
  const history = {
    get state() { return entries[index]; },
    pushState(data: Record<string, unknown>) { entries.splice(index + 1); entries.push(data); index++; },
    replaceState(data: Record<string, unknown>) { entries[index] = data; },
    go(delta: number) {
      index += delta;
      const event = new Event("popstate");
      Object.assign(event, { state: entries[index] });
      target.dispatchEvent(event);
    },
  };
  Object.assign(target, { history });
  return { target: target as unknown as Window, history, entries, position: () => index };
}

test("Back and Forward restore the editor before prompting and preserve the forward stack", () => {
  const b = browser();
  const uninstall = installNavigationHistory(b.target);
  b.target.history.pushState({ page: "events" }, "");
  b.target.history.pushState({ page: "editor" }, "");
  let proceed: (() => void) | undefined;
  let prompts = 0;
  const unblock = blockHistoryNavigation(next => { prompts++; proceed = next; });
  b.history.go(-1);
  expect(b.position()).toBe(2);
  expect(b.history.state.page).toBe("editor");
  expect(prompts).toBe(1);
  // Keep editing: no continuation, draft's history entry remains active.
  b.history.go(-1);
  expect(prompts).toBe(2);
  proceed!();
  expect(b.position()).toBe(1);
  expect(b.entries).toHaveLength(3);
  b.history.go(1);
  expect(b.position()).toBe(1);
  expect(prompts).toBe(3);
  proceed!();
  expect(b.history.state.page).toBe("editor");
  unblock(); uninstall();
});

test("replace preserves the entry index and unblocked traversal needs no confirmation", () => {
  const b = browser();
  const uninstall = installNavigationHistory(b.target);
  b.target.history.pushState({ __NA: true, page: "editor" }, "");
  b.target.history.replaceState({ __NA: true, page: "updated" }, "");
  expect(b.history.state).toMatchObject({ __NA: true, __mmmPosition: 1 });
  b.history.go(-1);
  expect(b.position()).toBe(0);
  b.history.go(1);
  expect(b.history.state.page).toBe("updated");
  uninstall();
});
