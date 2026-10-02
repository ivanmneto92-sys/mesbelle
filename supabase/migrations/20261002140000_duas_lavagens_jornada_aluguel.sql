-- Mapa do Aluguel: depois de Ajustes, o vestido agora passa por duas
-- lavagens (ida/volta da lavanderia cada uma) antes de ficar "Pronto para a
-- Loja" — além da lavagem que já existia depois da Devolução.
CREATE OR REPLACE FUNCTION public.fn_reserva_aluguel_gera_jornada()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_tipo_negocio text;
begin
  if NEW.status_reserva = 'aluguel' and NEW.negocio_id is not null
     and not exists (select 1 from public.jornada_aluguel where reserva_id = NEW.id) then

    select tipo_negocio into v_tipo_negocio from public.negocios where id = NEW.negocio_id;

    if coalesce(v_tipo_negocio, 'aluguel') = 'aluguel' then
      insert into public.jornada_aluguel (reserva_id, nome_etapa, is_concluido, ordem)
      select NEW.id, e.nome, false, e.ordem
      from (values
        ('Envio à Costureira', 0), ('Ajustes', 1),
        ('Envio à Lavanderia (1ª)', 2), ('Na Lavanderia (1ª)', 3),
        ('Envio à Lavanderia (2ª)', 4), ('Na Lavanderia (2ª)', 5),
        ('Pronto para a Loja', 6), ('Agendar Prova', 7), ('Retirada', 8), ('Devolução', 9),
        ('Envio à Lavanderia', 10), ('Na Lavanderia', 11), ('Disponível na Loja', 12)
      ) as e(nome, ordem);
    end if;
  end if;
  return NEW;
end;
$function$;
