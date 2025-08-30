-- Add missing school years for existing students
INSERT INTO school_years (year, is_active) VALUES 
(2024, true),
(2025, true), 
(2026, true)
ON CONFLICT (year) DO NOTHING;