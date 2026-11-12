CREATE TABLE boards (id TEXT PRIMARY KEY, name TEXT NOT NULL, mode TEXT NOT NULL, token_hash TEXT NOT NULL, state TEXT NOT NULL, revision INTEGER NOT NULL DEFAULT 0, created_at INTEGER NOT NULL);
--> statement-breakpoint
CREATE TABLE rate_limits (bucket TEXT PRIMARY KEY, hits INTEGER NOT NULL DEFAULT 0);
