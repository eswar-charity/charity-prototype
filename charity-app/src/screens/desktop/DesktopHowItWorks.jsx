import { useNavigate } from 'react-router-dom';
import { Compass, Users, Camera, Heart, ArrowRight, ShieldCheck } from 'lucide-react';
import DesktopHeader from '../../components/desktop/DesktopHeader';
import DesktopFooter from '../../components/desktop/DesktopFooter';
import { HOW_IT_WORKS_STEPS, HOW_IT_WORKS_ROLES } from '../../data/marketingPages';

const STEP_ICONS = { compass: Compass, users: Users, camera: Camera, heart: Heart };

export default function DesktopHowItWorks() {
  const navigate = useNavigate();

  return (
    <div className="dsk-page dsk-info-page">
      <DesktopHeader active="How it works" homePath="/guest/feed" />

      <main className="dsk-main">
        <section className="dsk-info-hero dsk-info-hero--blue">
          <div className="dsk-container dsk-info-hero-inner">
            <span className="dsk-info-eyebrow">How Charity Hub works</span>
            <h1 className="dsk-info-title">Showing up becomes a movement.</h1>
            <p className="dsk-info-lead">
              Charity Hub connects Social Entrepreneurs, verified nonprofits, and neighbors
              around live events — so participation turns into real dollars for causes that matter.
            </p>
            <div className="dsk-info-hero-actions">
              <button type="button" className="dsk-cta-btn" onClick={() => navigate('/guest/feed')}>
                Explore events
              </button>
              <button type="button" className="dsk-info-btn-outline" onClick={() => navigate('/')}>
                Sign up to host
              </button>
            </div>
          </div>
        </section>

        <section className="dsk-info-section">
          <div className="dsk-container">
            <div className="dsk-info-section-head">
              <h2 className="dsk-info-h2">Four steps from idea to impact</h2>
              <p className="dsk-info-sub">
                Every event on Charity Hub is linked to a verified nonprofit and reviewed before it goes live.
              </p>
            </div>
            <div className="dsk-info-steps">
              {HOW_IT_WORKS_STEPS.map((item) => {
                const Icon = STEP_ICONS[item.icon];
                return (
                  <article key={item.step} className="dsk-info-step-card">
                    <div className="dsk-info-step-top">
                      <span className="dsk-info-step-num">{item.step}</span>
                      <div className="dsk-info-step-icon">
                        <Icon size={20} color="var(--blue)" />
                      </div>
                    </div>
                    <h3 className="dsk-info-step-title">{item.title}</h3>
                    <p className="dsk-info-step-body">{item.body}</p>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        <section className="dsk-info-section dsk-info-section--soft">
          <div className="dsk-container">
            <div className="dsk-info-trust">
              <ShieldCheck size={22} color="var(--blue)" />
              <div>
                <p className="dsk-info-trust-title">Built on verified trust</p>
                <p className="dsk-info-trust-body">
                  Nonprofits are verified 501(c)(3) partners. Events are approved before publish.
                  Donations settle to the cause — not the platform.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="dsk-info-section">
          <div className="dsk-container">
            <div className="dsk-info-section-head">
              <h2 className="dsk-info-h2">Choose your role</h2>
              <p className="dsk-info-sub">Whether you host, back, or steward a nonprofit — there is a place for you.</p>
            </div>
            <div className="dsk-info-role-grid">
              {HOW_IT_WORKS_ROLES.map((role) => (
                <article key={role.title} className="dsk-info-role-card">
                  <h3 className="dsk-info-role-title">{role.title}</h3>
                  <p className="dsk-info-role-body">{role.body}</p>
                  <button type="button" className="dsk-info-link-btn" onClick={() => navigate(role.route)}>
                    {role.cta}
                    <ArrowRight size={14} />
                  </button>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="dsk-info-cta-band">
          <div className="dsk-container dsk-info-cta-inner">
            <h2 className="dsk-info-cta-title">Ready to start something good?</h2>
            <p className="dsk-info-cta-sub">Create a free event for any verified nonprofit on Charity Hub.</p>
            <button type="button" className="dsk-cta-btn dsk-info-cta-btn" onClick={() => navigate('/')}>
              Get started
            </button>
          </div>
        </section>
      </main>

      <DesktopFooter />
    </div>
  );
}
