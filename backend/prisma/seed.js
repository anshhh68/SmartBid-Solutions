const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Create Admin User
  const adminPass = await bcrypt.hash('Admin@123', 12);
  await prisma.user.upsert({
    where: { email: 'admin@smartbidsolutions.in' },
    update: {},
    create: {
      name: 'Admin User',
      email: 'admin@smartbidsolutions.in',
      password: adminPass,
      phone: '+917016235257',
      role: 'ADMIN',
      isActive: true,
      emailVerified: true,
    },
  });

  // Demo User
  const userPass = await bcrypt.hash('Demo@1234', 12);
  await prisma.user.upsert({
    where: { email: 'demo@example.com' },
    update: {},
    create: {
      name: 'Rajesh Kumar',
      email: 'demo@example.com',
      password: userPass,
      phone: '+919876543210',
      role: 'USER',
      isActive: true,
      emailVerified: true,
    },
  });

  // Tender Categories
  const categories = [
    { name: 'Construction & Infrastructure', slug: 'construction', icon: 'Building2' },
    { name: 'IT & Technology', slug: 'it-technology', icon: 'Monitor' },
    { name: 'Medical & Healthcare', slug: 'medical', icon: 'Heart' },
    { name: 'Defence & Security', slug: 'defence', icon: 'Shield' },
    { name: 'Education', slug: 'education', icon: 'GraduationCap' },
    { name: 'Transportation', slug: 'transportation', icon: 'Truck' },
    { name: 'Energy & Power', slug: 'energy', icon: 'Zap' },
    { name: 'Agriculture', slug: 'agriculture', icon: 'Leaf' },
    { name: 'Consultancy & Services', slug: 'consultancy', icon: 'Briefcase' },
    { name: 'Printing & Stationery', slug: 'printing', icon: 'Printer' },
    { name: 'Civil Works', slug: 'civil', icon: 'HardHat' },
    { name: 'Supply of Goods', slug: 'supply', icon: 'Package' },
  ];

  for (const cat of categories) {
    await prisma.tenderCategory.upsert({
      where: { slug: cat.slug },
      update: {},
      create: cat,
    });
  }

  const catMap = {};
  const allCats = await prisma.tenderCategory.findMany();
  for (const c of allCats) catMap[c.slug] = c.id;

  // Tenders are dynamically synced from live GeM public portals; no mock data seeded
  console.log('📦 Tenders will be synced directly from live legitimate sources (GeM).');

  // Services
  const services = [
    {
      title: 'GeM Registration & Bidding',
      slug: 'gem-registration',
      shortDesc: 'Complete assistance with Government e-Marketplace registration and product/service listing.',
      description: 'We provide end-to-end support for GeM registration including account setup, category selection, product cataloging, and bid submission assistance. Our experts help you navigate the Government e-Marketplace platform effectively.',
      icon: 'Award',
      features: ['GeM Account Registration', 'Product/Service Catalog Setup', 'Bid Identification & Alerts', 'Bid Document Preparation', 'L1 Optimization Strategy', 'Post-Award Support'],
      order: 1,
    },
    {
      title: 'E-Tender Bidding Assistance',
      slug: 'e-tender-bidding',
      shortDesc: 'Professional bid preparation and submission support for government e-tenders.',
      description: 'Our team of experts provides comprehensive e-tender assistance including tender identification, eligibility analysis, technical bid preparation, financial bid strategy, and complete submission support across major government portals.',
      icon: 'FileText',
      features: ['Tender Identification & Monitoring', 'Eligibility Analysis', 'Technical Bid Preparation', 'Financial Bid Optimization', 'Pre-bid Meeting Support', 'Submission Assistance'],
      order: 2,
    },
    {
      title: 'Tender Documentation',
      slug: 'tender-documentation',
      shortDesc: 'Accurate, compliant tender documentation prepared by experienced professionals.',
      description: 'Proper documentation is critical for tender success. We prepare all required documents including technical proposals, compliance statements, financial bids, and supporting materials in the exact format required by the tendering authority.',
      icon: 'ClipboardList',
      features: ['Technical Proposal Writing', 'Compliance Checklists', 'Financial Statement Preparation', 'Experience Certificate Compilation', 'Power of Attorney Drafting', 'Document Notarization Support'],
      order: 3,
    },
    {
      title: 'Digital Signature Certificate',
      slug: 'digital-signature',
      shortDesc: 'Fast, reliable DSC procurement and renewal for government portal access.',
      description: 'Digital Signature Certificates are mandatory for e-tender participation. We facilitate quick procurement of Class 3 DSCs for individuals and organizations, including renewal and technical setup on government portals.',
      icon: 'Key',
      features: ['Class 3 DSC Procurement', 'Individual & Organization DSC', 'Fast 1-2 Day Processing', 'Portal Registration Assistance', 'Annual Renewal Support', 'Technical Setup Help'],
      order: 4,
    },
    {
      title: 'ISO Certification Assistance',
      slug: 'iso-certification',
      shortDesc: 'Guidance and support for ISO 9001 and other quality certifications required for tenders.',
      description: 'Many government tenders require ISO certification as an eligibility criterion. We assist businesses in obtaining ISO 9001:2015, ISO 14001, and other certifications through accredited certification bodies.',
      icon: 'CheckCircle',
      features: ['ISO 9001:2015 Quality Management', 'ISO 14001 Environmental', 'Documentation Preparation', 'Internal Audit Support', 'Certification Body Liaison', 'Renewal Management'],
      order: 5,
    },
    {
      title: 'Brand & OEM Registration',
      slug: 'brand-oem-registration',
      shortDesc: 'Assistance with brand approval and OEM registration for procurement portals.',
      description: 'Get your brand or product registered as an approved OEM/brand on GeM and other government procurement portals, enabling direct participation in product-based tenders.',
      icon: 'Star',
      features: ['GeM Brand Registration', 'OEM Product Registration', 'Catalogue Management', 'Brand Protection', 'Category Expansion', 'Compliance Management'],
      order: 6,
    },
  ];

  for (const svc of services) {
    await prisma.service.upsert({
      where: { slug: svc.slug },
      update: {},
      create: svc,
    });
  }

  // Plans
  const plans = [
    {
      name: 'Basic',
      slug: 'basic',
      price: 999,
      period: 'monthly',
      features: [
        'Up to 10 saved tenders',
        'Basic tender search & filters',
        'Email alerts (daily digest)',
        'Tender deadline tracking',
        '1 user account',
        'Standard support',
      ],
      isPopular: false,
      order: 1,
    },
    {
      name: 'Professional',
      slug: 'professional',
      price: 2499,
      period: 'monthly',
      features: [
        'Unlimited saved tenders',
        'Advanced search & filters',
        'Real-time email & SMS alerts',
        'Tender deadline calendar',
        '3 user accounts',
        'Document download access',
        'Priority support',
        'Monthly tender analysis report',
      ],
      isPopular: true,
      order: 2,
    },
    {
      name: 'Enterprise',
      slug: 'enterprise',
      price: 0,
      period: 'custom',
      features: [
        'Everything in Professional',
        'Unlimited user accounts',
        'Custom tender categories & alerts',
        'Dedicated account manager',
        'Bid preparation assistance',
        'API access',
        'White-label options',
        'On-site training',
        'SLA guarantee',
      ],
      isPopular: false,
      order: 3,
    },
  ];

  for (const plan of plans) {
    await prisma.plan.upsert({
      where: { slug: plan.slug },
      update: {},
      create: plan,
    });
  }

  // Testimonials
  const testimonials = [
    {
      name: 'Amit Patel',
      company: 'Patel Construction Pvt. Ltd.',
      designation: 'Director',
      rating: 5,
      content: 'SmartBid Solutions helped us win our first government tender worth ₹1.2 Cr. Their documentation support and bid strategy were exceptional. Highly recommended for any business entering the government procurement space.',
      isPublished: true,
      order: 1,
    },
    {
      name: 'Priya Shah',
      company: 'TechVision IT Solutions',
      designation: 'CEO',
      rating: 5,
      content: 'Getting our GeM registration done was seamless with SmartBid. Within 2 weeks we were listed and started receiving orders. Their team is very knowledgeable about the process.',
      isPublished: true,
      order: 2,
    },
    {
      name: 'Rajesh Mehta',
      company: 'Mehta Medical Supplies',
      designation: 'Managing Partner',
      rating: 4,
      content: 'We had tried to get ISO certified for 2 years without success. SmartBid helped us get ISO 9001:2015 certification in just 4 months. This opened doors to several government tenders we could not bid on before.',
      isPublished: true,
      order: 3,
    },
    {
      name: 'Sunita Gupta',
      company: 'SunPower Energy',
      designation: 'Founder',
      rating: 5,
      content: 'The tender monitoring service saved us from missing a critical ₹2.5 Cr solar tender. Their timely alert and pre-bid support helped us submit a strong proposal.',
      isPublished: true,
      order: 4,
    },
  ];

  for (const t of testimonials) {
    const existing = await prisma.testimonial.findFirst({ where: { name: t.name } });
    if (!existing) {
      await prisma.testimonial.create({ data: t });
    }
  }

  // FAQs
  const faqs = [
    {
      question: 'What is GeM and how does GeM registration work?',
      answer: 'GeM (Government e-Marketplace) is the official online procurement portal of the Government of India. Businesses register as sellers to supply goods or services to government buyers. Registration requires GST, business registration documents, and bank details. SmartBid handles the entire process for you.',
      category: 'gem',
      order: 1,
    },
    {
      question: 'What documents are needed for e-tender participation?',
      answer: 'Typical requirements include: GST registration certificate, PAN card, company incorporation certificate, ISO certification (if required), audited financial statements, past experience certificates, digital signature certificate (Class 3), and EMD (Earnest Money Deposit). Requirements vary by tender.',
      category: 'tender',
      order: 2,
    },
    {
      question: 'What is a Digital Signature Certificate (DSC) and why is it needed?',
      answer: 'A DSC is an electronic equivalent of a physical signature. For government e-tenders, a Class 3 DSC is mandatory for online bid submission on portals like CPPP, GeM, and state government portals. It ensures authenticity and legal validity of submitted bids.',
      category: 'dsc',
      order: 3,
    },
    {
      question: 'How long does GeM registration take?',
      answer: 'With complete documents, GeM registration typically takes 3-5 business days. SmartBid expedites this by ensuring all documents are correct and complete before submission, avoiding common delays caused by incomplete applications.',
      category: 'gem',
      order: 4,
    },
    {
      question: 'What is your success rate with tender bids?',
      answer: 'Our success rate varies by tender type and competition. For tenders where we provide complete bid assistance, our clients have a significantly higher success rate than the industry average. We focus on eligibility analysis to ensure we only pursue tenders where our clients have a strong chance.',
      category: 'general',
      order: 5,
    },
    {
      question: 'Do you help with tenders from all states in India?',
      answer: 'Yes, we assist with central government tenders (CPPP, GeM) and state government tenders across India. Our primary focus is Gujarat, but we have successfully assisted clients with tenders from Maharashtra, Rajasthan, Madhya Pradesh, and other states.',
      category: 'general',
      order: 6,
    },
    {
      question: 'What is the difference between EMD and Performance Security?',
      answer: 'EMD (Earnest Money Deposit) is submitted with the bid to show seriousness — typically 2-3% of tender value. Performance Security (10% of contract value) is submitted by the winning bidder before contract signing. SmartBid advises on EMD exemptions available for MSMEs and GeM-registered sellers.',
      category: 'tender',
      order: 7,
    },
    {
      question: 'Can MSMEs get any advantages in government tenders?',
      answer: 'Yes! MSMEs enjoy significant advantages: EMD exemption in many tenders, purchase preference policy (minimum 25% procurement from MSMEs), price preference up to 15% over L1 bidder, and exclusive procurement of 358+ items from MSMEs. SmartBid helps MSMEs leverage these benefits.',
      category: 'general',
      order: 8,
    },
  ];

  for (const faq of faqs) {
    const existing = await prisma.faq.findFirst({ where: { question: faq.question } });
    if (!existing) {
      await prisma.faq.create({ data: faq });
    }
  }

  // Site Settings
  const settings = [
    { key: 'site_name', value: 'SmartBid Solutions' },
    { key: 'site_tagline', value: 'Bid Today. Grow Tomorrow.' },
    { key: 'contact_email', value: 'kinjalmodismartbidsolutions@gmail.com' },
    { key: 'contact_phone', value: '+91 70162 35257' },
    { key: 'contact_phone2', value: '+91 85117 22588' },
    { key: 'contact_address', value: 'Ahmedabad, Gujarat, India' },
    { key: 'whatsapp_number', value: '917016235257' },
    { key: 'facebook_url', value: '' },
    { key: 'linkedin_url', value: '' },
    { key: 'twitter_url', value: '' },
    { key: 'hero_title', value: 'Win Government Tenders with Expert Guidance' },
    { key: 'hero_subtitle', value: 'SmartBid Solutions helps businesses navigate government procurement — from GeM registration to bid submission. Your success is our mission.' },
    { key: 'stats_tenders', value: '5000+' },
    { key: 'stats_clients', value: '500+' },
    { key: 'stats_success_rate', value: '78%' },
    { key: 'stats_states', value: '15+' },
    { key: 'meta_title', value: 'SmartBid Solutions — Government Tender & GeM Registration Experts' },
    { key: 'meta_description', value: 'SmartBid Solutions provides expert assistance for GeM registration, e-tender bidding, documentation, DSC, and ISO certification. Based in Ahmedabad, Gujarat.' },
  ];

  for (const s of settings) {
    await prisma.siteSetting.upsert({
      where: { key: s.key },
      update: {},
      create: s,
    });
  }

  // Static Pages
  const pages = [
    {
      slug: 'privacy-policy',
      title: 'Privacy Policy',
      metaTitle: 'Privacy Policy | SmartBid Solutions',
      metaDesc: 'Read SmartBid Solutions privacy policy regarding data collection, usage, and protection.',
      content: `# Privacy Policy

Last updated: October 2025

SmartBid Solutions ("we", "our", or "us") is committed to protecting your personal information and your right to privacy.

## Information We Collect

We collect information you provide directly to us, such as when you create an account, submit an enquiry, or subscribe to our services. This includes:
- Name, email address, and phone number
- Company/organization information
- Service enquiry details
- Payment information (processed securely through payment gateways)

## How We Use Your Information

We use the information we collect to:
- Provide, maintain, and improve our services
- Send you service alerts, updates, and notifications
- Respond to your enquiries and provide customer support
- Comply with legal obligations

## Data Security

We implement appropriate technical and organizational security measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction.

## Contact Us

If you have questions about this Privacy Policy, please contact us at kinjalmodismartbidsolutions@gmail.com`,
      isPublished: true,
    },
    {
      slug: 'terms-and-conditions',
      title: 'Terms and Conditions',
      metaTitle: 'Terms & Conditions | SmartBid Solutions',
      metaDesc: 'Terms and conditions for using SmartBid Solutions services.',
      content: `# Terms and Conditions

Last updated: October 2025

By accessing and using SmartBid Solutions services, you agree to be bound by these Terms and Conditions.

## Use of Services

Our services are provided for legitimate business purposes related to government tender assistance. You agree not to misuse our platform or use it for any unlawful purpose.

## Account Responsibility

You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account.

## Disclaimer

While we strive to provide accurate tender information and bid assistance, success in government tenders depends on multiple factors beyond our control. We do not guarantee tender awards.

## Limitation of Liability

SmartBid Solutions shall not be liable for any indirect, incidental, special, or consequential damages arising from your use of our services.

## Contact

For any questions regarding these terms, contact us at kinjalmodismartbidsolutions@gmail.com`,
      isPublished: true,
    },
  ];

  for (const page of pages) {
    await prisma.page.upsert({
      where: { slug: page.slug },
      update: {},
      create: page,
    });
  }

  console.log('✅ Database seeded successfully!');
  console.log('📧 Admin: admin@smartbidsolutions.in / Admin@123');
  console.log('📧 Demo User: demo@example.com / Demo@1234');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
