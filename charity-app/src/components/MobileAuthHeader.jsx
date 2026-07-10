import { ChevronLeft } from 'lucide-react';
import Logo from './Logo';

export default function MobileAuthHeader({ onBack, activeStep = 0, totalSteps = 3 }) {
  return (
    <div className="mobile-auth-header">
      <div className="mobile-auth-top">
        <button type="button" className="back-btn" onClick={onBack} aria-label="Go back">
          <ChevronLeft size={18} />
        </button>
        <div className="mobile-auth-top-logo">
          <Logo height={24} />
        </div>
        <div className="mobile-auth-top-spacer" aria-hidden />
      </div>
      <div className="step-dots mobile-auth-steps">
        {Array.from({ length: totalSteps }, (_, i) => (
          <div key={i} className={`step-dot ${i === activeStep ? 'active' : ''}`} />
        ))}
      </div>
    </div>
  );
}
