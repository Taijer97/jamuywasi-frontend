/**
 * Utilidad inteligente para interpretar horarios de atención de tiendas,
 * evaluar si una tienda está ABIERTA o CERRADA en tiempo real y proyectar
 * el próximo evento de apertura o cierre para informar al cliente.
 */

export interface TimeSlot {
  openMinutes: number;  // Minutos desde las 00:00 (ej. 09:00 = 540)
  closeMinutes: number; // Minutos desde las 00:00 (ej. 19:30 = 1170)
  open12h: string;      // "9:00 AM"
  close12h: string;     // "7:30 PM"
}

export interface DayHours {
  dayIndex: number;     // 0 = Domingo, 1 = Lunes, ..., 6 = Sábado
  dayName: string;      // "Lunes", "Martes", etc.
  dayShort: string;     // "Lun", "Mar", etc.
  isOpen: boolean;
  slots: TimeSlot[];
  rawText: string;
}

export type StoreScheduleStatus = 'open' | 'closing_soon' | 'closed' | 'unknown';

export interface StoreOpenStatus {
  isOpen: boolean;
  status: StoreScheduleStatus;
  badgeText: string;          // "Abierto" | "Cierra Pronto" | "Cerrado" | "Consultar Horario"
  detailText: string;         // "Cierra a las 8:00 PM" | "Abre hoy a las 3:00 PM" | "Abre mañana a las 9:00 AM"
  todayText: string;          // "Hoy: 9:00 AM - 8:00 PM" o "Hoy: Cerrado"
  weeklyHours: DayHours[];
  hasSchedule: boolean;
}

const DAY_NAMES = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
const DAY_SHORTS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

// Normaliza textos de días a índices (0..6)
function normalizeDayIndex(str: string): number | null {
  const clean = str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
  if (clean.startsWith('dom')) return 0;
  if (clean.startsWith('lun')) return 1;
  if (clean.startsWith('mar')) return 2;
  if (clean.startsWith('mie') || clean.startsWith('mier')) return 3;
  if (clean.startsWith('jue')) return 4;
  if (clean.startsWith('vie')) return 5;
  if (clean.startsWith('sab')) return 6;
  return null;
}

export interface ScheduleTimeSlot {
  id: string;
  open: string;  // Formato 24h ej. "08:00"
  close: string; // Formato 24h ej. "18:00"
}

export interface DayScheduleItem {
  dayId: 'lun' | 'mar' | 'mie' | 'jue' | 'vie' | 'sab' | 'dom';
  name: string;
  short: string;
  isOpen: boolean;
  slots: ScheduleTimeSlot[];
}

export const DEFAULT_DAYS_SCHEDULE: DayScheduleItem[] = [
  {
    dayId: 'lun',
    name: 'Lunes',
    short: 'Lun',
    isOpen: true,
    slots: [
      { id: 'lun-1', open: '08:00', close: '13:00' },
      { id: 'lun-2', open: '14:30', close: '19:30' },
    ],
  },
  {
    dayId: 'mar',
    name: 'Martes',
    short: 'Mar',
    isOpen: true,
    slots: [
      { id: 'mar-1', open: '08:00', close: '13:00' },
      { id: 'mar-2', open: '14:30', close: '19:30' },
    ],
  },
  {
    dayId: 'mie',
    name: 'Miércoles',
    short: 'Mié',
    isOpen: true,
    slots: [
      { id: 'mie-1', open: '08:00', close: '13:00' },
      { id: 'mie-2', open: '14:30', close: '19:30' },
    ],
  },
  {
    dayId: 'jue',
    name: 'Jueves',
    short: 'Jue',
    isOpen: true,
    slots: [
      { id: 'jue-1', open: '08:00', close: '13:00' },
      { id: 'jue-2', open: '14:30', close: '19:30' },
    ],
  },
  {
    dayId: 'vie',
    name: 'Viernes',
    short: 'Vie',
    isOpen: true,
    slots: [
      { id: 'vie-1', open: '08:00', close: '13:00' },
      { id: 'vie-2', open: '14:30', close: '19:30' },
    ],
  },
  {
    dayId: 'sab',
    name: 'Sábado',
    short: 'Sáb',
    isOpen: true,
    slots: [
      { id: 'sab-1', open: '08:00', close: '13:00' },
    ],
  },
  {
    dayId: 'dom',
    name: 'Domingo',
    short: 'Dom',
    isOpen: false,
    slots: [],
  },
];

// Convierte minutos desde medianoche a "HH:MM" (formato 24h para inputs de tipo time)
function minutesTo24h(mins: number): string {
  const norm = ((mins % 1440) + 1440) % 1440;
  const h = Math.floor(norm / 60);
  const m = norm % 60;
  return `${h < 10 ? '0' : ''}${h}:${m < 10 ? '0' : ''}${m}`;
}

// Convierte "08:30 AM", "14:00", "7pm", etc. a minutos desde medianoche y string 12h
function parseTimeString(timeStr: string): { minutes: number; formatted12h: string } | null {
  if (!timeStr) return null;
  let clean = timeStr.trim().toLowerCase();
  clean = clean.replace(/^(?:de|desde|a\s+las?|las?)\s+/i, '').trim();

  // Caso con am / pm
  const matchAmPm = clean.match(/^(\d{1,2})(?::(\d{2}))?\s*(am|pm)?$/i);
  if (matchAmPm) {
    let hours = parseInt(matchAmPm[1], 10);
    const minutes = matchAmPm[2] ? parseInt(matchAmPm[2], 10) : 0;
    const ampm = matchAmPm[3] ? matchAmPm[3].toLowerCase() : null;

    if (ampm === 'pm' && hours < 12) hours += 12;
    if (ampm === 'am' && hours === 12) hours = 0;

    const totalMinutes = hours * 60 + minutes;
    const displayH = hours % 12 === 0 ? 12 : hours % 12;
    const displayM = minutes < 10 ? `0${minutes}` : `${minutes}`;
    const displayAmpm = hours >= 12 ? 'PM' : 'AM';

    return {
      minutes: totalMinutes,
      formatted12h: `${displayH}:${displayM} ${displayAmpm}`
    };
  }

  // Caso 24 horas militar "HH:MM"
  const match24 = clean.match(/^(\d{1,2}):(\d{2})$/);
  if (match24) {
    const hours = parseInt(match24[1], 10);
    const minutes = parseInt(match24[2], 10);
    const totalMinutes = hours * 60 + minutes;
    const displayH = hours % 12 === 0 ? 12 : hours % 12;
    const displayM = minutes < 10 ? `0${minutes}` : `${minutes}`;
    const displayAmpm = hours >= 12 ? 'PM' : 'AM';

    return {
      minutes: totalMinutes,
      formatted12h: `${displayH}:${displayM} ${displayAmpm}`
    };
  }

  return null;
}

// Parsea un rango como "8:00 AM - 1:00 PM" o "09:00 a 18:00"
function parseSingleRange(rangeStr: string): TimeSlot | null {
  const clean = rangeStr.trim().replace(/^(?:de|desde)\s+/i, '');
  const parts = clean.split(/\s*(?:-|–|—|\ba\b|\bal\b|\bto\b)\s*/i);
  if (parts.length < 2) return null;

  const start = parseTimeString(parts[0]);
  const end = parseTimeString(parts[1]);

  if (!start || !end) return null;

  // Si end es menor que start (ej. 9:00 PM a 2:00 AM), asumimos cruce de medianoche
  let endMins = end.minutes;
  if (endMins <= start.minutes) {
    endMins += 24 * 60;
  }

  return {
    openMinutes: start.minutes,
    closeMinutes: endMins,
    open12h: start.formatted12h,
    close12h: end.formatted12h
  };
}

// Parsea slots múltiples como "8:00 AM - 1:00 PM / 2:30 PM - 7:30 PM"
function parseSlots(slotsStr: string): TimeSlot[] {
  const subSlots = slotsStr.split(/\s*(?:\/|y|\||,)\s*/i);
  const result: TimeSlot[] = [];

  for (const sub of subSlots) {
    const parsed = parseSingleRange(sub);
    if (parsed) {
      result.push(parsed);
    }
  }

  // Si no se encontró separador '/', intentamos parsear directamente
  if (result.length === 0) {
    const direct = parseSingleRange(slotsStr);
    if (direct) result.push(direct);
  }

  return result;
}

/**
 * Parsea el texto de horarios de la tienda y lo estructura para los 7 días de la semana
 */
export function parseStoreSchedule(scheduleText: string | undefined): DayHours[] {
  const weekly: DayHours[] = Array.from({ length: 7 }, (_, i) => ({
    dayIndex: i,
    dayName: DAY_NAMES[i],
    dayShort: DAY_SHORTS[i],
    isOpen: false,
    slots: [],
    rawText: 'Cerrado'
  }));

  if (!scheduleText || !scheduleText.trim()) {
    return weekly;
  }

  const raw = scheduleText.trim();

  // Caso: 24 horas
  if (/24\s*(?:horas|hrs|h|\/7)/i.test(raw)) {
    for (let i = 0; i < 7; i++) {
      weekly[i].isOpen = true;
      weekly[i].slots = [{ openMinutes: 0, closeMinutes: 24 * 60, open12h: '12:00 AM', close12h: '11:59 PM' }];
      weekly[i].rawText = '24 Horas';
    }
    return weekly;
  }

  // Dividir en bloques separados por "|" o saltos de línea
  const blocks = raw.split(/\s*(?:\||\n|;)\s*/);

  for (const block of blocks) {
    const trimmedBlock = block.trim();
    if (!trimmedBlock) continue;

    // Detectar separación de días vs horas sin confundir ":" dentro de un formato de hora tipo "09:00"
    let daysPart: string | null = null;
    let hoursPart: string | null = null;

    const colonMatch = trimmedBlock.match(/^([a-záéíóúñ\s,.-]+?)\s*:\s*(.+)$/i);
    const deMatch = !colonMatch ? trimmedBlock.match(/^([a-záéíóúñ\s,.-]+?)\s+de\s+(.+)$/i) : null;
    const directSplitMatch = (!colonMatch && !deMatch)
      ? trimmedBlock.match(/^([a-záéíóúñ\s,.-]+?)\s+(\d{1,2}(?::\d{2})?\s*(?:am|pm)?\s*(?:-|–|—|\ba\b|\bal\b|\bto\b).+)$/i)
      : null;

    if (colonMatch) {
      daysPart = colonMatch[1];
      hoursPart = colonMatch[2];
    } else if (deMatch) {
      daysPart = deMatch[1];
      hoursPart = deMatch[2];
    } else if (directSplitMatch) {
      daysPart = directSplitMatch[1];
      hoursPart = directSplitMatch[2];
    } else {
      hoursPart = trimmedBlock;
    }

    if (daysPart && hoursPart) {
      const slots = parseSlots(hoursPart);
      if (slots.length > 0) {
        const rangeMatch = daysPart.match(/^([a-záéíóúñ]+)\s*(?:a|al|-)\s*([a-záéíóúñ]+)$/i);
        if (rangeMatch) {
          const startIdx = normalizeDayIndex(rangeMatch[1]);
          const endIdx = normalizeDayIndex(rangeMatch[2]);

          if (startIdx !== null && endIdx !== null) {
            let current = startIdx;
            while (true) {
              weekly[current].isOpen = true;
              weekly[current].slots = [...weekly[current].slots, ...slots];
              weekly[current].rawText = hoursPart;

              if (current === endIdx) break;
              current = (current + 1) % 7;
            }
          }
        } else {
          const individualDays = daysPart.split(/\s*,\s*/);
          for (const d of individualDays) {
            const idx = normalizeDayIndex(d);
            if (idx !== null) {
              weekly[idx].isOpen = true;
              weekly[idx].slots = [...weekly[idx].slots, ...slots];
              weekly[idx].rawText = hoursPart;
            }
          }
        }
      }
    } else if (hoursPart) {
      // Bloque general sin especificar días (ej. "9:00 AM - 8:00 PM"): aplica de Lunes a Sábado
      const slots = parseSlots(hoursPart);
      if (slots.length > 0) {
        for (let i = 1; i <= 6; i++) {
          weekly[i].isOpen = true;
          weekly[i].slots = [...slots];
          weekly[i].rawText = hoursPart;
        }
      }
    }
  }

  // Generar rawText amigable para días que tienen slots
  for (const day of weekly) {
    if (day.isOpen && day.slots.length > 0) {
      day.rawText = day.slots.map(s => `${s.open12h} - ${s.close12h}`).join(' / ');
    } else {
      day.rawText = 'Cerrado';
    }
  }

  return weekly;
}

/**
 * Convierte cualquier string de horarios guardado en la base de datos
 * a la estructura editable `DayScheduleItem[]` utilizada por el panel de administración
 * de la tienda, preservando de manera exacta los turnos configurados.
 */
export function parseScheduleToDaysSchedule(scheduleText: string | undefined): DayScheduleItem[] {
  if (!scheduleText || !scheduleText.trim()) {
    return DEFAULT_DAYS_SCHEDULE;
  }

  const weekly = parseStoreSchedule(scheduleText);
  const dayOrder: { dayId: DayScheduleItem['dayId']; dayIndex: number; name: string; short: string }[] = [
    { dayId: 'lun', dayIndex: 1, name: 'Lunes', short: 'Lun' },
    { dayId: 'mar', dayIndex: 2, name: 'Martes', short: 'Mar' },
    { dayId: 'mie', dayIndex: 3, name: 'Miércoles', short: 'Mié' },
    { dayId: 'jue', dayIndex: 4, name: 'Jueves', short: 'Jue' },
    { dayId: 'vie', dayIndex: 5, name: 'Viernes', short: 'Vie' },
    { dayId: 'sab', dayIndex: 6, name: 'Sábado', short: 'Sáb' },
    { dayId: 'dom', dayIndex: 0, name: 'Domingo', short: 'Dom' },
  ];

  // Si ningún día está abierto y el texto no dice explícitamente cerrado, recurrir al default
  const anyOpen = weekly.some(d => d.isOpen && d.slots.length > 0);
  if (!anyOpen && !/cerrado/i.test(scheduleText)) {
    return DEFAULT_DAYS_SCHEDULE;
  }

  return dayOrder.map(item => {
    const dayData = weekly[item.dayIndex];
    const isOpen = dayData ? dayData.isOpen && dayData.slots.length > 0 : false;
    const slots: ScheduleTimeSlot[] = isOpen && dayData
      ? dayData.slots.map((s, idx) => ({
          id: `${item.dayId}-${idx + 1}-${Math.random().toString(36).substring(2, 6)}`,
          open: minutesTo24h(s.openMinutes),
          close: minutesTo24h(s.closeMinutes >= 1440 ? 1439 : s.closeMinutes),
        }))
      : [];

    return {
      dayId: item.dayId,
      name: item.name,
      short: item.short,
      isOpen,
      slots: slots.length > 0 ? slots : [{ id: `${item.dayId}-1`, open: '08:00', close: '13:00' }],
    };
  });
}

/**
 * Evalúa en tiempo real si la tienda está abierta o cerrada,
 * calculando el próximo cambio de horario para informar al cliente.
 */
export function getStoreOpenStatus(
  scheduleText: string | undefined,
  currentDate: Date = new Date()
): StoreOpenStatus {
  if (!scheduleText || !scheduleText.trim()) {
    return {
      isOpen: false,
      status: 'unknown',
      badgeText: 'Horario flexible',
      detailText: 'Consultar por WhatsApp',
      todayText: 'Horario no especificado',
      weeklyHours: [],
      hasSchedule: false
    };
  }

  const weeklyHours = parseStoreSchedule(scheduleText);
  const currentDayIndex = currentDate.getDay(); // 0 = Domingo, 1 = Lunes, ...
  const currentMinutes = currentDate.getHours() * 60 + currentDate.getMinutes();

  const todayHours = weeklyHours[currentDayIndex];
  const isTodayOpen = todayHours?.isOpen && todayHours.slots.length > 0;

  // 1. ¿Está dentro de un turno activo hoy?
  if (isTodayOpen) {
    for (const slot of todayHours.slots) {
      if (currentMinutes >= slot.openMinutes && currentMinutes < slot.closeMinutes) {
        const minutesLeft = slot.closeMinutes - currentMinutes;
        const isClosingSoon = minutesLeft <= 45; // 45 minutos o menos

        return {
          isOpen: true,
          status: isClosingSoon ? 'closing_soon' : 'open',
          badgeText: isClosingSoon ? 'Cierra Pronto' : 'Abierto',
          detailText: `Cierra a la(s) ${slot.close12h}`,
          todayText: `Hoy: ${todayHours.rawText}`,
          weeklyHours,
          hasSchedule: true
        };
      }
    }

    // 2. No está dentro de un turno hoy, pero ¿abre en un turno posterior HOY?
    const laterSlotToday = todayHours.slots
      .filter(s => s.openMinutes > currentMinutes)
      .sort((a, b) => a.openMinutes - b.openMinutes)[0];

    if (laterSlotToday) {
      return {
        isOpen: false,
        status: 'closed',
        badgeText: 'Cerrado',
        detailText: `Abre hoy a la(s) ${laterSlotToday.open12h}`,
        todayText: `Hoy: ${todayHours.rawText}`,
        weeklyHours,
        hasSchedule: true
      };
    }
  }

  // 3. Ya cerró por hoy o hoy no abre: buscar el próximo día y hora de apertura
  for (let offset = 1; offset <= 7; offset++) {
    const nextDayIndex = (currentDayIndex + offset) % 7;
    const nextDay = weeklyHours[nextDayIndex];

    if (nextDay && nextDay.isOpen && nextDay.slots.length > 0) {
      const firstSlot = nextDay.slots.sort((a, b) => a.openMinutes - b.openMinutes)[0];
      const dayLabel = offset === 1 ? 'mañana' : `el ${nextDay.dayName}`;

      return {
        isOpen: false,
        status: 'closed',
        badgeText: 'Cerrado',
        detailText: `Abre ${dayLabel} a la(s) ${firstSlot.open12h}`,
        todayText: isTodayOpen ? `Hoy cerró: ${todayHours.rawText}` : 'Hoy: Cerrado',
        weeklyHours,
        hasSchedule: true
      };
    }
  }

  // Si ningún día abre
  return {
    isOpen: false,
    status: 'closed',
    badgeText: 'Cerrado',
    detailText: 'Cerrado temporalmente',
    todayText: 'Cerrado temporalmente',
    weeklyHours,
    hasSchedule: true
  };
}
