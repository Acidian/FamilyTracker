export type Member = { id: string; name: string; role: 'parent' | 'child'; color: number };
export type Course = { id: string; memberId: string; name: string; strength: string; amount: number; unit: string; startDate: string; days: number; times: string[]; instructions: string; stoppedAt?: string };
export type Dose = { id: string; courseId: string; slot: string; actualAt: string; recordedAt: string; by: string; amount: number; unit: string; status: 'given' | 'skipped'; note: string; voidedAt?: string; voidReason?: string };
export type FamilyEvent = { id: string; title: string; startsAt: string; endsAt: string; memberIds: string[]; category: 'school' | 'play' | 'family' | 'appointment'; location: string; notes: string };
export type CaptureNote = { id: string; text: string; memberId: string; createdAt: string; image?: string };
export type FamilyData = { members: Member[]; courses: Course[]; doses: Dose[]; events: FamilyEvent[]; notes: CaptureNote[] };
export type Slot = { key: string; at: Date; course: Course; record?: Dose };
export type Operation = { type: 'member'; value: Member } | { type: 'course'; value: Course } | { type: 'dose'; value: Dose } | { type: 'stop'; id: string; at: string } | { type: 'void'; id: string; reason: string; at: string } | { type: 'event'; value: FamilyEvent } | { type: 'deleteEvent'; id: string } | { type: 'note'; value: CaptureNote } | { type: 'deleteNote'; id: string };

export const uid = () => crypto.randomUUID();
export const dateKey = (date = new Date()) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
export const localDate = (key: string) => new Date(`${key}T12:00:00`);
export function addDays(key: string, count: number) { const d = localDate(key); d.setDate(d.getDate() + count); return dateKey(d); }
export function datetimeInput(date = new Date()) { return `${dateKey(date)}T${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`; }
export const timeLabel = (date: Date | string) => new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
export const dayLabel = (date: Date | string) => new Date(date).toLocaleDateString([], { day: 'numeric', month: 'short' });
export function emptyFamily(): FamilyData { return { members: [{ id: 'dad', name: 'Dad', role: 'parent', color: 0 }, { id: 'mum', name: 'Mum', role: 'parent', color: 1 }, { id: 'child1', name: 'Child 1', role: 'child', color: 2 }, { id: 'child2', name: 'Child 2', role: 'child', color: 3 }, { id: 'child3', name: 'Child 3', role: 'child', color: 4 }], courses: [], doses: [], events: [], notes: [] }; }
export function demoFamily(): FamilyData {
  const d = emptyFamily(); d.members[2].name = 'Sam'; d.members[3].name = 'Mia'; d.members[4].name = 'Leo';
  d.courses = [{ id: 'demo-course', memberId: 'child1', name: 'Example medicine', strength: 'Demo only', amount: 1, unit: 'demo dose', startDate: dateKey(), days: 4, times: ['08:00', '14:00', '20:00'], instructions: 'Example data. Replace with the exact instructions on your medicine label.' }];
  d.events = [{ id: 'demo-event', title: 'School pickup', startsAt: new Date(`${dateKey()}T15:30`).toISOString(), endsAt: new Date(`${dateKey()}T16:00`).toISOString(), memberIds: ['child1', 'child2', 'child3'], category: 'school', location: 'School gates', notes: 'Remember the swimming bag.' }, { id: 'demo-play', title: "Mia’s play date", startsAt: new Date(`${addDays(dateKey(), 2)}T10:00`).toISOString(), endsAt: new Date(`${addDays(dateKey(), 2)}T12:00`).toISOString(), memberIds: ['child2'], category: 'play', location: 'At a friend’s house', notes: '' }]; return d;
}
export function slotsForCourse(course: Course, doses: Dose[], from?: string, to?: string): Slot[] {
  const result: Slot[] = [];
  for (let day = 0; day < course.days; day++) {
    const key = addDays(course.startDate, day);
    if ((from && key < from) || (to && key > to)) continue;
    for (const time of [...course.times].sort()) {
      const slot = `${key}T${time}`; const at = new Date(slot);
      if (course.stoppedAt && at >= new Date(course.stoppedAt)) continue;
      result.push({ key: slot, at, course, record: doses.find(d => d.courseId === course.id && d.slot === slot && !d.voidedAt) });
    }
  }
  return result;
}
export function allSlots(data: FamilyData, from?: string, to?: string) { return data.courses.flatMap(c => slotsForCourse(c, data.doses, from, to)).sort((a, b) => +a.at - +b.at); }
const ensure = (condition: unknown, message: string) => { if (!condition) throw new Error(message); };
export function applyOperation(data: FamilyData, op: Operation): FamilyData {
  switch (op.type) {
    case 'member': ensure(op.value.name.trim() && op.value.name.length <= 40, 'Enter a name of 1–40 characters.'); return { ...data, members: data.members.some(m => m.id === op.value.id) ? data.members.map(m => m.id === op.value.id ? op.value : m) : [...data.members, op.value] };
    case 'course': {
      const c = op.value; ensure(data.members.some(m => m.id === c.memberId), 'Choose a family member.'); ensure(c.name.trim() && c.strength.trim(), 'Enter the medicine name and strength from the label.');
      ensure(Number.isFinite(c.amount) && c.amount > 0 && c.unit.trim(), 'Enter a positive amount and its unit.');
      ensure(Number.isInteger(c.days) && c.days >= 1 && c.days <= 90, 'Courses can be 1–90 days.');
      ensure(/^\d{4}-\d{2}-\d{2}$/.test(c.startDate) && !isNaN(+localDate(c.startDate)) && dateKey(localDate(c.startDate)) === c.startDate, 'Choose a valid start date.');
      ensure(c.times.length > 0 && c.times.length <= 8 && c.times.every(t => /^([01]\d|2[0-3]):[0-5]\d$/.test(t)) && new Set(c.times).size === c.times.length, 'Choose 1–8 different, valid dose times.');
      ensure(!data.courses.some(x => x.id === c.id), 'This course has already been saved.'); return { ...data, courses: [...data.courses, c] };
    }
    case 'dose': {
      const d = op.value; const course = data.courses.find(c => c.id === d.courseId);
      ensure(course, 'This medicine course no longer exists.');
      ensure(slotsForCourse(course!, []).some(s => s.key === d.slot), 'This dose is outside the active course.');
      ensure(!data.doses.some(x => x.courseId === d.courseId && x.slot === d.slot && !x.voidedAt), 'This dose has already been recorded. Refresh to see the latest entry.');
      ensure(!isNaN(Date.parse(d.actualAt)) && Date.parse(d.actualAt) <= Date.now() + 60000, 'A dose cannot be recorded in the future.');
      ensure(d.by.trim(), 'Choose who is recording this dose.');
      ensure(d.status === 'given' || d.status === 'skipped', 'Choose given or skipped.');
      ensure(Number.isFinite(d.amount) && d.amount > 0 && d.unit.trim(), 'Enter the amount and unit actually given.');
      ensure(d.status !== 'skipped' || d.note.trim(), 'Add a reason for skipping this dose.');
      return { ...data, doses: [...data.doses, d] };
    }
    case 'stop': return { ...data, courses: data.courses.map(c => c.id === op.id ? { ...c, stoppedAt: op.at } : c) };
    case 'void': ensure(op.reason.trim(), 'Add a reason for the correction.'); return { ...data, doses: data.doses.map(d => d.id === op.id ? { ...d, voidedAt: op.at, voidReason: op.reason.trim() } : d) };
    case 'event': ensure(op.value.title.trim() && !isNaN(Date.parse(op.value.startsAt)) && Date.parse(op.value.endsAt) > Date.parse(op.value.startsAt), 'Add a title and an end time after the start.'); return { ...data, events: [...data.events.filter(e => e.id !== op.value.id), op.value] };
    case 'deleteEvent': return { ...data, events: data.events.filter(e => e.id !== op.id) };
    case 'note': ensure(op.value.text.trim() || op.value.image, 'Add a note or photo.'); return { ...data, notes: [op.value, ...data.notes] };
    case 'deleteNote': return { ...data, notes: data.notes.filter(n => n.id !== op.id) };
  }
}
