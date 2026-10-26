type Blocker = (proceed: () => void) => void;
let blocker: Blocker | null = null;

export function blockHistoryNavigation(next: Blocker) {
  blocker = next;
  return () => { if (blocker === next) blocker = null; };
}

// Keep an index on app history entries so cancelled Back/Forward restores the
// original entry without adding duplicates or destroying the forward stack.
export function installNavigationHistory(target: Window) {
  const history = target.history;
  const key = "__mmmPosition";
  const push = history.pushState;
  const replace = history.replaceState;
  let position: number = history.state?.[key] ?? 0;
  let restoring: { position: number; delta: number; prompt: Blocker } | null = null;
  let allowed = false;
  replace.call(history, { ...history.state, [key]: position }, "");
  history.pushState = function (data, unused, url) {
    const next = position + 1;
    push.call(history, { ...data, [key]: next }, unused, url);
    position = next;
  };
  history.replaceState = function (data, unused, url) {
    replace.call(history, { ...data, [key]: position }, unused, url);
  };
  function pop(event: PopStateEvent) {
    const next = event.state?.[key];
    if (restoring) {
      event.stopImmediatePropagation();
      const intent = restoring;
      restoring = null;
      position = intent.position;
      intent.prompt(() => { allowed = true; history.go(intent.delta); });
      return;
    }
    if (typeof next !== "number") return; // Cross-document exits use beforeunload.
    const delta = next - position;
    if (!allowed && blocker && delta) {
      event.stopImmediatePropagation();
      restoring = { position, delta, prompt: blocker };
      history.go(-delta);
      return;
    }
    allowed = false;
    position = next;
  }
  target.addEventListener("popstate", pop, true);
  return () => {
    target.removeEventListener("popstate", pop, true);
    history.pushState = push;
    history.replaceState = replace;
  };
}
