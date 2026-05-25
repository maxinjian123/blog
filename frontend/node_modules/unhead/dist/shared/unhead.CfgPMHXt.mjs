function registerPlugin(head, p) {
  const plugin = typeof p === "function" ? p(head) : p;
  const key = plugin.key || String(head.plugins.size + 1);
  if (!head.plugins.get(key)) {
    head.plugins.set(key, plugin);
    for (const k in plugin.hooks || {})
      head.hooks?.hook(k, plugin.hooks[k]);
  }
}
// @__NO_SIDE_EFFECTS__
function createUnhead(renderer, resolvedOptions = {}) {
  const ssr = !resolvedOptions.document;
  const entries = /* @__PURE__ */ new Map();
  const plugins = /* @__PURE__ */ new Map();
  const head = {
    _entryCount: 1,
    plugins,
    resolvedOptions,
    ssr,
    entries,
    render: () => renderer(head),
    use: (p) => registerPlugin(head, p),
    push(input, _options) {
      const _i = _options?._index ?? head._entryCount++;
      const options = _options ? { ..._options } : {};
      delete options.head;
      delete options.onRendered;
      const entry = { _i, input, options };
      entries.set(_i, entry);
      const active = {
        _i,
        dispose() {
          entries.delete(_i);
        },
        patch(input2) {
          if (ssr) {
            entry.input = input2;
            delete entry._tags;
          } else {
            entry._pending = input2;
          }
          if (!entries.has(_i))
            entries.set(_i, entry);
        }
      };
      return active;
    }
  };
  resolvedOptions.init?.forEach((e) => e && head.push(e));
  return head;
}

export { createUnhead as c, registerPlugin as r };
