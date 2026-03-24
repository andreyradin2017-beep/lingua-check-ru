import { describe, it, expect, test } from 'vitest';

describe('simple', () => {
  it('should work', () => {
    expect(1 + 1).toBe(2);
  });
  
  test('another test', () => {
    expect('hello').toBe('hello');
  });
});
