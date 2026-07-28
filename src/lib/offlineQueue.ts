import { WorkoutSession } from '../types'

const STORAGE_KEY = 'lift_tracker_offline_queue'

export type QueuedMutation =
  | { type: 'insert_workout'; id: string; payload: WorkoutSession; userId: string; queuedAt: number }
  | { type: 'delete_workout'; id: string; userId: string; queuedAt: number }
  | { type: 'toggle_favorite'; id: string; favorited: boolean; userId: string; queuedAt: number }

export function loadQueue(): QueuedMutation[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    return JSON.parse(raw) as QueuedMutation[]
  } catch {
    return []
  }
}

export function saveQueue(queue: QueuedMutation[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(queue))
}

/** Queue an insert for a workout that failed to sync due to connectivity */
export function enqueueInsert(id: string, payload: WorkoutSession, userId: string): void {
  const queue = loadQueue()
  queue.push({ type: 'insert_workout', id, payload, userId, queuedAt: Date.now() })
  saveQueue(queue)
}

/**
 * Queue a delete. If an insert for this same id is still queued (never reached the server),
 * drop both — there's nothing on the server to delete, so no network call should ever be made for it.
 */
export function enqueueDelete(id: string, userId: string): void {
  const queue = loadQueue()
  const pendingInsertIndex = queue.findIndex(m => m.type === 'insert_workout' && m.id === id)
  if (pendingInsertIndex !== -1) {
    queue.splice(pendingInsertIndex, 1)
    saveQueue(queue)
    return
  }
  saveQueue([...queue, { type: 'delete_workout', id, userId, queuedAt: Date.now() }])
}

/**
 * Queue a favorite toggle. If an insert for this same id is still queued, patch its payload directly
 * instead of queuing a separate update against a row that doesn't exist on the server yet.
 */
export function enqueueFavoriteToggle(id: string, favorited: boolean, userId: string): void {
  const queue = loadQueue()
  const pendingInsert = queue.find(
    (m): m is Extract<QueuedMutation, { type: 'insert_workout' }> => m.type === 'insert_workout' && m.id === id
  )
  if (pendingInsert) {
    pendingInsert.payload = { ...pendingInsert.payload, favorited }
    saveQueue(queue)
    return
  }
  // Only the latest desired state matters — drop any earlier queued toggle for this id
  const withoutOlderToggle = queue.filter(m => !(m.type === 'toggle_favorite' && m.id === id))
  saveQueue([...withoutOlderToggle, { type: 'toggle_favorite', id, favorited, userId, queuedAt: Date.now() }])
}

/**
 * Merge a fresh server snapshot with what's still queued: union in unsynced inserts the server
 * doesn't have yet, drop anything with a still-queued delete, and apply any still-queued favorite toggle.
 */
export function reconcileWithQueue(serverWorkouts: WorkoutSession[], queue: QueuedMutation[]): WorkoutSession[] {
  const pendingDeleteIds = new Set(queue.filter(m => m.type === 'delete_workout').map(m => m.id))
  const pendingInserts = queue.filter(
    (m): m is Extract<QueuedMutation, { type: 'insert_workout' }> => m.type === 'insert_workout'
  )
  const pendingFavorites = new Map(
    queue
      .filter((m): m is Extract<QueuedMutation, { type: 'toggle_favorite' }> => m.type === 'toggle_favorite')
      .map(m => [m.id, m.favorited])
  )

  const serverIds = new Set(serverWorkouts.map(w => w.id))
  const merged = [
    ...serverWorkouts.filter(w => !pendingDeleteIds.has(w.id)),
    ...pendingInserts.filter(m => !serverIds.has(m.id)).map(m => m.payload),
  ]

  return merged.map(w => (pendingFavorites.has(w.id) ? { ...w, favorited: pendingFavorites.get(w.id)! } : w))
}
