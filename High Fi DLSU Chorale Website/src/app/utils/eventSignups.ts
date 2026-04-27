export type RoleSlot = {
  committee: string;
  role: string;
  limit: number;
};

export type MajorEventConfig = {
  enabled: boolean;
  examRequired: boolean;
  ensembleType: string;
};

export type EventMeta = {
  roleSlots: RoleSlot[];
  majorEvent: MajorEventConfig;
};

export type EventSignup = {
  memberId: number;
  memberName: string;
  committee: string;
  section: string;
  isPerforming: boolean;
  type: 'performing' | 'non_performing_role';
  roleName: string | null;
  roleCommittee: string | null;
  status: 'approved' | 'pending' | 'rejected';
  createdAt: string;
};

const META_KEY = 'chorale_event_meta_v1';
const SIGNUPS_KEY = 'chorale_event_signups_v1';

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJson<T>(key: string, value: T) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore write errors in restricted environments
  }
}

const DEFAULT_META: EventMeta = {
  roleSlots: [],
  majorEvent: { enabled: false, examRequired: false, ensembleType: '' },
};

export function getEventMeta(eventId: string): EventMeta {
  const all = readJson<Record<string, EventMeta>>(META_KEY, {});
  return all[eventId] ?? DEFAULT_META;
}

export function setEventMeta(eventId: string, meta: EventMeta) {
  const all = readJson<Record<string, EventMeta>>(META_KEY, {});
  all[eventId] = meta;
  writeJson(META_KEY, all);
}

export function getEventSignups(eventId: string): EventSignup[] {
  const all = readJson<Record<string, EventSignup[]>>(SIGNUPS_KEY, {});
  return all[eventId] ?? [];
}

export function setEventSignups(eventId: string, signups: EventSignup[]) {
  const all = readJson<Record<string, EventSignup[]>>(SIGNUPS_KEY, {});
  all[eventId] = signups;
  writeJson(SIGNUPS_KEY, all);
}

export function upsertEventSignup(eventId: string, signup: EventSignup) {
  const existing = getEventSignups(eventId);
  const idx = existing.findIndex(s =>
    s.memberId === signup.memberId &&
    s.type === signup.type &&
    (s.roleName ?? '') === (signup.roleName ?? ''),
  );
  if (idx >= 0) existing[idx] = signup;
  else existing.push(signup);
  setEventSignups(eventId, existing);
}

export function removeMemberSignups(eventId: string, memberId: number) {
  const existing = getEventSignups(eventId);
  setEventSignups(eventId, existing.filter(s => s.memberId !== memberId));
}

export function updateSignupStatus(
  eventId: string,
  memberId: number,
  roleName: string | null,
  status: EventSignup['status'],
) {
  const existing = getEventSignups(eventId);
  const idx = existing.findIndex(s => s.memberId === memberId && (s.roleName ?? null) === roleName);
  if (idx < 0) return;
  existing[idx] = { ...existing[idx], status };
  setEventSignups(eventId, existing);
}
