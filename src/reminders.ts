import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';
import { addDays, allSlots, dateKey } from './domain';
import type { FamilyData } from './domain';
export const nativeReminders = () => Capacitor.isNativePlatform();
export async function syncReminders(data: FamilyData, request = false) {
  if (!nativeReminders()) throw new Error('Background reminders are available in the Android app. On the web, export the course to your calendar for reminders.');
  const permission = request ? await LocalNotifications.requestPermissions() : await LocalNotifications.checkPermissions();
  if (permission.display !== 'granted') throw new Error('Notifications are disabled. Enable them in your phone’s settings.');
  const pending = await LocalNotifications.getPending();
  if (pending.notifications.length) await LocalNotifications.cancel({ notifications: pending.notifications.map(n => ({ id: n.id })) });
  const slots = allSlots(data, dateKey(), addDays(dateKey(), 14)).filter(s => !s.record && +s.at > Date.now()).slice(0, 60);
  if (slots.length) await LocalNotifications.schedule({ notifications: slots.map((s, i) => ({ id: i + 1, title: 'Family medicine reminder', body: 'Open Nightlight to check the latest record before giving a dose.', schedule: { at: s.at, allowWhileIdle: true }, extra: { courseId: s.course.id, slot: s.key } })) });
  return slots.length;
}
