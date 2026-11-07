import { highlightRanges, snippetAround } from './highlight';

const pick = (text: string, query: string) =>
  highlightRanges(text, query).map((r) => text.slice(r.start, r.end));

describe('highlightRanges', () => {
  it('ignora acentos y mayúsculas y pinta el texto original', () => {
    expect(pick('Taller de Programación', 'programacion')).toEqual(['Programación']);
    expect(pick('José Muñoz', 'jose munoz')).toEqual(['José', 'Muñoz']);
  });

  it('marca prefijos y todas las apariciones', () => {
    expect(pick('Biología y biólogos', 'biolo')).toEqual(['Biolo', 'biólo']);
  });

  it('fusiona rangos que se solapan', () => {
    expect(highlightRanges('programacion', 'program grama')).toEqual([{ start: 0, end: 8 }]);
  });

  it('sin coincidencias, consulta o texto vacíos devuelve []', () => {
    expect(highlightRanges('Hola', 'adios')).toEqual([]);
    expect(highlightRanges('Hola', '   ')).toEqual([]);
    expect(highlightRanges('', 'hola')).toEqual([]);
  });

  it('respeta saltos de línea y espacios múltiples', () => {
    expect(pick('uno\n\ndos  tres', 'dos')).toEqual(['dos']);
  });
});

describe('snippetAround', () => {
  const long = `${'Intro '.repeat(40)}aquí está la palabra clave buscada ${'final '.repeat(40)}`;

  it('devuelve el texto entero si es corto', () => {
    expect(snippetAround('corto', 'x')).toBe('corto');
  });

  it('centra el fragmento en la primera coincidencia y marca los recortes', () => {
    const s = snippetAround(long, 'clave', 80);
    expect(s).toContain('clave');
    expect(s.startsWith('…')).toBe(true);
    expect(s.endsWith('…')).toBe(true);
    expect(s.length).toBeLessThanOrEqual(82);
  });

  it('sin coincidencia usa el principio', () => {
    const s = snippetAround(long, 'zzz', 50);
    expect(s.startsWith('Intro')).toBe(true);
    expect(s.endsWith('…')).toBe(true);
  });

  it('una coincidencia al final no corta el final', () => {
    const text = `${'a '.repeat(100)}objetivo`;
    expect(snippetAround(text, 'objetivo', 30).endsWith('objetivo')).toBe(true);
  });
});
