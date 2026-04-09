import { useState } from 'react'
import { useFriends } from '../hooks/useFriends'
import { useChallenges } from '../hooks/useChallenges'
import { Challenge } from '../types'
import { useAuth } from '../context/AuthContext'

interface Props {
  weeklyGoal: number
}

export default function Friends({ weeklyGoal }: Props) {
  const { user } = useAuth()
  const {
    profile, friends, pendingIncoming: friendRequests, pendingSent,
    searchResults, loading,
    updateUsername, searchUsers, sendRequest,
    acceptRequest, declineRequest, removeFriend, getFriendProfile,
  } = useFriends()

  const {
    activeChallenges, pendingIncoming: challengeRequests, pendingSent: challengesSent,
    createChallenge, acceptChallenge, declineChallenge, hasPendingOrActive,
  } = useChallenges()

  const [searchQuery, setSearchQuery] = useState('')
  const [usernameInput, setUsernameInput] = useState('')
  const [editingUsername, setEditingUsername] = useState(false)
  const [usernameError, setUsernameError] = useState('')
  const [sendingTo, setSendingTo] = useState<string | null>(null)
  const [sendError, setSendError] = useState('')
  const [challengeModal, setChallengeModal] = useState<{ friendId: string; name: string } | null>(null)
  const [challengeGoal, setChallengeGoal] = useState(weeklyGoal || 3)

  const handleSearch = (q: string) => {
    setSearchQuery(q)
    searchUsers(q)
  }

  const handleSaveUsername = async () => {
    if (!usernameInput.trim()) return
    const err = await updateUsername(usernameInput)
    if (err) {
      setUsernameError('Username taken or invalid. Use letters, numbers and underscores only.')
    } else {
      setEditingUsername(false)
      setUsernameError('')
    }
  }

  const isFriend = (userId: string) =>
    friends.some(f => getFriendProfile(f)?.id === userId)

  const hasSentFriendRequest = (userId: string) =>
    pendingSent.some(f => f.addressee_id === userId)

  if (loading) {
    return (
      <div className="px-4 pt-6 pb-6 flex items-center justify-center min-h-64">
        <p className="text-gray-600">Loading...</p>
      </div>
    )
  }

  const totalNotifications = friendRequests.length + challengeRequests.length

  return (
    <div className="px-4 pt-6 pb-6 space-y-6">
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-bold text-white">Friends</h1>
        {totalNotifications > 0 && (
          <span className="px-2 py-0.5 rounded-full bg-orange-500 text-white text-xs font-bold">
            {totalNotifications}
          </span>
        )}
      </div>

      {/* ── Profile / Username ── */}
      <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Your Profile</p>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-orange-500/20 flex items-center justify-center text-orange-400 font-bold text-lg flex-shrink-0">
            {(profile?.display_name ?? '?')[0].toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white font-medium">{profile?.display_name}</p>
            {profile?.username
              ? <p className="text-sm text-gray-500">@{profile.username}</p>
              : <p className="text-sm text-orange-400">Set a username so friends can find you</p>
            }
          </div>
          <button
            onClick={() => { setEditingUsername(true); setUsernameInput(profile?.username ?? '') }}
            className="text-xs text-gray-500 hover:text-orange-400 transition-colors"
          >
            {profile?.username ? 'Edit' : 'Set'}
          </button>
        </div>
        {editingUsername && (
          <div className="mt-3 space-y-2">
            <div className="flex gap-2">
              <input
                autoFocus
                type="text"
                placeholder="username"
                value={usernameInput}
                onChange={e => setUsernameInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSaveUsername()}
                className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-orange-500"
              />
              <button onClick={handleSaveUsername} className="px-4 py-2 bg-orange-500 text-white text-sm font-semibold rounded-lg hover:bg-orange-600 transition-colors">Save</button>
              <button onClick={() => { setEditingUsername(false); setUsernameError('') }} className="px-3 py-2 bg-gray-800 text-gray-400 text-sm rounded-lg hover:bg-gray-700 transition-colors">Cancel</button>
            </div>
            {usernameError && <p className="text-xs text-red-400">{usernameError}</p>}
          </div>
        )}
      </div>

      {/* ── Pending friend requests ── */}
      {friendRequests.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
            Friend Requests ({friendRequests.length})
          </p>
          <div className="space-y-2">
            {friendRequests.map(f => {
              const p = f.requester
              return (
                <div key={f.id} className="bg-gray-900 rounded-xl px-4 py-3 border border-orange-500/20 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-orange-500/20 flex items-center justify-center text-orange-400 font-bold flex-shrink-0">
                    {(p?.display_name ?? '?')[0].toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium">{p?.display_name}</p>
                    {p?.username && <p className="text-xs text-gray-500">@{p.username}</p>}
                  </div>
                  <button onClick={() => acceptRequest(f.id)} className="px-3 py-1.5 bg-orange-500 text-white text-xs font-semibold rounded-lg hover:bg-orange-600 transition-colors">Accept</button>
                  <button onClick={() => declineRequest(f.id)} className="px-3 py-1.5 bg-gray-800 text-gray-400 text-xs rounded-lg hover:bg-gray-700 transition-colors">Decline</button>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── Pending challenge requests ── */}
      {challengeRequests.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
            Challenge Requests ({challengeRequests.length})
          </p>
          <div className="space-y-2">
            {challengeRequests.map(c => {
              const challenger = c.challenger
              return (
                <div key={c.id} className="bg-gray-900 rounded-xl px-4 py-3 border border-orange-500/20">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 font-bold flex-shrink-0">
                      {(challenger?.display_name ?? '?')[0].toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-medium">
                        <span className="text-orange-400">{challenger?.display_name}</span> challenged you!
                      </p>
                      <p className="text-xs text-gray-500">Goal: {c.goal} workouts this week</p>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-3">
                    <button onClick={() => acceptChallenge(c.id)} className="flex-1 py-2 bg-orange-500 text-white text-xs font-semibold rounded-lg hover:bg-orange-600 transition-colors">
                      Accept Challenge 🔥
                    </button>
                    <button onClick={() => declineChallenge(c.id)} className="px-4 py-2 bg-gray-800 text-gray-400 text-xs rounded-lg hover:bg-gray-700 transition-colors">
                      Decline
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── Active challenge leaderboard ── */}
      {activeChallenges.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
            Leaderboard
          </p>
          <div className="space-y-3">
            {activeChallenges.map(c => (
              <ChallengeCard key={c.id} challenge={c} userId={user?.id ?? ''} />
            ))}
          </div>
        </div>
      )}

      {/* ── Sent pending challenges ── */}
      {challengesSent.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Waiting on Response</p>
          <div className="space-y-2">
            {challengesSent.map(c => {
              const opponent = c.challenged
              return (
                <div key={c.id} className="bg-gray-900 rounded-xl px-4 py-3 border border-gray-800 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-gray-700 flex items-center justify-center text-gray-400 font-bold flex-shrink-0">
                    {(opponent?.display_name ?? '?')[0].toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium">vs {opponent?.display_name}</p>
                    <p className="text-xs text-gray-500">Goal: {c.goal} workouts · waiting for accept</p>
                  </div>
                  <div className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── Search ── */}
      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Find Friends</p>
        <div className="flex items-center gap-2 bg-gray-800 rounded-xl px-3 py-2.5 border border-gray-700 focus-within:border-orange-500 transition-colors mb-2">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-gray-500 flex-shrink-0">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            placeholder="Search by name or @username..."
            value={searchQuery}
            onChange={e => handleSearch(e.target.value)}
            className="flex-1 bg-transparent text-white placeholder-gray-500 text-sm focus:outline-none"
          />
          {searchQuery && (
            <button onClick={() => { setSearchQuery(''); searchUsers('') }} className="text-gray-500 hover:text-white">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          )}
        </div>
        {sendError && <p className="text-xs text-red-400 mb-2">{sendError}</p>}
        {searchQuery && (
          <div className="space-y-1">
            {searchResults.length === 0 ? (
              <p className="text-center text-gray-600 text-sm py-4">No users found</p>
            ) : searchResults.map(p => (
              <div key={p.id} className="bg-gray-900 rounded-xl px-4 py-3 border border-gray-800 flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-gray-700 flex items-center justify-center text-gray-300 font-bold flex-shrink-0">
                  {(p.display_name ?? '?')[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-medium">{p.display_name}</p>
                  {p.username && <p className="text-xs text-gray-500">@{p.username}</p>}
                </div>
                {isFriend(p.id) ? (
                  <span className="text-xs text-green-400 font-medium">Friends</span>
                ) : hasSentFriendRequest(p.id) ? (
                  <span className="text-xs text-gray-500">Sent</span>
                ) : (
                  <button
                    disabled={sendingTo === p.id}
                    onClick={async () => {
                      setSendingTo(p.id)
                      setSendError('')
                      const err = await sendRequest(p.id)
                      setSendingTo(null)
                      if (err) setSendError(err)
                    }}
                    className="px-3 py-1.5 bg-orange-500 text-white text-xs font-semibold rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50"
                  >
                    {sendingTo === p.id ? '...' : 'Add'}
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Friends list ── */}
      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
          Friends {friends.length > 0 && `(${friends.length})`}
        </p>
        {friends.length === 0 ? (
          <div className="bg-gray-900 rounded-xl p-8 border border-gray-800 text-center">
            <p className="text-gray-600 text-sm">No friends yet — search above to add some!</p>
          </div>
        ) : (
          <div className="space-y-2">
            {friends.map(f => {
              const fp = getFriendProfile(f)
              if (!fp) return null
              const challenged = hasPendingOrActive(fp.id)
              return (
                <div key={f.id} className="bg-gray-900 rounded-xl px-4 py-3 border border-gray-800 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-orange-500/20 flex items-center justify-center text-orange-400 font-bold flex-shrink-0">
                    {(fp.display_name ?? '?')[0].toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium">{fp.display_name}</p>
                    {fp.username && <p className="text-xs text-gray-500">@{fp.username}</p>}
                  </div>
                  {challenged ? (
                    <span className="text-xs text-orange-400 font-medium">Active</span>
                  ) : (
                    <button
                      onClick={() => {
                        setChallengeModal({ friendId: fp.id, name: fp.display_name ?? fp.username ?? 'them' })
                        setChallengeGoal(weeklyGoal || 3)
                      }}
                      className="px-3 py-1.5 bg-orange-500/15 text-orange-400 text-xs font-semibold rounded-lg hover:bg-orange-500/25 transition-colors border border-orange-500/20"
                    >
                      Challenge
                    </button>
                  )}
                  <button onClick={() => removeFriend(f.id)} className="text-gray-700 hover:text-red-400 transition-colors p-1">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* ── Challenge modal ── */}
      {challengeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)' }}>
          <div className="w-full max-w-sm bg-gray-900 rounded-2xl p-5 border border-gray-800">
            <h3 className="text-lg font-bold text-white mb-1">Challenge {challengeModal.name}</h3>
            <p className="text-sm text-gray-500 mb-4">Who can log the most workouts this week?</p>
            <div className="mb-5">
              <label className="block text-xs text-gray-500 mb-2">Weekly goal (workouts)</label>
              <div className="flex items-center gap-3">
                <button onClick={() => setChallengeGoal(g => Math.max(1, g - 1))} className="w-10 h-10 rounded-xl bg-gray-800 text-white text-xl flex items-center justify-center hover:bg-gray-700 transition-colors">−</button>
                <span className="text-3xl font-bold text-white w-12 text-center">{challengeGoal}</span>
                <button onClick={() => setChallengeGoal(g => g + 1)} className="w-10 h-10 rounded-xl bg-gray-800 text-white text-xl flex items-center justify-center hover:bg-gray-700 transition-colors">+</button>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={async () => {
                  await createChallenge(challengeModal.friendId, challengeGoal)
                  setChallengeModal(null)
                }}
                className="flex-1 py-3 bg-orange-500 text-white font-semibold rounded-xl hover:bg-orange-600 transition-colors"
              >
                Send Challenge <span className="no-invert">🔥</span>
              </button>
              <button onClick={() => setChallengeModal(null)} className="px-4 py-3 bg-gray-800 text-gray-400 rounded-xl hover:bg-gray-700 transition-colors">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function ChallengeCard({ challenge: c, userId }: { challenge: Challenge; userId: string }) {
  const myCount = c.my_count ?? 0
  const theirCount = c.their_count ?? 0
  const goal = c.goal

  const myProfile = c.challenger_id === userId ? c.challenger : c.challenged
  const theirProfile = c.challenger_id === userId ? c.challenged : c.challenger
  const theirName = theirProfile?.display_name ?? theirProfile?.username ?? 'Opponent'
  const myName = myProfile?.display_name ?? 'You'

  const myPct = Math.min(100, (myCount / goal) * 100)
  const theirPct = Math.min(100, (theirCount / goal) * 100)

  const weekEnd = new Date(c.week_start)
  weekEnd.setDate(weekEnd.getDate() + 7)
  const daysLeft = Math.max(0, Math.ceil((weekEnd.getTime() - Date.now()) / 86400000))

  let statusMsg = ''
  if (myCount >= goal && theirCount >= goal) statusMsg = 'Both hit the goal! 🎉'
  else if (myCount >= goal) statusMsg = 'You hit the goal! 🔥'
  else if (theirCount >= goal) statusMsg = `${theirName} hit the goal first!`
  else if (myCount > theirCount) statusMsg = "You're in the lead 💪"
  else if (theirCount > myCount) statusMsg = `${theirName} is ahead — push harder!`
  else statusMsg = 'All tied up — keep going!'

  return (
    <div className="bg-gray-900 rounded-xl p-4 border border-orange-500/20">
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm font-semibold text-white">vs {theirName}</p>
        <span className="text-xs text-gray-500">{daysLeft}d left · goal: {goal}</span>
      </div>

      <div className="space-y-3 mb-3">
        {/* My progress */}
        <div>
          <div className="flex justify-between text-xs mb-1.5">
            <span className="text-orange-400 font-medium">{myName}</span>
            <span className="text-white font-semibold">{myCount} / {goal}</span>
          </div>
          <div className="h-2.5 bg-gray-800 rounded-full overflow-hidden">
            <div className="h-full bg-orange-500 rounded-full transition-all duration-500" style={{ width: `${myPct}%` }} />
          </div>
        </div>

        {/* Their progress */}
        <div>
          <div className="flex justify-between text-xs mb-1.5">
            <span className="text-blue-400 font-medium">{theirName}</span>
            <span className="text-white font-semibold">{theirCount} / {goal}</span>
          </div>
          <div className="h-2.5 bg-gray-800 rounded-full overflow-hidden">
            <div className="h-full bg-blue-400 rounded-full transition-all duration-500" style={{ width: `${theirPct}%` }} />
          </div>
        </div>
      </div>

      <div className="pt-2 border-t border-gray-800">
        <p className="text-xs text-center text-gray-400 font-medium">{statusMsg}</p>
      </div>
    </div>
  )
}
