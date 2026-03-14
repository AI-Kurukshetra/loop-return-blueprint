-- Remove static analytics storage table.
-- Analytics should be computed live from transactional data.
DROP TABLE IF EXISTS "return_analytics" CASCADE;
DROP TABLE IF EXISTS "ReturnAnalytics" CASCADE;
