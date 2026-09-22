import { expect, it } from 'vitest';
import { escapeICS, eventCalendar, foldLine } from './calendar';
it('escapes calendar injection and folds by UTF-8 octets', () => { expect(escapeICS('hello,world;\nEND:VEVENT')).toBe('hello\\,world\\;\\nEND:VEVENT'); for (const line of foldLine('é'.repeat(90)).split('\r\n')) expect(new TextEncoder().encode(line).length).toBeLessThanOrEqual(75); });
it('exports a valid bounded event with stable identity', () => { const s = eventCalendar([{ id: 'abc', title: 'Trip', startsAt: '2026-09-22T08:00:00Z', endsAt: '2026-09-22T09:00:00Z', notes: '', location: '', memberIds: [], category: 'school' }]); expect(s).toContain('UID:abc@nightlight.family'); expect(s).toContain('DTSTART:20260922T080000Z'); expect(s).toContain('DTEND:20260922T090000Z'); });
