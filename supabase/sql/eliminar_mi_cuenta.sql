create or replace function public.eliminar_mi_cuenta()
returns void
language plpgsql
security definer
set search_path to ''
as $$
declare uid uuid := (select auth.uid());
begin
  if uid is null then raise exception 'tenés que ingresar para eliminar tu cuenta'; end if;
  if exists (select 1 from public.perfiles where id = uid and rol = 'admin') then
    raise exception 'la cuenta de administración no se puede eliminar desde acá';
  end if;
  if exists (select 1 from public.proyectos p where p.estado = 'en_curso' and (p.owner = uid or exists (
      select 1 from public.propuestas pr where pr.proyecto_id = p.id and pr.pro = uid and pr.estado = 'aceptada'))) then
    raise exception 'tenés un trabajo en curso: terminalo o cerralo antes de eliminar tu cuenta';
  end if;
  perform set_config('red.sistema', '1', true);
  delete from auth.users where id = uid;
  perform set_config('red.sistema', '0', true);
end; $$;
revoke all on function public.eliminar_mi_cuenta() from public, anon;
grant execute on function public.eliminar_mi_cuenta() to authenticated;
