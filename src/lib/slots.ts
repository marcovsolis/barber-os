/**
 * Slot calculation utilities for BarberOS.
 *
 * A "slot" is a potential start time for an appointment.
 * A slot is available if it doesn't overlap with any existing appointment
 * and fits within the barber's working hours for that day.
 */

import { addMinutes, format, parseISO, isAfter, isBefore, isEqual } from 'date-fns'
import { toZonedTime, fromZonedTime } from 'date-fns-tz'

export interface TimeSlot {
  /** Display label e.g. "09:00" */
  label: string
  /** ISO 8601 UTC string for starts_at */
  startsAt: string
  /** ISO 8601 UTC string for ends_at */
  endsAt: string
}

interface ExistingAppointment {
  starts_at: string
  ends_at:   string
}

export interface BarberBlock {
  is_full_day: boolean
  start_time:  string | null  // "HH:mm" local time
  end_time:    string | null  // "HH:mm" local time
}

/**
 * Generate all available time slots for a barber on a given date.
 *
 * @param date        - "YYYY-MM-DD" in the shop's local timezone
 * @param startTime   - "HH:mm" working hours start (local)
 * @param endTime     - "HH:mm" working hours end (local)
 * @param duration    - service duration in minutes
 * @param existing    - appointments already booked (UTC ISO strings)
 * @param timezone    - IANA timezone string e.g. "America/Mexico_City"
 * @param breakAfter  - extra minutes blocked after service for cleanup/prep (default 0)
 * @param blocks      - admin-defined time blocks for this barber+date
 */
export function generateAvailableSlots(
  date:        string,
  startTime:   string,
  endTime:     string,
  duration:    number,
  existing:    ExistingAppointment[],
  timezone:    string,
  breakAfter = 0,
  blocks:      BarberBlock[] = []
): TimeSlot[] {
  const slots: TimeSlot[] = []

  // If any block is a full-day block, return no slots
  if (blocks.some(b => b.is_full_day)) return []

  const localStart = new Date(`${date}T${startTime}:00`)
  const localEnd   = new Date(`${date}T${endTime}:00`)

  // Convert to UTC using the shop's timezone
  const windowStart = fromZonedTime(localStart, timezone)
  const windowEnd   = fromZonedTime(localEnd,   timezone)

  // Parse existing appointments to Date objects
  const booked = existing.map(a => ({
    start: parseISO(a.starts_at),
    end:   parseISO(a.ends_at),
  }))

  // Convert time blocks to UTC date ranges for this date
  const blockedRanges = blocks
    .filter(b => !b.is_full_day && b.start_time && b.end_time)
    .map(b => ({
      start: fromZonedTime(new Date(`${date}T${b.start_time}:00`), timezone),
      end:   fromZonedTime(new Date(`${date}T${b.end_time}:00`),   timezone),
    }))

  const now = new Date()

  let cursor = windowStart

  while (true) {
    const slotEnd         = addMinutes(cursor, duration)
    // The "effective end" includes break time — this is what we need clear of other bookings
    const slotEffectiveEnd = addMinutes(cursor, duration + breakAfter)

    // Stop if the effective slot would exceed the working window
    if (isAfter(slotEffectiveEnd, windowEnd) || isEqual(slotEffectiveEnd, windowEnd)) break

    // Skip slots in the past (with 5-min buffer)
    const isPast = isBefore(addMinutes(cursor, -5), now)

    if (!isPast) {
      // Check overlap: the full effective window [cursor, cursor+duration+break] must be clear
      const overlapsBooked = booked.some(
        a => isBefore(cursor, a.end) && isAfter(slotEffectiveEnd, a.start)
      )
      const overlapsBlocked = blockedRanges.some(
        r => isBefore(cursor, r.end) && isAfter(slotEffectiveEnd, r.start)
      )
      const overlaps = overlapsBooked || overlapsBlocked

      if (!overlaps) {
        // Convert back to local time for display
        const localSlot = toZonedTime(cursor, timezone)
        slots.push({
          label:    format(localSlot, 'HH:mm'),
          startsAt: cursor.toISOString(),
          endsAt:   slotEnd.toISOString(),   // actual end (not including break)
        })
      }
    }

    cursor = addMinutes(cursor, 15)  // 15-min grid
    if (isAfter(cursor, windowEnd))  break
  }

  return slots
}
