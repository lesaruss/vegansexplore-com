# Banner cuts of the Guide commercials (playbook ve-guide-banner-audio)

Sean, 2026-11-09: the banner version of each commercial changes only the last line. The podcast cut ends "Open the <Guide> at
vegansexplore.com" (or "Find it at vegansexplore.com under Guides"); the banner cut ends "Tap below to open the <Guide>." Same voice,
same music, everything before the last line untouched.

How the Holiday cut was made (`holiday-guide-banner-v1.mp3`, 35.4 s, -16.5 LUFS, stt matched word for word):

1. Record the whole script again with the new last line in the Guide's roster voice (el-media `tts` from SQL with `net.http_post`,
   "Veegan" in the text sent), saved as `commercials/voice/<guide>-<speaker>-banner-take1.mp3`. Only its last sentence is used: a sentence
   said at the end of the full script ends the way a closing line should.
2. el-media `stt` on the podcast voice stem and on the new take, for the cut points (the gap before the old last line, the span of the new one).
3. `splice_holiday.py` (numpy over ffmpeg-decoded mono 44.1 kHz): find where the voice sits in the podcast mix (cross-correlation), fit the
   voice and bed gains just before the cut, keep the podcast mix untouched up to the gap, then the new line at the fitted voice gain over
   the same bed continued from the same point, the original tail (0.45 s, then a 2.5 s fade), a 25 ms crossfade at the join; a pause over
   about half a second inside the new line is shortened. Encode 192 kbps.
4. Upload with el-media `upload_url` and PUT; compare md5 with the public file.
5. el-media `stt` on the finished cut; it must read the script word for word. Then a `ve_guide_commercials` row (cut `banner`).

The October spots (Dairy, Airport, Restaurant, Stadium, Creator, Nonprofit) have no voice stems stored: their banner cuts splice into the
finished mix the same way (the bed under the old last line, where one exists, carries on under the new one).
