window.__ModuleLoader__.load({
  id: '@dsh-testkit/fixture-web-status',
  factory: (_require) => {
    var module = { exports: {} }
    var exports = module.exports
    Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' })
    const name = '@dsh-testkit/fixture-web-status'
    const inject = []

    function apply(ctx) {
      const expected = 'Fixture status ready'
      const selector = '[role="status"][aria-live="polite"]'
      const adopt = (root) => {
        const candidates = root instanceof Element
          ? [root, ...root.querySelectorAll(selector)]
          : [...document.querySelectorAll(selector)]
        for (const element of candidates) {
          if (element.matches?.(selector) && element.textContent === 'Deep diving...') {
            element.textContent = expected
          }
        }
      }
      const observer = new MutationObserver(records => {
        for (const record of records) {
          for (const node of record.addedNodes) adopt(node)
        }
      })
      ctx.effect(() => {
        adopt(document)
        observer.observe(document.body, { childList: true, subtree: true })
        return () => observer.disconnect()
      }, 'dsh-testkit fixture TurnStatus smoke')
    }

    exports.apply = apply
    exports.inject = inject
    exports.name = name
    return module.exports
  },
})
