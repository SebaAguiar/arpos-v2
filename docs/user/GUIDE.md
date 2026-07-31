# Guía de Usuario — ArPOS

Esta guía explica cómo usar ArPOS en el día a día: desde la instalación hasta el cierre de caja. Está pensada para el personal de mostrador, encargados y administradores.

---

## 1. Instalación

### Requisitos mínimos

- **Windows 10/11**, **macOS 12+** o **Linux** (AppImage, .deb o .rpm)
- 4 GB de RAM (recomendado 8 GB)
- Conexión a internet solo para instalar actualizaciones y sincronizar con la nube (opcional)

### Pasos

1. Descargar el instalador de la última versión desde las Releases del proyecto.
2. Ejecutar el instalador y seguir el asistente.
3. La primera vez que se abre la app, el asistente de configuración inicial guía la creación de la empresa.

> **Actualizaciones:** ArPOS se actualiza automáticamente cuando hay una versión nueva. El indicador de actualización aparece en la barra superior. Si no se actualiza en el momento, se puede aplicar luego desde Configuración → Actualizaciones.

---

## 2. Primer arranque (Asistente de configuración)

La primera vez que inicia ArPOS, se presenta un asistente con estos pasos:

1. **Datos de la empresa:** razón social, CUIT, domicilio, IVA y teléfono.
2. **Sucursal:** nombre y dirección del local donde corre ArPOS.
3. **Usuario administrador:** nombre, email y contraseña para el primer ingreso.
4. **Medios de pago:** se preconfiguran Efectivo, Débito, Crédito, QR y Billetera. Se pueden ajustar luego en Configuración.

> La app funciona **100% offline**. La sincronización a la nube es opcional y se habilita en Configuración.

---

## 3. Ingreso

1. Ingresar con el email y la contraseña del usuario.
2. Si el usuario no tiene permisos para el módulo, la opción no aparece en el menú lateral.

---

## 4. Punto de venta (Cobrar)

Es la pantalla principal del cajero.

### Agregar productos

- **Buscar** por nombre, código de barras o SKU en el campo de búsqueda.
- Tocar o hacer clic en un producto para agregarlo al carrito.
- Si el producto tiene **variantes** (por ejemplo talle y color), se abre un selector para elegir la combinación.
- Para un producto sin código de barras (por ejemplo "Yerba extra"), usar **Producto libre** e ingresar nombre y precio.

### Editar el carrito

- Cambiar la **cantidad** de un artículo con los controles + / −.
- **Eliminar** un artículo con el botón de quitar.
- Asignar un **cliente** tocando el selector de cliente (opcional).

### Descuentos

- En el resumen del carrito se puede ingresar un descuento:
  - **Porcentaje (%)** para descuentos como "10%".
  - **Monto fijo ($)** para rebajas puntuales.

### Cobrar

1. Tocar **Cobrar**.
2. Seleccionar el **medio de pago** (Efectivo, Débito, Crédito, QR, etc.).
3. Si el medio es crédito, se aplica el recargo configurado.
4. Si se paga en efectivo, se muestra el **vuelto** calculado.
5. Confirmar el cobro. Se puede **imprimir el ticket** (automático según configuración) o enviar el comprobante por otro medio.

> **Estado offline:** si la conexión se pierde, un indicador rojo aparece en la barra superior. El POS sigue funcionando normalmente: las ventas se guardan localmente y se sincronizan cuando se restablece la conexión.

---

## 5. Productos

El módulo de Productos permite administrar el catálogo.

- **Crear producto:** nombre, precio, costo, SKU, código de barras, categoría e impuesto.
- **Variantes:** talle, color, etc. Cada variante puede tener su propio precio y stock.
- **Editar y eliminar** productos existentes.
- **Precios:** el IVA se calcula sobre el precio final; la app muestra el desglose automáticamente.

---

## 6. Inventario

Permite controlar el stock de cada sucursal.

- **Movimientos de stock:** entradas (compras, ajustes positivos) y salidas (ventas, ajustes negativos). Cada movimiento queda registrado con fecha y usuario.
- **Ajuste de stock:** corregir diferencias físicas (rotura, merma, conteo). Se solicita un motivo antes de confirmar.
- El stock se descuenta automáticamente con cada venta.

---

## 7. Reportes

El módulo de Reportes agrupa las métricas del negocio:

- **Resumen del día:** ventas, cantidad de tickets, ticket promedio.
- **Ventas por medio de pago** (efectivo, débito, crédito, QR).
- **Productos más vendidos.**
- **Reporte de inventario** (stock actual y valorizado).
- **Caja:** aperturas, cierres y diferencias.

Los reportes se pueden filtrar por rango de fechas y por sucursal.

---

## 8. Caja

El módulo de Caja registra el dinero físico de cada turno.

1. **Abrir caja:** al comenzar el turno, registrar el monto inicial de la caja.
2. **Vender:** el sistema acumula los cobros en efectivo automáticamente.
3. **Control de caja (opcional):** registrar ingresos y egresos puntuales (retiro de efectivo, pago a proveedor).
4. **Cerrar caja:** al terminar el turno, el sistema calcula lo esperado vs. lo contado. Registrar el monto final y la diferencia.

> El arqueo de caja es independiente del total de ventas: también incluye los movimientos en efectivo que no son ventas.

---

## 9. Configuración

Disponible para usuarios administradores.

- **Empresa:** razón social, CUIT, domicilio, IVA.
- **Sucursales:** alta y edición de sucursales.
- **Usuarios:** crear usuarios, asignar rol y permisos.
- **Medios de pago:** activar/desactivar, renombrar, recargo por crédito y orden de aparición.
- **Ticket:** impresión automática, tamaño de papel (80mm, 58mm, A4, A5), encabezado y pie de ticket.
- **Impuestos:** tasa de IVA por defecto.
- **Sincronización:** conexión a la nube (opcional). Muestra el estado de la cola de sincronización.

### Sincronización en la nube (Sync Cloud)

La sincronización es **opcional**: ArPOS funciona completo sin conexión, y los cambios quedan encolados en el dispositivo hasta que conectás la nube.

- **Conectar:** ingresá la URL del servidor cloud y el token JWT, y tocá **Conectar**. La nube debe estar activa en tu suscripción.
- **Estado:** el panel muestra si estás conectado, cuántos cambios quedan por subir y la última sincronización.
- **Subir cambios:** enviá manualmente los cambios pendientes a la nube.
- **Descargar cambios:** traé los cambios de otros dispositivos. Al conectar, la descarga es automática.
- **Desconectar:** detené la sincronización. Los cambios locales se siguen guardando y quedan en la cola; al volver a conectar se suben.

> **Importante:** mientras estás desconectado, las ventas se acumulan en la cola y **no se pierden**. Si el token vence o la suscripción caduca, la descarga queda pausada hasta renovarla.

### Sistema y actualizaciones (app desktop)

- **Estado del sistema:** uso de CPU, RAM y disco del dispositivo.
- **Actualizaciones:** buscar y aplicar versiones nuevas.

---

## 10. Copias de seguridad

El módulo de Respaldo permite proteger la información:

- **Crear respaldo:** genera una copia de la base de datos con fecha y hora.
- **Restaurar:** recupera una copia guardada. **Advertencia:** restaurar reemplaza los datos actuales. Se recomienda hacer un respaldo antes de restaurar.

> Las copias de seguridad solo incluyen datos locales. Si se usa sincronización en la nube, verificar el estado de la cola antes de restaurar para no perder operaciones pendientes.

---

## 11. Conceptos útiles

| Término | Significado |
|---|---|
| **Ticket** | Comprobante de venta emitido al cliente. |
| **SKU** | Código interno del producto (letras y números). |
| **Variante** | Combinación de atributos de un producto (talle, color). |
| **Medio de pago** | Forma de cobro: efectivo, débito, crédito, QR, billetera. |
| **Recargo** | Sobrecosto porcentual aplicado al crédito. |
| **Arqueo de caja** | Conteo del efectivo físico al abrir y cerrar el turno. |
| **Sync** | Sincronización de los datos locales con la nube. |

---

## 12. Solución de problemas comunes

| Problema | Solución |
|---|---|
| La app no arranca | Verificar que el backend local inició (indicador en pantalla). Reiniciar la app. |
| No se imprimen los tickets | Revisar Configuración → Ticket → impresión automática y tamaño de papel. |
| El stock no cuadra | Revisar Movimientos de stock y ajustar con un Ajuste de stock (con motivo). |
| Hay ventas sin sincronizar | Revisar Configuración → Sincronización. Mientras haya conexión, la cola se vacía sola. |
| No llega una actualización | Configuración → Actualizaciones → Buscar actualizaciones. |
