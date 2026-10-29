export const config = {
  business: "coach-tae",
  urlKey: "NEXT_PUBLIC_SUPABASE_URL",
  dbKey: "SUPABASE_SERVICE_ROLE_KEY",
  payments: true,
  tables: {
    athletes: ["ct_athletes", "id,name,graduation_year,created_at"],
    bookings: [
      "ct_bookings",
      "id,athlete_id,slot_id,status,paid,hold_until,created_at",
    ],
    slots: ["ct_slots", "id,kind,starts_at,ends_at,cancelled,capacity"],
    orders: ["ct_orders", "id,product_key,status,amount,currency,created_at"],
    credits: ["ct_credits", "id,kind,delta,created_at"],
    legacy: ["ct_blocks", "id,starts_at,ends_at,reason"],
    jobs: ["ct_outbox", "id,kind,run_at,attempts,completed_at,last_error"],
  },
};
