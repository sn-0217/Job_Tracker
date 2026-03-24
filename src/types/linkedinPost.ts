export interface LinkedInPost {
  id: string;
  postUrl: string;
  posterName?: string;
  company?: string;
  email?: string;
  /** Why is this post relevant? e.g. "Hiring manager at Stripe posted about openings" */
  context?: string;
  notes?: string;
  followUpDate?: string;  // ISO date
  done: boolean;
  createdAt: string;      // ISO
}
