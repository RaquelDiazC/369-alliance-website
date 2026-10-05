import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

function shield() {
  let state = null, cleanup, timer;
  const events = () => {
    const handlers = new Map();
    return {
      handlers,
      addEventListener: (name, fn) => handlers.set(name, fn),
      removeEventListener: (name) => handlers.delete(name),
      fire: (name, event = {}) => handlers.get(name)?.(event),
    };
  };
  const doc = { ...events(), visibilityState: 'visible', hasFocus: () => true };
  const win = { ...events(), setTimeout: (fn) => { timer = fn; return 1; }, clearTimeout: () => { timer = null; } };
  const react = {
    useState: () => [state, next => { state = typeof next === 'function' ? next(state) : next; }],
    useRef: () => ({ current: null }), useCallback: fn => fn,
    useEffect: fn => { cleanup = fn(); }, useMemo: fn => fn(),
  };
  const source = fs.readFileSync(new URL('../client/src/components/review/Protection.tsx', import.meta.url), 'utf8');
  const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX } }).outputText;
  const context = { exports: {}, document: doc, window: win, navigator: {}, require: name => name === 'react' ? react : name === 'react/jsx-runtime' ? { jsx: () => null, jsxs: () => null } : {} };
  vm.runInNewContext(code, context);
  context.exports.ProtectionShield({ active: true, children: null });
  return { doc, win, state: () => state, expire: () => timer?.(), cleanup: () => cleanup() };
}

test('clicking the page recovers blackout even without a window focus event', () => {
  const s = shield(); s.win.fire('blur'); assert.equal(s.state(), 'blur');
  s.doc.fire('pointerdown'); assert.equal(s.state(), null);
});
test('keyboard focus and page restoration recover blackout', () => {
  const s = shield(); s.win.fire('blur'); s.doc.fire('focusin'); assert.equal(s.state(), null);
  s.win.fire('blur'); s.win.fire('pageshow'); assert.equal(s.state(), null);
});
test('hidden tabs remain covered even after a spurious focus event', () => {
  const s = shield(); s.doc.visibilityState = 'hidden'; s.doc.fire('visibilitychange');
  s.win.fire('focus'); assert.equal(s.state(), 'blur');
});
test('screenshot timeout retains blackout if the tab is still hidden', () => {
  const s = shield(); s.doc.fire('keyup', { key: 'PrintScreen' }); assert.equal(s.state(), 'screenshot');
  s.doc.visibilityState = 'hidden'; s.expire(); assert.equal(s.state(), 'blur');
  s.doc.visibilityState = 'visible'; s.doc.fire('visibilitychange'); assert.equal(s.state(), null);
});
test('returning to the page does not dismiss the screenshot timeout', () => {
  const s = shield(); s.doc.fire('keyup', { key: 'PrintScreen' });
  s.doc.fire('pointerdown'); assert.equal(s.state(), 'screenshot');
  s.expire(); assert.equal(s.state(), null);
});
test('all recovery listeners are removed on unmount', () => {
  const s = shield(); s.cleanup();
  assert.equal(s.doc.handlers.size, 0); assert.equal(s.win.handlers.size, 0);
});
