// ─── Shared TypeScript types for SmartBid Solutions ───────────────────────────

// ──── Auth / User ──────────────────────────────────────────────────────────────

export type UserRole = 'USER' | 'ADMIN';

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  role: UserRole;
  isActive: boolean;
  emailVerified?: boolean;
  createdAt: string;
  updatedAt?: string;
}

// ──── Tender ───────────────────────────────────────────────────────────────────

export type TenderStatus = 'ACTIVE' | 'CLOSED' | 'UPCOMING' | 'AWARDED' | 'CANCELLED';

export interface TenderCategory {
  id: string;
  name: string;
  slug: string;
  icon?: string | null;
  _count?: { tenders: number };
}

export interface TenderDocument {
  name: string;
  url: string;
}

export interface Tender {
  id: string;
  title: string;
  refNo?: string | null;
  department: string;
  categoryId?: string | null;
  category?: Pick<TenderCategory, 'id' | 'name' | 'slug' | 'icon'> | null;
  location: string;
  state?: string | null;
  value?: number | null;
  valueCurrency: string;
  emd?: number | null;
  fee?: number | null;
  status: TenderStatus;
  publishedAt?: string | null;
  openingDate?: string | null;
  closingDate: string;
  preBidDate?: string | null;
  tenderType?: string | null;
  eligibility?: string | null;
  description?: string | null;
  documents?: TenderDocument[] | null;
  sourceUrl?: string | null;
  source?: string | null;
  isPublished: boolean;
  viewCount: number;
  createdAt: string;
  updatedAt: string;
  isSaved?: boolean;
  _count?: { savedBy: number };
}

export interface TenderListResponse {
  tenders: Tender[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// ──── Enquiry ──────────────────────────────────────────────────────────────────

export type EnquiryStatus = 'NEW' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';

export interface Enquiry {
  id: string;
  userId?: string | null;
  user?: Pick<User, 'name' | 'email'> | null;
  name: string;
  email: string;
  phone?: string | null;
  service?: string | null;
  subject?: string | null;
  message: string;
  status: EnquiryStatus;
  assignedTo?: string | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
}

// ──── Service ─────────────────────────────────────────────────────────────────

export interface Service {
  id: string;
  title: string;
  slug: string;
  shortDesc: string;
  description: string;
  icon: string;
  features: string[];
  isActive: boolean;
  order: number;
}

// ──── Plan ────────────────────────────────────────────────────────────────────

export interface Plan {
  id: string;
  name: string;
  slug: string;
  price: number;
  period: string;
  features: string[];
  isPopular: boolean;
  isActive: boolean;
  order: number;
}

// ──── Testimonial ─────────────────────────────────────────────────────────────

export interface Testimonial {
  id: string;
  name: string;
  company?: string | null;
  designation?: string | null;
  rating: number;
  content: string;
  avatar?: string | null;
  isPublished: boolean;
  order: number;
}

// ──── FAQ ─────────────────────────────────────────────────────────────────────

export interface Faq {
  id: string;
  question: string;
  answer: string;
  category: string;
  order: number;
  isActive: boolean;
}

// ──── Site Settings ───────────────────────────────────────────────────────────

export type SiteSettings = Record<string, string>;

// ──── Audit Log ───────────────────────────────────────────────────────────────

export interface AuditLog {
  id: string;
  userId?: string | null;
  user?: Pick<User, 'name' | 'email'> | null;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | string;
  entity: string;
  entityId?: string | null;
  metadata?: Record<string, unknown> | null;
  ipAddress?: string | null;
  createdAt: string;
}

// ──── Saved Tender / Alert ────────────────────────────────────────────────────

export interface SavedTender extends Tender {
  savedAt: string;
}

export interface TenderAlert {
  id: string;
  userId: string;
  keywords: string[];
  categories: string[];
  locations: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// ──── Subscription ────────────────────────────────────────────────────────────

export interface Subscription {
  id: string;
  userId: string;
  planId: string;
  plan?: Plan;
  startDate: string;
  endDate: string;
  isActive: boolean;
  createdAt: string;
}

// ──── API response helpers ────────────────────────────────────────────────────

export interface ApiError {
  error: string;
  field?: string;
  details?: unknown;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  totalPages: number;
}

// ──── Dashboard ───────────────────────────────────────────────────────────────

export interface AdminDashboardStats {
  totalUsers: number;
  totalTenders: number;
  activeTenders: number;
  totalEnquiries: number;
  newEnquiries: number;
  closingSoon: number;
}

export interface UserDashboardStats {
  savedTenders: number;
  activeAlerts: number;
  enquiries: number;
}
