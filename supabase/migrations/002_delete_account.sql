-- =====================================================================
-- ManaMatch · Borrar mi cuenta (RGPD: derecho de supresión)
-- La app no tiene permiso para borrar usuarios. Esta función se ejecuta con los permisos de su dueño,
-- pero SOLO puede borrar al usuario que la llama (auth.uid()): nadie puede borrar la cuenta de otro.
-- Al borrar de auth.users, el resto de datos (perfil, mazos, retos, duelos, mensajes, bloqueos…)
-- desaparece en cascada gracias a "on delete cascade" en schema.sql.
-- =====================================================================

create or replace function public.delete_my_account() returns void
language plpgsql security definer set search_path = public as $$
declare
  uid uuid := auth.uid();
begin
  if uid is null then
    raise exception 'Hay que iniciar sesión para borrar la cuenta';
  end if;
  delete from auth.users where id = uid;
end;
$$;

-- Solo los usuarios con sesión pueden llamarla
revoke execute on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;
