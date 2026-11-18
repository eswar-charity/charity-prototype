import { DomainProvider } from './domain/store.jsx'
import { ToastProvider, ConfirmProvider } from './ui/kit.jsx'
import { GateProvider } from './ui/Gate.jsx'

/** Everything a screen can rely on: domain engine, toasts, confirm dialog, identity gate. Router sits outside. */
export default function AppProviders({ children, engine }) {
  return (
    <DomainProvider engine={engine}>
      <ToastProvider>
        <ConfirmProvider>
          <GateProvider>{children}</GateProvider>
        </ConfirmProvider>
      </ToastProvider>
    </DomainProvider>
  )
}
