/** Prevent an automatic production push from cutting over before hosted acceptance. */
if (
  process.env.VERCEL_ENV === "production" &&
  process.env.STRIPE_LIVE_ENABLED === "true"
) {
  console.error(
    "Production release blocked: live Stripe activation is not authorized.",
  );
  process.exitCode = 1;
}
if (
  process.env.VERCEL_ENV === "production" &&
  process.env.PLATFORM_BOOKING_ENABLED === "true"
) {
  const issues = [];
  const sha = process.env.VERCEL_GIT_COMMIT_SHA;
  if (
    !sha ||
    !/^[a-f0-9]{40}$/.test(sha) ||
    process.env.BOOKING_CUTOVER_VERIFIED_COMMIT !== sha
  )
    issues.push(
      "Hosted acceptance must be recorded for this exact VERCEL_GIT_COMMIT_SHA using BOOKING_CUTOVER_VERIFIED_COMMIT.",
    );
  if (process.env.APP_URL !== "https://coachtaeqb.com")
    issues.push("APP_URL must be the verified Coach Tae production origin.");
  if (
    process.env.NEXT_PUBLIC_SUPABASE_URL !==
    "https://fqmojknpqhogotyvxyie.supabase.co"
  )
    issues.push("Supabase project URL does not match Coach Tae.");
  const required = [
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    "SUPABASE_SERVICE_ROLE_KEY",
    "STRIPE_SECRET_KEY",
    "STRIPE_WEBHOOK_SECRET",
    "STRIPE_PRICE_PRIVATE",
    "STRIPE_PRICE_GROUP",
    "STRIPE_PRICE_PRIVATE_PACK",
    "STRIPE_PRICE_GROUP_PACK",
    "STRIPE_PRICE_LAB_MONTHLY",
    "STRIPE_PRICE_LAB_ANNUAL",
    "RESEND_API_KEY",
    "EMAIL_FROM",
  ];
  for (const name of required)
    if (!process.env[name]) issues.push(`Missing production binding: ${name}.`);
  if (
    !/^(sk|rk)_test_/.test(process.env.STRIPE_SECRET_KEY || "") ||
    process.env.STRIPE_LIVE_ENABLED === "true"
  )
    issues.push(
      "This cutover requires Stripe test mode; live payments are not authorized.",
    );
  if ((process.env.CRON_SECRET || "").length < 32)
    issues.push("A strong production CRON_SECRET is required.");
  if (issues.length) {
    console.error(
      "Production booking cutover blocked. Keep the current live deployment until hosted acceptance passes.",
    );
    for (const issue of issues) console.error(`- ${issue}`);
    process.exitCode = 1;
  } else
    console.log(
      "Production configuration guard passed. The acceptance marker is an operator attestation, not an automated live test.",
    );
}
