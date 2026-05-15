import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useState, useEffect, useRef } from 'react';

function Home() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [isVisible, setIsVisible] = useState(false);
  const observerRef = useRef(null);

  useEffect(() => {
    setTimeout(() => setIsVisible(true), 80);

    observerRef.current = new IntersectionObserver(
      (entries) => entries.forEach((e) => {
        if (e.isIntersecting) e.target.classList.add('in-view');
      }),
      { threshold: 0.08 }
    );
    document.querySelectorAll('.reveal').forEach((el) => observerRef.current.observe(el));

    return () => observerRef.current?.disconnect();
  }, []);

  return (
    <div className="min-h-screen overflow-x-hidden" style={{ background: 'linear-gradient(160deg, #fdf8ff 0%, #fff5fb 40%, #f8f5ff 70%, #f0f8ff 100%)' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;1,9..40,300&display=swap');

        :root {
          --serif: 'Instrument Serif', Georgia, serif;
          --sans: 'DM Sans', sans-serif;
        }

        * { box-sizing: border-box; }
        body, p, span, a, li, button, div { font-family: var(--sans); }
        h1, h2, h3, h4, h5, h6 { font-family: var(--serif); font-weight: 400; margin: 0; }

        .lux-card {
          background: rgba(255,255,255,0.72);
          backdrop-filter: blur(28px) saturate(160%);
          -webkit-backdrop-filter: blur(28px) saturate(160%);
          border: 1px solid rgba(255,255,255,0.92);
          border-radius: 28px;
          box-shadow: 0 2px 0 rgba(255,255,255,0.9) inset, 0 8px 40px rgba(124,58,237,0.07), 0 2px 8px rgba(0,0,0,0.03);
          transition: box-shadow 0.4s ease, transform 0.45s cubic-bezier(0.34,1.56,0.64,1);
        }
        .lux-card:hover {
          box-shadow: 0 2px 0 rgba(255,255,255,0.9) inset, 0 24px 64px rgba(124,58,237,0.13), 0 4px 16px rgba(0,0,0,0.05);
          transform: translateY(-8px);
        }

        .nav-wrap {
          background: rgba(255,255,255,0.82);
          backdrop-filter: blur(32px) saturate(200%);
          -webkit-backdrop-filter: blur(32px) saturate(200%);
          border-bottom: 1px solid rgba(255,255,255,0.95);
          box-shadow: 0 1px 0 rgba(124,58,237,0.06), 0 4px 24px rgba(124,58,237,0.04);
        }

        .btn-primary {
          display: inline-flex; align-items: center; gap: 8px;
          padding: 15px 34px;
          background: linear-gradient(135deg, #7c3aed 0%, #db2777 100%);
          color: white; font-family: var(--sans); font-weight: 500; font-size: 15px; letter-spacing: 0.01em;
          border-radius: 100px; border: none; cursor: pointer;
          box-shadow: 0 4px 24px rgba(124,58,237,0.38), 0 1px 3px rgba(0,0,0,0.1);
          transition: all 0.35s cubic-bezier(0.34,1.56,0.64,1);
        }
        .btn-primary:hover { transform: scale(1.05) translateY(-2px); box-shadow: 0 12px 40px rgba(124,58,237,0.48); }

        .btn-ghost {
          display: inline-flex; align-items: center; gap: 8px;
          padding: 14px 32px;
          background: rgba(255,255,255,0.85); color: #374151;
          font-family: var(--sans); font-weight: 500; font-size: 15px;
          border-radius: 100px; border: 1px solid rgba(255,255,255,0.95); cursor: pointer;
          box-shadow: 0 2px 16px rgba(0,0,0,0.06);
          transition: all 0.3s ease;
        }
        .btn-ghost:hover { background: white; box-shadow: 0 8px 32px rgba(0,0,0,0.1); transform: translateY(-2px); }

        /* Gradient text helpers */
        .g-pp { background: linear-gradient(135deg,#7c3aed,#db2777); -webkit-background-clip:text; background-clip:text; -webkit-text-fill-color:transparent; }
        .g-pr { background: linear-gradient(135deg,#db2777,#f43f5e); -webkit-background-clip:text; background-clip:text; -webkit-text-fill-color:transparent; }
        .g-bc { background: linear-gradient(135deg,#2563eb,#06b6d4); -webkit-background-clip:text; background-clip:text; -webkit-text-fill-color:transparent; }
        .g-ge { background: linear-gradient(135deg,#16a34a,#059669); -webkit-background-clip:text; background-clip:text; -webkit-text-fill-color:transparent; }

        /* Blobs */
        @keyframes drift {
          0%,100% { transform: translate(0,0) scale(1) rotate(0deg); }
          25% { transform: translate(28px,-36px) scale(1.07) rotate(3deg); }
          50% { transform: translate(-18px,26px) scale(0.95) rotate(-2deg); }
          75% { transform: translate(18px,8px) scale(1.03) rotate(2deg); }
        }
        .blob { animation: drift 13s ease-in-out infinite; }
        .blob2 { animation-delay: -4.5s; animation-duration: 15s; }
        .blob3 { animation-delay: -9s; animation-duration: 11s; }

        /* Reveal on scroll */
        .reveal {
          opacity: 0; transform: translateY(36px);
          transition: opacity 0.85s cubic-bezier(0.16,1,0.3,1), transform 0.85s cubic-bezier(0.16,1,0.3,1);
        }
        .reveal.in-view { opacity: 1; transform: none; }
        .d1 { transition-delay: 0.08s; }
        .d2 { transition-delay: 0.18s; }
        .d3 { transition-delay: 0.28s; }
        .d4 { transition-delay: 0.38s; }

        /* Hero entrance */
        .hero-line { transition: opacity 1.1s cubic-bezier(0.16,1,0.3,1), transform 1.1s cubic-bezier(0.16,1,0.3,1); }
        .hero-line.out { opacity: 0; transform: translateY(44px); }
        .hd1 { transition-delay: 0.1s; }
        .hd2 { transition-delay: 0.28s; }
        .hd3 { transition-delay: 0.44s; }
        .hd4 { transition-delay: 0.58s; }

        /* Ornament divider */
        .ornament { display:flex; align-items:center; gap:14px; }
        .ornament::before,.ornament::after { content:''; flex:1; height:1px; background:linear-gradient(to right,transparent,rgba(124,58,237,0.2),transparent); }
        .ornament span { font-family:var(--serif); font-style:italic; font-size:12px; color:#9333ea; letter-spacing:0.1em; white-space:nowrap; }

        /* Sec label */
        .sec-label { font-family:var(--sans); font-size:10.5px; font-weight:700; letter-spacing:0.2em; text-transform:uppercase; color:#9333ea; display:inline-block; margin-bottom:12px; }

        /* Stat bar */
        .stat-bar {
          background: rgba(255,255,255,0.78);
          backdrop-filter: blur(22px);
          border: 1px solid rgba(255,255,255,0.95);
          border-radius: 24px;
          box-shadow: 0 2px 0 rgba(255,255,255,0.9) inset, 0 8px 40px rgba(124,58,237,0.06);
          overflow: hidden;
        }

        /* Scroll indicator */
        @keyframes scroll-pulse { 0%,100%{transform:translateY(0);opacity:1;} 50%{transform:translateY(7px);opacity:0.4;} }
        .scroll-dot { width:5px; height:5px; border-radius:50%; background:#c4b5fd; animation:scroll-pulse 1.6s ease-in-out infinite; }

        /* Float emoji */
        @keyframes float-up { 0%,100%{transform:translateY(0);} 50%{transform:translateY(-10px);} }
        .float-e { animation:float-up 3.5s ease-in-out infinite; }
        .float-e:nth-child(2){ animation-delay:-1.2s; }
        .float-e:nth-child(3){ animation-delay:-2.3s; }

        /* Nav link */
        .nav-a { font-family:var(--sans); font-size:13.5px; font-weight:500; color:#6b7280; padding:7px 15px; border-radius:100px; text-decoration:none; transition:all 0.2s; }
        .nav-a:hover { color:#7c3aed; background:rgba(124,58,237,0.07); }

        /* Role featured */
        .role-feat {
          background: linear-gradient(160deg,rgba(255,255,255,0.88) 0%,rgba(255,240,250,0.88) 100%) !important;
          transform: scale(1.05) translateY(-4px) !important;
          box-shadow: 0 2px 0 rgba(255,255,255,0.9) inset, 0 32px 80px rgba(219,39,119,0.13), 0 4px 16px rgba(0,0,0,0.05) !important;
        }
        .role-feat:hover { transform: scale(1.05) translateY(-12px) !important; }

        /* Featured pill */
        .feat-pill { display:inline-flex; align-items:center; gap:5px; padding:4px 14px; background:linear-gradient(135deg,rgba(219,39,119,0.09),rgba(244,63,94,0.09)); border:1px solid rgba(219,39,119,0.18); border-radius:100px; font-size:11px; font-weight:700; color:#db2777; margin-bottom:18px; letter-spacing:0.04em; }

        /* Quote */
        .big-quote { font-family:var(--serif); font-style:italic; font-size:80px; line-height:0; position:absolute; top:28px; right:22px; color:rgba(124,58,237,0.07); pointer-events:none; }

        /* CTA wrap */
        .cta-section {
          background: linear-gradient(140deg,rgba(245,240,255,0.92) 0%,rgba(255,240,250,0.92) 50%,rgba(240,245,255,0.92) 100%);
          border: 1px solid rgba(255,255,255,0.95);
          border-radius: 44px;
          box-shadow: 0 2px 0 rgba(255,255,255,0.9) inset, 0 28px 80px rgba(124,58,237,0.09);
          position: relative; overflow: hidden;
        }
        .cta-section::before { content:''; position:absolute; inset:0; background:radial-gradient(ellipse 70% 55% at 50% 0%,rgba(216,180,254,0.28) 0%,transparent 70%); pointer-events:none; }

        /* Footer */
        .footer-base { border-top:1px solid rgba(124,58,237,0.09); background:rgba(255,255,255,0.6); backdrop-filter:blur(20px); }

        /* Grain */
        .grain-overlay { position:fixed; inset:0; z-index:999; pointer-events:none; opacity:0.28;
          background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.05'/%3E%3C/svg%3E");
        }

        /* Hover social icon */
        .soc-icon { width:34px; height:34px; border-radius:10px; background:rgba(255,255,255,0.85); border:1px solid rgba(124,58,237,0.1); display:flex; align-items:center; justify-content:center; font-size:12px; color:#9ca3af; cursor:pointer; transition:all 0.2s; font-weight:700; }
        .soc-icon:hover { border-color:rgba(124,58,237,0.32); color:#7c3aed; }

        .icon-wrap { transition: transform 0.4s cubic-bezier(0.34,1.56,0.64,1); }
        .lux-card:hover .icon-wrap { transform: scale(1.14) rotate(6deg); }

        @media (max-width: 768px) {
          .desktop-grid-4 { grid-template-columns: 1fr 1fr !important; }
          .desktop-grid-3 { grid-template-columns: 1fr !important; }
          .desktop-grid-2 { grid-template-columns: 1fr !important; }
          .desktop-grid-footer { grid-template-columns: 1fr 1fr !important; }
          .hide-mobile { display:none !important; }
          .role-feat { transform: scale(1) translateY(0) !important; }
        }
      `}</style>

      {/* Grain texture overlay */}
      <div className="grain-overlay" />

      {/* Ambient background blobs */}
      <div style={{ position: 'fixed', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 0 }}>
        <div className="blob" style={{ position: 'absolute', top: '-15%', left: '-8%', width: 750, height: 750, borderRadius: '50%', background: 'radial-gradient(circle, rgba(216,180,254,0.2) 0%, transparent 65%)' }} />
        <div className="blob blob2" style={{ position: 'absolute', top: '25%', right: '-12%', width: 650, height: 650, borderRadius: '50%', background: 'radial-gradient(circle, rgba(251,207,232,0.18) 0%, transparent 65%)' }} />
        <div className="blob blob3" style={{ position: 'absolute', bottom: '5%', left: '20%', width: 550, height: 550, borderRadius: '50%', background: 'radial-gradient(circle, rgba(147,197,253,0.14) 0%, transparent 65%)' }} />
      </div>

      {/* ── NAVIGATION ── */}
      <nav className="nav-wrap" style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50 }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 40px', height: 72, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>

          <div style={{ position: 'relative', cursor: 'pointer', display: 'flex', alignItems: 'center' }} onClick={() => navigate('/')}>
            <div style={{ position: 'absolute', top: -10, left: 0, transition: 'transform 0.4s ease' }}
              onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.06)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
            >
              <img src="/logo.svg" alt="AutismCare" style={{ height: 100, width: 'auto', filter: 'drop-shadow(0 4px 14px rgba(124,58,237,0.22))' }} />
            </div>
            <div style={{ width: 100, height: 72 }} />
          </div>

          <div className="hide-mobile" style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            {['Features', 'How It Works', 'Testimonials'].map(l => (
              <a key={l} href={`#${l.toLowerCase().replace(/ /g,'-')}`} className="nav-a">{l}</a>
            ))}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {currentUser ? (
              <button className="btn-primary" style={{ padding: '10px 22px', fontSize: 14 }} onClick={() => navigate(`/${currentUser.role}`)}>
                Dashboard
              </button>
            ) : (
              <>
                <button className="nav-a" style={{ background: 'none', border: 'none', cursor: 'pointer' }} onClick={() => navigate('/login')}>Login</button>
                <button className="btn-primary" style={{ padding: '10px 22px', fontSize: 14 }} onClick={() => navigate('/register')}>
                  Get Started
                </button>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section style={{ position: 'relative', zIndex: 10, paddingTop: 168, paddingBottom: 100, paddingLeft: 24, paddingRight: 24 }}>
        <div style={{ maxWidth: 860, margin: '0 auto', textAlign: 'center' }}>

          <div className={`hero-line hd1 ${!isVisible ? 'out' : ''}`} style={{ marginBottom: 24 }}>
            <div className="ornament" style={{ maxWidth: 380, margin: '0 auto' }}>
              <span>Compassionate · Intelligent · Connected</span>
            </div>
          </div>

          <div className={`hero-line hd2 ${!isVisible ? 'out' : ''}`}>
            <h1 style={{ fontSize: 'clamp(50px,8.5vw,92px)', lineHeight: 1.04, letterSpacing: '-0.01em', marginBottom: 28 }}>
              <span style={{ display: 'block', fontStyle: 'italic', background: 'linear-gradient(130deg,#7c3aed 0%,#db2777 55%,#2563eb 100%)', WebkitBackgroundClip: 'text', backgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                Empowering
              </span>
              <span style={{ display: 'block', color: '#160d2e' }}>Early Childhood</span>
              <span style={{ display: 'block', fontStyle: 'italic', background: 'linear-gradient(130deg,#db2777 0%,#7c3aed 100%)', WebkitBackgroundClip: 'text', backgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                Autism Education
              </span>
            </h1>
          </div>

          <div className={`hero-line hd3 ${!isVisible ? 'out' : ''}`}>
            <p style={{ fontFamily: 'var(--sans)', fontSize: 17, color: '#6b7280', marginBottom: 44, maxWidth: 520, margin: '0 auto 44px', lineHeight: 1.82, fontWeight: 400 }}>
              A collaborative platform connecting doctors, teachers, and parents to provide
              personalized care and education for children with autism.
            </p>
          </div>

          <div className={`hero-line hd4 ${!isVisible ? 'out' : ''}`}>
            <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 56 }}>
              <button className="btn-primary" onClick={() => navigate('/register')}>
                Begin Your Journey <span style={{ fontSize: 17 }}>→</span>
              </button>
              <button className="btn-ghost" onClick={() => navigate('/login')}>
                Watch Demo
              </button>
            </div>

            {/* Floating role badges */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: 24, marginBottom: 52 }}>
              {[{ e: '👨‍⚕️', l: 'Doctors' }, { e: '👩‍🏫', l: 'Teachers' }, { e: '👨‍👩‍👧', l: 'Parents' }].map((r, i) => (
                <div key={i} className="float-e" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 7 }}>
                  <div style={{ width: 58, height: 58, borderRadius: 20, background: 'rgba(255,255,255,0.88)', border: '1px solid rgba(255,255,255,0.97)', boxShadow: '0 8px 32px rgba(124,58,237,0.11)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26 }}>{r.e}</div>
                  <span style={{ fontFamily: 'var(--sans)', fontSize: 10.5, fontWeight: 600, color: '#c4b5fd', letterSpacing: '0.08em', textTransform: 'uppercase' }}>{r.l}</span>
                </div>
              ))}
            </div>

            {/* Scroll cue */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 7 }}>
              <span style={{ fontFamily: 'var(--sans)', fontSize: 9.5, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#d8b4fe', fontWeight: 600 }}>Scroll</span>
              <div style={{ width: 22, height: 34, borderRadius: 100, border: '1.5px solid rgba(124,58,237,0.18)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '6px 0' }}>
                <div className="scroll-dot" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── STATS ── */}
      <section style={{ position: 'relative', zIndex: 10, padding: '0 24px 80px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div className="stat-bar reveal" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)' }} id="stats-grid">
            {[
              { v: '1,000+', l: 'Children Supported',    ic: '👶', g: 'linear-gradient(135deg,#7c3aed,#db2777)' },
              { v: '500+',   l: 'Healthcare Providers',   ic: '🏥', g: 'linear-gradient(135deg,#db2777,#f43f5e)' },
              { v: '95%',    l: 'Satisfaction Rate',      ic: '⭐', g: 'linear-gradient(135deg,#2563eb,#06b6d4)' },
              { v: '10K+',   l: 'AI Plans Generated',     ic: '🤖', g: 'linear-gradient(135deg,#16a34a,#059669)' },
            ].map((s, i) => (
              <div key={i} style={{ padding: '36px 20px', textAlign: 'center', borderRight: i < 3 ? '1px solid rgba(124,58,237,0.07)' : 'none' }}>
                <div style={{ fontSize: 22, marginBottom: 8 }}>{s.ic}</div>
                <div style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 42, lineHeight: 1.1, marginBottom: 6, background: s.g, WebkitBackgroundClip: 'text', backgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{s.v}</div>
                <div style={{ fontFamily: 'var(--sans)', fontSize: 12, color: '#9ca3af', fontWeight: 500, letterSpacing: '0.04em' }}>{s.l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── ROLES ── */}
      <section id="features" style={{ position: 'relative', zIndex: 10, padding: '80px 24px' }}>
        <div style={{ maxWidth: 1180, margin: '0 auto' }}>
          <div className="reveal" style={{ textAlign: 'center', marginBottom: 60 }}>
            <div className="sec-label">Who It's For</div>
            <div className="ornament" style={{ maxWidth: 280, margin: '0 auto 14px' }}><span>the care circle</span></div>
            <h2 style={{ fontSize: 'clamp(32px,5vw,54px)', color: '#160d2e', marginBottom: 14, lineHeight: 1.1 }}>
              Built for <em className="g-pp">Everyone</em><br />in the Care Team
            </h2>
            <p style={{ fontFamily: 'var(--sans)', fontSize: 14.5, color: '#9ca3af', maxWidth: 400, margin: '0 auto', lineHeight: 1.75 }}>
              One unified platform connecting every stakeholder in the autism care journey.
            </p>
          </div>

          <div className="desktop-grid-3" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 22, alignItems: 'start' }}>
            {[
              { e:'👨‍⚕️', title:'For Doctors',  tg:'linear-gradient(135deg,#7c3aed,#db2777)', bg:'rgba(124,58,237,0.07)', cc:'#7c3aed', bb:'rgba(124,58,237,0.07)', bc:'#7c3aed', bh:'rgba(124,58,237,0.14)', feat:false,
                desc:'Manage patient records, track progress, and generate AI-powered weekly education plans based on clinical assessments.',
                items:['Centralized patient records','AI-generated care plans','Progress tracking tools','Collaborate with educators'] },
              { e:'👩‍🏫', title:'For Teachers', tg:'linear-gradient(135deg,#db2777,#f43f5e)', bg:'rgba(219,39,119,0.07)', cc:'#db2777', bb:'rgba(219,39,119,0.07)', bc:'#db2777', bh:'rgba(219,39,119,0.14)', feat:true,
                desc:'Upload progress notes, get personalized activity recommendations, and implement data-driven teaching strategies.',
                items:['Smart activity suggestions','Progress documentation','Communication tools','Resource library'] },
              { e:'👨‍👩‍👧', title:'For Parents',  tg:'linear-gradient(135deg,#2563eb,#06b6d4)', bg:'rgba(37,99,235,0.07)', cc:'#2563eb', bb:'rgba(37,99,235,0.07)', bc:'#2563eb', bh:'rgba(37,99,235,0.14)', feat:false,
                desc:"Stay connected with your child's care team, view real-time progress, and access personalized learning activities.",
                items:['Real-time updates','Activity timeline','Direct messaging','At-home resources'] },
            ].map((r, i) => (
              <div key={i} className={`lux-card reveal d${i+1} ${r.feat ? 'role-feat' : ''}`} style={{ padding: '36px 30px' }}>
                {r.feat && <div className="feat-pill">✦ Most Popular</div>}
                <div className="icon-wrap" style={{ width: 58, height: 58, borderRadius: 20, background: r.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 27, marginBottom: 20 }}>{r.e}</div>
                <h3 style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 26, marginBottom: 10, background: r.tg, WebkitBackgroundClip: 'text', backgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{r.title}</h3>
                <p style={{ fontFamily: 'var(--sans)', fontSize: 13.5, color: '#6b7280', lineHeight: 1.75, marginBottom: 22 }}>{r.desc}</p>
                <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 26px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {r.items.map((f, j) => (
                    <li key={j} style={{ display: 'flex', alignItems: 'center', gap: 10, fontFamily: 'var(--sans)', fontSize: 13, color: '#4b5563' }}>
                      <span style={{ width: 20, height: 20, borderRadius: 6, background: r.bg, color: r.cc, fontWeight: 800, fontSize: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>✓</span>
                      {f}
                    </li>
                  ))}
                </ul>
                <button style={{ width: '100%', padding: '12px', background: r.bb, color: r.bc, border: 'none', borderRadius: 14, fontFamily: 'var(--sans)', fontWeight: 600, fontSize: 13.5, cursor: 'pointer', transition: 'background 0.2s' }}
                  onMouseEnter={e => e.currentTarget.style.background = r.bh}
                  onMouseLeave={e => e.currentTarget.style.background = r.bb}
                >Learn More →</button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="how-it-works" style={{ position: 'relative', zIndex: 10, padding: '80px 24px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div className="reveal" style={{ textAlign: 'center', marginBottom: 60 }}>
            <div className="sec-label">Process</div>
            <h2 style={{ fontSize: 'clamp(32px,5vw,54px)', color: '#160d2e', marginBottom: 12 }}>
              How It <em className="g-pp">Works</em>
            </h2>
            <p style={{ fontFamily: 'var(--sans)', fontSize: 14.5, color: '#9ca3af' }}>Four elegant steps to transform care</p>
          </div>

          <div className="desktop-grid-4" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 18, position: 'relative' }}>
            {/* Connector */}
            <div className="hide-mobile" style={{ position: 'absolute', top: 32, left: 'calc(12.5% + 24px)', right: 'calc(12.5% + 24px)', height: 1, background: 'linear-gradient(90deg,rgba(124,58,237,0.2),rgba(219,39,119,0.2),rgba(249,115,22,0.2),rgba(234,179,8,0.2))', zIndex: 0 }} />

            {[
              { n:'01', ic:'📝', title:'Create Account',  desc:'Sign up as doctor, teacher, or parent in minutes',        from:'#7c3aed', to:'#db2777' },
              { n:'02', ic:'📤', title:'Add Information', desc:'Upload assessments and progress notes securely',           from:'#db2777', to:'#f43f5e' },
              { n:'03', ic:'🤖', title:'AI Insights',     desc:'Receive personalised recommendations instantly',          from:'#f43f5e', to:'#f97316' },
              { n:'04', ic:'📈', title:'Track Progress',  desc:'Monitor development and celebrate every win',             from:'#f97316', to:'#eab308' },
            ].map((s, i) => (
              <div key={i} className={`reveal d${i+1}`} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', position: 'relative', zIndex: 1 }}>
                <div style={{ width: 64, height: 64, borderRadius: '50%', background: `linear-gradient(135deg,${s.from},${s.to})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, marginBottom: 18, boxShadow: '0 8px 28px rgba(124,58,237,0.22)', border: '3px solid rgba(255,255,255,0.92)', transition: 'transform 0.35s ease', cursor: 'default' }}
                  onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.12)'}
                  onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                >{s.ic}</div>
                <div className="lux-card" style={{ padding: '20px 16px', width: '100%' }}>
                  <div style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 11, color: '#d8b4fe', marginBottom: 6, letterSpacing: '0.1em' }}>{s.n}</div>
                  <h4 style={{ fontFamily: 'var(--serif)', fontSize: 17, color: '#160d2e', marginBottom: 7 }}>{s.title}</h4>
                  <p style={{ fontFamily: 'var(--sans)', fontSize: 12, color: '#9ca3af', lineHeight: 1.65 }}>{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── WHY SPECIAL ── */}
      <section style={{ position: 'relative', zIndex: 10, padding: '80px 24px' }}>
        <div style={{ maxWidth: 1180, margin: '0 auto' }}>
          <div className="reveal" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 52, flexWrap: 'wrap', gap: 20 }}>
            <div>
              <div className="sec-label">Why Choose Us</div>
              <h2 style={{ fontSize: 'clamp(32px,5vw,54px)', color: '#160d2e', lineHeight: 1.1 }}>
                Why AutismCare<br /><em className="g-pp">is Special</em>
              </h2>
            </div>
            <p style={{ fontFamily: 'var(--sans)', fontSize: 14, color: '#9ca3af', maxWidth: 280, lineHeight: 1.8, textAlign: 'right' }}>
              Cutting-edge technology fused with compassionate, expert care — built for every child.
            </p>
          </div>

          <div className="desktop-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
            {[
              { ic:'🤖', title:'AI-Powered Planning',    color:'#7c3aed', bg:'rgba(124,58,237,0.08)', desc:"Our intelligent system analyzes assessments and progress to generate personalized weekly education plans tailored to each child's unique needs and learning style." },
              { ic:'🤝', title:'Seamless Collaboration', color:'#db2777', bg:'rgba(219,39,119,0.08)', desc:'Connect doctors, teachers, and parents in one unified platform, ensuring everyone is aligned on care strategies and progress with real-time updates.' },
              { ic:'📊', title:'Data-Driven Insights',   color:'#2563eb', bg:'rgba(37,99,235,0.08)',   desc:'Track development over time with visual progress reports and data analytics that highlight strengths and areas for growth with actionable insights.' },
              { ic:'🔒', title:'Secure & Private',       color:'#16a34a', bg:'rgba(22,163,74,0.08)',   desc:'Built with blockchain technology to ensure data security, transparency, and compliance with HIPAA and healthcare privacy standards.' },
            ].map((f, i) => (
              <div key={i} className={`lux-card reveal d${i+1}`} style={{ padding: '34px 30px', display: 'flex', gap: 22, alignItems: 'flex-start' }}>
                <div className="icon-wrap" style={{ width: 58, height: 58, borderRadius: 18, background: f.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, flexShrink: 0 }}>{f.ic}</div>
                <div>
                  <h4 style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 22, color: f.color, marginBottom: 10 }}>{f.title}</h4>
                  <p style={{ fontFamily: 'var(--sans)', fontSize: 13.5, color: '#6b7280', lineHeight: 1.78 }}>{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section id="testimonials" style={{ position: 'relative', zIndex: 10, padding: '80px 24px' }}>
        <div style={{ maxWidth: 1180, margin: '0 auto' }}>
          <div className="reveal" style={{ textAlign: 'center', marginBottom: 60 }}>
            <div className="sec-label">Testimonials</div>
            <h2 style={{ fontSize: 'clamp(32px,5vw,54px)', color: '#160d2e', marginBottom: 14 }}>
              Trusted by Care Teams<br /><em className="g-pp">Everywhere</em>
            </h2>
            <p style={{ fontFamily: 'var(--sans)', fontSize: 14.5, color: '#9ca3af' }}>Words from the people who matter most</p>
          </div>

          <div className="desktop-grid-3" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 22 }}>
            {[
              { i:'S', name:'Dr. Sarah Miller',  role:'Pediatric Specialist',         quote:'"AutismCare has revolutionized how I collaborate with teachers and parents. The AI recommendations are spot-on and save me hours each week."', f:'#7c3aed', t:'#db2777' },
              { i:'J', name:'Jennifer Lee',       role:'Special Education Teacher',    quote:'"The activity recommendations are incredibly helpful. I can see exactly what each child needs and track their progress in real-time."',    f:'#db2777', t:'#f43f5e' },
              { i:'M', name:'Maria Johnson',      role:'Parent',                       quote:'"Finally, I can stay connected with Emma\'s care team and see her progress every day. It\'s given us so much peace of mind."',            f:'#2563eb', t:'#06b6d4' },
            ].map((t, i) => (
              <div key={i} className={`lux-card reveal d${i+1}`} style={{ padding: '34px 30px', position: 'relative', overflow: 'hidden' }}>
                <div className="big-quote">"</div>
                <div style={{ display: 'flex', gap: 2, marginBottom: 18 }}>
                  {Array(5).fill(0).map((_,j) => <span key={j} style={{ color: '#fbbf24', fontSize: 13 }}>★</span>)}
                </div>
                <p style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 16, color: '#374151', lineHeight: 1.78, marginBottom: 24 }}>{t.quote}</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 14, background: `linear-gradient(135deg,${t.f},${t.t})`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 20, boxShadow: '0 4px 16px rgba(124,58,237,0.2)', flexShrink: 0 }}>{t.i}</div>
                  <div>
                    <div style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 15, color: '#160d2e' }}>{t.name}</div>
                    <div style={{ fontFamily: 'var(--sans)', fontSize: 11.5, color: '#9ca3af', fontWeight: 500, marginTop: 2 }}>{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section style={{ position: 'relative', zIndex: 10, padding: '40px 24px 100px' }}>
        <div style={{ maxWidth: 860, margin: '0 auto' }}>
          <div className="cta-section reveal" style={{ padding: '80px 64px', textAlign: 'center' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 18px', background: 'linear-gradient(135deg,rgba(124,58,237,0.09),rgba(219,39,119,0.09))', border: '1px solid rgba(124,58,237,0.14)', borderRadius: 100, fontFamily: 'var(--sans)', fontSize: 12, fontWeight: 700, color: '#7c3aed', marginBottom: 28, letterSpacing: '0.04em' }}>
              🚀 Join 1,000+ families already using AutismCare
            </div>
            <h2 style={{ fontSize: 'clamp(34px,6vw,60px)', color: '#160d2e', marginBottom: 18, lineHeight: 1.08 }}>
              Ready to <em className="g-pp">Transform</em><br />Autism Care?
            </h2>
            <p style={{ fontFamily: 'var(--sans)', fontSize: 15, color: '#6b7280', maxWidth: 460, margin: '0 auto 40px', lineHeight: 1.82 }}>
              Join our community of dedicated professionals and families committed to the best possible care for children with autism.
            </p>
            <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
              <button className="btn-primary" onClick={() => navigate('/register')}>
                Get Started Today <span style={{ fontSize: 17 }}>→</span>
              </button>
              <button className="btn-ghost">Schedule a Demo</button>
            </div>
            <p style={{ fontFamily: 'var(--sans)', fontSize: 12, color: '#c4b5fd', marginTop: 22, letterSpacing: '0.04em' }}>
              No credit card required · Free 30-day trial
            </p>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="footer-base" style={{ padding: '60px 40px 40px', position: 'relative', zIndex: 10 }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <div className="desktop-grid-footer" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: 48, marginBottom: 52 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                <img src="/logo.svg" alt="AutismCare" style={{ height: 32 }} />
                <span style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 22, background: 'linear-gradient(135deg,#7c3aed,#db2777)', WebkitBackgroundClip: 'text', backgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>AutismCare</span>
              </div>
              <p style={{ fontFamily: 'var(--sans)', fontSize: 13, color: '#9ca3af', lineHeight: 1.8, maxWidth: 270, marginBottom: 22 }}>
                Empowering early childhood autism education through AI-powered collaboration.
              </p>
              <div style={{ display: 'flex', gap: 8 }}>
                {['𝕏','in','f'].map((s,i) => (
                  <div key={i} className="soc-icon">{s}</div>
                ))}
              </div>
            </div>

            {[
              { title:'Product',   links:['Features','Pricing','Security','Roadmap'] },
              { title:'Resources', links:['Documentation','Help Center','Blog','Community'] },
              { title:'Company',   links:['About Us','Careers','Contact','Privacy'] },
            ].map((col, i) => (
              <div key={i}>
                <h4 style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 18, color: '#160d2e', marginBottom: 18 }}>{col.title}</h4>
                <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: 11 }}>
                  {col.links.map((l, j) => (
                    <li key={j}>
                      <a href="#" style={{ fontFamily: 'var(--sans)', fontSize: 13, color: '#9ca3af', textDecoration: 'none', transition: 'color 0.2s', fontWeight: 400 }}
                        onMouseEnter={e => e.currentTarget.style.color = '#7c3aed'}
                        onMouseLeave={e => e.currentTarget.style.color = '#9ca3af'}
                      >{l}</a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div style={{ borderTop: '1px solid rgba(124,58,237,0.08)', paddingTop: 26, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
            <p style={{ fontFamily: 'var(--sans)', fontSize: 12, color: '#c4b5fd' }}>© 2026 AutismCare. All rights reserved.</p>
            <div style={{ display: 'flex', gap: 22 }}>
              {['Terms','Privacy','Cookies'].map(l => (
                <a key={l} href="#" style={{ fontFamily: 'var(--sans)', fontSize: 12, color: '#c4b5fd', textDecoration: 'none', transition: 'color 0.2s' }}
                  onMouseEnter={e => e.currentTarget.style.color = '#7c3aed'}
                  onMouseLeave={e => e.currentTarget.style.color = '#c4b5fd'}
                >{l}</a>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default Home;