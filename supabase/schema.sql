CREATE TABLE tickets (
  id BIGSERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  priority TEXT CHECK (priority IN ('Low','Medium','High','Critical')),
  category TEXT,
  status TEXT CHECK (status IN ('New','In Progress','Resolved','Escalated')) DEFAULT 'New',
  source TEXT CHECK (source IN ('portal','telegram')) NOT NULL,
  reporter_name TEXT,
  telegram_message_id BIGINT UNIQUE,
  original_text TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
