import { tagEntry } from './tagger';
it('tags by NASA category, first-mentioned wins ties', () => {
  const s = tagEntry('Missed the call window with Sam again. The printer jammed and I fixed it, finally.', 112, 'u1');
  expect(s.map(x => [x.category, x.group, x.felt])).toEqual([['Outside Communications', 'home', 'hard'], ['Equipment', 'work', 'good']]);
});
it('handles empty, unknown and long text', () => {
  expect(tagEntry('   ', 112, 'u')).toEqual([]);
  expect(tagEntry('Zxqv blorp.', 112, 'u')[0]).toMatchObject({ category: 'Uncategorised', group: 'other', felt: null });
  expect(() => tagEntry('Work. '.repeat(1000), 112, 'u')).not.toThrow();
  expect(tagEntry('x'.repeat(5000), 112, 'u')).toHaveLength(1);
  expect(tagEntry('...!!!???', 112, 'u')).toEqual([]);
});
it('merges neighbouring sentences with the same category', () => {
  expect(tagEntry('The pump broke. The valve leaked too.', 5, 'u')).toHaveLength(1);
});
