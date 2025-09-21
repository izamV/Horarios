import { addMinutesToISO, minutesBetween } from '../adapters/datetime';
import { createId } from '../adapters/uuid';
import type { MaterialQty, Session } from '../domain/types';

type OwnerRol = Session['ownerRol'];

export interface SequentialConfig {
  startISO: string;
  durations: number[];
  ownerId: string;
  ownerRol: OwnerRol;
  base?: {
    locationId?: string;
    tareaId?: string;
    materiales?: MaterialQty[];
    infoExtra?: string;
  };
}

export const createSequentialSessions = ({
  startISO,
  durations,
  ownerId,
  ownerRol,
  base
}: SequentialConfig): Session[] => {
  let cursor = startISO;
  return durations.map((duration) => {
    const end = addMinutesToISO(cursor, duration);
    const session: Session = {
      id: createId(),
      ownerId,
      ownerRol,
      inicioISO: cursor,
      finISO: end,
      locationId: base?.locationId,
      tareaId: base?.tareaId,
      materiales: base?.materiales ? base.materiales.map((m) => ({ ...m })) : undefined,
      infoExtra: base?.infoExtra
    };
    cursor = end;
    return session;
  });
};

export const sessionsOverlap = (a: Session, b: Session) => {
  if (a.id === b.id) return false;
  return a.inicioISO < b.finISO && b.inicioISO < a.finISO;
};

export const ownerHasOverlap = (sessions: Session[], session: Session): boolean =>
  sessions.filter((s) => s.ownerId === session.ownerId && s.ownerRol === session.ownerRol)
    .some((existing) => sessionsOverlap(existing, session));

export const shiftSession = (session: Session, minutes: number): Session => ({
  ...session,
  inicioISO: addMinutesToISO(session.inicioISO, minutes),
  finISO: addMinutesToISO(session.finISO, minutes)
});

export const updateSessionDuration = (session: Session, newDurationMinutes: number): Session => ({
  ...session,
  finISO: addMinutesToISO(session.inicioISO, newDurationMinutes)
});

export const sortSessions = (sessions: Session[]): Session[] =>
  [...sessions].sort((a, b) => (a.inicioISO < b.inicioISO ? -1 : 1));

export const ownerScheduleSummary = (sessions: Session[], ownerId: string) => {
  const ownerSessions = sessions.filter((s) => s.ownerId === ownerId);
  if (ownerSessions.length === 0) {
    return { totalMinutes: 0, count: 0 };
  }
  const totalMinutes = ownerSessions.reduce((acc, session) => acc + minutesBetween(session.inicioISO, session.finISO), 0);
  return {
    totalMinutes,
    count: ownerSessions.length
  };
};

export const replaceSession = (sessions: Session[], updated: Session): Session[] =>
  sessions.map((session) => (session.id === updated.id ? updated : session));

export const removeSessionById = (sessions: Session[], id: string): Session[] =>
  sessions.filter((session) => session.id !== id);
