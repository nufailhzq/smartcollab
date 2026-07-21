-- Peer contribution scores move from a 0–100 scale to a coarse 1–5 activity
-- scale (1 = tidak aktif langsung … 5 = sangat aktif). Existing rows are on the
-- old 0–100 scale, so remap them: round(old / 20), clamped to 1–5.
--   0–10 → 1, 11–30 → 2, 31–50 → 3, 51–70 → 4, 71–100 → 5
UPDATE `peer_assessments`
SET `fld_contribution_score` = LEAST(5, GREATEST(1, ROUND(`fld_contribution_score` / 20)));
