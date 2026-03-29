import { useState } from 'react'
import { Page } from '../types'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

interface Props {
  onNavigate: (page: Page) => void
  theme: 'dark' | 'light'
  onThemeChange: (theme: 'dark' | 'light') => void
}

export default function Settings({ onNavigate, theme, onThemeChange }: Props) {
  const { user, signOut } = useAuth()
  const [signOutConfirm, setSignOutConfirm] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const handleDeleteAccount = async () => {
    if (!user) return
    setDeleting(true)
    await supabase.from('workouts').delete().eq('user_id', user.id)
    await supabase.from('user_settings').delete().eq('user_id', user.id)
    await signOut()
  }

  const email = user?.email ?? ''
  const displayName = (user?.user_metadata?.full_name as string | undefined) ?? email.split('@')[0]

  return (
    <div style={{ fontFamily: "'DM Sans', -apple-system, sans-serif", padding: '0 0 100px' }}>
      {/* Header */}
      <div style={{
        padding: '20px 24px 0',
        display: 'flex', alignItems: 'center', gap: 14,
      }}>
        <button
          onClick={() => onNavigate('dashboard')}
          style={{
            background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 10, width: 36, height: 36, display: 'flex',
            alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0,
          }}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M10 3L5 8l5 5" stroke="rgba(255,255,255,0.7)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: 'rgba(255,255,255,0.9)', letterSpacing: '-0.02em' }}>
          Settings
        </h1>
      </div>

      <div style={{ padding: '24px 24px 0', display: 'flex', flexDirection: 'column', gap: 24 }}>

        {/* About me */}
        <section>
          <p style={{ margin: '0 0 12px', fontSize: 11, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 500 }}>
            Account
          </p>
          <div style={{
            background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: 14, padding: '16px 18px', display: 'flex', alignItems: 'center', gap: 14,
          }}>
            <div style={{
              width: 44, height: 44, borderRadius: 22,
              background: 'linear-gradient(135deg, #F97316 0%, #EA580C 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 18, fontWeight: 700, color: 'white', flexShrink: 0,
            }}>
              {displayName.charAt(0).toUpperCase()}
            </div>
            <div>
              <p style={{ margin: 0, fontSize: 15, fontWeight: 500, color: 'rgba(255,255,255,0.9)' }}>{displayName}</p>
              <p style={{ margin: '2px 0 0', fontSize: 12, color: 'rgba(255,255,255,0.35)' }}>{email}</p>
            </div>
          </div>
        </section>

        {/* Appearance */}
        <section>
          <p style={{ margin: '0 0 12px', fontSize: 11, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 500 }}>
            Appearance
          </p>
          <div style={{
            background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: 14, overflow: 'hidden',
          }}>
            <div style={{
              padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 32, height: 32, borderRadius: 8,
                  background: 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {theme === 'dark' ? (
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path d="M13.5 10.5A6 6 0 015.5 2.5a6 6 0 108 8z" fill="rgba(255,255,255,0.7)" />
                    </svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <circle cx="8" cy="8" r="3" fill="rgba(255,255,255,0.7)" />
                      <line x1="8" y1="1" x2="8" y2="3" stroke="rgba(255,255,255,0.7)" strokeWidth="1.5" strokeLinecap="round" />
                      <line x1="8" y1="13" x2="8" y2="15" stroke="rgba(255,255,255,0.7)" strokeWidth="1.5" strokeLinecap="round" />
                      <line x1="1" y1="8" x2="3" y2="8" stroke="rgba(255,255,255,0.7)" strokeWidth="1.5" strokeLinecap="round" />
                      <line x1="13" y1="8" x2="15" y2="8" stroke="rgba(255,255,255,0.7)" strokeWidth="1.5" strokeLinecap="round" />
                      <line x1="2.9" y1="2.9" x2="4.3" y2="4.3" stroke="rgba(255,255,255,0.7)" strokeWidth="1.5" strokeLinecap="round" />
                      <line x1="11.7" y1="11.7" x2="13.1" y2="13.1" stroke="rgba(255,255,255,0.7)" strokeWidth="1.5" strokeLinecap="round" />
                      <line x1="2.9" y1="13.1" x2="4.3" y2="11.7" stroke="rgba(255,255,255,0.7)" strokeWidth="1.5" strokeLinecap="round" />
                      <line x1="11.7" y1="4.3" x2="13.1" y2="2.9" stroke="rgba(255,255,255,0.7)" strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                  )}
                </div>
                <div>
                  <p style={{ margin: 0, fontSize: 15, fontWeight: 500, color: 'rgba(255,255,255,0.9)' }}>
                    {theme === 'dark' ? 'Dark mode' : 'Light mode'}
                  </p>
                  <p style={{ margin: '2px 0 0', fontSize: 12, color: 'rgba(255,255,255,0.35)' }}>
                    {theme === 'dark' ? 'Switch to light' : 'Switch to dark'}
                  </p>
                </div>
              </div>
              {/* Toggle switch */}
              <div
                onClick={() => onThemeChange(theme === 'dark' ? 'light' : 'dark')}
                style={{
                  width: 44, height: 26, borderRadius: 13,
                  background: theme === 'light' ? '#F97316' : 'rgba(255,255,255,0.12)',
                  cursor: 'pointer', position: 'relative', transition: 'background 0.25s ease',
                  flexShrink: 0,
                }}
              >
                <div style={{
                  position: 'absolute', top: 3,
                  left: theme === 'light' ? 21 : 3,
                  width: 20, height: 20, borderRadius: 10,
                  background: 'white', transition: 'left 0.25s ease',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
                }} />
              </div>
            </div>
          </div>
        </section>

        {/* Account actions */}
        <section>
          <p style={{ margin: '0 0 12px', fontSize: 11, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 500 }}>
            Account actions
          </p>
          <div style={{
            background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: 14, overflow: 'hidden',
          }}>
            <button
              onClick={() => setSignOutConfirm(true)}
              style={{
                width: '100%', padding: '14px 18px', background: 'none', border: 'none',
                display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer',
                borderBottom: '1px solid rgba(255,255,255,0.05)',
              }}
            >
              <div style={{
                width: 32, height: 32, borderRadius: 8,
                background: 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M6 14H3a1 1 0 01-1-1V3a1 1 0 011-1h3" stroke="rgba(255,255,255,0.5)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M10 11l3-3-3-3M13 8H6" stroke="rgba(255,255,255,0.5)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <span style={{ fontSize: 15, fontWeight: 500, color: 'rgba(255,255,255,0.7)', fontFamily: 'inherit' }}>
                Sign out
              </span>
            </button>
            <button
              onClick={() => setDeleteConfirm(true)}
              style={{
                width: '100%', padding: '14px 18px', background: 'none', border: 'none',
                display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer',
              }}
            >
              <div style={{
                width: 32, height: 32, borderRadius: 8,
                background: 'rgba(239,68,68,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M2 4h12M5 4V2.5A.5.5 0 015.5 2h5a.5.5 0 01.5.5V4M6 7v5M10 7v5M3 4l1 9.5a.5.5 0 00.5.5h7a.5.5 0 00.5-.5L13 4" stroke="#ef4444" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <div style={{ textAlign: 'left' }}>
                <p style={{ margin: 0, fontSize: 15, fontWeight: 500, color: '#ef4444', fontFamily: 'inherit' }}>
                  Remove my data
                </p>
                <p style={{ margin: '2px 0 0', fontSize: 12, color: 'rgba(255,255,255,0.3)', fontFamily: 'inherit' }}>
                  Deletes all workouts and settings
                </p>
              </div>
            </button>
          </div>
        </section>

        {/* About */}
        <section>
          <p style={{ margin: '0 0 12px', fontSize: 11, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 500 }}>
            About
          </p>
          <div style={{
            background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: 14, padding: '16px 18px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <p style={{ margin: 0, fontSize: 15, fontWeight: 500, color: 'rgba(255,255,255,0.9)' }}>LiftTracker</p>
              <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.25)', fontFamily: "'Space Mono', monospace" }}>v1.0</span>
            </div>
            <p style={{ margin: '8px 0 0', fontSize: 13, color: 'rgba(255,255,255,0.35)', lineHeight: 1.5 }}>
              Built for people who actually show up. No fluff, no noise — just your lifts, your progress, your gains. Now stop reading and go train.
            </p>
          </div>
        </section>

      </div>

      {/* Sign out confirmation modal */}
      {signOutConfirm && (
        <div
          onClick={() => setSignOutConfirm(false)}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
            backdropFilter: 'blur(4px)', zIndex: 200,
            display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: '#1a1d24', borderRadius: '20px 20px 0 0',
              border: '1px solid rgba(255,255,255,0.08)',
              padding: '24px 24px 40px', width: '100%', maxWidth: 512,
            }}
          >
            <p style={{ margin: '0 0 6px', fontSize: 18, fontWeight: 600, color: 'rgba(255,255,255,0.9)' }}>
              Sign out?
            </p>
            <p style={{ margin: '0 0 24px', fontSize: 14, color: 'rgba(255,255,255,0.4)', lineHeight: 1.5 }}>
              You'll need to sign back in to access your workouts.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <button
                onClick={signOut}
                style={{
                  padding: '14px', borderRadius: 12, border: 'none',
                  background: 'rgba(255,255,255,0.1)', color: 'white',
                  fontSize: 15, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer',
                }}
              >
                Yes, sign out
              </button>
              <button
                onClick={() => setSignOutConfirm(false)}
                style={{
                  padding: '14px', borderRadius: 12,
                  background: 'none', border: '1px solid rgba(255,255,255,0.08)',
                  color: 'rgba(255,255,255,0.5)', fontSize: 15, fontFamily: 'inherit', cursor: 'pointer',
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirmation modal */}
      {deleteConfirm && (
        <div
          onClick={() => setDeleteConfirm(false)}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
            backdropFilter: 'blur(4px)', zIndex: 200,
            display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: '#1a1d24', borderRadius: '20px 20px 0 0',
              border: '1px solid rgba(255,255,255,0.08)',
              padding: '24px 24px 40px', width: '100%', maxWidth: 512,
            }}
          >
            <p style={{ margin: '0 0 6px', fontSize: 18, fontWeight: 600, color: 'rgba(255,255,255,0.9)' }}>
              Remove all data?
            </p>
            <p style={{ margin: '0 0 24px', fontSize: 14, color: 'rgba(255,255,255,0.4)', lineHeight: 1.5 }}>
              This will permanently delete all your workouts and settings. This action cannot be undone.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <button
                onClick={handleDeleteAccount}
                disabled={deleting}
                style={{
                  padding: '14px', borderRadius: 12, border: 'none',
                  background: deleting ? 'rgba(239,68,68,0.4)' : '#ef4444',
                  color: 'white', fontSize: 15, fontWeight: 600,
                  fontFamily: 'inherit', cursor: deleting ? 'not-allowed' : 'pointer',
                }}
              >
                {deleting ? 'Deleting...' : 'Yes, delete everything'}
              </button>
              <button
                onClick={() => setDeleteConfirm(false)}
                style={{
                  padding: '14px', borderRadius: 12,
                  background: 'none', border: '1px solid rgba(255,255,255,0.08)',
                  color: 'rgba(255,255,255,0.5)', fontSize: 15, fontFamily: 'inherit', cursor: 'pointer',
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
