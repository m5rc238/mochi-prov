import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach, vi } from 'vitest'

// jsdom implements neither of these, and React Flow needs both to lay out.
if (!globalThis.ResizeObserver) {
  globalThis.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver
}

if (!globalThis.DOMMatrixReadOnly) {
  globalThis.DOMMatrixReadOnly = class {
    m22 = 1
    constructor(_transform?: string) {}
    scale() {
      return this
    }
    translate() {
      return this
    }
    multiply() {
      return this
    }
    toFloat64Array() {
      return new Float64Array()
    }
    toFloat32Array() {
      return new Float32Array()
    }
  } as unknown as typeof DOMMatrixReadOnly
}

if (typeof globalThis.DOMMatrix === 'undefined') {
  globalThis.DOMMatrix = globalThis.DOMMatrixReadOnly as unknown as typeof DOMMatrix
}

if (!Element.prototype.scrollTo) {
  Element.prototype.scrollTo = function scrollTo() {}
}

if (!Element.prototype.scrollIntoView) {
  Element.prototype.scrollIntoView = function scrollIntoView() {}
}

if (!window.matchMedia) {
  window.matchMedia = ((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia
}

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})
