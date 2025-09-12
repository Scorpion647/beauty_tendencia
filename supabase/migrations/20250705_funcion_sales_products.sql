

-- 03_funcion_registrar_venta.sql
create or replace function registrar_venta_producto(
  p_producto_id bigint,
  p_cantidad integer
)
returns void
language plpgsql
as $$
declare
  v_producto record;
  v_total numeric;
  v_precio_unitario numeric;
  v_descuento integer;
begin
  -- Obtener el producto
  select * into v_producto from productos where id = p_producto_id;

  if not found then
    raise exception 'Producto no encontrado con id: %', p_producto_id;
  end if;

  -- Validar cantidad suficiente
  if v_producto.cantidad < p_cantidad then
    raise exception 'Cantidad insuficiente en stock. Disponible: %, Solicitada: %', v_producto.cantidad, p_cantidad;
  end if;

  -- Obtener precio y descuento
  v_descuento := coalesce(v_producto.descuento, 0);
  v_precio_unitario := v_producto.precio * (1 - v_descuento / 100.0);

  -- Calcular total con descuento
  v_total := p_cantidad * v_precio_unitario;

  -- Insertar en ventas
  insert into ventas_productos (
    producto_id,
    cantidad,
    precio_unitario,
    descuento,
    total
  )
  values (
    p_producto_id,
    p_cantidad,
    v_precio_unitario,
    v_descuento,
    v_total
  );

  -- Actualizar inventario
  update productos
  set cantidad = cantidad - p_cantidad
  where id = p_producto_id;

end;
$$;
