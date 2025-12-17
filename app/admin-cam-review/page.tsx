'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

type SubmissionRow = {
  id: string;
  created_at: string;
  cam_name: string | null;
  engine_make: string | null;
  engine_family: string | null;
  notes: string | null;
  cam_card_path: string | null;
  spec: any;
  status: string | null;
};

const BUCKET_NAME = 'cam_cards';
const TABLE = 'cse_cam_submissions_table';
const ADMINS_TABLE = 'cse_admins';

function prettyJson(v: any) {
  try {
    return JSON.stringify(v ?? {}, null, 2);
  } catch {
    return String(v ?? '');
  }
}

function escapeHtml(s: any) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => {
    const map: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
    };
    return map[c] ?? c;
  });
}

export default function AdminCamReviewPage() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

  const supabase: SupabaseClient | null = useMemo(() => {
    if (!supabaseUrl || !supabaseAnonKey) return null;
    return createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });
  }, [supabaseUrl, supabaseAnonKey]);

  const [adminState, setAdminState] = useState<'checking' | 'not_logged_in' | 'not_admin' | 'ok' | 'error'>('checking');
  const [whoLine, setWhoLine] = useState('');
  const [msg, setMsg] = useState<{ text: string; kind: 'ok' | 'err' | '' }>({ text: 'Booting…', kind: '' });

  const [pending, setPending] = useState<SubmissionRow[]>([]);
  const [current, setCurrent] = useState<SubmissionRow | null>(null);
  const [denyReason, setDenyReason] = useState('');

  const [photoUrl, setPhotoUrl] = useState<string | null>(null);

  function setStatus(text: string, kind: 'ok' | 'err' | '' = '') {
    setMsg({ text, kind });
  }

  async function getPhotoUrl(path: string | null) {
    if (!supabase) return null;
    if (!path) return null;
    if (path.startsWith('http://') || path.startsWith('https://')) return path;

    const pub = supabase.storage.from(BUCKET_NAME).getPublicUrl(path);
    if (pub?.data?.publicUrl) return pub.data.publicUrl;

    const signed = await supabase.storage.from(BUCKET_NAME).createSignedUrl(path, 60 * 60);
    if (signed?.data?.signedUrl) return signed.data.signedUrl;

    return null;
  }

  async function requireAdmin() {
    if (!supabase) {
      setAdminState('error');
      setStatus('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY in Vercel.', 'err');
      return { ok: false as const };
    }

    setAdminState('checking');
    setStatus('Checking login…');

    const { data: sessionData, error: sessErr } = await supabase.auth.getSession();
    if (sessErr) {
      setAdminState('error');
      setStatus(`Auth error (getSession): ${sessErr.message}`, 'err');
      return { ok: false as const };
    }

    const session = sessionData?.session;
    if (!session?.user) {
      setAdminState('not_logged_in');
      setWhoLine('');
      setStatus('Not logged in on this domain. Open /login first, then come back here.', 'err');
      return { ok: false as const };
    }

    const user = session.user;
    setWhoLine(user.email ? `Logged in: ${user.email}` : `Logged in: ${user.id}`);
    setStatus('Checking admin access…');

    // IMPORTANT: this select requires a SELECT policy on cse_admins for authenticated users
    // allowing them to read their own row (user_id = auth.uid()).
    const { data: adminRow, error: adminErr } = await supabase
      .from(ADMINS_TABLE)
      .select('user_id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (adminErr) {
      setAdminState('error');
      setStatus(`Admin check failed (RLS on ${ADMINS_TABLE}?): ${adminErr.message}`, 'err');
      return { ok: false as const, user };
    }

    if (!adminRow) {
      setAdminState('not_admin');
      setStatus(`Logged in, but not in ${ADMINS_TABLE}.`, 'err');
      return { ok: false as const, user };
    }

    setAdminState('ok');
    setStatus('Admin OK. Loading queue…', 'ok');
    return { ok: true as const, user };
  }

  async function loadQueue() {
    if (!supabase) return;

    setStatus('Loading pending queue…');

    const { data, error } = await supabase
      .from(TABLE)
      .select('id, created_at, cam_name, engine_make, engine_family, notes, cam_card_path, spec, status')
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (error) {
      setPending([]);
      setCurrent(null);
      setPhotoUrl(null);
      setStatus(`Queue load failed (likely RLS on ${TABLE}): ${error.message}`, 'err');
      return;
    }

    const rows = (data ?? []) as SubmissionRow[];
    setPending(rows);
    setStatus(`Loaded ${rows.length} pending cams.`, 'ok');

    if (rows.length) {
      selectRow(rows[0].id, rows);
    } else {
      setCurrent(null);
      setPhotoUrl(null);
    }
  }

  async function selectRow(id: string, listOverride?: SubmissionRow[]) {
    const list = listOverride ?? pending;
    const row = list.find((x) => x.id === id) || null;
    setCurrent(row);
    setDenyReason('');

    if (!row) {
      setPhotoUrl(null);
      return;
    }

    setPhotoUrl(null);
    const url = await getPhotoUrl(row.cam_card_path);
    setPhotoUrl(url);
  }

  async function setStatusOnCurrent(newStatus: 'approved' | 'denied') {
    if (!supabase || !current) return;

    setStatus(`${newStatus.toUpperCase()}…`);

    const updates: any = { status: newStatus };

    if (newStatus === 'denied' && denyReason.trim()) {
      const existing = current.notes ? String(current.notes) : '';
      updates.notes = (existing ? existing + '\n\n' : '') + `[ADMIN DENIAL]: ${denyReason.trim()}`;
    }

    const { error } = await supabase.from(TABLE).update(updates).eq('id', current.id);

    if (error) {
      setStatus(`Update failed (RLS on ${TABLE}): ${error.message}`, 'err');
      return;
    }

    setStatus(`Updated to ${newStatus}.`, 'ok');

    // remove from local list
    const next = pending.filter((x) => x.id !== current.id);
    setPending(next);

    if (next.length) {
      await selectRow(next[0].id, next);
    } else {
      setCurrent(null);
      setPhotoUrl(null);
    }
  }

  async function signOut() {
    if (!supabase) return;
    await supabase.auth.signOut();
    location.reload();
  }

  useEffect(() => {
    let mounted = true;

    (async () => {
      const res = await requireAdmin();
      if (!mounted) return;
      if (res.ok) {
        await loadQueue();
      }
    })().catch((e) => {
      console.error(e);
      setAdminState('error');
      setStatus(`Boot error: ${e?.message || String(e)}`, 'err');
    });

    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const adminLabel =
    adminState === 'checking'
      ? 'Checking admin…'
      : adminState === 'ok'
      ? 'Admin: OK'
      : adminState === 'not_logged_in'
      ? 'Not logged in'
      : adminState === 'not_admin'
      ? 'Not admin'
      : 'Admin error';

  return (
    <div style={{ minHeight: '100vh', padding: 16, color: '#e5e7eb', fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, sans-serif',
      background:
        'radial-gradient(circle at 10% 0%, rgba(56,189,248,.18), transparent 45%),' +
        'radial-gradient(circle at 90% 0%, rgba(244,114,182,.16), transparent 45%),' +
        'radial-gradient(circle at 50% 100%, rgba(167,139,250,.12), transparent 55%),' +
        'linear-gradient(180deg, #050816, #020617)'
    }}>
      <div style={{
        maxWidth: 1200, margin: '0 auto',
        background: 'rgba(2,6,23,.65)', border: '1px solid rgba(56,189,248,.35)',
        borderRadius: 18, padding: 14, boxShadow: '0 18px 46px rgba(0,0,0,.55)',
        display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', flexWrap: 'wrap'
      }}>
        <div>
          <div style={{ fontWeight: 900, letterSpacing: '.14em', textTransform: 'uppercase', color: '#7dd3fc', fontSize: 14 }}>
            Cam Spec Elite — Admin Moderation
          </div>
          <div style={{ fontSize: 12, color: '#cbd5f5' }}>
            Review pending cam submissions. Preview photo + specs. Approve or deny in one click.
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ padding: '7px 10px', borderRadius: 999, border: '1px solid rgba(56,189,248,.35)', background: 'rgba(2,6,23,.55)', fontSize: 12 }}>
            <b>{adminLabel}</b>
          </div>
          <div style={{ padding: '7px 10px', borderRadius: 999, border: '1px solid rgba(56,189,248,.35)', background: 'rgba(2,6,23,.55)', fontSize: 12 }}>
            Queue: <b>{pending.length}</b>
          </div>
          <button
            onClick={loadQueue}
            style={{ cursor: 'pointer', borderRadius: 12, padding: '10px 12px', fontWeight: 800, border: '1px solid rgba(148,163,184,.25)', background: 'rgba(2,6,23,.55)', color: '#e5e7eb' }}
          >
            Refresh Queue
          </button>
          <button
            onClick={signOut}
            style={{ cursor: 'pointer', border: 'none', borderRadius: 12, padding: '10px 12px', fontWeight: 900, color: '#06101a',
              background: 'linear-gradient(90deg, rgba(56,189,248,.95), rgba(244,114,182,.9))' }}
          >
            Sign Out
          </button>
        </div>
      </div>

      <div style={{ maxWidth: 1200, margin: '14px auto 0', display: 'grid', gridTemplateColumns: '1.05fr 1.95fr', gap: 14 }}>
        {/* Left list */}
        <div style={{
          background: 'rgba(2,6,23,.75)', border: '1px solid rgba(56,189,248,.35)', borderRadius: 18,
          boxShadow: '0 18px 46px rgba(0,0,0,.55)', overflow: 'hidden'
        }}>
          <div style={{ padding: '12px 14px', borderBottom: '1px solid rgba(56,189,248,.22)',
            background: 'linear-gradient(135deg, rgba(56,189,248,.08), rgba(244,114,182,.06))',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontSize: 13, letterSpacing: '.12em', textTransform: 'uppercase', color: '#bfe9ff', fontWeight: 900 }}>Pending Queue</div>
            <span style={{ fontSize: 11, padding: '4px 8px', borderRadius: 999, border: '1px solid rgba(245,158,11,.45)', color: '#fde68a' }}>pending</span>
          </div>

          <div style={{ maxHeight: 'calc(100vh - 190px)', overflow: 'auto' }}>
            {!pending.length ? (
              <div style={{ padding: 12 }}>
                <div style={{ fontWeight: 900 }}>No pending cams 🎉</div>
                <div style={{ fontSize: 12, color: '#cbd5f5' }}>
                  {msg.kind === 'err' ? 'Check the Status box for the exact error.' : 'Nothing to review right now.'}
                </div>
              </div>
            ) : (
              pending.map((r) => {
                const active = current?.id === r.id;
                return (
                  <div
                    key={r.id}
                    onClick={() => selectRow(r.id)}
                    style={{
                      padding: '12px 14px',
                      borderBottom: '1px solid rgba(148,163,184,.12)',
                      cursor: 'pointer',
                      background: active ? 'rgba(244,114,182,.07)' : 'transparent',
                      borderLeft: active ? '3px solid rgba(244,114,182,.65)' : '3px solid transparent',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
                      <div style={{ fontWeight: 900 }}>{r.cam_name || '(No name)'}</div>
                      <span style={{ fontSize: 11, padding: '4px 8px', borderRadius: 999, border: '1px solid rgba(245,158,11,.45)', color: '#fde68a' }}>pending</span>
                    </div>
                    <div style={{ marginTop: 4, fontSize: 11, color: '#cbd5f5' }}>
                      {r.engine_make || '—'} • {r.engine_family || '—'} • {new Date(r.created_at).toLocaleString()}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right detail */}
        <div style={{
          background: 'rgba(2,6,23,.75)', border: '1px solid rgba(56,189,248,.35)', borderRadius: 18,
          boxShadow: '0 18px 46px rgba(0,0,0,.55)', overflow: 'hidden'
        }}>
          <div style={{ padding: '12px 14px', borderBottom: '1px solid rgba(56,189,248,.22)',
            background: 'linear-gradient(135deg, rgba(56,189,248,.08), rgba(244,114,182,.06))',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontSize: 13, letterSpacing: '.12em', textTransform: 'uppercase', color: '#bfe9ff', fontWeight: 900 }}>Review</div>
            <span style={{ fontSize: 11, padding: '4px 8px', borderRadius: 999, border: '1px solid rgba(148,163,184,.22)', color: '#dbeafe' }}>
              {current?.status || '—'}
            </span>
          </div>

          <div style={{ padding: 14, display: 'grid', gridTemplateColumns: '1.05fr 1fr', gap: 14 }}>
            <div style={{ border: '1px solid rgba(148,163,184,.16)', borderRadius: 16, background: 'rgba(2,6,23,.45)', padding: 12 }}>
              <div style={{ fontSize: 11, color: '#cbd5f5', letterSpacing: '.08em', textTransform: 'uppercase' }}>Cam Name</div>
              <div style={{ fontSize: 13, fontWeight: 900, marginTop: 4 }}>{current?.cam_name || 'Select a cam…'}</div>

              <div style={{ height: 10 }} />

              <div style={{ fontSize: 11, color: '#cbd5f5', letterSpacing: '.08em', textTransform: 'uppercase' }}>Engine</div>
              <div style={{ fontSize: 12, color: '#cbd5f5' }}>
                {current ? `${current.engine_make || '—'} • ${current.engine_family || '—'}` : '—'}
              </div>

              <div style={{ height: 10 }} />

              <div style={{ fontSize: 11, color: '#cbd5f5', letterSpacing: '.08em', textTransform: 'uppercase' }}>Notes</div>
              <div style={{ fontSize: 12, color: '#cbd5f5' }}>{current?.notes || '—'}</div>

              <div style={{ height: 12 }} />

              <div style={{ fontSize: 11, color: '#cbd5f5', letterSpacing: '.08em', textTransform: 'uppercase' }}>
                Denial Reason (optional)
              </div>
              <textarea
                value={denyReason}
                onChange={(e) => setDenyReason(e.target.value)}
                placeholder="Example: photo is blurry, missing duration/LSA, bad data, etc."
                style={{
                  width: '100%',
                  minHeight: 90,
                  borderRadius: 14,
                  padding: '10px 12px',
                  border: '1px solid rgba(56,189,248,.22)',
                  background: 'rgba(2,6,23,.55)',
                  color: '#e5e7eb',
                  outline: 'none',
                  resize: 'vertical',
                  marginTop: 6,
                }}
              />

              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 10 }}>
                <button
                  disabled={!current}
                  onClick={() => setStatusOnCurrent('approved')}
                  style={{
                    cursor: current ? 'pointer' : 'not-allowed',
                    border: 'none',
                    borderRadius: 12,
                    padding: '10px 12px',
                    fontWeight: 900,
                    background: 'linear-gradient(90deg, rgba(34,197,94,.95), rgba(56,189,248,.85))',
                    color: '#04120b',
                    opacity: current ? 1 : 0.6,
                  }}
                >
                  Approve
                </button>

                <button
                  disabled={!current}
                  onClick={() => setStatusOnCurrent('denied')}
                  style={{
                    cursor: current ? 'pointer' : 'not-allowed',
                    border: 'none',
                    borderRadius: 12,
                    padding: '10px 12px',
                    fontWeight: 900,
                    background: 'linear-gradient(90deg, rgba(239,68,68,.95), rgba(244,114,182,.85))',
                    color: '#1b070a',
                    opacity: current ? 1 : 0.6,
                  }}
                >
                  Deny
                </button>

                <button
                  disabled={!photoUrl}
                  onClick={() => photoUrl && window.open(photoUrl, '_blank', 'noopener,noreferrer')}
                  style={{
                    cursor: photoUrl ? 'pointer' : 'not-allowed',
                    borderRadius: 12,
                    padding: '10px 12px',
                    fontWeight: 900,
                    border: '1px solid rgba(148,163,184,.25)',
                    background: 'rgba(2,6,23,.55)',
                    color: '#e5e7eb',
                    opacity: photoUrl ? 1 : 0.6,
                  }}
                >
                  Open Photo
                </button>
              </div>

              <div style={{
                marginTop: 12,
                padding: '10px 12px',
                borderRadius: 14,
                border: '1px solid rgba(148,163,184,.18)',
                background: 'rgba(2,6,23,.55)',
                fontSize: 12,
                display: 'flex',
                justifyContent: 'space-between',
                gap: 10,
                flexWrap: 'wrap'
              }}>
                <span>
                  <b>Status:</b>{' '}
                  <span style={{ color: msg.kind === 'err' ? '#fecaca' : msg.kind === 'ok' ? '#bbf7d0' : '#e5e7eb' }}>
                    {msg.text}
                  </span>
                </span>
                <span>{whoLine}</span>
              </div>
            </div>

            <div style={{ border: '1px solid rgba(148,163,184,.16)', borderRadius: 16, background: 'rgba(2,6,23,.45)', padding: 12 }}>
              <div style={{ fontSize: 11, color: '#cbd5f5', letterSpacing: '.08em', textTransform: 'uppercase' }}>Cam Card Photo</div>
              <div style={{
                borderRadius: 16, overflow: 'hidden',
                border: '1px solid rgba(56,189,248,.22)',
                background: 'rgba(2,6,23,.55)',
                minHeight: 240,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginTop: 8
              }}>
                {current ? (
                  photoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img alt="Cam card photo" src={photoUrl} style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }} />
                  ) : (
                    <div style={{ fontSize: 12, color: '#cbd5f5', padding: 10, textAlign: 'center' }}
                      dangerouslySetInnerHTML={{
                        __html:
                          `No photo found OR cam_card_path not readable.<br/><br/><b>cam_card_path:</b> ${escapeHtml(current.cam_card_path || '—')}`,
                      }}
                    />
                  )
                ) : (
                  <div style={{ fontSize: 12, color: '#cbd5f5', padding: 10, textAlign: 'center' }}>
                    Select a cam to preview its uploaded cam card photo.
                  </div>
                )}
              </div>

              <div style={{ height: 12 }} />

              <div style={{ fontSize: 11, color: '#cbd5f5', letterSpacing: '.08em', textTransform: 'uppercase' }}>Specs (JSON)</div>
              <div style={{ marginTop: 8, padding: 10, borderRadius: 14, border: '1px solid rgba(148,163,184,.16)', background: 'rgba(2,6,23,.55)' }}>
                <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontSize: 12, lineHeight: 1.35 }}>
                  {current ? prettyJson(current.spec) : '—'}
                </pre>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @media (max-width: 980px) {
          div[style*="grid-template-columns: 1.05fr 1.95fr"] {
            grid-template-columns: 1fr !important;
          }
          div[style*="grid-template-columns: 1.05fr 1fr"] {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
