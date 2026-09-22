import type { ReactNode } from 'react';
import { ArrowLeft, LoaderCircle, Moon, Plus } from 'lucide-react';
import type { Member } from '../domain';
export function Avatar({ member, small = false }: { member: Member; small?: boolean }) { return <span aria-hidden="true" className={`avatar color-${member.color % 5} ${small ? 'small' : ''}`}>{member.name.trim().slice(0, 1).toUpperCase()}</span>; }
export function PageHeader({ eyebrow, title, children }: { eyebrow: string; title: string; children?: ReactNode }) { return <header className="page-header"><div><p className="eyebrow">{eyebrow}</p><h1>{title}</h1></div>{children}</header>; }
export function Panel({ title, subtitle, back, children }: { title: string; subtitle?: string; back: () => void; children: ReactNode }) { return <section className="form-page"><button className="back" onClick={back}><ArrowLeft size={18}/> Back</button><h1>{title}</h1>{subtitle && <p className="intro">{subtitle}</p>}{children}</section>; }
export function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) { return <label className="field"><span>{label}</span>{children}{hint && <small>{hint}</small>}</label>; }
export function Empty({ title, text, action, onAction }: { title: string; text: string; action?: string; onAction?: () => void }) { return <div className="empty"><span className="empty-icon"><Moon size={28}/></span><h3>{title}</h3><p>{text}</p>{action && <button className="primary" onClick={onAction}><Plus size={18}/>{action}</button>}</div>; }
export function Submit({ busy, children }: { busy: boolean; children: ReactNode }) { return <button className="primary full" type="submit" disabled={busy}>{busy ? <><LoaderCircle className="spin" size={18}/> Saving…</> : children}</button>; }
export function ErrorMessage({ message }: { message: string }) { return message ? <p className="form-error" role="alert">{message}</p> : null; }
