CREATE OR REPLACE FUNCTION public.update_updated_at_column()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_sales_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_sales_items_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.registrar_venta_producto(p_producto_id bigint, p_cantidad integer)
 RETURNS void
 LANGUAGE plpgsql
AS $function$
DECLARE
  v_producto record;
  v_total numeric;
  v_precio_unitario numeric;
  v_descuento integer;
BEGIN
  -- Obtener el producto
  SELECT * INTO v_producto FROM productos WHERE id = p_producto_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Producto no encontrado con id: %', p_producto_id;
  END IF;

  -- Validar cantidad suficiente
  IF v_producto.cantidad < p_cantidad THEN
    RAISE EXCEPTION 'Cantidad insuficiente en stock. Disponible: %, Solicitada: %', v_producto.cantidad, p_cantidad;
  END IF;

  -- Obtener precio y descuento
  v_precio_unitario := v_producto.precio;
  v_descuento := COALESCE(v_producto.descuento, 0);

  -- Calcular total con descuento
  v_total := p_cantidad * v_precio_unitario * (1 - v_descuento / 100.0);

  -- Insertar en ventas_productos
  INSERT INTO ventas_productos (
    producto_id,
    cantidad,
    precio_unitario,
    descuento,
    total
  )
  VALUES (
    p_producto_id,
    p_cantidad,
    v_precio_unitario,
    v_descuento,
    v_total
  );

  -- Actualizar inventario
  UPDATE productos
  SET cantidad = cantidad - p_cantidad
  WHERE id = p_producto_id;

END;
$function$;
