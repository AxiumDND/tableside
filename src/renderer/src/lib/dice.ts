export interface DiceResult {
  expr: string;
  total: number;
  detail: string;
  rolls: number[];
  sides: number;
  bonus: number;
}

const DICE_RE = /(\d*)d(\d+)([+-]\d+)?/i;

export function rollExpr(expr: string): DiceResult {
  const cleaned = expr.replace(/\s/g, '');
  const match = DICE_RE.exec(cleaned);
  if (!match) {
    const n = Number(cleaned);
    return {
      expr,
      total: Number.isFinite(n) ? n : 0,
      detail: String(cleaned),
      rolls: [],
      sides: 0,
      bonus: 0,
    };
  }
  const count = match[1] ? Number(match[1]) : 1;
  const sides = Number(match[2]);
  const bonus = match[3] ? Number(match[3]) : 0;
  const rolls: number[] = [];
  for (let i = 0; i < Math.min(count, 40); i += 1) {
    rolls.push(1 + Math.floor(Math.random() * sides));
  }
  const total = rolls.reduce((sum, n) => sum + n, 0) + bonus;
  const bonusText = bonus ? (bonus > 0 ? `+${bonus}` : String(bonus)) : '';
  return {
    expr,
    total,
    detail: `[${rolls.join(', ')}]${bonusText}`,
    rolls,
    sides,
    bonus,
  };
}

export function rollD20(mod: number, label = 'Check'): DiceResult {
  const result = rollExpr(`1d20${mod >= 0 ? '+' : ''}${mod}`);
  return { ...result, expr: `${label} ${mod >= 0 ? '+' : ''}${mod}` };
}

export function abilityMod(score: number): number {
  return Math.floor((score - 10) / 2);
}

export function formatMod(mod: number): string {
  return mod >= 0 ? `+${mod}` : String(mod);
}

export function extractRolls(text: string): { label: string; expr: string }[] {
  const found: { label: string; expr: string }[] = [];
  const seen = new Set<string>();
  const add = (label: string, expr: string): void => {
    const key = `${label}:${expr}`;
    if (seen.has(key)) return;
    seen.add(key);
    found.push({ label, expr });
  };

  const attack =
    /([+-]\d+)\s*to hit/i.exec(text) ??
    /Attack Roll:\s*([+-]\d+)/i.exec(text) ??
    /(?:Melee|Ranged)\s+(?:Weapon\s+)?Attack:\s*([+-]\d+)/i.exec(text);
  if (attack) add('To hit', `1d20${attack[1]}`);

  const dice: string[] = [];
  const damage = /(\d+d\d+(?:[+-]\d+)?)/gi;
  let match: RegExpExecArray | null;
  while ((match = damage.exec(text))) {
    if (/^1?d20(?:[+-]\d+)?$/i.test(match[1])) continue;
    dice.push(match[1]);
  }
  dice.forEach((expr, index) => {
    add(dice.length === 1 ? 'Damage' : `Damage ${index + 1}`, expr);
  });

  const dc = /DC\s+(\d+)/i.exec(text);
  if (dc) add(`Save DC ${dc[1]}`, '1d20');
  return found;
}
