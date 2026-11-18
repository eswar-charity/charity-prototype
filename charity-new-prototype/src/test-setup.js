import '@testing-library/jest-dom/vitest'

// jsdom has no <dialog> modal support.
HTMLDialogElement.prototype.showModal = function showModal() { this.setAttribute('open', '') }
HTMLDialogElement.prototype.close = function close() {
  this.removeAttribute('open')
  this.dispatchEvent(new Event('close'))
}
window.scrollTo = () => {}
