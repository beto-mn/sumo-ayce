# Feature Specification: Staff Portal

**Feature Branch**: `feat/006-staff-portal`
**Created**: 2026-05-28
**Status**: Draft

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Cajero registra visita de cliente existente (Priority: P1)

Un cajero busca al cliente por número de teléfono, verifica su saldo de puntos, y registra una visita para acumular puntos al finalizar la comida.

**Why this priority**: Es la acción más frecuente del portal. Sin esta capacidad, el programa de lealtad no puede operar en producción.

**Independent Test**: Se puede probar completamente iniciando sesión como staff, buscando un cliente con teléfono registrado y registrando una visita. El sistema debe mostrar los puntos actualizados al finalizar.

**Acceptance Scenarios**:

1. **Given** un cajero autenticado en el dashboard, **When** ingresa el teléfono de un cliente registrado, **Then** el sistema muestra el nombre, saldo de puntos y nivel del cliente
2. **Given** el cajero está viendo el perfil del cliente, **When** registra una visita, **Then** los puntos se acumulan y el cliente recibe una notificación WhatsApp de confirmación
3. **Given** el cajero registra una visita, **When** la operación es exitosa, **Then** el sistema muestra el nuevo saldo y regresa al dashboard listo para el siguiente cliente

---

### User Story 2 - Cajero registra nuevo cliente (Priority: P2)

Un cliente que come por primera vez quiere inscribirse al programa de lealtad. El cajero crea su cuenta en el momento.

**Why this priority**: Permite la captación de clientes nuevos directamente en caja, sin requerir que el cliente lo haga por su cuenta.

**Independent Test**: Se puede probar creando un cliente con teléfono nuevo. El sistema debe rechazar teléfonos ya registrados y confirmar la creación exitosa.

**Acceptance Scenarios**:

1. **Given** un cajero autenticado, **When** ingresa un teléfono que no existe en el sistema y completa el nombre, **Then** se crea el cliente con 0 puntos y recibe un mensaje WhatsApp de bienvenida
2. **Given** el cajero intenta crear un cliente, **When** el teléfono ya está registrado, **Then** el sistema muestra el perfil existente en lugar de duplicarlo
3. **Given** se crea el cliente nuevo, **When** la operación es exitosa, **Then** el cajero puede registrar la visita inmediatamente sin pasos adicionales

---

### User Story 3 - Cajero canjea una recompensa para el cliente (Priority: P3)

Un cliente con puntos suficientes solicita canjear una recompensa. El cajero realiza el canje en el sistema.

**Why this priority**: Completa el ciclo del programa de lealtad: acumular y redimir. Sin canje, los puntos no tienen valor percibido.

**Independent Test**: Se puede probar buscando un cliente con saldo suficiente e intentando canjear cada recompensa disponible. El sistema debe bloquear canjes cuando los puntos son insuficientes.

**Acceptance Scenarios**:

1. **Given** el cajero está viendo el perfil del cliente, **When** selecciona una recompensa del catálogo con puntos suficientes y confirma, **Then** los puntos se descuentan y el cliente recibe confirmación por WhatsApp
2. **Given** el cajero intenta canjear una recompensa, **When** el cliente no tiene puntos suficientes, **Then** el sistema bloquea la acción y muestra el déficit de puntos
3. **Given** el canje es exitoso, **When** el cajero confirma, **Then** el sistema muestra el nuevo saldo y el canje queda registrado en el historial

---

### User Story 4 - Admin revisa historial y anula transacciones (Priority: P4)

Un administrador de sucursal necesita revisar el historial de transacciones del día y corregir una visita que fue registrada por error.

**Why this priority**: Proporciona control operativo y corrección de errores. Crítico para la confianza del sistema entre el personal.

**Independent Test**: Se puede probar iniciando sesión como admin, accediendo al historial de transacciones y anulando una transacción de prueba.

**Acceptance Scenarios**:

1. **Given** un admin autenticado en el panel de admin, **When** accede al historial de transacciones, **Then** ve todas las transacciones de su sucursal con fecha, cajero responsable, cliente y puntos afectados
2. **Given** el admin identifica una transacción errónea, **When** la anula con una razón, **Then** los puntos se revierten, el cliente es notificado y la anulación queda registrada con el nombre del admin
3. **Given** un staff intenta acceder al panel de admin, **When** navega a esa URL, **Then** es redirigido al dashboard con un mensaje de acceso denegado

---

### User Story 5 - Admin consulta métricas de la sucursal (Priority: P5)

Un administrador quiere ver el rendimiento del programa de lealtad en su sucursal: visitas del día, recompensas canjeadas y clientes activos.

**Why this priority**: Da visibilidad operativa al administrador sin requerir acceso directo a la base de datos.

**Independent Test**: Se puede probar iniciando sesión como admin y navegando a la sección de reportes. Las métricas deben reflejar las transacciones registradas en el día.

**Acceptance Scenarios**:

1. **Given** un admin autenticado, **When** accede a reportes, **Then** ve visitas del día, recompensas canjeadas del día, total de clientes activos en la sucursal y puntos emitidos
2. **Given** el admin consulta reportes, **When** no hay transacciones en el día, **Then** el sistema muestra ceros sin errores

---

### Edge Cases

- ¿Qué pasa si el cajero pierde conexión durante el registro de una visita? El sistema debe informar si la operación fue guardada o no, sin registros duplicados.
- ¿Qué pasa si el cliente tiene puntos negativos por una anulación? El sistema no debe permitir que el saldo baje de cero.
- ¿Qué pasa si el token de sesión expira mientras el cajero está en medio de una operación? El sistema debe redirigir al login sin perder el contexto de la acción en curso.
- ¿Qué pasa si se intenta canjear la misma recompensa dos veces en segundos? El sistema debe prevenir canjes duplicados.
- ¿Qué pasa si un admin intenta anular una transacción ya anulada? El sistema debe rechazarlo con un mensaje claro.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: El sistema DEBE autenticar a los usuarios con nombre de usuario y contraseña
- **FR-002**: Las sesiones DEBEN expirar automáticamente después de 8 horas sin requerir acción del usuario
- **FR-003**: El sistema DEBE otorgar acceso a funciones según el rol del usuario: `staff`, `admin` u `owner`
- **FR-004**: Un usuario `staff` o `admin` DEBE estar ligado a una sola sucursal; sus acciones solo afectan datos de esa sucursal
- **FR-005**: El cajero DEBE poder buscar un cliente por número de teléfono y ver su nombre, saldo de puntos y nivel
- **FR-006**: El cajero DEBE poder crear un cliente nuevo ingresando nombre y teléfono
- **FR-007**: El sistema DEBE impedir crear clientes con teléfonos duplicados; en su lugar muestra el perfil existente
- **FR-008**: El cajero DEBE poder registrar una visita para acumular puntos al cliente
- **FR-009**: El cajero DEBE poder canjear una recompensa del catálogo para un cliente con puntos suficientes
- **FR-010**: El sistema DEBE impedir canjes cuando los puntos del cliente son insuficientes
- **FR-011**: El sistema DEBE impedir que el saldo de puntos de un cliente baje de cero
- **FR-012**: El admin DEBE poder consultar el historial completo de transacciones de su sucursal
- **FR-013**: El admin DEBE poder anular una transacción indicando una razón; la anulación DEBE revertir los puntos afectados
- **FR-014**: El sistema DEBE registrar quién realizó cada anulación y cuándo
- **FR-015**: El admin DEBE poder ver métricas diarias de su sucursal: visitas, canjes y clientes activos
- **FR-016**: Las rutas del panel de admin DEBEN ser inaccesibles para usuarios con rol `staff`
- **FR-017**: El sistema DEBE cerrar sesión al usuario si intenta acceder con un token expirado

### Key Entities

- **StaffUser**: Empleado del sistema. Atributos clave: nombre de usuario, rol (staff/admin/owner), sucursal asignada, estado activo/inactivo
- **Sesión**: Instancia de acceso autenticado. Atributos clave: usuario, token, fecha de expiración (8 horas desde creación)
- **Transacción de lealtad**: Registro de puntos ganados o canjeados. Atributos clave: cliente, tipo (earn/redeem), puntos, cajero responsable, sucursal, timestamp, estado (activa/anulada)
- **Anulación**: Corrección de una transacción errónea. Atributos clave: transacción original, admin que la realizó, razón, timestamp

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: El cajero puede completar el flujo completo (buscar cliente → registrar visita) en menos de 30 segundos
- **SC-002**: El cajero puede crear un cliente nuevo e inmediatamente registrar su primera visita en menos de 60 segundos
- **SC-003**: El 100% de las acciones sobre puntos (acumulación y canje) quedan registradas con el cajero responsable y la sucursal
- **SC-004**: Un admin puede anular una transacción y verificar la reversión de puntos en menos de 2 minutos
- **SC-005**: Las rutas restringidas redirigen a usuarios sin permiso en el 100% de los intentos de acceso
- **SC-006**: Las sesiones expiran dentro de los 8 horas sin intervención manual, sin afectar operaciones en curso al momento de la expiración

## Assumptions

- Los usuarios `staff_users` son creados directamente en la base de datos por el owner en esta versión; no hay UI para gestión de cuentas de staff
- Un usuario `owner` puede autenticarse pero su panel (`/staff/owner/`) queda como placeholder en esta versión; la diferenciación de permisos se implementa desde el inicio para no requerir refactor posterior
- El programa de lealtad ya tiene clientes, recompensas y transacciones existentes (feature 005); el staff portal consume esos datos
- Los cajeros usan el portal desde una tablet o computadora fija en caja, no desde móvil; la UI está optimizada para pantallas medianas (≥768px)
- Las notificaciones WhatsApp al cliente se disparan desde los endpoints de loyalty existentes; el staff portal no las gestiona directamente
- No se requiere modo offline; se asume conectividad estable en el punto de venta
