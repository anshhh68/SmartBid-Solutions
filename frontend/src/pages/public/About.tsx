import { CheckCircle, Users, Target, Award, MapPin, Phone, Mail } from 'lucide-react';
import { Link } from 'react-router-dom';
import { EMAILS } from '../../lib/constants';

export default function About() {
  return (
    <div className="bg-paper min-h-screen">
      <div className="border-b border-rule bg-ink py-16 text-paper">
        <div className="max-w-6xl mx-auto px-4">
          <h1 className="font-display text-4xl">The Ahmedabad desk</h1>
          <p className="mt-3 max-w-2xl text-paper/70">
            Government bidding support for MSMEs who cannot keep a clerk on GeM all day.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-16">
        {/* Story */}
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 mb-4">Our Story</h2>
            <div className="space-y-4 text-slate-600 text-sm leading-relaxed">
              <p>
                SmartBid Solutions was founded with a single mission: to make government procurement accessible to every eligible business in India, not just those with dedicated bid teams.
              </p>
              <p>
                We recognized that thousands of capable businesses — especially MSMEs — were missing out on government contracts because they lacked the expertise to navigate complex tendering processes, GeM registration, and documentation requirements.
              </p>
              <p>
                Today, we have helped over 500 businesses across Gujarat and other states successfully participate in government procurement, securing contracts worth crores of rupees and helping these companies grow sustainably.
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {[
              { value: '500+', label: 'Clients Served', icon: <Users className="w-6 h-6" /> },
              { value: '78%', label: 'Success Rate', icon: <Target className="w-6 h-6" /> },
              { value: '10+', label: 'Years Experience', icon: <Award className="w-6 h-6" /> },
              { value: '15+', label: 'States Covered', icon: <MapPin className="w-6 h-6" /> },
            ].map((stat, i) => (
              <div key={i} className="bg-white rounded-2xl border border-rule p-6 text-center shadow-sm">
                <div className="w-12 h-12 bg-[#0A2342]/10 text-stamp rounded-xl flex items-center justify-center mx-auto mb-3">
                  {stat.icon}
                </div>
                <p className="text-2xl font-extrabold text-ink">{stat.value}</p>
                <p className="text-xs text-ink-soft mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Mission, Vision, Values */}
        <div className="grid md:grid-cols-3 gap-6">
          {[
            {
              title: 'Our Mission',
              color: 'bg-paper-2 border-rule',
              titleColor: 'text-stamp',
              text: 'To democratize access to government procurement by providing expert guidance and tools that enable every eligible business to compete for and win government contracts.',
            },
            {
              title: 'Our Vision',
              color: 'bg-ink border-ink',
              titleColor: 'text-ochre',
              textColor: 'text-paper/80',
              text: 'To be India\'s most trusted government tender partner, building a transparent, accessible procurement ecosystem where merit determines success.',
            },
            {
              title: 'Our Values',
              color: 'bg-ochre/10 border-ochre/30',
              titleColor: 'text-ochre',
              textColor: 'text-ink',
              text: 'Integrity in every engagement. Transparency in our processes. Excellence in our work. Partnership with our clients\' long-term success.',
            },
          ].map(({ title, color, titleColor, textColor, text }) => (
            <div key={title} className={`rounded-2xl border p-6 shadow-sm ${color}`}>
              <h2 className={`font-bold mb-3 text-lg ${titleColor}`}>{title}</h2>
              <p className={`text-sm leading-relaxed ${textColor || 'text-ink-soft'}`}>{text}</p>
            </div>
          ))}
        </div>

        {/* Why Choose Us */}
        <div className="bg-white rounded-2xl border border-rule p-8 shadow-sm">
          <h2 className="text-2xl font-bold text-ink mb-6">Why Choose SmartBid Solutions?</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {[
              'Expert team with certified procurement professionals',
              'Deep knowledge of GeM, CPPP, and all state portals',
              'End-to-end support — from eligibility check to bid submission',
              'Transparent engagement terms with customized scopes',
              'Dedicated account manager for each client',
              'Track record of 500+ successful engagements',
              'MSME-specialized — we know how to leverage MSME advantages',
              'Quick turnaround — most documents prepared within 24-48 hours',
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-ochre flex-shrink-0 mt-0.5" />
                <span className="text-sm text-ink-soft">{item}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Contact Info */}
        <div className="bg-ink rounded-3xl p-10 text-paper text-center border border-rule">
          <h2 className="font-display text-3xl mb-3">Ready to Start Winning Tenders?</h2>
          <p className="text-paper/75 mb-8 max-w-xl mx-auto text-sm">
            Contact our desk today for a free consultation and discover how we can help your business.
          </p>
          <div className="flex flex-wrap justify-center gap-6 mb-8 text-sm">
            <a href="tel:+917016235257" className="flex items-center gap-2 text-paper/80 hover:text-ochre transition-colors">
              <Phone className="w-4 h-4 text-ochre" /> +91 70162 35257
            </a>
            <a href={`mailto:${EMAILS[0]}`} className="flex items-center gap-2 text-paper/80 hover:text-ochre transition-colors">
              <Mail className="w-4 h-4 text-ochre" /> {EMAILS[0]}
            </a>
            <div className="flex items-center gap-2 text-paper/80">
              <MapPin className="w-4 h-4 text-ochre" /> Ahmedabad, Gujarat
            </div>
          </div>
          <Link
            to="/contact"
            className="inline-block px-8 py-3 bg-ochre hover:bg-[#b08024] text-white font-bold rounded-xl transition-all shadow-sm"
          >
            Get in Touch
          </Link>
        </div>
      </div>
    </div>
  );
}
