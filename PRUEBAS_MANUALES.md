# Guía de pruebas manuales — Food Store

## Preparación

1. Configurar `backend/.env` a partir de `.env.example`.
2. Crear el entorno virtual e instalar `backend/requirements.txt`.
3. Desde `backend`, ejecutar `python -m app.db.seed` y luego `uvicorn app.main:app --reload`.
4. Desde `frontend`, instalar dependencias con `pnpm install` y ejecutar `pnpm dev`.
5. Abrir `http://localhost:5173` y `http://localhost:8000/docs`.

Cuenta de administración creada por el seed:
- Usuario: `admin`
- Contraseña: `Admin1234!`

## Casos y evidencias sugeridas

| Caso | Acción | Resultado esperado | Captura sugerida |
|---|---|---|---|
| 1 | Abrir catálogo sin iniciar sesión | Se listan productos activos; búsqueda y filtro por categoría funcionan | Catálogo con filtro aplicado |
| 2 | Registrar un cliente e iniciar sesión | Se crea el usuario con rol `user` y se establece cookie HttpOnly | Perfil o navegación con sesión iniciada |
| 3 | Agregar productos, cambiar cantidades y quitar una línea | El carrito refleja las cantidades y subtotales | Carrito con más de un producto |
| 4 | Confirmar pedido con dirección y forma de pago | Se crea el pedido y el backend calcula el total | Confirmación y pedido en “Mis pedidos” |
| 5 | Consultar stock luego de comprar | El stock disminuye según las cantidades pedidas | Producto/stock en panel admin o `/docs` |
| 6 | Cancelar un pedido pendiente como su dueño | El estado pasa a `CANCELADO` y se restituye el stock | Pedido cancelado y stock restituido |
| 7 | Intentar consultar/cancelar pedido de otro cliente | El backend rechaza la operación | Respuesta 403 en `/docs` |
| 8 | Intentar comprar más unidades que el stock | El backend rechaza la compra y no persiste pedido ni descuento parcial | Error de stock en la interfaz |
| 9 | Como admin, crear/editar/dar de baja categoría y producto | Los cambios persisten; las bajas son lógicas | Panel de categorías y productos |
| 10 | Como admin, pausar/reanudar disponibilidad y modificar stock | El producto deja de poder agregarse al carrito al pausarlo | Panel con producto pausado |
| 11 | Avanzar pedido `PENDIENTE` → `EN_PREPARACION` → `ENTREGADO` | Solo se permiten transiciones válidas; los estados terminales no cambian | Panel de pedidos entregados |
| 12 | Consultar resumen administrativo | Los conteos e ingresos corresponden a pedidos entregados | Tarjetas del resumen |
| 13 | Intentar desactivar la propia cuenta admin | La API rechaza la operación | Error 400 en administración |
