import { relativeTimeParts } from './relative';

const now = new Date('2026-11-06T12:00:00Z');
const ago = (ms: number) => new Date(now.getTime() - ms);
const MIN = 60_000;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;

describe('relativeTimeParts', () => {
  it('menos de un minuto es "ahora", también con fechas futuras', () => {
    expect(relativeTimeParts(ago(59_000), now)).toEqual({ unit: 'now' });
    expect(relativeTimeParts(ago(-5 * MIN), now)).toEqual({ unit: 'now' });
  });

  it('minutos, horas y días redondeados hacia abajo', () => {
    expect(relativeTimeParts(ago(MIN), now)).toEqual({ unit: 'minute', value: 1 });
    expect(relativeTimeParts(ago(59 * MIN + 59_000), now)).toEqual({ unit: 'minute', value: 59 });
    expect(relativeTimeParts(ago(HOUR), now)).toEqual({ unit: 'hour', value: 1 });
    expect(relativeTimeParts(ago(23 * HOUR + 59 * MIN), now)).toEqual({ unit: 'hour', value: 23 });
    expect(relativeTimeParts(ago(DAY), now)).toEqual({ unit: 'day', value: 1 });
    expect(relativeTimeParts(ago(6 * DAY + 23 * HOUR), now)).toEqual({ unit: 'day', value: 6 });
  });

  it('a partir de 7 días devuelve la fecha', () => {
    const d = ago(7 * DAY);
    expect(relativeTimeParts(d, now)).toEqual({ unit: 'date', date: d });
  });

  it('acepta cadenas ISO y números', () => {
    expect(relativeTimeParts(ago(2 * HOUR).toISOString(), now)).toEqual({ unit: 'hour', value: 2 });
    expect(relativeTimeParts(ago(3 * MIN).getTime(), now)).toEqual({ unit: 'minute', value: 3 });
  });

  it('usa la hora actual por defecto', () => {
    expect(relativeTimeParts(new Date())).toEqual({ unit: 'now' });
  });
});
