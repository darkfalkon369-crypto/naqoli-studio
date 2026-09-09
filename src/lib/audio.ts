/**
 * Tiny in-code music-box synth: generates a pleasant pentatonic kids'
 * melody as a 16-bit mono WAV buffer. No external assets needed.
 * Different categories get different seeds → different melodies.
 */

function hashSeed(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function synthMelodyWav(kind: string, seconds: number): Buffer {
  const sr = 22050;
  const total = Math.floor(sr * seconds);
  const data = new Float32Array(total);

  let seed = hashSeed(kind) || 1;
  const rnd = () => {
    seed ^= seed << 13;
    seed ^= seed >>> 17;
    seed ^= seed << 5;
    seed >>>= 0;
    return seed / 4294967296;
  };

  // C-major pentatonic, two octaves — always consonant, kid-friendly
  const scale = [523.25, 587.33, 659.25, 783.99, 880.0, 1046.5, 1174.66, 1318.51];

  const noteDur = 0.42;
  let prev = Math.floor(rnd() * scale.length);

  const addNote = (freq: number, startSec: number, amp: number, decay: number) => {
    const start = Math.floor(startSec * sr);
    const len = Math.floor(sr * 1.6);
    for (let i = 0; i < len && start + i < total; i++) {
      const t = i / sr;
      const env = Math.exp(-t * decay);
      // music-box timbre: fundamental + soft 2nd/3rd harmonics
      const v =
        Math.sin(2 * Math.PI * freq * t) +
        0.35 * Math.sin(4 * Math.PI * freq * t) * Math.exp(-t * 9) +
        0.12 * Math.sin(6 * Math.PI * freq * t) * Math.exp(-t * 14);
      data[start + i] += v * env * amp;
    }
  };

  // melody: stepwise random walk (smooth, singable)
  for (let t = 0.2; t < seconds - 0.5; t += noteDur) {
    const step = rnd() < 0.7 ? (rnd() < 0.5 ? 1 : -1) : Math.floor(rnd() * 3) - 1;
    prev = Math.min(scale.length - 1, Math.max(0, prev + step));
    addNote(scale[prev], t, 0.42, 5.5);
    // occasional sparkle octave ping
    if (rnd() < 0.18) addNote(scale[prev] * 2, t + noteDur / 2, 0.14, 8);
  }

  // gentle bass every ~1.7s (root/fifth)
  for (let t = 0; t < seconds - 1; t += 1.68) {
    const bass = rnd() < 0.5 ? 130.81 : 196.0; // C3 / G3
    addNote(bass, t, 0.3, 3.2);
  }

  // soft normalize
  let peak = 0;
  for (let i = 0; i < total; i++) peak = Math.max(peak, Math.abs(data[i]));
  const g = peak > 0 ? 0.82 / peak : 1;

  // WAV (16-bit PCM mono)
  const buf = Buffer.alloc(44 + total * 2);
  buf.write("RIFF", 0);
  buf.writeUInt32LE(36 + total * 2, 4);
  buf.write("WAVE", 8);
  buf.write("fmt ", 12);
  buf.writeUInt32LE(16, 16);
  buf.writeUInt16LE(1, 20);
  buf.writeUInt16LE(1, 22);
  buf.writeUInt32LE(sr, 24);
  buf.writeUInt32LE(sr * 2, 28);
  buf.writeUInt16LE(2, 32);
  buf.writeUInt16LE(16, 34);
  buf.write("data", 36);
  buf.writeUInt32LE(total * 2, 40);
  for (let i = 0; i < total; i++) {
    const v = Math.max(-1, Math.min(1, data[i] * g));
    buf.writeInt16LE(Math.round(v * 32767), 44 + i * 2);
  }
  return buf;
}
