/**
 * Web Speech API による日本語読み上げ（TTS）。
 * 資料: 言語読解力のハンディキャップを相殺するため、語彙・文章題を音声提示する。
 * iPad / Chrome を想定。未対応環境では黙って何もしない。
 */
export function speak(text: string) {
  try {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'ja-JP';
    u.rate = 0.95; // 児童向けに少しゆっくり
    u.pitch = 1.0;
    window.speechSynthesis.speak(u);
  } catch {
    /* noop */
  }
}

export function stopSpeaking() {
  try {
    window.speechSynthesis?.cancel();
  } catch {
    /* noop */
  }
}
