-- Existing Coach Tae database only. Safe to re-run; no reservations are deleted.
select cron.schedule('coach-tae-expire-unpaid-reservations','* * * * *',
 $job$update public.ct_bookings set status='expired' where status='held' and hold_until < now();$job$);
