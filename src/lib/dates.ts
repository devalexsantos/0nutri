import { format, startOfDay, endOfDay, addDays, differenceInMinutes, parse } from "date-fns";
import { ptBR } from "date-fns/locale";

export const TZ = "America/Sao_Paulo";

export function todayStart(now: Date = new Date()) {
  return startOfDay(now);
}

export function todayEnd(now: Date = new Date()) {
  return endOfDay(now);
}

export function formatDateLong(date: Date) {
  return format(date, "EEEE, d 'de' MMMM", { locale: ptBR });
}

export function formatDate(date: Date) {
  return format(date, "dd/MM/yyyy");
}

export function formatTime(date: Date) {
  return format(date, "HH:mm");
}

/** Combina uma data com um horário "HH:mm" e retorna um Date. */
export function combineDateAndTime(date: Date, time: string): Date {
  const [h, m] = time.split(":").map((n) => Number.parseInt(n, 10));
  const d = new Date(date);
  d.setHours(h ?? 0, m ?? 0, 0, 0);
  return d;
}

export function parseTime(time: string, base: Date = new Date()): Date {
  return parse(time, "HH:mm", base);
}

export function minutesUntil(targetTime: string, from: Date = new Date()): number {
  const target = combineDateAndTime(from, targetTime);
  return differenceInMinutes(target, from);
}

export function nextDay(d: Date) {
  return addDays(d, 1);
}

export function isoDate(d: Date): string {
  return format(d, "yyyy-MM-dd");
}

/**
 * Canonical "date key" para colunas DateTime que representam um dia de calendário.
 * Retorna o instante de meia-noite no fuso de São Paulo (UTC-3, sem DST desde 2019)
 * do dia SP que contém `d`. Use em writes/queries de campos como `DailyMealLog.date`.
 */
export function dateKey(d: Date = new Date()): Date {
  return new Date(`${isoDate(d)}T00:00:00-03:00`);
}

/** Parse de "YYYY-MM-DD" como meia-noite SP, espelhando `dateKey`. */
export function parseDateKey(iso: string): Date {
  return new Date(`${iso}T00:00:00-03:00`);
}

/**
 * "YYYY-MM-DD" no fuso de São Paulo. Funciona no servidor (independe de TZ) e
 * no cliente (independe do fuso do browser do usuário).
 */
export function todayIsoSp(now: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}
