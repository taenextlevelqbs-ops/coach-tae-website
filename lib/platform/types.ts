export type Athlete = {
  id: string;
  name: string;
  graduation_year: number | null;
  family_id: string;
};
export type Slot = {
  id: string;
  kind: "private" | "group";
  starts_at: string;
  ends_at: string;
  capacity: number;
  remaining: number;
};
export type Booking = {
  id: string;
  athlete_id: string;
  status: string;
  slot_id: string;
  ct_slots: Slot;
  created_at: string;
  hold_until: string | null;
};
export type Lesson = {
  id: string;
  title: string;
  category: string;
  body: string;
  published: boolean;
  questions: Question[];
  slug?: string;
  level?: "beginner" | "intermediate" | "advanced";
  topic?: string;
  diagram?: string | null;
  sort_order?: number;
};
export type Question = {
  prompt: string;
  options: string[];
  answer?: number;
  explanation?: string;
};
export type Membership = {
  subscription_id: string;
  status: string;
  access_until: string;
  cancel_at_period_end: boolean;
};
export type Order = {
  id: string;
  product_key: string;
  status: string;
  amount: number | null;
  refunded_amount?: number;
  currency: string | null;
  created_at: string;
};
export type PortalData = {
  athletes: Athlete[];
  bookings: Booking[];
  credits: { private: number; group: number };
  recovery?: { private: number; group: number };
  orders: Order[];
  memberships: Membership[];
  isCoach: boolean;
  settings: {
    cancellation_hours: number;
    reschedule_hours: number;
    notice_hours: number;
    timezone: string;
    location: string;
  };
  progress: {
    athlete_id: string;
    lesson_id: string;
    score: number | null;
    completed_at: string;
  }[];
};
