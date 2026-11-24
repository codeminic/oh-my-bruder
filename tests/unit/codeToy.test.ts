import { describe, expect, it } from 'vitest';
import { CODE_MAX_LEN, formatOutput, normalizeInput } from '../../src/toys/code/codeToy';

describe('normalizeInput', () => {
  it('trims and collapses whitespace', () => {
    expect(normalizeInput('  robots  ', 'x')).toBe('robots');
    expect(normalizeInput('big   \n  ideas', 'x')).toBe('big ideas');
  });
  it('uses the fallback for empty input', () => {
    expect(normalizeInput('   ', 'things')).toBe('things');
    expect(normalizeInput('', 'things')).toBe('things');
  });
  it('truncates to the maximum length', () => {
    expect(CODE_MAX_LEN).toBe(24);
    expect(normalizeInput('a'.repeat(40), 'x')).toHaveLength(24);
  });
  it('leaves markup as plain text for the DOM to escape', () => {
    expect(normalizeInput('<b>x</b>', 'x')).toBe('<b>x</b>');
  });
});

describe('formatOutput', () => {
  it('joins prefix and value', () => {
    expect(formatOutput('Building', 'robots')).toBe('Building robots');
  });
});
