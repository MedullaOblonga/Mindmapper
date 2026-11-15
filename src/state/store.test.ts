import { createStoreForTest, STORAGE_KEY } from './store';
it('survives a broken localStorage', () => {
  localStorage.setItem(STORAGE_KEY, '{not json');
  expect(() => createStoreForTest()).not.toThrow();
  expect(createStoreForTest().getState().day).toBe(112);
});
it('ignores data from an older version', () => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ v: 0, day: 5, events: 'x' }));
  expect(createStoreForTest().getState().events).toEqual([]);
});
it('persists events and clamps the day', () => {
  const s = createStoreForTest();
  s.getState().setDay(500); expect(s.getState().day).toBe(250);
  s.getState().add({ type: 'dismiss', what: 'tonight' });
  expect(createStoreForTest().getState().events).toHaveLength(1);
});
it('runs in memory when storage throws', () => {
  const orig = Storage.prototype.setItem;
  Storage.prototype.setItem = () => { throw new Error('full'); };
  try { const s = createStoreForTest(); expect(() => s.getState().add({ type: 'dismiss', what: 'tonight' })).not.toThrow(); expect(s.getState().events).toHaveLength(1); }
  finally { Storage.prototype.setItem = orig; }
});
