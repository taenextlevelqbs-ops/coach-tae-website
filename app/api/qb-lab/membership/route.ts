import { accountConfig } from "@/server/qb-lab/accounts/config";
import { accountClient, verifiedAccount } from "@/server/qb-lab/accounts/session";
import { AccountError, accountResponse, boundedJson, fields, requireOrigin, text, paragraph, uuid } from "@/server/qb-lab/accounts/http";
function instant(value: unknown) {
  if (typeof value !== 'string' || value.length > 40 || !/Z$|[+-]\d{2}:\d{2}$/.test(value) || !Number.isFinite(Date.parse(value))) throw new AccountError(422, 'INVALID_DATE');
  return new Date(value).toISOString();
}
async function handle(request: Request) {
  const config = accountConfig();
  if (!config) return accountResponse({ code: 'ACCOUNTS_NOT_CONFIGURED' }, 503);
  try {
    if (request.method !== 'GET') requireOrigin(request, config.origin);
    const client = await accountClient(config);
    const account = await verifiedAccount(client);
    if (request.method === 'GET') {
      const athlete = uuid(new URL(request.url).searchParams.get('athlete'));
      const [messages, schedule] = await Promise.all([
        client.from('qb_messages').select('id,body,publish_at,task_id').eq('athlete_id', athlete).order('publish_at', { ascending: false }).limit(100),
        client.from('qb_training_sessions').select('id,title,location,starts_at,ends_at,status,revision').eq('athlete_id', athlete).order('starts_at').limit(100),
      ]);
      if (messages.error || schedule.error) throw new AccountError(503, 'DATABASE_UNAVAILABLE');
      const inbox = await Promise.all(messages.data.map(async message => {
        const status = await client.rpc('qb_message_status', { target: message.id });
        if (status.error) throw new AccountError(503, 'DATABASE_UNAVAILABLE');
        return { ...message, receipt: status.data?.[0] ?? null };
      }));
      return accountResponse({ messages: inbox, schedule: schedule.data });
    }
    const input = await boundedJson(request);
    if (input.action === 'read') {
      fields(input, ['action', 'id']);
      const { error } = await client.rpc('qb_mark_message_read', { target: uuid(input.id) });
      if (error) throw new AccountError(403, 'WRITE_DENIED');
      return accountResponse({ saved: true });
    }
    if (!['coach','administrator'].includes(account.role)) throw new AccountError(403, 'COACH_REQUIRED');
    if (input.action === 'message') {
      fields(input, ['action', 'athletes', 'body', 'publishAt', 'contentKey']);
      if (!Array.isArray(input.athletes) || input.athletes.length < 1 || input.athletes.length > 100) throw new AccountError(422, 'INVALID_RECIPIENTS');
      const targets = input.athletes.map(uuid);
      if (new Set(targets).size !== targets.length) throw new AccountError(422, 'INVALID_RECIPIENTS');
      const { data, error } = await client.rpc('qb_send_message', {
        targets, message: paragraph(input.body, 2000), delivery: instant(input.publishAt),
        content_key: input.contentKey == null ? null : text(input.contentKey, 120),
      });
      if (error) throw new AccountError(403, 'WRITE_DENIED');
      return accountResponse({ queued: data, delivery: 'in_app_only' }, 201);
    }
    if (input.action === 'schedule') {
      fields(input, ['action', 'athlete', 'title', 'location', 'startsAt', 'endsAt', 'id', 'revision', 'cancel']);
      if (input.cancel !== undefined && typeof input.cancel !== 'boolean') throw new AccountError(422, 'INVALID_SCHEDULE');
      if (input.id && (!Number.isInteger(input.revision) || Number(input.revision) < 1)) throw new AccountError(422, 'INVALID_REVISION');
      const { data, error } = await client.rpc('qb_schedule_session', {
        target: uuid(input.athlete), session_title: text(input.title, 160), place: text(input.location, 200),
        starts: instant(input.startsAt), ends: instant(input.endsAt), existing: input.id ? uuid(input.id) : null,
        expected_revision: input.id ? input.revision : null, cancel: input.cancel === true,
      });
      if (error) throw new AccountError(403, 'WRITE_DENIED');
      return accountResponse({ id: data }, 201);
    }
    return accountResponse({ code: 'UNKNOWN_ACTION' }, 422);
  } catch (error) {
    return error instanceof AccountError ? accountResponse({ code: error.code }, error.status) : accountResponse({ code: 'SERVICE_UNAVAILABLE' }, 503);
  }
}
export const GET = handle;
export const POST = handle;
