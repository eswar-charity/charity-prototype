import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Compass, Users, Camera, Heart, ArrowRight, ShieldCheck } from 'lucide-react';
import MobileAppHeader from '../../components/MobileAppHeader';
import GuestBottomNav from '../../components/GuestBottomNav';
import BottomNav from '../../components/BottomNav';
import { useAuth } from '../../auth/AuthContext';
import { HOW_IT_WORKS_STEPS, HOW_IT_WORKS_ROLES } from '../../data/marketingPages';

const STEP_ICONS = { compass: Compass, users: Users, camera: Camera, heart: Heart };

export default function HowItWorks() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const homePath = isAuthenticated ? '/feed' : '/guest/feed';
  const startPath = isAuthenticated ? '/event/step-1' : '/';

  return (
    <div className="phone-shell">
      <div className="screen info-page-screen">
        <MobileAppHeader
          layout="bar"
          homePath={homePath}
          left={(
            <button type="button" className="back-btn" aria-label="Go back" onClick={() => navigate(homePath)}>
              <ChevronLeft size={18} />
            </button>
          )}
          title="How it works"
          subtitle="From discovery to real-world impact"
        />

        <div className="screen-inner info-page-scroll">
          <section className="info-hero-card">
            <span className="info-eyebrow">Charity Hub</span>
            <h1 className="info-title">Showing up becomes a movement.</h1>
            <p className="info-lead">
              Social Entrepreneurs host events for verified nonprofits. Guests discover, back, and follow along live.
            </p>
          </section>

          <section className="info-block">
            <h2 className="info-h2">Four steps to impact</h2>
            {HOW_IT_WORKS_STEPS.map((item) => {
              const Icon = STEP_ICONS[item.icon];
              return (
                <article key={item.step} className="info-step-card">
                  <div className="info-step-icon"><Icon size={18} color="var(--blue)" /></div>
                  <div>
                    <p className="info-step-num">{item.step}</p>
                    <h3 className="info-step-title">{item.title}</h3>
                    <p className="info-step-body">{item.body}</p>
                  </div>
                </article>
              );
            })}
          </section>

          <section className="info-trust-card">
            <ShieldCheck size={20} color="var(--blue)" />
            <div>
              <p className="info-trust-title">Verified nonprofits only</p>
              <p className="info-trust-body">Every event is linked to a 501(c)(3) partner and reviewed before it goes live.</p>
            </div>
          </section>

          <section className="info-block">
            <h2 className="info-h2">Choose your role</h2>
            {HOW_IT_WORKS_ROLES.map((role) => (
              <button key={role.title} type="button" className="info-role-card" onClick={() => navigate(role.route)}>
                <div>
                  <p className="info-role-title">{role.title}</p>
                  <p className="info-role-body">{role.body}</p>
                </div>
                <span className="info-role-cta">{role.cta} <ArrowRight size={14} /></span>
              </button>
            ))}
          </section>

          <button type="button" className="btn-primary" style={{ marginTop: 8 }} onClick={() => navigate(startPath)}>
            {isAuthenticated ? 'Create an event' : 'Get started'}
          </button>
        </div>

        {isAuthenticated
          ? <BottomNav onPlusClick={() => navigate('/event/step-1')} />
          : <GuestBottomNav active="discover" />}
      </div>
    </div>
  );
}
