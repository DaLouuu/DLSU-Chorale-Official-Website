// data.ts — mutable `let` exports that initializePublicData / initializeUserData
// replace with real Supabase data before the first meaningful render.
// EVENTS and FEE_RECORDS are the only two that keep a hardcoded sample as a
// fallback if the real table has zero rows; everything else starts empty and
// stays empty on a genuinely empty result, rather than silently showing
// fabricated data.

import bcfc from '../imports/choir-bcfc.png';
import lpep from '../imports/choir-lpep.png';
import tcc from '../imports/choir-tcc.png';
import tet from '../imports/choir-tet.png';
import b2b1 from '../imports/choir-b2b-1.png';

// ── Static mock arrays used as fallbacks ─────────────────────────────────────

const MOCK_EVENTS = [
  {
    id: "e1",
    name: "Baccalaureate & Commencement — Term 3",
    type: "Performance",
    date: "2026-05-10",
    callTime: "07:30",
    venue: "Teresa Yuchengco Auditorium",
    attire: "Formal Filipiniana — Green Skirt / Barong",
    repertoire: ["La Salle Alma Mater", "Animo La Salle", "Ode to Joy (Beethoven)", "A New Day (Celine Dion, arr. Ryan Cayabyab)"],
    signupDeadline: "2026-05-02",
    castSize: 36,
    signedUp: 28,
    image: bcfc,
    description: "Annual commencement ceremony for the graduating batch. Full repertoire rehearsal required.",
    mySignup: null,
    forms: {
      waiver: {
        enabled: true,
        title: "Campus Waiver Form",
        description: "Required for all BCFC participants. Submit before May 2.",
        fields: [
          { id: "f1", label: "Student ID Number", type: "text" as const, required: true },
          { id: "f2", label: "Emergency contact name", type: "text" as const, required: true },
          { id: "f3", label: "Emergency contact number", type: "text" as const, required: true },
          { id: "f4", label: "I understand that I must arrive by 7:30 AM on the day of the event", type: "checkbox" as const, required: true },
          { id: "f5", label: "I agree to the terms and conditions of participation", type: "checkbox" as const, required: true },
        ],
      },
    },
  },
  {
    id: "e2",
    name: "Lasallian Partnership Evening (LPEP)",
    type: "Performance",
    date: "2026-05-17",
    callTime: "17:00",
    venue: "Henry Sy Sr. Hall, Function Room",
    attire: "Green Top / White Pants (Semi-formal)",
    repertoire: ["Usahay (Trad.)", "Di Tayo Pwede (The Juans & Ben&Ben arr. Khow)", "Anak ng Pasig", "A Million Dreams"],
    signupDeadline: "2026-05-08",
    castSize: 28,
    signedUp: 22,
    image: lpep,
    description: "Intimate partnership evening for Lasallian donors. Smaller ensemble configuration.",
    mySignup: "Signed up",
  },
  {
    id: "e3",
    name: "Busan Choral Festival — Homecoming Concert",
    type: "Performance",
    date: "2026-05-24",
    callTime: "18:00",
    venue: "Teresa Yuchengco Auditorium",
    attire: "Full Filipiniana Costume",
    repertoire: ["Pamugun (F. Buencamino)", "Koyu No Te Nupur", "Di Tayo Pwede", "Dansa"],
    signupDeadline: "2026-05-14",
    castSize: 40,
    signedUp: 34,
    image: tcc,
    description: "Celebrating our ₩20M Grand Prize at Busan 2025. A homecoming concert featuring festival repertoire.",
    mySignup: "Signed up",
    forms: {
      waiver: {
        enabled: true,
        title: "Campus Waiver Form",
        description: "Required for high-profile concert events.",
        fields: [
          { id: "f1", label: "Full legal name", type: "text" as const, required: true },
          { id: "f2", label: "Parent/Guardian contact number", type: "text" as const, required: true },
          { id: "f3", label: "I acknowledge participation in rehearsals and the concert", type: "checkbox" as const, required: true },
        ],
      },
      excuse: {
        enabled: true,
        title: "Excused Absence Form",
        description: "If you cannot attend certain rehearsals, submit this form for approval.",
        fields: [
          { id: "e1", label: "Date(s) you will be absent", type: "date" as const, required: true },
          { id: "e2", label: "Reason for absence", type: "textarea" as const, required: true },
          { id: "e3", label: "Supporting document (medical cert, excuse letter, etc.)", type: "file" as const, required: false },
          { id: "e4", label: "I will catch up on missed rehearsal material", type: "checkbox" as const, required: true },
        ],
      },
    },
  },
  {
    id: "e4",
    name: "Sunday Liturgy — St. La Salle Chapel",
    type: "Performance",
    date: "2026-05-03",
    callTime: "09:00",
    venue: "St. La Salle Chapel",
    attire: "Green Polo / White Blouse",
    repertoire: ["Entrance Hymn", "Responsorial Psalm", "Panis Angelicus (Franck)", "Recessional"],
    signupDeadline: "2026-04-28",
    castSize: 20,
    signedUp: 14,
    image: tet,
    description: "Weekly liturgical service. Small ensemble — walk-ins welcome if slots open.",
    mySignup: null,
  },
  {
    id: "e5",
    name: "Bayang Barok — Flagship Concert",
    type: "Performance",
    date: "2026-06-14",
    callTime: "15:00",
    venue: "Teresa Yuchengco Auditorium",
    attire: "Full Costume — see wardrobe brief",
    repertoire: ["Full B2B repertoire (14 pieces)"],
    signupDeadline: "2026-05-30",
    castSize: 42,
    signedUp: 11,
    image: b2b1,
    description: "Our flagship annual concert. Sign-ups just opened — roster prioritizes performing members in good standing.",
    mySignup: null,
  },
  {
    id: "e6",
    name: "Philippine Choral Competition 2026",
    type: "Competition",
    date: "2026-07-19",
    callTime: "07:00",
    venue: "Cultural Center of the Philippines",
    attire: "Competition Costume — Full Filipiniana",
    repertoire: ["Pamugun (F. Buencamino)", "Di Tayo Pwede (arr. Khow)", "Dansa"],
    signupDeadline: "2026-07-01",
    castSize: 32,
    signedUp: 20,
    image: tcc,
    description: "Annual national choral competition. Selected performing members only — slots limited.",
    mySignup: null,
  },
  {
    id: "e7",
    name: "Asia Pacific Choral Festival — Singapore",
    type: "Festival",
    date: "2026-08-10",
    callTime: "09:00",
    venue: "Esplanade Theatres on the Bay, Singapore",
    attire: "Full Filipiniana Costume",
    repertoire: ["Dansa", "Pamugun", "Ode to Joy (Beethoven arr.)"],
    signupDeadline: "2026-07-15",
    castSize: 24,
    signedUp: 10,
    image: b2b1,
    description: "International festival in Singapore. Travel and accommodation provided for selected members.",
    mySignup: null,
  },
  {
    id: "e8",
    name: "Outreach Concert — Gawad Kalinga Village",
    type: "Request",
    date: "2026-06-28",
    callTime: "10:00",
    venue: "GK Enchanted Farm, Bulacan",
    attire: "Green Polo / Jeans (Casual)",
    repertoire: ["Anak ng Pasig", "Bayan Ko", "Lupang Hinirang"],
    signupDeadline: "2026-06-20",
    castSize: 30,
    signedUp: 12,
    image: lpep,
    description: "Community outreach concert for GK village residents. Volunteer-based, open to all members who wish to participate.",
    mySignup: null,
  },
];

// One sample only, kept as a demo fallback the same way MOCK_EVENTS is —
// shown only if the real fee_records table has zero rows. Includes a
// submitted proof of payment so the admin review UI has something to show.
const MOCK_FEE_RECORDS = [
  { id: "f1", date: "2026-04-10", type: "Absent (unexcused)", amount: 150, status: "pending", reference: "Rehearsal no-show", memberId: 12100234, memberName: "Althea Marquez", submittedAt: "2026-04-24 10:30", paymentData: { paymentDate: "2026-04-24", senderAccount: "0917-555-1234", senderAccountName: "Althea Marquez", receiverAccount: "0917-123-4567 (GCash - Isabela Cruz)", referenceNumber: "GCash-2026424-001", proofFileName: "gcash_receipt_001.jpg", proofDataUrl: lpep, amount: 150 } },
];

// Outstanding/paid/lastPayment are derived from fee records so mock and
// live-Supabase data stay consistent instead of using separately seeded numbers.
export function computeFeeSummaries(records: any[]): any[] {
  const byMember = new Map<number, { memberId: number; memberName: string; section: string; outstanding: number; paid: number; lastPayment: string | null }>();
  for (const r of records) {
    const key = r.memberId;
    if (!byMember.has(key)) {
      byMember.set(key, { memberId: r.memberId, memberName: r.memberName, section: r.section ?? '', outstanding: 0, paid: 0, lastPayment: null });
    }
    const summary = byMember.get(key)!;
    if (r.status === 'unpaid' || r.status === 'pending') summary.outstanding += r.amount;
    if (r.status === 'paid') {
      summary.paid += r.amount;
      if (!summary.lastPayment || (r.paidAt && r.paidAt > summary.lastPayment)) summary.lastPayment = r.paidAt ?? summary.lastPayment;
    }
  }
  // Reads the live MEMBERS binding so this reflects the real roster once
  // initializePublicData() has replaced it.
  return MEMBERS.map(m => byMember.get(m.id) ?? { memberId: m.id, memberName: m.name, section: m.section, outstanding: 0, paid: 0, lastPayment: null });
}

// ── Mutable live exports — replaced by Supabase data at runtime ───────────────
// ESM live bindings mean consumers will see the updated value after assignment.
// Only EVENTS and FEE_RECORDS keep a hardcoded fallback sample (shown only if
// the real table has zero rows) — everything else starts empty and is left
// empty if the real query legitimately returns nothing, rather than silently
// showing fabricated members/attendance/excuses/rules/announcements.

export let MEMBERS: any[] = [];
export let CURRENT_MEMBER: any = null;
export let CURRENT_ADMIN: any = null;
export let ATTENDANCE_LOG: any[] = [];
export let EVENTS: any[] = MOCK_EVENTS;
export let EXCUSE_REQUESTS: any[] = [];
export let FEE_RECORDS: any[] = MOCK_FEE_RECORDS;
export let FEE_RULES: any[] = [];
export let ANNOUNCEMENTS: any[] = [];

export const ANALYTICS_MONTHLY = [
  { month: "Jan", Soprano: 4, Alto: 3, Tenor: 5, Bass: 2 },
  { month: "Feb", Soprano: 6, Alto: 4, Tenor: 3, Bass: 5 },
  { month: "Mar", Soprano: 3, Alto: 7, Tenor: 6, Bass: 4 },
  { month: "Apr", Soprano: 5, Alto: 5, Tenor: 8, Bass: 6 },
];

export const REASON_BREAKDOWN = [
  { label: "Academic conflict", count: 24, pct: 38 },
  { label: "Illness", count: 14, pct: 22 },
  { label: "Family obligation", count: 10, pct: 16 },
  { label: "Org / CSO activity", count: 8, pct: 13 },
  { label: "Transport / traffic", count: 4, pct: 6 },
  { label: "Other", count: 3, pct: 5 },
];

export const SOCIAL_EVENTS = [
  {
    id: "s1",
    name: "Christmas Party 2026",
    date: "2026-12-15",
    time: "18:00",
    venue: "Green Court, DLSU Manila",
    description: "Annual Christmas celebration with gift exchange, games, and dinner. Bring your Secret Santa gift (₱300 budget)!",
    slots: 64,
    signedUp: 42,
    mySignup: true,
  },
  {
    id: "s2",
    name: "Team Building — Tagaytay Retreat",
    date: "2026-06-20",
    time: "06:00",
    venue: "Nurture Wellness Village, Tagaytay",
    description: "Weekend team building activity with workshops, bonding games, and relaxation. Overnight stay included.",
    slots: 50,
    signedUp: 38,
    mySignup: false,
  },
  {
    id: "s3",
    name: "Game Night & Pizza Party",
    date: "2026-05-30",
    time: "19:00",
    venue: "Music Studio A",
    description: "Casual game night with board games, karaoke, and unlimited pizza. Bring your favorite games!",
    slots: 40,
    signedUp: 28,
    mySignup: true,
  },
  {
    id: "s4",
    name: "Beach Day — Batangas",
    date: "2026-07-12",
    time: "05:00",
    venue: "Laiya, Batangas",
    description: "Day trip to the beach for swimming, beach volleyball, and bonding. Transportation provided.",
    slots: 55,
    signedUp: 15,
    mySignup: false,
  },
];

export let MUSIC_LIBRARY: any[] = [];

export const REHEARSALS = [
  { id: "r1", date: "2026-04-28", time: "18:00", endTime: "21:00", type: "Full Rehearsal", venue: "Music Studio A", notes: "BCFC repertoire focus" },
  { id: "r2", date: "2026-04-29", time: "18:00", endTime: "20:00", type: "Sectional", section: "Soprano/Alto", venue: "Music Studio B", notes: "LPEP pieces" },
  { id: "r3", date: "2026-04-30", time: "18:00", endTime: "20:00", type: "Sectional", section: "Tenor/Bass", venue: "Music Studio A", notes: "LPEP pieces" },
  { id: "r4", date: "2026-05-01", time: "18:00", endTime: "21:00", type: "Full Rehearsal", venue: "Music Studio A", notes: "Run-through all upcoming performances" },
  { id: "r5", date: "2026-05-05", time: "18:00", endTime: "21:00", type: "Full Rehearsal", venue: "Music Studio A", notes: "BCFC final rehearsal" },
  { id: "r6", date: "2026-05-08", time: "18:00", endTime: "21:00", type: "Full Rehearsal", venue: "Music Studio A", notes: "Busan homecoming concert prep" },
  { id: "r7", date: "2026-05-12", time: "18:00", endTime: "21:00", type: "Full Rehearsal", venue: "Music Studio A", notes: "Busan homecoming concert prep" },
  { id: "r8", date: "2026-05-13", time: "18:00", endTime: "20:00", type: "Sectional", section: "Soprano/Alto", venue: "Music Studio B", notes: "Harmonization work" },
  { id: "r9", date: "2026-05-14", time: "18:00", endTime: "20:00", type: "Sectional", section: "Tenor/Bass", venue: "Music Studio A", notes: "Harmonization work" },
  { id: "r10", date: "2026-05-15", time: "18:00", endTime: "21:00", type: "Full Rehearsal", venue: "Music Studio A", notes: "Full ensemble" },
];

// Rehearsal events for AdminAttendance mock fallback (April 2026 weekly rehearsals)
export const REHEARSAL_EVENTS = [
  { id: "201", name: "Full Rehearsal", date: "2026-04-07", time: "18:00", venue: "Music Studio A", type: "rehearsal" },
  { id: "202", name: "Sectional — S/A", date: "2026-04-09", time: "18:00", venue: "Music Studio B", type: "rehearsal" },
  { id: "203", name: "Full Rehearsal", date: "2026-04-14", time: "18:00", venue: "Music Studio A", type: "rehearsal" },
  { id: "204", name: "Sectional — T/B", date: "2026-04-16", time: "18:00", venue: "Music Studio A", type: "rehearsal" },
  { id: "205", name: "Full Rehearsal", date: "2026-04-21", time: "18:00", venue: "Music Studio A", type: "rehearsal" },
  { id: "206", name: "Sectional — S/A", date: "2026-04-23", time: "18:00", venue: "Music Studio B", type: "rehearsal" },
  { id: "207", name: "Full Rehearsal", date: "2026-04-28", time: "18:00", venue: "Music Studio A", type: "rehearsal" },
  { id: "208", name: "Sectional — T/B", date: "2026-04-30", time: "18:00", venue: "Music Studio A", type: "rehearsal" },
];

export const CLASS_SCHEDULES = [
  {
    memberId: 12100234,
    term: "Term 3 2025-2026",
    classes: [
      { code: "LBYCPA2", name: "Computer Programming Applications 2", days: ["Monday", "Wednesday"], startTime: "14:30", endTime: "16:00", room: "GK304" },
      { code: "CSADPRG", name: "Data Structures and Algorithms", days: ["Tuesday", "Thursday"], startTime: "13:00", endTime: "14:30", room: "V209" },
      { code: "LCINTER", name: "Intermediate Spanish", days: ["Tuesday", "Thursday"], startTime: "16:00", endTime: "17:30", room: "BR305" },
      { code: "PHYSIS2", name: "Physics for Engineers 2", days: ["Monday", "Friday"], startTime: "10:00", endTime: "11:30", room: "SJ108" },
    ],
  },
];

// ── Supabase loaders ──────────────────────────────────────────────────────────

// Load data that doesn't require a logged-in user.
// Called once at app startup; gates the first render.
export async function initializePublicData(): Promise<void> {
  try {
    const { supabase } = await import('./supabase');

    // 1. Members from profiles
    const { data: profilesData } = await supabase
      .from('profiles')
      .select('id, first_name, last_name, voice_section, is_admin, email, school_id, committee, membership_status, excuse_decision_opt_in, rehearsal_reminder_opt_in')
      .order('last_name', { ascending: true });

    if (profilesData) {
      MEMBERS = profilesData.map(p => {
        const firstName = p.first_name ?? '';
        const lastName = p.last_name ?? '';
        const name = [firstName, lastName].filter(Boolean).join(' ') || (p.email?.split('@')[0] ?? 'Unknown');
        const initials = [firstName[0], lastName[0]].filter(Boolean).join('').toUpperCase() || '?';
        return {
          id: p.school_id ?? 0,
          name,
          section: p.voice_section ?? '',
          role: p.is_admin ? 'Admin' : 'Member',
          committee: p.committee ?? '',
          year: '',
          rfid: '',
          email: p.email ?? '',
          avatar: initials,
          admin: p.is_admin ?? false,
          _uuid: p.id,
          excuseDecisionOptIn: p.excuse_decision_opt_in ?? true,
          rehearsalReminderOptIn: p.rehearsal_reminder_opt_in ?? true,
        };
      });
    }

    // 2. Events
    const { data: eventsData } = await supabase
      .from('events')
      .select('*')
      .order('event_date', { ascending: true });

    if (eventsData && eventsData.length > 0) {
      EVENTS = eventsData.map(ev => ({
        id: String(ev.event_id),
        _eventId: ev.event_id,          // numeric for FK joins
        name: ev.name ?? ev.notes ?? `${ev.event_type ?? 'Event'} — ${ev.event_date}`,
        type: ev.event_type === 'performance' ? 'Performance' : 'Rehearsal',
        date: ev.event_date,
        callTime: (ev.call_time ?? ev.start_time ?? '').replace(/\+.*$/, '').slice(0, 5) || '18:00',
        venue: ev.venue ?? '',
        attire: ev.attire ?? '',
        repertoire: (ev.repertoire as string[]) ?? [],
        signupDeadline: ev.signup_deadline ?? '',
        castSize: ev.cast_size ?? 0,
        signedUp: 0,
        image: ev.image_url || tcc,
        description: ev.description || ev.notes || '',
        mySignup: null,
        file_url: ev.file_url ?? null,
        allowsExcusedAbsence: !!ev.allows_excused_absence,
        excusedAbsenceOpen: ev.excused_absence_open ?? true,
        excusedAbsenceFormUrl: ev.excused_absence_form_url ?? null,
        isClosed: !!ev.is_closed,
      }));

      // Sync rehearsals to window so Calendar UI shows DB data on all screens
      const rehearsalRows = EVENTS.filter(ev => ev.type === 'Rehearsal');
      if (rehearsalRows.length > 0) {
        (window as any).REHEARSALS = rehearsalRows.map(ev => ({
          id: String((ev as any)._eventId ?? ev.id),
          _eventId: (ev as any)._eventId ?? null,
          date: ev.date,
          type: ev.name ?? 'Full Rehearsal',
          section: '',
          time: (ev as any).callTime ?? '18:00',
          endTime: '21:00',
          venue: ev.venue ?? '',
          notes: ev.description ?? '',
        }));
      }
    }

    // 3. All excuse requests joined with profiles (admin view needs all)
    const { data: excuseData } = await supabase
      .from('excuse_requests')
      .select('*, profiles!account_id_fk(first_name, last_name, voice_section, school_id)')
      .order('created_at', { ascending: false });

    if (excuseData) {
      const eventById = new Map(EVENTS.map(ev => [(ev as any)._eventId, ev]));
      EXCUSE_REQUESTS = excuseData.map(er => {
        const profile = (er as any).profiles;
        const firstName = profile?.first_name ?? '';
        const lastName = profile?.last_name ?? '';
        const memberName = [firstName, lastName].filter(Boolean).join(' ') || 'Unknown';
        const linkedEvent = (er as any).event_id_fk != null ? eventById.get((er as any).event_id_fk) : null;
        return {
          id: er.request_id,
          memberId: profile?.school_id ?? 0,
          memberName,
          section: profile?.voice_section ?? '',
          date: er.excused_date ?? '',
          type: er.excuse_type ?? 'Absent',
          reason: er.notes ?? '',
          status: er.status ?? 'Pending',
          submittedAt: er.created_at ? er.created_at.slice(0, 16).replace('T', ' ') : '',
          eta: er.eta ?? undefined,
          notes: (er as any).admin_response ?? undefined,
          approvedBy: (er as any).approved_by ?? undefined,
          eventId: (er as any).event_id_fk ?? undefined,
          eventName: (linkedEvent as any)?.name ?? undefined,
          allowsExcusedAbsence: (linkedEvent as any)?.allowsExcusedAbsence ?? false,
          documentUrl: (er as any).document_url ?? undefined,
        };
      });
    }

    // 4. All fee records joined with profiles (admin view needs all; member
    // screens filter client-side by memberId, same pattern as excuses above)
    const { data: feeData } = await supabase
      .from('fee_records')
      .select('*, profiles!account_id_fk(first_name, last_name, voice_section, school_id)')
      .order('fee_date', { ascending: false });

    if (feeData && feeData.length > 0) {
      FEE_RECORDS = feeData.map(fr => {
        const profile = (fr as any).profiles;
        const firstName = profile?.first_name ?? '';
        const lastName = profile?.last_name ?? '';
        const memberName = [firstName, lastName].filter(Boolean).join(' ') || 'Unknown';
        const hasPaymentInfo = fr.status === 'pending' || fr.status === 'paid';
        const proofUrl: string | null = (fr as any).proof_url ?? null;
        return {
          id: fr.id,
          date: fr.fee_date ?? '',
          type: fr.type ?? '',
          amount: Number(fr.amount ?? 0),
          status: fr.status ?? 'unpaid',
          reference: fr.reference ?? '',
          memberId: profile?.school_id ?? 0,
          memberName,
          section: profile?.voice_section ?? '',
          submittedAt: fr.submitted_at ? fr.submitted_at.slice(0, 16).replace('T', ' ') : undefined,
          paidAt: fr.paid_at ?? undefined,
          paymentData: hasPaymentInfo ? {
            paymentDate: (fr as any).payment_date ?? undefined,
            senderAccount: (fr as any).sender_account ?? undefined,
            senderAccountName: (fr as any).sender_account_name ?? undefined,
            receiverAccount: (fr as any).receiver_account ?? undefined,
            referenceNumber: (fr as any).reference_number ?? undefined,
            proofFileName: proofUrl ? decodeURIComponent(proofUrl.split('/').pop() ?? 'proof').replace(/^\d+_/, '') : undefined,
            proofDataUrl: proofUrl ?? undefined,
            amount: Number(fr.amount ?? 0),
            rejectionReason: (fr as any).rejection_reason ?? undefined,
          } : undefined,
        };
      });
    }

    // 5. Fee rules (fee schedule)
    const { data: ruleData } = await supabase
      .from('fee_rules')
      .select('*')
      .order('effective_date', { ascending: false });

    if (ruleData) {
      FEE_RULES = ruleData.map(r => ({
        id: String(r.id),
        type: r.type ?? '',
        amount: Number(r.amount ?? 0),
        effective: r.effective_date ?? '',
      }));
    }

    // 6. Announcements
    const { data: announcementData } = await supabase
      .from('announcements')
      .select('*')
      .order('created_at', { ascending: false });

    if (announcementData) {
      ANNOUNCEMENTS = announcementData.map(a => ({
        id: String(a.id),
        title: a.title ?? '',
        body: a.body ?? '',
        date: a.created_at ? a.created_at.slice(0, 10) : '',
        pinned: !!a.pinned,
        author: a.author ?? '',
        recipients: a.recipients ?? 'all',
      }));
    }

    // 7. Music library (categories + items)
    const { data: categoryData } = await supabase
      .from('music_categories')
      .select('*')
      .order('sort_order', { ascending: true });

    if (categoryData) {
      const { data: itemData } = await supabase
        .from('music_items')
        .select('*')
        .order('created_at', { ascending: true });

      MUSIC_LIBRARY = categoryData.map(cat => ({
        id: String(cat.id),
        _categoryId: cat.id,
        category: cat.name ?? '',
        items: (itemData ?? [])
          .filter((it: any) => it.category_id === cat.id)
          .map((it: any) => ({
            id: String(it.id),
            _itemId: it.id,
            title: it.title ?? '',
            type: it.type ?? 'Score',
            link: it.link ?? '',
            notes: it.notes ?? '',
            eventId: it.event_id_fk != null ? String(it.event_id_fk) : undefined,
          })),
      }));
    }
  } catch {
    // Network/query failure — leave whatever was already loaded (or the
    // empty-array default) in place rather than crashing.
  }
}

// Load data for a specific logged-in user.
// Called after successful login before navigating to home.
export async function initializeUserData(userUuid: string, schoolId: number): Promise<void> {
  try {
    // Set CURRENT_MEMBER from the already-loaded MEMBERS list
    const member = MEMBERS.find(m => m.id === schoolId);
    if (member) {
      CURRENT_MEMBER = member;
    }

    // Set CURRENT_ADMIN similarly if admin
    if (member?.admin) {
      CURRENT_ADMIN = member;
    }

    const { supabase } = await import('./supabase');

    // Load attendance logs for this user
    const { data: logs } = await supabase
      .from('attendance_logs')
      .select('log_id, created_at, log_status, events!event_id_fk(event_date, event_type, notes, start_time)')
      .eq('account_id_fk', userUuid)
      .order('created_at', { ascending: false })
      .limit(50);

    if (logs) {
      ATTENDANCE_LOG = logs.map(log => {
        const ev = (log as any).events;
        const d = log.created_at ? new Date(log.created_at) : null;
        const timeIn = d ? d.toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit', hour12: false }) : '—';
        const rawStatus = (log.log_status ?? 'Present').toLowerCase();
        return {
          date: ev?.event_date ?? log.created_at?.slice(0, 10) ?? '',
          type: ev?.event_type === 'performance' ? 'Performance' : 'Rehearsal',
          status: rawStatus,
          timeIn,
          note: ev?.notes ?? '',
        };
      });
    }
  } catch {
    // Network/query failure — leave whatever was already loaded (or the
    // empty-array default) in place rather than crashing.
  }
}

// Expose data to window for any legacy component access
Object.assign(window, {
  MEMBERS,
  CURRENT_MEMBER,
  CURRENT_ADMIN,
  ATTENDANCE_LOG,
  EXCUSE_REQUESTS,
  EVENTS,
  FEE_RECORDS,
  ANNOUNCEMENTS,
  FEE_RULES,
  ANALYTICS_MONTHLY,
  REASON_BREAKDOWN,
  SOCIAL_EVENTS,
  MUSIC_LIBRARY,
  REHEARSALS,
  CLASS_SCHEDULES,
});
