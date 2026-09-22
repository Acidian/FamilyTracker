import { createContext, useContext, useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { createClient } from '@supabase/supabase-js';
import { applyOperation, emptyFamily } from './domain';
import type { FamilyData, Operation } from './domain';

const url = import.meta.env.VITE_SUPABASE_URL; const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
export const cloud = url && key ? createClient(url, key) : null;
const STORAGE = 'nightlight-family-v1';
type Snapshot = { data: FamilyData; demo: boolean };
function readLocal(): Snapshot { try { const raw = localStorage.getItem(STORAGE); if (raw) { const s = JSON.parse(raw); if (s.data?.members && s.data?.courses && s.data?.doses && s.data?.events && s.data?.notes) return s; } } catch { /* Keep corrupt data untouched; a new save will report storage errors. */ } return { data: emptyFamily(), demo: false }; }
type Store = { data: FamilyData; demo: boolean; busy: boolean; online: boolean; email: string | null; household: string | null; syncError: string; ready: boolean; dispatch: (op: Operation) => Promise<void>; replaceLocal: (data: FamilyData, demo: boolean) => void; signIn: (email: string, password: string, signup: boolean) => Promise<string>; signOut: () => Promise<void>; createHousehold: () => Promise<void>; joinHousehold: (code: string) => Promise<void>; invite: () => Promise<string>; refresh: () => Promise<void> };
const Context = createContext<Store | null>(null);
export const useFamily = () => { const c = useContext(Context); if (!c) throw new Error('Missing family provider'); return c; };
export function FamilyProvider({ children }: { children: ReactNode }) {
  const [snapshot, setSnapshot] = useState(readLocal); const [email, setEmail] = useState<string | null>(null); const [household, setHousehold] = useState<string | null>(null); const [busy, setBusy] = useState(false); const [ready, setReady] = useState(!cloud); const [online, setOnline] = useState(navigator.onLine); const [syncError, setSyncError] = useState('');
  const current = useRef(snapshot); const lock = useRef(false); current.current = snapshot;
  const commit = (next: Snapshot, persist = true) => { if (persist) localStorage.setItem(STORAGE, JSON.stringify(next)); current.current = next; setSnapshot(next); };
  async function loadHousehold() {
    if (!cloud) return;
    const { data: session } = await cloud.auth.getSession(); setEmail(session.session?.user.email ?? null);
    if (!session.session) { setHousehold(null); setSnapshot(readLocal()); setReady(true); return; }
    const { data: membership, error } = await cloud.from('household_members').select('household_id').eq('user_id', session.session.user.id).maybeSingle(); if (error) throw error;
    if (membership) { const { data, error: e } = await cloud.from('households').select('id,state,revision').eq('id', membership.household_id).single(); if (e) throw e; setHousehold(data.id); commit({ data: data.state as FamilyData, demo: false }, false); } else { setHousehold(null); }
    setSyncError(''); setReady(true);
  }
  useEffect(() => {
    const on = () => setOnline(true); const off = () => setOnline(false); window.addEventListener('online', on); window.addEventListener('offline', off);
    void loadHousehold().catch(e => { setSyncError(e.message); setReady(true); });
    const sub = cloud?.auth.onAuthStateChange(() => { setTimeout(() => { void loadHousehold().catch(e => setSyncError(e.message)); }, 0); });
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off); sub?.data.subscription.unsubscribe(); };
  }, []);
  useEffect(() => {
    if (!household || !cloud) return;
    const refresh = () => { if (!lock.current && navigator.onLine) void loadHousehold().catch(e => setSyncError(e.message)); };
    const timer = setInterval(refresh, 10000); window.addEventListener('focus', refresh); window.addEventListener('online', refresh);
    const channel = cloud.channel(`family:${household}`).on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'households', filter: `id=eq.${household}` }, refresh).subscribe();
    return () => { clearInterval(timer); window.removeEventListener('focus', refresh); window.removeEventListener('online', refresh); void cloud?.removeChannel(channel); };
  }, [household]);
  async function dispatch(op: Operation) {
    if (lock.current) throw new Error('Please wait for the current change to save.');
    lock.current = true; setBusy(true);
    try {
      if (!household || !cloud) { commit({ ...current.current, data: applyOperation(current.current.data, op) }); return; }
      if (!navigator.onLine) throw new Error('Reconnect before changing shared records. Another parent may have already recorded this dose.');
      for (let attempt = 0; attempt < 4; attempt++) {
        const { data: row, error } = await cloud.from('households').select('state,revision').eq('id', household).single(); if (error) throw error;
        const next = applyOperation(row.state as FamilyData, op);
        const { data: success, error: saveError } = await cloud.rpc('save_household', { p_id: household, p_revision: row.revision, p_state: next }); if (saveError) throw saveError;
        if (success) { commit({ data: next, demo: false }, false); setSyncError(''); return; }
      }
      throw new Error('The family record changed. Please refresh and try again.');
    } finally { lock.current = false; setBusy(false); }
  }
  const value: Store = { data: snapshot.data, demo: snapshot.demo, busy, online, email, household, syncError, ready, dispatch,
    replaceLocal(data, demo) { if (household) throw new Error('Demo data is only available in device-only mode.'); commit({ data, demo }); },
    async signIn(email, password, signup) { if (!cloud) throw new Error('Shared access has not been configured for this build.'); const { data, error } = signup ? await cloud.auth.signUp({ email, password }) : await cloud.auth.signInWithPassword({ email, password }); if (error) throw error; await loadHousehold(); return data.session ? 'Signed in.' : 'Check your email to confirm your account, then sign in.'; },
    async signOut() { if (cloud) { const { error } = await cloud.auth.signOut(); if (error) throw error; } setEmail(null); setHousehold(null); setSnapshot(readLocal()); },
    async createHousehold() { if (!cloud) throw new Error('Shared access is not configured.'); if (snapshot.demo) throw new Error('Leave the demo before creating your shared family.'); const { error } = await cloud.rpc('create_household', { p_state: current.current.data }); if (error) throw error; await loadHousehold(); },
    async joinHousehold(code) { if (!cloud) throw new Error('Shared access is not configured.'); const { error } = await cloud.rpc('join_household', { p_code: code.trim() }); if (error) throw error; await loadHousehold(); },
    async invite() { if (!cloud || !household) throw new Error('Create a shared family first.'); const { data, error } = await cloud.rpc('rotate_invite', { p_id: household }); if (error) throw error; return data as string; },
    refresh: loadHousehold,
  };
  return <Context.Provider value={value}>{children}</Context.Provider>;
}
