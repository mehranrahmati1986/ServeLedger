const persianPartsFormatter = new Intl.DateTimeFormat("en-US-u-ca-persian", {
  year: "numeric",
  month: "numeric",
  day: "numeric"
});

const persianMonthFormatter = new Intl.DateTimeFormat("fa-IR-u-ca-persian", {
  year: "numeric",
  month: "long"
});

const persianFullDateFormatter = new Intl.DateTimeFormat("fa-IR-u-ca-persian", {
  weekday: "long",
  year: "numeric",
  month: "long",
  day: "numeric"
});

const persianShortDateFormatter = new Intl.DateTimeFormat("fa-IR-u-ca-persian", {
  month: "short",
  day: "numeric"
});

export const persianWeekdays = ["شنبه", "یکشنبه", "دوشنبه", "سه‌شنبه", "چهارشنبه", "پنج‌شنبه", "جمعه"];

export interface PersianDayCell {
  date: Date;
  iso: string;
  day: number;
  isToday: boolean;
}

const toIsoDate = (date: Date) => {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const parseIsoDate = (value: string) => {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, (month || 1) - 1, day || 1, 12);
};

export const getPersianParts = (date: Date) => {
  const parts = persianPartsFormatter.formatToParts(date);
  const year = Number(parts.find(part => part.type === "year")?.value);
  const month = Number(parts.find(part => part.type === "month")?.value);
  const day = Number(parts.find(part => part.type === "day")?.value);
  return { year, month, day };
};

export const buildPersianMonth = (viewDate: Date) => {
  const target = getPersianParts(viewDate);
  const start = new Date(viewDate);
  start.setHours(12, 0, 0, 0);
  start.setDate(start.getDate() - 42);

  const todayIso = toIsoDate(new Date());
  const days: PersianDayCell[] = [];

  for (let index = 0; index < 92; index += 1) {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    const parts = getPersianParts(date);

    if (parts.year === target.year && parts.month === target.month) {
      const iso = toIsoDate(date);
      days.push({
        date,
        iso,
        day: parts.day,
        isToday: iso === todayIso
      });
    }
  }

  const firstDay = days[0]?.date;
  const leadingBlanks = firstDay ? (firstDay.getDay() + 1) % 7 : 0;

  return {
    label: persianMonthFormatter.format(viewDate),
    year: target.year,
    month: target.month,
    days,
    leadingBlanks
  };
};

export const addPersianMonths = (date: Date, delta: number) => {
  const next = new Date(date);
  next.setHours(12, 0, 0, 0);
  next.setDate(next.getDate() + delta * 32);
  return next;
};

export const formatPersianDate = (isoDate: string) => {
  if (!isoDate) return "";
  return persianFullDateFormatter.format(parseIsoDate(isoDate));
};

export const formatPersianShortDate = (isoDate: string) => {
  if (!isoDate) return "";
  return persianShortDateFormatter.format(parseIsoDate(isoDate));
};
