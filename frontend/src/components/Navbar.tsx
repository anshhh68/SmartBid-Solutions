import { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { Menu, X, Phone } from 'lucide-react';
import { EMAILS, PHONES, WHATSAPP_URL } from '../lib/constants';

const navLinks = [
  { to: '/', label: 'Home' },
  { to: '/tenders', label: 'Tenders' },
  { to: '/services', label: 'Services' },
  { to: '/about', label: 'About' },
  { to: '/contact', label: 'Contact' },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-rule bg-paper">
      <div className="hidden border-b border-rule bg-ink text-[11px] text-paper/80 md:block">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-1.5">
          <p>Ahmedabad desk · 24/7 Dedicated Support & Bid Advisory</p>
          <div className="flex items-center gap-5">
            <a href={`tel:${PHONES[0].replace(/\s/g, '')}`} className="hover:text-paper">{PHONES[0]}</a>
            <a href={`mailto:${EMAILS[0]}`} className="hover:text-paper">{EMAILS[0]}</a>
          </div>
        </div>
      </div>

      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link to="/" className="flex items-center gap-3 group">
          <img
            src="/logo.png"
            alt="SmartBid Solutions"
            className="h-10 sm:h-12 w-auto object-contain transition-transform group-hover:scale-[1.02]"
          />
        </Link>

        <nav className="hidden items-center gap-1 lg:flex">
          {navLinks.map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `px-3 py-1.5 text-sm ${isActive ? 'text-stamp' : 'text-ink-soft hover:text-ink'}`
              }
            >
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          <a
            href={`tel:${PHONES[0].replace(/\s/g, '')}`}
            className="inline-flex items-center gap-2 border border-rule px-3 py-2 text-xs font-semibold uppercase tracking-wider"
          >
            <Phone className="h-3.5 w-3.5" /> Call
          </a>
          <NavLink
            to="/contact"
            className="bg-stamp px-3 py-2 text-xs font-semibold uppercase tracking-wider text-paper hover:bg-stamp-deep"
          >
            Contact Desk
          </NavLink>
        </div>

        <button
          type="button"
          className="p-2 lg:hidden"
          onClick={() => setOpen(!open)}
          aria-label="Menu"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {open && (
        <div className="border-t border-rule px-4 py-3 lg:hidden">
          {navLinks.map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                `block py-2 text-sm ${isActive ? 'text-stamp' : 'text-ink'}`
              }
            >
              {label}
            </NavLink>
          ))}
          <NavLink
            to="/contact"
            onClick={() => setOpen(false)}
            className="mt-2 block bg-stamp px-3 py-2 text-center text-sm font-semibold text-paper"
          >
            Contact Desk
          </NavLink>
        </div>
      )}
    </header>
  );
}
