# Guía de Usuario — Arcom

Esta guía explica cómo usar Arcom en el día a día: desde la instalación hasta el cierre de caja. Está pensada para el personal de mostrador, encargados y administradores.

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

> **Actualizaciones:** Arcom se actualiza automáticamente cuando hay una versión nueva. El indicador de actualización aparece en la barra superior. Si no se actualiza en el momento, se puede aplicar luego desde Configuración → Actualizaciones.

---

## 2. Primer arranque (Asistente de configuración)

La primera vez que inicia Arcom, se presenta un asistente con estos pasos:

1. **Datos del negocio:** nombre y CUIT/RUT. La sucursal principal se crea automáticamente.
2. **Usuario administrador:** email y contraseña para el primer ingreso.
3. Al finalizar, la base de datos queda inicializada y se inicia la sesión automáticamente.

> Los **medios de pago** se configuran después en Configuración → Métodos de pago. Por defecto están habilitados Efectivo, Débito, Crédito, QR, Billetera, Transferencia y Puntos.

> La app funciona **100% offline**. La sincronización a la nube es opcional y se habilita en Configuración.

---

## 3. Ingreso

1. Ingresar con el email y la contraseña del usuario.
2. Si el usuario no tiene permisos para el módulo, la opción no aparece en el menú lateral.

---

## 4. Punto de venta (Cobrar)

Es la pantalla principal del cajero.

### Agregar productos

- **Buscar** por nombre, código interno o código de barras en el campo de búsqueda (el lector de código de barras escribe en ese campo).
- Tocar o hacer clic en un producto para agregarlo al carrito.
- Si el producto tiene **variantes** (por ejemplo talle y color), se abre un selector para elegir la combinación.

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
5. Confirmar el cobro. Se puede **imprimir el ticket** (automático según configuración), **descargarlo en PDF** o **compartirlo por WhatsApp**.

> **Estado offline:** si la conexión se pierde, un indicador rojo aparece en la barra superior. El POS sigue funcionando normalmente: las ventas se guardan localmente y se sincronizan cuando se restablece la conexión.

---

## 5. Productos

El módulo de Productos permite administrar el catálogo.

- **Crear producto:** nombre, código de barras / código interno, categoría, costo y precio (el margen se calcula automáticamente).
- **Variantes:** talle, color, etc. Cada variante puede tener su propio código de barras, SKU y precio.
- **Editar y eliminar** productos existentes.
- **Precios:** la tasa de IVA es global (Configuración → IVA). Los precios se cargan con IVA incluido.

---

## 6. Inventario

Permite controlar el stock de cada sucursal.

- **Movimientos de stock:** entradas (compras, ajustes positivos) y salidas (ventas, ajustes negativos). Cada movimiento queda registrado con fecha y usuario.
- **Ajuste de stock:** corregir diferencias físicas (rotura, merma, conteo). Se solicita un motivo antes de confirmar.
- El stock se descuenta automáticamente con cada venta.

---

## 7. Clientes

Permite administrar la cartera de clientes del negocio.

- **Crear, editar y eliminar** clientes (nombre, email, teléfono).
- **Buscar** clientes por nombre, email o teléfono.
- Asignar un cliente a una venta desde el POS (botón del carrito).

## 8. Compras

Permite gestionar órdenes de compra a proveedores.

- **Nueva orden:** seleccionar proveedor y productos a ordenar.
- Los estados posibles son **Borrador**, **Pedido**, **Parcial**, **Recibido** y **Cancelado**.
- **Recibir mercadería** actualiza el stock automáticamente.

## 9. Tareas

Permite registrar tareas operativas con prioridad y estado.

- **Prioridades:** Urgente, Alta, Media, Baja.
- **Estados:** Pendiente, En progreso, Completada.

## 10. Reportes

El módulo de Reportes agrupa las métricas del negocio:

- **Resumen:** ventas, cantidad de tickets, ticket promedio.
- **Ventas por hora** y **por medio de pago** (efectivo, débito, crédito, QR, etc.).
- **Productos más vendidos.**
- **Reporte de inventario:** valor del stock, productos con stock bajo y sin stock, y desglose por categoría.
- **Caja:** turnos cerrados, ventas del turno y diferencias.

Los reportes se pueden filtrar por período: **Hoy**, **7 días**, **30 días** o **90 días**.

---

## 11. Caja

El módulo de Caja registra el dinero físico de cada turno.

1. **Abrir caja:** al comenzar el turno, registrar el monto inicial de la caja.
2. **Vender:** el sistema acumula los cobros en efectivo automáticamente.
3. **Control de caja (opcional):** registrar ingresos y egresos puntuales (retiro de efectivo, pago a proveedor).
4. **Cerrar caja:** al terminar el turno, el sistema calcula lo esperado vs. lo contado. Registrar el monto final y la diferencia.

> El arqueo de caja es independiente del total de ventas: también incluye los movimientos en efectivo que no son ventas.

---

## 12. Facturación Electrónica (ARCA/AFIP)

Arcom emite **comprobantes electrónicos** autorizados por ARCA (ex AFIP) en tiempo real. Esto habilita facturar legalmente sin controlador fiscal: cada comprobante obtiene su **CAE** (Código de Autorización Electrónico) y lleva el **código QR** oficial.

### Configuración inicial

En **Configuración → Facturación**:

1. **Datos fiscales:** CUIT, razón social y condición frente al IVA (monotributista, responsable inscripto, etc.).
2. **Certificado digital:** cargar el certificado (CRT) y su clave privada emitidos por ARCA/AFIP.
3. **Punto de venta:** seleccionar el punto de venta habilitado para facturar.
4. **Ambiente:** operar en **homologación** (pruebas, sin validez fiscal) o **producción** (comprobantes reales). Usá homologación para validar la configuración antes de facturar en serio.

### Emitir comprobantes

Al **cobrar** desde el punto de venta, si la facturación está configurada podés elegir el **tipo de comprobante** a emitir:

- **Factura A** (para clientes responsables inscriptos / exportación) o **B** (consumidor final / monotributista) según la condición del cliente.
- **Ticket** (no fiscal) si no querés emitir comprobante fiscal en esa operación.

### Notas de crédito y débito

Si una venta facturada debe corregirse:

- **Nota de crédito:** anula o reduce el importe de una factura (devolución de mercadería, error de facturación).
- **Nota de débito:** aumenta el importe de una factura (recargo posterior, diferencias).

Ambas se generan desde el **historial de facturas** del producto o de la venta original, y se emiten con su propio CAE ante ARCA.

### ¿Qué pasa si ARCA no responde?

Arcom **encola** los comprobantes pendientes y los reintenta automáticamente mientras el servicio esté disponible. Ninguna venta se pierde ni deja de registrarse por una caída temporal de ARCA. Desde el **dashboard fiscal** (Configuración → Facturación) podés ver el estado de cada comprobante y reintentar los fallidos manualmente.

> **Nota:** el envío de comprobantes a ARCA es obligatorio por ley para dar validez fiscal. Asegurate de mantener el certificado vigente y los datos fiscales correctos.

---

## 13. Configuración

Disponible para usuarios administradores.

- **Empresa:** nombre, CUIT/RUT, domicilio, email y teléfono.
- **Sucursales:** alta y edición de sucursales.
- **Usuarios:** crear usuarios y asignar rol (cajero o administrador).
- **Medios de pago:** activar/desactivar cada método y renombrarlo. El recargo por crédito se configura aparte.
- **Ticket:** impresión automática, tamaño de papel (80mm, 58mm, A4, A5), encabezado y pie de ticket.
- **Impuestos:** tasa de IVA por defecto.
- **Facturación (ARCA/AFIP):** datos fiscales, certificado digital, punto de venta y estado de los comprobantes emitidos.
- **Sincronización:** conexión a la nube (opcional). Muestra el estado de la cola de sincronización y la suscripción.

### Sincronización en la nube (Sync Cloud)

La sincronización es **opcional**: Arcom funciona completo sin conexión, y los cambios quedan encolados en el dispositivo hasta que conectás la nube.

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

## 14. Copias de seguridad

El módulo de Respaldo permite proteger la información:

- **Crear respaldo:** genera una copia de la base de datos con fecha y hora.
- **Restaurar:** recupera una copia guardada. **Advertencia:** restaurar reemplaza los datos actuales. Se recomienda hacer un respaldo antes de restaurar.

> Las copias de seguridad solo incluyen datos locales. Si se usa sincronización en la nube, verificar el estado de la cola antes de restaurar para no perder operaciones pendientes.

---

## 15. Conceptos útiles

| Término | Significado |
|---|---|
| **Ticket** | Comprobante de venta emitido al cliente. |
| **SKU** | Código interno del producto (letras y números). |
| **Variante** | Combinación de atributos de un producto (talle, color). |
| **Medio de pago** | Forma de cobro: efectivo, débito, crédito, QR, billetera. |
| **Recargo** | Sobrecosto porcentual aplicado al crédito. |
| **Arqueo de caja** | Conteo del efectivo físico al abrir y cerrar el turno. |
| **Sync** | Sincronización de los datos locales con la nube. |
| **Billetera (wallet)** | Saldo a favor de un cliente, acreditado o debitado manualmente. |
| **CAE** | Código de Autorización Electrónico: el código que ARCA entrega y que valida a cada comprobante fiscal. |
| **Comprobante (factura)** | Documento fiscal emitido ante ARCA (Factura A/B, nota de crédito o débito). |
| **Homologación** | Ambiente de pruebas de ARCA: permite validar la emisión sin validez fiscal. |

---

## 16. Solución de problemas comunes

| Problema | Solución |
|---|---|
| La app no arranca | Verificar que el backend local inició (indicador en pantalla). Reiniciar la app. |
| No se imprimen los tickets | Revisar Configuración → Ticket → impresión automática y tamaño de papel. |
| El stock no cuadra | Revisar Movimientos de stock y ajustar con un Ajuste de stock (con motivo). |
| Hay ventas sin sincronizar | Revisar Configuración → Sincronización. Mientras haya conexión, la cola se vacía sola. |
| No llega una actualización | Configuración → Actualizaciones → Buscar actualizaciones. |
| No se emite el comprobante fiscal | Revisar Configuración → Facturación: datos fiscales, certificado y punto de venta. Los comprobantes pendientes se reintentan solos; también se pueden enviar desde el dashboard fiscal. |
| El ticket sale sin factura | El ticket es no fiscal por diseño. Para emitir comprobante legal, configurá ARCA y elegí Factura al cobrar. |
