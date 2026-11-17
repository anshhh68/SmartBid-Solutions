import { Link } from 'react-router-dom';
import { ADDRESS, PHONES, WHATSAPP_URL } from '../lib/constants';
import { useContactEmail } from '../hooks/useContactEmail';

const Footer = () => {
  const email = useContactEmail();
  const year = new Date().getFullYear();

  const services = [
    { label: 'GeM registration', to: '/services/gem-registration' },
    { label: 'E-tender bidding', to: '/services/e-tender-bidding' },
    { label: 'Documentation', to: '/services/tender-documentation' },
    { label: 'Digital signature', to: '/services/digital-signature' },
    { label: 'ISO certification', to: '/services/iso-certification' },
    { label: 'Brand & OEM', to: '/services/brand-oem-registration' },
  ];

  return (
    <footer className="border-t border-ink bg-ink text-paper/75">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 md:grid-cols-4">
        <div className="md:col-span-1">
          <Link to="/" className="inline-block bg-white p-2.5 rounded-xl shadow-sm mb-4">
            <img
              src="/logo.png"
              alt="SmartBid Solutions"
              className="h-10 w-auto object-contain"
            />
          </Link>
          <p className="text-sm leading-relaxed text-paper/85">
            GeM, e-tender, DSC, and documentation desk serving All India. We prepare and file bids. You run the business.
          </p>
          <Link
            to="/contact"
            className="mt-5 inline-block bg-stamp px-4 py-2 text-xs font-semibold uppercase tracking-wider text-paper hover:bg-stamp-deep transition-colors"
          >
            Message the Desk
          </Link>
        </div>
        <div>
          <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-ochre">Work</p>
          <ul className="space-y-2 text-sm">
            {services.map((s) => (
              <li key={s.to}>
                <Link to={s.to} className="hover:text-paper">{s.label}</Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-ochre">Office</p>
          <ul className="space-y-2 text-sm">
            <li><Link to="/tenders" className="hover:text-paper">Live tenders</Link></li>
            <li><Link to="/about" className="hover:text-paper">About</Link></li>
            <li><Link to="/faq" className="hover:text-paper">FAQ</Link></li>
            <li><Link to="/contact" className="hover:text-paper">Contact</Link></li>
            <li><Link to="/contact#feedback" className="hover:text-paper">Feedback</Link></li>
            <li><Link to="/privacy-policy" className="hover:text-paper">Privacy</Link></li>
            <li><Link to="/terms-and-conditions" className="hover:text-paper">Terms</Link></li>
          </ul>
        </div>
        <div>
          <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-ochre">Find us</p>
          <div className="mt-3 text-sm space-y-0.5">
            <p>
              <a href="tel:+917016235257" className="hover:text-paper">
                +91 70162 35257
              </a>
            </p>
            <p>
              <a href="tel:+918511722588" className="text-paper/60 hover:text-paper text-xs">
                +91 85117 22588
              </a>
            </p>
          </div>
          <p className="mt-1 break-all text-sm">{email}</p>
        </div>
      </div>
      <div className="border-t border-white/10 px-4 py-4 text-center text-[11px] tracking-wide text-paper/50">
        © {year} SmartBid Solutions · Serving All India. Government bidding support, not a government portal.
      </div>
    </footer>
  );
};

export default Footer;
