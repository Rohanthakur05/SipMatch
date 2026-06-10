import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './Landing.css';

const Landing = () => {
  const [activeFaq, setActiveFaq] = useState(null);

  // Auto-scroll to top on load
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const toggleFaq = (index) => {
    setActiveFaq(activeFaq === index ? null : index);
  };

  const features = [
    {
      icon: "🍷",
      title: "Match by Preferences",
      desc: "Whether you prefer craft beer, fine wine, or artisanal cocktails, find someone with matching tastes."
    },
    {
      icon: "✨",
      title: "Compatibility Scoring",
      desc: "Our smart algorithm pairs you with individuals who match your nightlife vibe and personality."
    },
    {
      icon: "🌙",
      title: "Discover Nightlife",
      desc: "Find the best local bars, clubs, and lounges while connecting with potential partners."
    },
    {
      icon: "💬",
      title: "Real-time Messaging",
      desc: "Break the ice instantly with seamless, secure messaging right from the app."
    }
  ];

  const steps = [
    {
      title: "Create Your Profile",
      desc: "Set up your profile with your best photos and bio. Be authentic and let your personality shine."
    },
    {
      title: "Choose Preferences",
      desc: "Select your favorite drinks, typical nightlife activities, and what you're looking for."
    },
    {
      title: "Match & Connect",
      desc: "Swipe through curated profiles. When the feeling is mutual, it's a match!"
    },
    {
      title: "Start Chatting",
      desc: "Send a message, plan a date, and see where the night takes you."
    }
  ];

  const testimonials = [
    {
      name: "Sarah Jenkins",
      role: "Wine Enthusiast",
      quote: "SipMatch made dating fun again! I met someone who actually appreciates a good Cabernet as much as I do. We've been inseparable since our first date at a local vineyard.",
      img: "https://i.pravatar.cc/150?img=44"
    },
    {
      name: "Michael Chen",
      role: "Craft Beer Lover",
      quote: "I was tired of generic dating apps. Finding a partner to explore new microbreweries with was exactly what I wanted. The matching algorithm is incredibly accurate.",
      img: "https://i.pravatar.cc/150?img=11"
    },
    {
      name: "Elena Rodriguez",
      role: "Mixology Fan",
      quote: "The interface is gorgeous and the people are genuine. I love the focus on shared experiences rather than just swiping endlessly. Highly recommend!",
      img: "https://i.pravatar.cc/150?img=5"
    }
  ];

  const faqs = [
    {
      q: "Is SipMatch free to use?",
      a: "Yes! Core features like swiping, matching, and messaging are completely free. We also offer a premium subscription for advanced filters and unlimited likes."
    },
    {
      q: "How does the matching algorithm work?",
      a: "We analyze your drink preferences, lifestyle choices, and personality traits to find highly compatible partners who share your vibe."
    },
    {
      q: "Is my personal data secure?",
      a: "Absolutely. We use industry-standard encryption to protect your data and never share your personal information with third parties without your consent."
    },
    {
      q: "Can I use SipMatch if I don't drink alcohol?",
      a: "Yes! We have a vibrant community of sober-curious and non-drinking users. You can easily filter for coffee dates, mocktails, and alcohol-free activities."
    }
  ];

  return (
    <div className="landing-page">
      <div className="landing-content">
        {/* Navigation */}
        <nav className="landing-nav">
          <div className="landing-logo">
            <span role="img" aria-label="glasses">🥂</span> SipMatch
          </div>
          <div className="nav-links">
            <a href="#features" className="nav-link">Features</a>
            <a href="#how-it-works" className="nav-link">How it Works</a>
            <a href="#testimonials" className="nav-link">Stories</a>
          </div>
          <Link to="/login" className="btn btn-outline" style={{ display: 'none' }}>Log In</Link>
          {/* Hiding individual login button in nav for simpler mobile layout; primary CTAs are in Hero */}
        </nav>

        {/* Hero Section */}
        <section className="hero-section">
          <div className="hero-tagline">The #1 App for Nightlife Romance</div>
          <h1 className="hero-title">Find Your Perfect Pour</h1>
          <p className="hero-subtitle">
            Connect with singles who share your taste in drinks, venues, and unforgettable nights out.
            SipMatch is where great conversations start over great beverages.
          </p>
          <div className="hero-cta">
            <Link to="/signup" className="btn btn-primary">Get Started</Link>
            <a href="#features" className="btn btn-outline">Learn More</a>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="section">
          <div className="section-header">
            <h2 className="section-title">Why SipMatch?</h2>
            <p className="section-subtitle">We focus on the shared experiences that make dating exciting and natural.</p>
          </div>
          <div className="features-grid">
            {features.map((feature, idx) => (
              <div key={idx} className="glass-card">
                <div className="feature-icon-wrapper">
                  {feature.icon}
                </div>
                <h3 className="feature-title">{feature.title}</h3>
                <p className="feature-desc">{feature.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* How It Works Section */}
        <section id="how-it-works" className="section">
          <div className="section-header">
            <h2 className="section-title">How It Works</h2>
            <p className="section-subtitle">Your journey to finding the perfect partner is just a few steps away.</p>
          </div>
          <div className="steps-container" style={{ maxWidth: '800px', margin: '0 auto' }}>
            {steps.map((step, idx) => (
              <div key={idx} className="step-item">
                <div className="step-number">{idx + 1}</div>
                <div className="step-content">
                  <h3 className="step-title">{step.title}</h3>
                  <p className="step-desc">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Testimonials Section */}
        <section id="testimonials" className="section">
          <div className="section-header">
            <h2 className="section-title">Success Stories</h2>
            <p className="section-subtitle">Don't just take our word for it. Hear from couples who found their match.</p>
          </div>
          <div className="testimonials-grid">
            {testimonials.map((test, idx) => (
              <div key={idx} className="glass-card testimonial-card">
                <div className="quote-icon">"</div>
                <p className="testimonial-text">{test.quote}</p>
                <div className="user-info">
                  <div className="user-avatar" style={{ backgroundImage: `url(${test.img})` }}></div>
                  <div className="user-details">
                    <h4>{test.name}</h4>
                    <p>{test.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* FAQ Section */}
        <section id="faq" className="section">
          <div className="section-header">
            <h2 className="section-title">Frequently Asked Questions</h2>
            <p className="section-subtitle">Got questions? We've got answers.</p>
          </div>
          <div className="faq-container">
            {faqs.map((faq, idx) => (
              <div 
                key={idx} 
                className={`faq-item ${activeFaq === idx ? 'active' : ''}`}
                onClick={() => toggleFaq(idx)}
              >
                <div className="faq-question">
                  {faq.q}
                  <span className="faq-icon">+</span>
                </div>
                <div className="faq-answer">
                  <p>{faq.a}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Footer */}
        <footer className="footer">
          <div className="footer-content">
            <div className="footer-col">
              <h3><span role="img" aria-label="glasses">🥂</span> SipMatch</h3>
              <p>The premier dating app for people who love discovering new drinks, venues, and experiences together.</p>
              <div className="social-links">
                <a href="#" className="social-link">In</a>
                <a href="#" className="social-link">Tw</a>
                <a href="#" className="social-link">Fb</a>
              </div>
            </div>
            <div className="footer-col">
              <h3>Company</h3>
              <ul className="footer-links">
                <li><a href="#">About Us</a></li>
                <li><a href="#">Careers</a></li>
                <li><a href="#">Press</a></li>
                <li><a href="#">Blog</a></li>
              </ul>
            </div>
            <div className="footer-col">
              <h3>Support</h3>
              <ul className="footer-links">
                <li><a href="#">Help Center</a></li>
                <li><a href="#">Safety Center</a></li>
                <li><a href="#">Community Guidelines</a></li>
              </ul>
            </div>
            <div className="footer-col">
              <h3>Legal</h3>
              <ul className="footer-links">
                <li><a href="#">Privacy Policy</a></li>
                <li><a href="#">Terms of Service</a></li>
                <li><a href="#">Cookie Policy</a></li>
              </ul>
            </div>
          </div>
          <div className="footer-bottom">
            <p>&copy; {new Date().getFullYear()} SipMatch. All rights reserved.</p>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default Landing;
