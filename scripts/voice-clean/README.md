# Cleaning Sean's voice-booth takes (2026-11-21, the World Vegan Expo Guide)

- `clean.py <line> <conv.mp3> <out.mp3>`: cut on speech, not silence. ElevenLabs scribe word timings give the first and last word; from
  there it walks 10 ms frames out to the first quiet frame (< -48 dBFS). Then a 30 ms fade in, a 150 ms fade out, 250 ms of padding,
  and -16.0 LUFS with a soft limiter at -1.5 dBTP (mono, 44.1 kHz, 128k).
- **Why not a silence trim:** the click of pressing Stop is quiet in Sean's raw take, but the voice conversion makes it loud (peak about
  -22 dB, about 0.25 s after the last word). A -45 dB silence trim stops at the click and keeps it; Sean heard it on every line.
- `dehiss.py <in> <out.wav> <t0> <t1>`: over one span (source time), crossfades to a 4.5 kHz low-passed copy with 15 ms ramps, and
  leaves the rest of the file untouched. Use it for a conversion hiss on a fricative. First use: the "f" of "Founding" in
  `liz-expo-n-start`, source 23.19 to 23.44 s, where almost all the energy sat above 6 kHz and Sean's raw take had none of it.
- The stt call and the upload go through a one-time function (`scripts/supabase-once/expo-voices.ts`), redeployed as the 410 stub after.
