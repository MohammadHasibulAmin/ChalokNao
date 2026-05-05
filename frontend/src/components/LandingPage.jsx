import React from 'react';
import { useNavigate } from 'react-router-dom';
import './LandingPage.css';

const LandingPage = () => {
  const navigate = useNavigate();

  const handleLogin = () => navigate('/login');
  const handleGetStarted = () => navigate('/register');
  const handlePostRequest = () => navigate('/marketplace');
  const handleBrowseDrivers = () => navigate('/marketplace');

  return (
    <div className="landing-page">
      {/* NAV */}
      <nav className="nav">
        <div className="logo">Chalok<span>Nao</span></div>
        <ul className="nav-links">
          <li><a href="#find-drivers">Find Drivers</a></li>
          <li><a href="#for-drivers">For Drivers</a></li>
          <li><a href="#how-it-works">How it Works</a></li>
          <li><a href="#pricing">Pricing</a></li>
        </ul>
        <div className="nav-cta">
          <button className="btn-ghost" onClick={handleLogin}>Log In</button>
          <button className="btn-primary" onClick={handleGetStarted}>Get Started</button>
        </div>
      </nav>

      {/* HERO */}
      <section className="hero">
        <div className="hero-content">
          <div className="hero-eyebrow">
            <span className="pulse-dot"></span>
            Bangladesh's First Driver Hiring Platform
          </div>
          <h1>Hire <em>Trusted</em> Drivers. Instantly.</h1>
          <p className="hero-sub">
            ChalokNao automates the entire driver hiring process — from search and screening to contract signing and payment.
            Permanent or temporary, we connect you with verified, rated drivers across Bangladesh.
          </p>
          <div className="hero-actions">
            <button className="btn-large btn-large-red" onClick={handlePostRequest}>Post a Hiring Request</button>
            <button className="btn-large btn-large-outline" onClick={handleBrowseDrivers}>Browse Drivers</button>
          </div>
          <div className="hero-trust">
            <div className="trust-avatars">
              <div className="av">R</div>
              <div className="av">K</div>
              <div className="av">M</div>
              <div className="av">A</div>
            </div>
            <div className="trust-text">
              <strong>2,400+ drivers hired</strong>
              Across Dhaka, Chittagong, Gazipur & more
            </div>
          </div>
        </div>
        <div className="hero-visual">
          <div className="driver-card-main">
            <div className="dc-header">
              <div className="dc-avatar">RK</div>
              <div>
                <div className="dc-name">Rafiqul Karim</div>
                <div className="dc-meta">⭐ 4.9 &nbsp;·&nbsp; 7 yrs experience &nbsp;·&nbsp; Dhaka</div>
              </div>
            </div>
            <div className="dc-badges">
              <span className="badge badge-gold">⚡ Top Rated</span>
              <span className="badge badge-green">✓ Verified Docs</span>
              <span className="badge badge-red">Highway Expert</span>
              <span className="badge badge-gold">Customer Service Pro</span>
            </div>
            <div className="dc-stats">
              <div className="dc-stat">
                <div className="val">7<span className="unit">yr</span></div>
                <div className="lbl">Experience</div>
              </div>
              <div className="dc-stat">
                <div className="val">4.9</div>
                <div className="lbl">Rating</div>
              </div>
              <div className="dc-stat">
                <div className="val">84</div>
                <div className="lbl">Hires Done</div>
              </div>
            </div>
            <div className="dc-footer">
              <div className="dc-avail">
                <span className="avail-dot"></span> Available Now
              </div>
              <button className="hire-btn">Send Offer →</button>
            </div>
          </div>
          <div className="floating-cards">
            <div className="mini-card mini-card-green">
              <div className="mini-card-label">Active Contracts</div>
              <div className="mini-card-val">38</div>
              <div className="mini-card-sub">This month</div>
            </div>
            <div className="mini-card">
              <div className="mini-card-label">Avg Salary</div>
              <div className="mini-card-val">৳18k</div>
              <div className="mini-card-sub">Per month</div>
            </div>
            <div className="mini-card">
              <div className="mini-card-label">Interviews Today</div>
              <div className="mini-card-val">12</div>
              <div className="mini-card-sub">Scheduled</div>
            </div>
            <div className="mini-card mini-card-red">
              <div className="mini-card-label">Pending Verifs</div>
              <div className="mini-card-val">6</div>
              <div className="mini-card-sub">Admin queue</div>
            </div>
          </div>
        </div>
      </section>

      {/* STATS BAR */}
      <div className="stats-bar">
        <div className="stat-item">
          <div className="stat-num">5<span>,200+</span></div>
          <div className="stat-lbl">Registered Drivers</div>
        </div>
        <div className="stat-item">
          <div className="stat-num">2<span>,400+</span></div>
          <div className="stat-lbl">Completed Hires</div>
        </div>
        <div className="stat-item">
          <div className="stat-num">4<span>.8★</span></div>
          <div className="stat-lbl">Average Driver Rating</div>
        </div>
        <div className="stat-item">
          <div className="stat-num">8<span> Divisions</span></div>
          <div className="stat-lbl">Coverage Across BD</div>
        </div>
      </div>

      {/* HOW IT WORKS */}
      <section className="section">
        <div className="section-label">Process</div>
        <div className="section-title">Hire in 4 Simple Steps</div>
        <p className="section-sub">
          No middlemen, no phone calls, no wasted time. ChalokNao automates every step of the hiring journey.
        </p>
        <div className="steps-grid">
          <div className="step-card" data-step="01">
            <div className="step-icon">🔍</div>
            <div className="step-title">Search & Filter</div>
            <p className="step-desc">
              Filter drivers by location, experience, salary range, and availability. Compare side-by-side and shortlist your favorites.
            </p>
          </div>
          <div className="step-card" data-step="02">
            <div className="step-icon">📅</div>
            <div className="step-title">Schedule Interview</div>
            <p className="step-desc">
              Propose an interview — online, in-person, or via real-time chat. Drivers accept or decline directly from the platform.
            </p>
          </div>
          <div className="step-card" data-step="03">
            <div className="step-icon">🤝</div>
            <div className="step-title">Send Offer & Confirm</div>
            <p className="step-desc">
              Submit a custom salary offer. Both you and the driver confirm to finalize the agreement — no ambiguity.
            </p>
          </div>
          <div className="step-card" data-step="04">
            <div className="step-icon">💳</div>
            <div className="step-title">Secure Payment</div>
            <p className="step-desc">
              Pay securely via Stripe. ChalokNao automatically calculates and collects its commission. Contract is stored for both parties.
            </p>
          </div>
          <div className="step-card" data-step="05">
            <div className="step-icon">📋</div>
            <div className="step-title">Manage Contracts</div>
            <p className="step-desc">
              Track ongoing hires, past contracts, payment status, and renewal dates from your owner dashboard.
            </p>
          </div>
          <div className="step-card" data-step="06">
            <div className="step-icon">⭐</div>
            <div className="step-title">Rate & Review</div>
            <p className="step-desc">
              After a contract, leave a rating. Great drivers earn badges. Your feedback shapes the community.
            </p>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="features-section">
        <div className="section-label">Features</div>
        <div className="section-title">Everything You Need</div>
        <p className="section-sub">
          Built specifically for the Bangladesh driver-owner market — with tools that actually make sense here.
        </p>
        <div className="features-grid">
          <div className="feature-block">
            <div className="feature-tag">For Owners</div>
            <h3>Advanced Driver Search</h3>
            <p>
              Filter by salary range, experience, location, rating, and real-time availability. Our map-powered search uses OpenStreetMap to show drivers near your service area.
            </p>
          </div>
          <div className="feature-block">
            <div className="feature-tag">For Drivers</div>
            <h3>Smart Profile & Badges</h3>
            <p>
              Build a reputation with Experience Badges, document verification, and a training module tracker. Trained drivers get prioritized in search results.
            </p>
          </div>
          <div className="feature-block">
            <div className="feature-tag">For Owners</div>
            <h3>Driver Comparison View</h3>
            <p>
              Shortlist up to 4 drivers and compare them side-by-side — experience, salary expectations, rating, and contract history in one view.
            </p>
          </div>
          <div className="feature-block">
            <div className="feature-tag">For Drivers</div>
            <h3>Availability Calendar</h3>
            <p>
              Mark available date ranges for short-term hire. Owners can see exactly when you're free — eliminating back-and-forth coordination.
            </p>
          </div>
          <div className="feature-block">
            <div className="feature-tag">Platform</div>
            <h3>Real-time Chat Support</h3>
            <p>
              Owners and drivers can connect with admins for dispute resolution, complaints, or any help — all within the platform.
            </p>
          </div>
          <div className="feature-block">
            <div className="feature-tag">Platform</div>
            <h3>Automated Commission</h3>
            <p>
              No manual billing. ChalokNao calculates its commission automatically after hire confirmation. Every transaction is logged for transparency.
            </p>
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section className="section">
        <div className="section-label">Pricing</div>
        <div className="section-title">Simple, Commission-Based</div>
        <p className="section-sub">
          We only earn when you hire. No subscriptions, no hidden fees — just a flat commission per successful hire.
        </p>
        <div className="pricing-grid">
          <div className="price-card">
            <div className="price-label">Temporary Hire</div>
            <div className="price-name">Day Driver</div>
            <div className="price-amount">৳200<span>/hire</span></div>
            <p className="price-desc">For short-term contracts under 30 days</p>
            <ul className="price-features">
              <li>Full driver profile access</li>
              <li>Availability calendar</li>
              <li>Secure payment</li>
              <li>Basic chat support</li>
            </ul>
            <button className="price-btn price-btn-outline" onClick={handlePostRequest}>Post a Request</button>
          </div>
          <div className="price-card featured">
            <div className="price-label">Most Popular</div>
            <div className="price-name">Permanent Hire</div>
            <div className="price-amount">5%<span> of 1st salary</span></div>
            <p className="price-desc">For long-term employment agreements</p>
            <ul className="price-features">
              <li>Everything in Day Driver</li>
              <li>Driver comparison tool</li>
              <li>Interview scheduling</li>
              <li>Contract management</li>
              <li>Priority admin support</li>
            </ul>
            <button className="price-btn price-btn-red" onClick={handleGetStarted}>Get Started</button>
          </div>
          <div className="price-card">
            <div className="price-label">Enterprise</div>
            <div className="price-name">Fleet Hiring</div>
            <div className="price-amount">Custom</div>
            <p className="price-desc">For companies hiring 5+ drivers at once</p>
            <ul className="price-features">
              <li>Bulk hiring tools</li>
              <li>Dedicated account manager</li>
              <li>Custom commission rate</li>
              <li>API access</li>
            </ul>
            <button className="price-btn price-btn-outline">Contact Us</button>
          </div>
        </div>
      </section>

      {/* CTA BANNER */}
      <div className="cta-banner">
        <div>
          <h2>Ready to Find Your Next Driver?</h2>
          <p>Join thousands of owners and drivers on Bangladesh's most trusted hiring platform.</p>
        </div>
        <div className="cta-actions">
          <button className="btn-white" onClick={handlePostRequest}>Post a Job →</button>
          <button className="btn-register" onClick={handleGetStarted}>Register as Driver</button>
        </div>
      </div>

      {/* FOOTER */}
      <footer>
        <div className="footer-logo">Chalok<span>Nao</span></div>
        <div className="footer-links">
          <button type="button" onClick={(e) => e.preventDefault()} className="footer-link">About</button>
          <button type="button" onClick={(e) => e.preventDefault()} className="footer-link">Privacy</button>
          <button type="button" onClick={(e) => e.preventDefault()} className="footer-link">Terms</button>
          <button type="button" onClick={(e) => e.preventDefault()} className="footer-link">Support</button>
          <button type="button" onClick={(e) => e.preventDefault()} className="footer-link">Blog</button>
        </div>
        <div className="footer-copy">© 2025 ChalokNao. All rights reserved.</div>
      </footer>
    </div>
  );
};

export default LandingPage;