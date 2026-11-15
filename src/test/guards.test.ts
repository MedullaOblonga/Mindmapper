const raw = import.meta.glob('/src/**/*.tsx', { query: '?raw', import: 'default', eager: true }) as Record<string, string>;
const tsxFiles = Object.entries(raw).filter(([p]) => !p.endsWith('.test.tsx'));

function stripImportsAndComments(text: string): string {
  return text
    .replace(/^\s*import .*$/gm, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\/\/.*$/gm, '')
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, '');
}

it('found the component files', () => { expect(tsxFiles.length).toBeGreaterThan(0); });
it('has no hard-coded colours in components', () => {
  for (const [path, text] of tsxFiles) expect(text, path).not.toMatch(/#[0-9a-fA-F]{3,8}\b|rgba?\(/);
});
it('has no banned words in UI text', () => {
  const banned = /\b(wellness|detected|flagged|burnout|sentiment|baseline)\b/i;
  for (const [path, text] of tsxFiles) expect(stripImportsAndComments(text), path).not.toMatch(banned);
});
