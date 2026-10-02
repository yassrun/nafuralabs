const DAYS: Record<string, string> = {
  MON: 'lundi', TUE: 'mardi', WED: 'mercredi', THU: 'jeudi', FRI: 'vendredi', SAT: 'samedi', SUN: 'dimanche',
  '1': 'lundi', '2': 'mardi', '3': 'mercredi', '4': 'jeudi', '5': 'vendredi', '6': 'samedi', '0': 'dimanche', '7': 'dimanche',
};

const isNumber = (value: string) => /^\d+$/.test(value);

/** Spring 6-field cron (`s m h dom mon dow`) in French for common schedules; other expressions are returned as is. */
export function describeCron(cron: unknown): string {
  const expression = String(cron ?? '').trim();
  const parts = expression.split(/\s+/);
  if (parts.length !== 6) return expression;
  const [second, minute, hour, dayOfMonth, month, dayOfWeek] = parts;
  if (second !== '0' || !isNumber(minute) || !isNumber(hour) || month !== '*') return expression;
  const time = `${hour.padStart(2, '0')}:${minute.padStart(2, '0')}`;

  if (dayOfMonth === '*' && (dayOfWeek === '*' || dayOfWeek === '?')) return `Tous les jours à ${time}`;
  if ((dayOfMonth === '*' || dayOfMonth === '?') && DAYS[dayOfWeek.toUpperCase()]) {
    return `Chaque ${DAYS[dayOfWeek.toUpperCase()]} à ${time}`;
  }
  if (isNumber(dayOfMonth) && (dayOfWeek === '*' || dayOfWeek === '?')) {
    return `Le ${dayOfMonth === '1' ? '1er' : dayOfMonth} de chaque mois à ${time}`;
  }
  return expression;
}
