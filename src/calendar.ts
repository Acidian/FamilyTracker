import { Capacitor } from '@capacitor/core';
import { Directory, Filesystem } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import type { Course, FamilyEvent } from './domain';
import { slotsForCourse } from './domain';
export const escapeICS = (s: string) => s.replace(/\\/g, '\\\\').replace(/\r?\n/g, '\\n').replace(/;/g, '\\;').replace(/,/g, '\\,');
const stamp = (d: Date | string) => new Date(d).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
export function foldLine(line: string) { let result = ''; let count = 0; for (const char of line) { const size = new TextEncoder().encode(char).length; if (count + size > 75) { result += '\r\n '; count = 1; } result += char; count += size; } return result; }
export function eventCalendar(events: FamilyEvent[]) {
  return ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Nightlight//Family//EN', 'CALSCALE:GREGORIAN', ...events.flatMap(e => ['BEGIN:VEVENT', `UID:${e.id}@nightlight.family`, `DTSTAMP:${stamp(new Date())}`, `DTSTART:${stamp(e.startsAt)}`, `DTEND:${stamp(e.endsAt)}`, `SUMMARY:${escapeICS(e.title)}`, `LOCATION:${escapeICS(e.location)}`, `DESCRIPTION:${escapeICS(e.notes)}`, 'END:VEVENT']), 'END:VCALENDAR'].map(foldLine).join('\r\n') + '\r\n';
}
export function courseCalendar(course: Course) { return eventCalendar(slotsForCourse(course, []).map(s => ({ id: `${course.id}-${s.key}`, title: 'Medicine reminder', startsAt: s.at.toISOString(), endsAt: new Date(+s.at + 5 * 60000).toISOString(), location: '', notes: 'Open Nightlight to review the medicine details and record the dose.', memberIds: [], category: 'family' }))); }
export async function saveFile(name: string, content: string, mime = 'text/calendar') {
  if (Capacitor.isNativePlatform()) { const base64 = btoa(Array.from(new TextEncoder().encode(content), b => String.fromCharCode(b)).join('')); const result = await Filesystem.writeFile({ path: name, data: base64, directory: Directory.Cache }); await Share.share({ title: name, url: result.uri }); return; }
  const url = URL.createObjectURL(new Blob([content], { type: mime })); const a = document.createElement('a'); a.href = url; a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
}
