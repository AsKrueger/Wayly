import { LocalStore } from '../../core/storage/local-store.service';
import { TtlCache } from './ttl-cache';

describe('TtlCache', () => {
  let now = 0;
  const cache = () => new TtlCache<number>(new LocalStore(), 'test', 1000, 2, () => now);

  beforeEach(() => {
    localStorage.clear();
    now = 0;
  });

  it('returns values until they expire', () => {
    const subject = cache();
    subject.set('a', 1);
    now = 1000;
    expect(subject.get('a')).toBe(1);
    now = 1001;
    expect(subject.get('a')).toBeNull();
    expect(localStorage.getItem('wayly.cache.test.a')).toBeNull();
  });

  it('evicts the oldest entry beyond the limit', () => {
    const subject = cache();
    subject.set('a', 1);
    subject.set('b', 2);
    subject.set('a', 3);
    subject.set('c', 4);
    expect(subject.get('b')).toBeNull();
    expect(subject.get('a')).toBe(3);
    expect(subject.get('c')).toBe(4);
  });

  it('ignores a corrupt index or entry', () => {
    localStorage.setItem('wayly.cache.test.index', '"oops"');
    localStorage.setItem('wayly.cache.test.x', '{"value":1}');
    const subject = cache();
    expect(subject.get('x')).toBeNull();
    subject.set('y', 2);
    expect(subject.get('y')).toBe(2);
  });
});
