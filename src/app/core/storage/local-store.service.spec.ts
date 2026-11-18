import { LocalStore } from './local-store.service';

describe('LocalStore', () => {
  const store = new LocalStore();

  beforeEach(() => localStorage.clear());
  afterEach(() => jest.restoreAllMocks());

  it('writes, reads and removes JSON values under a prefix', () => {
    store.write('plan', { stops: 2 });
    expect(localStorage.getItem('wayly.plan')).toBe('{"stops":2}');
    expect(store.read<{ stops: number }>('plan')).toEqual({ stops: 2 });
    store.remove('plan');
    expect(store.read('plan')).toBeNull();
  });

  it('returns null for corrupt data', () => {
    localStorage.setItem('wayly.bad', '{not json');
    expect(store.read('bad')).toBeNull();
  });

  it('never throws when storage is unavailable', () => {
    jest.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('quota');
    });
    jest.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    expect(store.read('x')).toBeNull();
    expect(() => store.write('x', 1)).not.toThrow();
    expect(() => store.remove('x')).not.toThrow();
  });
});
