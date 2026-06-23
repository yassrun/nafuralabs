import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'cronDescription',
  standalone: true,
})
export class CronDescriptionPipe implements PipeTransform {
  transform(cron: string | null | undefined): string {
    if (!cron) return '';

    const parts = cron.trim().split(/\s+/);
    if (parts.length < 6) {
      return cron;
    }

    const [sec, min, hour, dayOfMonth, month, dayOfWeek] = parts;

    const time = this.formatTime(hour, min);

    // Daily: 0 0 8 * * *
    if (dayOfMonth === '*' && month === '*' && dayOfWeek === '*') {
      return `Daily at ${time}`;
    }

    // Weekly: 0 0 2 * * SUN
    if (dayOfMonth === '*' && month === '*' && dayOfWeek !== '*') {
      const dayName = this.dayOfWeekLabel(dayOfWeek);
      return `Every ${dayName} at ${time}`;
    }

    // Monthly: 0 0 3 1 * *
    if (dayOfMonth !== '*' && month === '*' && dayOfWeek === '*') {
      return `Monthly on day ${dayOfMonth} at ${time}`;
    }

    return cron;
  }

  private formatTime(hour: string, minute: string): string {
    const h = Number(hour || '0');
    const m = Number(minute || '0');
    const suffix = h >= 12 ? 'PM' : 'AM';
    const normalizedHour = ((h + 11) % 12) + 1;
    const mm = m.toString().padStart(2, '0');
    return `${normalizedHour}:${mm} ${suffix}`;
  }

  private dayOfWeekLabel(value: string): string {
    const upper = value.toUpperCase();
    switch (upper) {
      case 'SUN':
      case '0':
        return 'Sunday';
      case 'MON':
      case '1':
        return 'Monday';
      case 'TUE':
      case '2':
        return 'Tuesday';
      case 'WED':
      case '3':
        return 'Wednesday';
      case 'THU':
      case '4':
        return 'Thursday';
      case 'FRI':
      case '5':
        return 'Friday';
      case 'SAT':
      case '6':
        return 'Saturday';
      default:
        return value;
    }
  }
}

