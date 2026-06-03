import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const navLinks = [
    { label: 'Home', path: '/' },
    { label: 'Anatomy', path: '/anatomy' },
    { label: 'Design', path: '/design' },
    { label: 'Why', path: '/why' },
  ];

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled ? 'glass border-b border-primary/10' : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-10 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-3 group">
          <div className="relative w-7 h-7">
            <div className="absolute inset-0 rounded bg-primary/20 rotate-45 group-hover:bg-primary/30 transition-colors" />
            <div className="absolute inset-1 rounded-sm bg-primary rotate-45" />
          </div>
          <span className="font-display font-700 text-sm tracking-widest text-foreground/90 uppercase">
            ArQitec
          </span>
          <span className="hidden sm:block text-muted-foreground/50 text-xs font-mono tracking-widest">
            Quantum Fabrication
          </span>
        </Link>

        {/* Nav Links */}
        <div className="flex items-center gap-1">
          {navLinks.map(({ label, path }) => {
            const active = location.pathname === path;
            return (
              <Link
                key={path}
                to={path}
                className={`relative px-4 py-2 text-sm font-body font-medium tracking-wide transition-all duration-200 rounded-lg ${
                  active
                    ? 'text-primary'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {active && (
                  <span className="absolute inset-0 rounded-lg bg-primary/8 border border-primary/20" />
                )}
                <span className="relative">{label}</span>
              </Link>
            );
          })}
          <Link
            to="/design"
            className="ml-4 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold tracking-wide hover:bg-primary/90 transition-all duration-200 glow-cyan"
          >
            Launch →
          </Link>
        </div>
      </div>
    </nav>
  );
}