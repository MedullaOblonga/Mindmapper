type Rec = { lang: string; interimResults: boolean; continuous: boolean; start(): void; stop(): void;
  onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }> & { isFinal: boolean }>; resultIndex: number }) => void) | null; onend: (() => void) | null; onerror: (() => void) | null };
type RecCtor = new () => Rec;

function ctor(): RecCtor | null {
  if (typeof window === 'undefined') return null;
  const w = window as unknown as { SpeechRecognition?: RecCtor; webkitSpeechRecognition?: RecCtor };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}
export function canListen(): boolean { return ctor() !== null; }

/** Starts the browser's speech recognition. Returns a stop function. */
export function listen(onText: (t: string) => void, onEnd: () => void): () => void {
  const C = ctor();
  if (!C) { onEnd(); return () => {}; }
  const r = new C();
  r.lang = 'en-US'; r.interimResults = false; r.continuous = true;
  r.onresult = e => { for (let i = e.resultIndex; i < e.results.length; i++) if (e.results[i].isFinal) onText(e.results[i][0].transcript.trim()); };
  r.onend = onEnd; r.onerror = onEnd;
  try { r.start(); } catch { onEnd(); }
  return () => { try { r.stop(); } catch { /* already stopped */ } };
}
export function canSpeak(): boolean { return typeof window !== 'undefined' && 'speechSynthesis' in window; }
export function speak(text: string): void {
  if (!canSpeak()) return;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(new SpeechSynthesisUtterance(text));
}
