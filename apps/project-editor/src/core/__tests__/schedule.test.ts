import { describe, expect, it } from 'vitest';
import { createSequentialSessions, ownerHasOverlap, sessionsOverlap } from '../schedule';

const baseSession = {
  ownerId: 'owner-1',
  ownerRol: 'CLIENTE' as const
};

describe('schedule helpers', () => {
  it('creates sequential sessions without gaps', () => {
    const [first, second] = createSequentialSessions({
      startISO: new Date('2024-01-01T08:00:00Z').toISOString(),
      durations: [30, 60],
      ownerId: baseSession.ownerId,
      ownerRol: baseSession.ownerRol
    });
    expect(first.finISO).toBe(second.inicioISO);
  });

  it('detects overlapping sessions for same owner', () => {
    const [first] = createSequentialSessions({
      startISO: new Date('2024-01-01T09:00:00Z').toISOString(),
      durations: [60],
      ownerId: baseSession.ownerId,
      ownerRol: baseSession.ownerRol
    });
    const [second] = createSequentialSessions({
      startISO: new Date('2024-01-01T09:30:00Z').toISOString(),
      durations: [60],
      ownerId: baseSession.ownerId,
      ownerRol: baseSession.ownerRol
    });
    expect(sessionsOverlap(first, second)).toBe(true);
    expect(ownerHasOverlap([first], second)).toBe(true);
  });
});
