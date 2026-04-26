// data.ts — mock data kept as initial values / fallback
// MEMBERS, EVENTS, EXCUSE_REQUESTS, ATTENDANCE_LOG are mutable let exports
// so that initializePublicData / initializeUserData can replace them with
// real Supabase data before the first React render.

import bcfc from '../imports/choir-bcfc.png';
import lpep from '../imports/choir-lpep.png';
import tcc from '../imports/choir-tcc.png';
import tet from '../imports/choir-tet.png';
import b2b1 from '../imports/choir-b2b-1.png';

// ── Static mock arrays used as fallbacks ─────────────────────────────────────

const MOCK_MEMBERS = [
  { id: 12100234, name: "Althea Marquez", section: "Soprano", role: "Member", committee: "Music", year: "3rd Year", rfid: "A3F21B90", email: "althea_marquez@dlsu.edu.ph", avatar: "AM" },
  { id: 12100891, name: "Miguel Santos", section: "Bass", role: "Section Head", committee: "Logistics", year: "4th Year", rfid: "B8E402C1", email: "miguel_santos@dlsu.edu.ph", avatar: "MS", exec: true },
  { id: 12101552, name: "Ria Dela Cruz", section: "Alto", role: "President", committee: "Executive", year: "4th Year", rfid: "C1D902A8", email: "ria_delacruz@dlsu.edu.ph", avatar: "RD", exec: true, admin: true },
  { id: 12102344, name: "Joaquin Reyes", section: "Tenor", role: "Member", committee: "Music", year: "2nd Year", rfid: "D9F81B33", email: "joaquin_reyes@dlsu.edu.ph", avatar: "JR" },
  { id: 12100775, name: "Patricia Lim", section: "Soprano", role: "VP Internal", committee: "Executive", year: "4th Year", rfid: "E4A72C10", email: "patricia_lim@dlsu.edu.ph", avatar: "PL", exec: true, admin: true },
  { id: 12103201, name: "Rafael Tan", section: "Bass", role: "Member", committee: "Publicity", year: "1st Year", rfid: "F2B938D1", email: "rafael_tan@dlsu.edu.ph", avatar: "RT" },
  { id: 12101120, name: "Sophia Garcia", section: "Alto", role: "Member", committee: "Music", year: "3rd Year", rfid: "A7B19D22", email: "sophia_garcia@dlsu.edu.ph", avatar: "SG" },
  { id: 12102890, name: "Nico Villanueva", section: "Tenor", role: "Section Head", committee: "Music", year: "3rd Year", rfid: "B2F830A4", email: "nico_villanueva@dlsu.edu.ph", avatar: "NV", exec: true },
  { id: 12100443, name: "Bea Cabauatan", section: "Soprano", role: "Member", committee: "Publicity", year: "2nd Year", rfid: "C3A812B5", email: "bea_cabauatan@dlsu.edu.ph", avatar: "BC" },
  { id: 12103567, name: "Lorenzo Aquino", section: "Bass", role: "Member", committee: "Logistics", year: "1st Year", rfid: "D4E923F6", email: "lorenzo_aquino@dlsu.edu.ph", avatar: "LA" },
  { id: 12101899, name: "Isabela Cruz", section: "Alto", role: "Member", committee: "Finance", year: "3rd Year", rfid: "E5C134A7", email: "isabela_cruz@dlsu.edu.ph", avatar: "IC" },
  { id: 12102011, name: "Marco Dizon", section: "Tenor", role: "Member", committee: "Music", year: "2nd Year", rfid: "F6D245B8", email: "marco_dizon@dlsu.edu.ph", avatar: "MD" },
  { id: 12100982, name: "Camille Flores", section: "Soprano", role: "Member", committee: "Music", year: "3rd Year", rfid: "A8E356C9", email: "camille_flores@dlsu.edu.ph", avatar: "CF" },
  { id: 12103412, name: "Gabriel Lopez", section: "Bass", role: "Member", committee: "Music", year: "1st Year", rfid: "B9F467DA", email: "gabriel_lopez@dlsu.edu.ph", avatar: "GL" },
  { id: 12101733, name: "Denise Ramos", section: "Alto", role: "Member", committee: "Publicity", year: "3rd Year", rfid: "CAA578EB", email: "denise_ramos@dlsu.edu.ph", avatar: "DR" },
  { id: 12102655, name: "Xavier Ong", section: "Tenor", role: "Member", committee: "Logistics", year: "2nd Year", rfid: "DBB689FC", email: "xavier_ong@dlsu.edu.ph", avatar: "XO" },
];

const MOCK_ATTENDANCE_LOG = [
  { date: "2026-04-24", type: "Rehearsal", status: "present", timeIn: "18:02", note: "" },
  { date: "2026-04-22", type: "Rehearsal", status: "late", timeIn: "18:24", note: "Traffic on Taft" },
  { date: "2026-04-20", type: "Rehearsal", status: "present", timeIn: "17:58", note: "" },
  { date: "2026-04-17", type: "Performance", status: "present", timeIn: "14:30", note: "BCFC dress rehearsal" },
  { date: "2026-04-15", type: "Rehearsal", status: "excused", timeIn: "—", note: "Academic conflict — approved" },
  { date: "2026-04-13", type: "Rehearsal", status: "present", timeIn: "18:00", note: "" },
  { date: "2026-04-10", type: "Rehearsal", status: "absent", timeIn: "—", note: "No submission" },
  { date: "2026-04-08", type: "Rehearsal", status: "present", timeIn: "18:05", note: "" },
  { date: "2026-04-06", type: "Rehearsal", status: "present", timeIn: "17:55", note: "" },
  { date: "2026-04-03", type: "Performance", status: "present", timeIn: "15:00", note: "Sunday Mass, Chapel" },
  { date: "2026-04-01", type: "Rehearsal", status: "late", timeIn: "18:19", note: "Last minute room change" },
  { date: "2026-03-30", type: "Rehearsal", status: "present", timeIn: "18:01", note: "" },
];

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

const MOCK_EXCUSE_REQUESTS = [
  { id: 1, memberId: 12100234, memberName: "Althea Marquez", section: "Soprano", date: "2026-04-28", type: "Late", reason: "Lab exam until 6:30PM — ETA 7:00PM", status: "Pending", submittedAt: "2026-04-24 09:12", eta: "19:00" },
  { id: 2, memberId: 12100234, memberName: "Althea Marquez", section: "Soprano", date: "2026-04-15", type: "Excused Absent", reason: "Academic conflict — thesis defense", status: "Approved", submittedAt: "2026-04-12 21:40", approvedBy: "Ria Dela Cruz", notes: "Attached defense schedule — approved." },
  { id: 3, memberId: 12102344, memberName: "Joaquin Reyes", section: "Tenor", date: "2026-04-28", type: "Absent", reason: "Org event clash (CSO retreat)", status: "Pending", submittedAt: "2026-04-23 15:22" },
  { id: 4, memberId: 12103201, memberName: "Rafael Tan", section: "Bass", date: "2026-04-28", type: "Late", reason: "Back-to-back classes until 7:00PM", status: "Pending", submittedAt: "2026-04-23 20:05", eta: "19:15" },
  { id: 5, memberId: 12101120, memberName: "Sophia Garcia", section: "Alto", date: "2026-04-26", type: "Absent", reason: "Out of town — family obligation", status: "Pending", submittedAt: "2026-04-22 08:30" },
];

// ── Mutable live exports — replaced by Supabase data at runtime ───────────────
// ESM live bindings mean consumers will see the updated value after assignment.

export let MEMBERS: any[] = MOCK_MEMBERS;
export let CURRENT_MEMBER: any = MOCK_MEMBERS[0];
export let CURRENT_ADMIN: any = MOCK_MEMBERS[2];
export let ATTENDANCE_LOG: any[] = MOCK_ATTENDANCE_LOG;
export let EVENTS: any[] = MOCK_EVENTS;
export let EXCUSE_REQUESTS: any[] = MOCK_EXCUSE_REQUESTS;

// ── Static data (no real DB table yet — always mock) ─────────────────────────

export const FEE_RECORDS = [
  { id: "f1", date: "2026-04-22", type: "Late", amount: 50, status: "unpaid", reference: "Rehearsal late arrival (18:24)", memberId: 12100234, memberName: "Althea Marquez" },
  { id: "f2", date: "2026-04-10", type: "Absent (unexcused)", amount: 150, status: "pending", reference: "Rehearsal no-show", memberId: 12100234, memberName: "Althea Marquez", submittedAt: "2026-04-24 10:30", paymentData: { paymentDate: "2026-04-24", senderAccount: "0917-555-1234", senderAccountName: "Althea Marquez", receiverAccount: "0917-123-4567 (GCash - Isabela Cruz)", referenceNumber: "GCash-2026424-001", proofFileName: "gcash_receipt_001.jpg", amount: 150 } },
  { id: "f3", date: "2026-04-01", type: "Late", amount: 50, status: "paid", reference: "Rehearsal late arrival (18:19)", paidAt: "2026-04-08", memberId: 12100234, memberName: "Althea Marquez" },
  { id: "f4", date: "2026-03-11", type: "Absent (unexcused)", amount: 150, status: "paid", reference: "Rehearsal no-show", paidAt: "2026-03-20", memberId: 12100234, memberName: "Althea Marquez" },
  { id: "f5", date: "2026-04-20", type: "Late", amount: 50, status: "pending", reference: "Rehearsal late arrival", memberId: 12102344, memberName: "Joaquin Reyes", submittedAt: "2026-04-23 14:15", paymentData: { paymentDate: "2026-04-23", senderAccount: "0917-555-9876", senderAccountName: "Joaquin Reyes", receiverAccount: "0917-123-4567 (GCash - Isabela Cruz)", referenceNumber: "GCash-2026423-002", proofFileName: "payment_proof.png", amount: 50 } },
];

export const FEE_SUMMARIES = MOCK_MEMBERS.map((m, i) => {
  const seeds = [200, 0, 0, 350, 0, 500, 50, 0, 100, 750, 50, 200, 0, 450, 150, 100];
  const paid = [400, 0, 200, 150, 0, 300, 100, 0, 0, 250, 200, 100, 0, 150, 50, 0];
  return {
    memberId: m.id,
    memberName: m.name,
    section: m.section,
    outstanding: seeds[i] || 0,
    paid: paid[i] || 0,
    lastPayment: paid[i] ? "2026-04-12" : null,
  };
});

export const FEE_RULES = [
  { id: "r1", type: "Late (Rehearsal)", amount: 50, effective: "2026-01-01" },
  { id: "r2", type: "Absent — unexcused (Rehearsal)", amount: 150, effective: "2026-01-01" },
  { id: "r3", type: "Late (Performance)", amount: 200, effective: "2026-01-01" },
  { id: "r4", type: "Absent — unexcused (Performance)", amount: 500, effective: "2026-01-01" },
];

export const ANNOUNCEMENTS = [
  { id: "a1", title: "📌 BCFC callboard — sectional schedules posted", body: "Sopranos & Altos: Tues/Thurs 6PM. Tenors & Basses: Mon/Wed 6PM. Full ensemble call this Friday.", date: "2026-04-23", pinned: true, author: "Maestro Emmanuel dela Peña" },
  { id: "a2", title: "Busan repertoire binders ready for pickup", body: "New binders are at the music office. Please pick up by Friday; bring your ID.", date: "2026-04-22", pinned: false, author: "Patricia Lim (VP Internal)" },
  { id: "a3", title: "Reminder — fee settlement deadline", body: "Outstanding balances for March must be settled by April 30. Finance will be at the studio every rehearsal.", date: "2026-04-20", pinned: true, author: "Isabela Cruz (Finance)" },
];

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

export const MUSIC_LIBRARY = [
  {
    id: "m1",
    category: "Current Repertoire",
    items: [
      { title: "Pamugun (F. Buencamino)", type: "Score", link: "https://drive.google.com/file/d/...", notes: "SATB arrangement", eventId: "e3" },
      { title: "Koyu No Te Nupur", type: "Score", link: "https://drive.google.com/file/d/...", notes: "Japanese folk song", eventId: "e3" },
      { title: "Di Tayo Pwede", type: "Score", link: "https://drive.google.com/file/d/...", notes: "The Juans arr. Khow", eventId: "e2" },
      { title: "Dansa", type: "Score", link: "https://drive.google.com/file/d/...", notes: "Festival piece", eventId: "e3" },
    ],
  },
  {
    id: "m2",
    category: "Study Guides",
    items: [
      { title: "Sight-reading Exercises — Soprano", type: "PDF", link: "https://drive.google.com/file/d/...", notes: "Levels 1-3" },
      { title: "Breathing Techniques Guide", type: "PDF", link: "https://drive.google.com/file/d/...", notes: "Maestro dela Peña" },
      { title: "Vocal Warm-up Routines", type: "PDF", link: "https://drive.google.com/file/d/...", notes: "15-min daily routine" },
    ],
  },
  {
    id: "m3",
    category: "Practice Tracks",
    items: [
      { title: "Pamugun — Soprano Part", type: "MP3", link: "https://drive.google.com/file/d/...", notes: "Isolated track", eventId: "e3" },
      { title: "Pamugun — Full Mix", type: "MP3", link: "https://drive.google.com/file/d/...", notes: "All parts", eventId: "e3" },
      { title: "Di Tayo Pwede — Alto Part", type: "MP3", link: "https://drive.google.com/file/d/...", notes: "Isolated track", eventId: "e2" },
    ],
  },
  {
    id: "m4",
    category: "Archive",
    items: [
      { title: "Bayang Barok 2025 — Full Repertoire", type: "Folder", link: "https://drive.google.com/drive/folders/...", notes: "14 pieces", eventId: "e5" },
      { title: "Busan 2025 Competition Pieces", type: "Folder", link: "https://drive.google.com/drive/folders/...", notes: "Award-winning set", eventId: "e3" },
    ],
  },
];

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
      .select('id, first_name, last_name, voice_section, is_admin, email, school_id, committee, membership_status')
      .order('last_name', { ascending: true });

    if (profilesData && profilesData.length > 0) {
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
        image: tcc,
        description: ev.notes ?? '',
        mySignup: null,
        file_url: ev.file_url ?? null,
      }));
    }

    // 3. All excuse requests joined with profiles (admin view needs all)
    const { data: excuseData } = await supabase
      .from('excuse_requests')
      .select('*, profiles!account_id_fk(first_name, last_name, voice_section, school_id)')
      .order('created_at', { ascending: false });

    if (excuseData && excuseData.length > 0) {
      EXCUSE_REQUESTS = excuseData.map(er => {
        const profile = (er as any).profiles;
        const firstName = profile?.first_name ?? '';
        const lastName = profile?.last_name ?? '';
        const memberName = [firstName, lastName].filter(Boolean).join(' ') || 'Unknown';
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
          notes: er.notes ?? undefined,
        };
      });
    }
  } catch {
    // On failure, keep mock data as fallback
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

    if (logs && logs.length > 0) {
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
    // On failure, keep mock data as fallback
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
  FEE_SUMMARIES,
  ANNOUNCEMENTS,
  FEE_RULES,
  ANALYTICS_MONTHLY,
  REASON_BREAKDOWN,
  SOCIAL_EVENTS,
  MUSIC_LIBRARY,
  REHEARSALS,
  CLASS_SCHEDULES,
});
