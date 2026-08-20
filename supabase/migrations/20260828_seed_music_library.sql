-- The music library UI has shown the same hardcoded mock categories/tracks
-- (data.ts MOCK MUSIC_LIBRARY) since before music_categories/music_items
-- existed. Once an admin adds any real category, initializePublicData()
-- switches entirely to the real tables (see data.ts) — so these mock rows
-- were never actually in the database, had no real id, and AdminMusicLibrary
-- .tsx's delete handler silently no-ops when an item has no _itemId. That's
-- "deleting a track does nothing": the track being deleted was still mock
-- data. Seeding these as real rows (once) fixes it for every existing item,
-- not just tracks.
INSERT INTO music_categories (name, sort_order)
SELECT * FROM (VALUES
  ('Current Repertoire', 0),
  ('Study Guides', 1),
  ('Practice Tracks', 2),
  ('Archive', 3)
) AS seed(name, sort_order)
WHERE NOT EXISTS (SELECT 1 FROM music_categories);

INSERT INTO music_items (category_id, title, type, link, notes)
SELECT c.id, v.title, v.type, v.link, v.notes
FROM (VALUES
  ('Current Repertoire', 'Pamugun (F. Buencamino)', 'Score', 'https://drive.google.com/file/d/...', 'SATB arrangement'),
  ('Current Repertoire', 'Koyu No Te Nupur', 'Score', 'https://drive.google.com/file/d/...', 'Japanese folk song'),
  ('Current Repertoire', 'Di Tayo Pwede', 'Score', 'https://drive.google.com/file/d/...', 'The Juans arr. Khow'),
  ('Current Repertoire', 'Dansa', 'Score', 'https://drive.google.com/file/d/...', 'Festival piece'),
  ('Study Guides', 'Sight-reading Exercises — Soprano', 'PDF', 'https://drive.google.com/file/d/...', 'Levels 1-3'),
  ('Study Guides', 'Breathing Techniques Guide', 'PDF', 'https://drive.google.com/file/d/...', 'Maestro dela Peña'),
  ('Study Guides', 'Vocal Warm-up Routines', 'PDF', 'https://drive.google.com/file/d/...', '15-min daily routine'),
  ('Practice Tracks', 'Pamugun — Soprano Part', 'MP3', 'https://drive.google.com/file/d/...', 'Isolated track'),
  ('Practice Tracks', 'Pamugun — Full Mix', 'MP3', 'https://drive.google.com/file/d/...', 'All parts'),
  ('Practice Tracks', 'Di Tayo Pwede — Alto Part', 'MP3', 'https://drive.google.com/file/d/...', 'Isolated track'),
  ('Archive', 'Bayang Barok 2025 — Full Repertoire', 'Folder', 'https://drive.google.com/drive/folders/...', '14 pieces'),
  ('Archive', 'Busan 2025 Competition Pieces', 'Folder', 'https://drive.google.com/drive/folders/...', 'Award-winning set')
) AS v(category_name, title, type, link, notes)
JOIN music_categories c ON c.name = v.category_name
WHERE NOT EXISTS (SELECT 1 FROM music_items);
