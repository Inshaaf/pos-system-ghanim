ALTER TABLE pos.expenses
    ADD COLUMN session_id BIGINT REFERENCES pos.sessions(id);

CREATE INDEX idx_expenses_session_id ON pos.expenses(session_id);

WITH session_matches AS (
    SELECT e.id AS expense_id,
           s.id AS session_id,
           COUNT(*) OVER (PARTITION BY e.id) AS match_count
    FROM pos.expenses e
    JOIN pos.sessions s
      ON e.created_at >= s.opened_at
     AND (s.closed_at IS NULL OR e.created_at <= s.closed_at)
    WHERE e.cash_movement_id IS NULL
)
UPDATE pos.expenses e
SET session_id = sm.session_id
FROM session_matches sm
WHERE e.id = sm.expense_id
  AND sm.match_count = 1;
