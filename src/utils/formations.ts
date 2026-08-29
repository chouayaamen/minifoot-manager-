export type FormatType = '5v5' | '6v6' | '7v7' | '8v8';
export type Slot = { id: string; label: string; x: number; y: number; position: string };
export type FormationDef = { name: string; slots: Slot[] };

function s(id: string, label: string, x: number, y: number, pos: string): Slot {
  return { id, label, x, y, position: pos };
}

export const FORMATIONS: Record<FormatType, FormationDef[]> = {
  '5v5': [
    {
      name: '1-2-1',
      slots: [
        s('gk', 'GK', 50, 88, 'GK'),
        s('d1', 'DEF', 30, 68, 'DEF'),
        s('d2', 'DEF', 70, 68, 'DEF'),
        s('m1', 'MID', 50, 42, 'MID'),
        s('p1', 'PIVOT', 50, 18, 'PIVOT'),
      ],
    },
    {
      name: '2-2',
      slots: [
        s('gk', 'GK', 50, 88, 'GK'),
        s('d1', 'DEF', 25, 62, 'DEF'),
        s('d2', 'DEF', 75, 62, 'DEF'),
        s('m1', 'MID', 25, 30, 'MID'),
        s('m2', 'MID', 75, 30, 'MID'),
      ],
    },
    {
      name: '2-1-1',
      slots: [
        s('gk', 'GK', 50, 88, 'GK'),
        s('d1', 'DEF', 30, 65, 'DEF'),
        s('d2', 'DEF', 70, 65, 'DEF'),
        s('m1', 'MID', 50, 42, 'MID'),
        s('p1', 'PIVOT', 50, 18, 'PIVOT'),
      ],
    },
  ],
  '6v6': [
    {
      name: '2-2-1',
      slots: [
        s('gk', 'GK', 50, 88, 'GK'),
        s('d1', 'DEF', 30, 66, 'DEF'),
        s('d2', 'DEF', 70, 66, 'DEF'),
        s('m1', 'MID', 30, 38, 'MID'),
        s('m2', 'MID', 70, 38, 'MID'),
        s('p1', 'PIVOT', 50, 16, 'PIVOT'),
      ],
    },
    {
      name: '2-1-2',
      slots: [
        s('gk', 'GK', 50, 88, 'GK'),
        s('d1', 'DEF', 28, 66, 'DEF'),
        s('d2', 'DEF', 72, 66, 'DEF'),
        s('m1', 'MID', 50, 44, 'MID'),
        s('p1', 'PIVOT', 30, 18, 'PIVOT'),
        s('p2', 'PIVOT', 70, 18, 'PIVOT'),
      ],
    },
    {
      name: '1-3-1',
      slots: [
        s('gk', 'GK', 50, 88, 'GK'),
        s('d1', 'DEF', 50, 68, 'DEF'),
        s('m1', 'MID', 20, 42, 'MID'),
        s('m2', 'MID', 50, 38, 'MID'),
        s('m3', 'MID', 80, 42, 'MID'),
        s('p1', 'PIVOT', 50, 16, 'PIVOT'),
      ],
    },
  ],
  '7v7': [
    {
      name: '2-3-1',
      slots: [
        s('gk', 'GK', 50, 88, 'GK'),
        s('d1', 'DEF', 32, 70, 'DEF'),
        s('d2', 'DEF', 68, 70, 'DEF'),
        s('m1', 'MID', 20, 44, 'MID'),
        s('m2', 'MID', 50, 40, 'MID'),
        s('m3', 'MID', 80, 44, 'MID'),
        s('p1', 'PIVOT', 50, 16, 'PIVOT'),
      ],
    },
    {
      name: '3-2-1',
      slots: [
        s('gk', 'GK', 50, 88, 'GK'),
        s('d1', 'DEF', 22, 68, 'DEF'),
        s('d2', 'DEF', 50, 70, 'DEF'),
        s('d3', 'DEF', 78, 68, 'DEF'),
        s('m1', 'MID', 35, 40, 'MID'),
        s('m2', 'MID', 65, 40, 'MID'),
        s('p1', 'PIVOT', 50, 16, 'PIVOT'),
      ],
    },
    {
      name: '3-1-2',
      slots: [
        s('gk', 'GK', 50, 88, 'GK'),
        s('d1', 'DEF', 22, 68, 'DEF'),
        s('d2', 'DEF', 50, 70, 'DEF'),
        s('d3', 'DEF', 78, 68, 'DEF'),
        s('m1', 'MID', 50, 44, 'MID'),
        s('p1', 'PIVOT', 32, 18, 'PIVOT'),
        s('p2', 'PIVOT', 68, 18, 'PIVOT'),
      ],
    },
  ],
  '8v8': [
    {
      name: '3-3-1',
      slots: [
        s('gk', 'GK', 50, 88, 'GK'),
        s('d1', 'DEF', 22, 70, 'DEF'),
        s('d2', 'DEF', 50, 72, 'DEF'),
        s('d3', 'DEF', 78, 70, 'DEF'),
        s('m1', 'MID', 22, 42, 'MID'),
        s('m2', 'MID', 50, 38, 'MID'),
        s('m3', 'MID', 78, 42, 'MID'),
        s('p1', 'PIVOT', 50, 16, 'PIVOT'),
      ],
    },
    {
      name: '2-4-1',
      slots: [
        s('gk', 'GK', 50, 88, 'GK'),
        s('d1', 'DEF', 32, 70, 'DEF'),
        s('d2', 'DEF', 68, 70, 'DEF'),
        s('m1', 'MID', 18, 44, 'MID'),
        s('m2', 'MID', 40, 40, 'MID'),
        s('m3', 'MID', 60, 40, 'MID'),
        s('m4', 'MID', 82, 44, 'MID'),
        s('p1', 'PIVOT', 50, 16, 'PIVOT'),
      ],
    },
    {
      name: '3-2-2',
      slots: [
        s('gk', 'GK', 50, 88, 'GK'),
        s('d1', 'DEF', 22, 70, 'DEF'),
        s('d2', 'DEF', 50, 72, 'DEF'),
        s('d3', 'DEF', 78, 70, 'DEF'),
        s('m1', 'MID', 32, 40, 'MID'),
        s('m2', 'MID', 68, 40, 'MID'),
        s('p1', 'PIVOT', 32, 16, 'PIVOT'),
        s('p2', 'PIVOT', 68, 16, 'PIVOT'),
      ],
    },
  ],
};

export function getFormation(format: FormatType, name: string): FormationDef | undefined {
  return FORMATIONS[format].find((f) => f.name === name);
}

export function defaultFormation(format: FormatType): FormationDef {
  return FORMATIONS[format][0];
}

export function allFormatTypes(): FormatType[] {
  return ['5v5', '6v6', '7v7', '8v8'];
}