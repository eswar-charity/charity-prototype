import '@testing-library/jest-dom/vitest'

// jsdom has no <dialog> modal support.
HTMLDialogElement.prototype.showModal = function showModal() { this.setAttribute('open', '') }
HTMLDialogElement.prototype.close = function close() {
  this.removeAttribute('open')
  this.dispatchEvent(new Event('close'))
}
window.scrollTo = () => {}

// QR codes draw to <canvas>; jsdom has no 2D context. A no-op is enough for tests.
HTMLCanvasElement.prototype.getContext = () => null
