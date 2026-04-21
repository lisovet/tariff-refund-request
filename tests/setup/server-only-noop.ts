// No-op replacement for the `server-only` package — vitest aliases the
// import here so server-only entry points (@contexts/<name>/server)
// remain importable in tests. Production builds see the real package
// (which throws if imported into a client module).
export {}
