import { addMinutes, differenceInMinutes, formatISO, isAfter, isBefore, parseISO } from 'date-fns';

export const parseDate = (iso: string) => parseISO(iso);
export const toISO = (date: Date) => formatISO(date);
export const addMinutesToISO = (iso: string, minutes: number) => formatISO(addMinutes(parseISO(iso), minutes));
export const minutesBetween = (startISO: string, endISO: string) => differenceInMinutes(parseISO(endISO), parseISO(startISO));
export const isBeforeISO = (a: string, b: string) => isBefore(parseISO(a), parseISO(b));
export const isAfterISO = (a: string, b: string) => isAfter(parseISO(a), parseISO(b));
export const nowISO = () => formatISO(new Date());
export const toDisplayTime = (iso: string) => new Date(iso).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
export const toDisplayDate = (iso: string) => new Date(iso).toLocaleDateString('es-ES');
