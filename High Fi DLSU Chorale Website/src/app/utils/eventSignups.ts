import { supabase } from '../supabase';

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
let initialized = false;
let metaCache: Record<string, EventMeta> = {};
let signupsCache: Record<string, EventSignup[]> = {};

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

function hydrateFromLocalStorage() {
  metaCache = readJson<Record<string, EventMeta>>(META_KEY, {});
  signupsCache = readJson<Record<string, EventSignup[]>>(SIGNUPS_KEY, {});
}

function persistLocalCache() {
  writeJson(META_KEY, metaCache);
  writeJson(SIGNUPS_KEY, signupsCache);
}

export async function initializeEventSignups() {
  if (initialized) return;
  hydrateFromLocalStorage();

  try {
    const [metaRes, signupsRes] = await Promise.all([
      supabase
        .from('event_role_slots')
        .select('event_id, committee, role_name, slot_limit, major_event_enabled, exam_required, ensemble_type'),
      supabase
        .from('event_signups')
        .select('event_id, member_id, member_name, committee, section, is_performing, signup_type, role_name, role_committee, status, created_at'),
    ]);

    if (!metaRes.error && Array.isArray(metaRes.data)) {
      const nextMeta: Record<string, EventMeta> = {};
      for (const row of metaRes.data as any[]) {
        const id = String(row.event_id);
        if (!nextMeta[id]) {
          nextMeta[id] = {
            roleSlots: [],
            majorEvent: {
              enabled: !!row.major_event_enabled,
              examRequired: !!row.exam_required,
              ensembleType: row.ensemble_type ?? '',
            },
          };
        }
        nextMeta[id].roleSlots.push({
          committee: row.committee ?? '',
          role: row.role_name ?? '',
          limit: Number(row.slot_limit ?? 0),
        });
      }
      metaCache = nextMeta;
    }

    if (!signupsRes.error && Array.isArray(signupsRes.data)) {
      const nextSignups: Record<string, EventSignup[]> = {};
      for (const row of signupsRes.data as any[]) {
        const id = String(row.event_id);
        if (!nextSignups[id]) nextSignups[id] = [];
        nextSignups[id].push({
          memberId: Number(row.member_id),
          memberName: row.member_name ?? '',
          committee: row.committee ?? '',
          section: row.section ?? '',
          isPerforming: !!row.is_performing,
          type: row.signup_type === 'non_performing_role' ? 'non_performing_role' : 'performing',
          roleName: row.role_name ? row.role_name : null,
          roleCommittee: row.role_committee ? row.role_committee : null,
          status: row.status ?? 'approved',
          createdAt: row.created_at ?? new Date().toISOString(),
        });
      }
      signupsCache = nextSignups;
    }
  } catch {
    // Keep local cache if network/db access fails.
  }

  persistLocalCache();
  initialized = true;
}

export function getEventMeta(eventId: string): EventMeta {
  return metaCache[eventId] ?? DEFAULT_META;
}

export function setEventMeta(eventId: string, meta: EventMeta) {
  metaCache[eventId] = meta;
  persistLocalCache();
  void (async () => {
    await supabase.from('event_role_slots').delete().eq('event_id', Number(eventId));
    if (meta.roleSlots.length === 0) return;
    await supabase.from('event_role_slots').insert(
      meta.roleSlots.map(slot => ({
        event_id: Number(eventId),
        committee: slot.committee,
        role_name: slot.role,
        slot_limit: slot.limit,
        major_event_enabled: meta.majorEvent.enabled,
        exam_required: meta.majorEvent.examRequired,
        ensemble_type: meta.majorEvent.ensembleType || null,
      })),
    );
  })();
}

export function getEventSignups(eventId: string): EventSignup[] {
  return signupsCache[eventId] ?? [];
}

export function setEventSignups(eventId: string, signups: EventSignup[]) {
  signupsCache[eventId] = signups;
  persistLocalCache();
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
  void supabase.from('event_signups').upsert(
    {
      event_id: Number(eventId),
      member_id: signup.memberId,
      member_name: signup.memberName,
      committee: signup.committee,
      section: signup.section,
      is_performing: signup.isPerforming,
      signup_type: signup.type,
      role_name: signup.roleName ?? '',
      role_committee: signup.roleCommittee ?? '',
      status: signup.status,
      created_at: signup.createdAt,
    },
    { onConflict: 'event_id,member_id,signup_type,role_name' },
  );
}

export function removeMemberSignups(eventId: string, memberId: number) {
  const existing = getEventSignups(eventId);
  setEventSignups(eventId, existing.filter(s => s.memberId !== memberId));
  void supabase.from('event_signups').delete().eq('event_id', Number(eventId)).eq('member_id', memberId);
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
  void supabase
    .from('event_signups')
    .update({ status })
    .eq('event_id', Number(eventId))
    .eq('member_id', memberId)
    .eq('role_name', roleName ?? '');
}
