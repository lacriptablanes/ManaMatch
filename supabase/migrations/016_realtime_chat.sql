-- =====================================================================
-- ManaMatch · Chat y duelos en tiempo real
--   · Supabase Realtime avisa de los mensajes y duelos nuevos. Las políticas RLS ya filtran:
--     cada usuario solo recibe los de sus propios duelos.
-- =====================================================================
alter publication supabase_realtime add table public.messages;
alter publication supabase_realtime add table public.matches;
