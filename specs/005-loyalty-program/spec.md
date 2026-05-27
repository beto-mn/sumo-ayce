# Feature Specification: Loyalty Program

**Feature Branch**: `feat/005-loyalty-program`
**Created**: 2026-05-26
**Status**: Draft
**Input**: User description: "Loyalty Program — sistema de puntos por visita para clientes SUMO AYCE. Los clientes acumulan puntos en cada visita al restaurante, pueden ver su saldo y canjear recompensas. El staff escanea/valida la visita desde el Staff Portal (feature 006). Las notificaciones van por WhatsApp vía Twilio (ya implementado en feat/003). La tabla base en Neon PostgreSQL ya existe desde feat/001."

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Registro de Cliente (Priority: P1)

Un cliente visita SUMO por primera vez y quiere unirse al programa de lealtad. Un colaborador lo registra en el momento capturando su nombre y número de WhatsApp. El cliente recibe inmediatamente un mensaje de WhatsApp confirmando su alta con saldo 0 y un mensaje de bienvenida.

**Why this priority**: Sin registro no existe ninguna otra funcionalidad del programa. Es el punto de entrada obligatorio.

**Independent Test**: Registrar un cliente nuevo con nombre + teléfono y verificar que aparece en el sistema con 0 puntos y que se envía un mensaje de bienvenida por WhatsApp.

**Acceptance Scenarios**:

1. **Given** un cliente nuevo proporciona nombre y teléfono válido, **When** el staff envía el registro, **Then** el cliente se crea con saldo 0 y se envía notificación de bienvenida por WhatsApp si tiene opt-in.
2. **Given** un teléfono ya registrado, **When** el staff intenta registrar de nuevo, **Then** el sistema devuelve el perfil existente sin crear duplicado.
3. **Given** un formato de teléfono inválido, **When** el staff envía el registro, **Then** el sistema rechaza la solicitud con mensaje de error claro.
4. **Given** un cliente con `deletedAt` registrado, **When** se intenta registrar el mismo teléfono, **Then** el sistema rechaza la solicitud indicando que el cliente está inactivo.

---

### User Story 2 — Acumulación de Puntos por Visita (Priority: P1)

Cuando un cliente visita el restaurante y consume, un colaborador registra la visita desde el Staff Portal. El cliente recibe una cantidad fija de puntos, su saldo se actualiza y recibe un WhatsApp con el nuevo balance.

**Why this priority**: Ganar puntos es el ciclo de valor central del programa — sin él no hay nada que canjear.

**Independent Test**: Registrar una visita para un cliente existente y verificar que su saldo aumenta en el monto configurado, con notificación WhatsApp de confirmación.

**Acceptance Scenarios**:

1. **Given** un cliente registrado, **When** el staff registra una visita en una sucursal específica, **Then** el saldo aumenta por el valor configurado de puntos-por-visita y se envía WhatsApp de confirmación con el nuevo saldo.
2. **Given** un teléfono no registrado en el programa, **When** el staff intenta registrar una visita, **Then** el sistema rechaza la operación (el cliente debe estar registrado primero).
3. **Given** un cliente registrado, **When** se registra una visita, **Then** la transacción queda en el historial con sucursal, fecha y puntos ganados.
4. **Given** un cliente con `deletedAt` registrado, **When** el staff intenta registrar una visita, **Then** el sistema rechaza la operación.
5. **Given** un cliente cuyo nuevo saldo alcanza el costo de una o más recompensas activas, **When** se registra la visita, **Then** se envía un WhatsApp adicional notificando que tiene recompensas disponibles, incluyendo el nombre, descripción y costo en puntos de cada recompensa desbloqueada.

---

### User Story 3 — Consulta de Saldo e Historial (Priority: P2)

Existen dos canales de consulta con distinto alcance:

- **Staff (autenticado)**: desde el Staff Portal puede buscar cualquier cliente por teléfono y ver nombre, saldo actual e historial completo de transacciones. Útil para atender dudas en caja o procesar canjes.
- **Cliente (WhatsApp)**: el cliente envía la palabra "saldo" al número de WhatsApp de SUMO y recibe un mensaje de respuesta con únicamente su saldo total de puntos. Sin historial ni datos personales.

**Why this priority**: La visibilidad del saldo genera confianza en el programa. El canal WhatsApp permite al cliente conocer su balance sin visitar la sucursal, reutilizando la infraestructura Twilio ya instalada.

**Independent Test (staff)**: Buscar un cliente por teléfono desde el portal y verificar que se devuelven nombre, saldo y las últimas 20 transacciones en orden descendente.
**Independent Test (WhatsApp)**: Enviar "saldo" desde un número registrado y verificar que llega un mensaje con el total de puntos y nada más.

**Acceptance Scenarios**:

1. **Given** un colaborador autenticado, **When** busca un cliente por número de teléfono, **Then** se devuelven nombre, saldo actual y hasta 20 transacciones más recientes.
2. **Given** un teléfono inexistente, **When** el staff hace la búsqueda, **Then** el sistema devuelve respuesta de no encontrado.
3. **Given** un cliente con historial mixto (earn + redeem), **When** el staff consulta el historial, **Then** las transacciones se ordenan de más nueva a más antigua con tipo, delta de puntos, sucursal y fecha.
4. **Given** un cliente registrado con opt-in activo, **When** envía "saldo" por WhatsApp, **Then** recibe un mensaje con su saldo total de puntos (ej. "Tienes 45 puntos SUMO 🍣").
5. **Given** un número no registrado en el programa, **When** envía "saldo" por WhatsApp, **Then** recibe un mensaje indicando que no está inscrito en el programa y cómo unirse.
6. **Given** un cliente registrado, **When** envía "saldo" por WhatsApp con cualquier variación de mayúsculas/minúsculas ("Saldo", "SALDO"), **Then** la respuesta es la misma.

---

### User Story 4 — Catálogo de Recompensas (Priority: P2)

Cualquier usuario puede ver la lista actual de recompensas disponibles con su costo en puntos y descripción.

**Why this priority**: Los clientes necesitan ver qué pueden obtener para mantenerse motivados a acumular puntos.

**Independent Test**: Obtener el catálogo y verificar que solo se devuelven recompensas activas ordenadas por costo ascendente.

**Acceptance Scenarios**:

1. **When** se solicita el catálogo de recompensas, **Then** se devuelven todas las recompensas activas ordenadas por costo en puntos de menor a mayor.
2. **Given** una recompensa marcada como inactiva, **When** se solicita el catálogo, **Then** la recompensa inactiva se excluye del resultado.

---

### User Story 5 — Canje de Recompensa (Priority: P3)

El staff procesa un canje a petición del cliente. Se descuentan los puntos del saldo del cliente y se crea un registro de canje con estado "pendiente". El cliente recibe un mensaje WhatsApp con el código de canje para presentarlo al staff. El staff marca el canje como utilizado cuando el cliente lo presenta.

**Why this priority**: El canje es la recompensa final del programa; depende de que el earn esté funcionando primero.

**Independent Test**: Procesar un canje para un cliente con saldo suficiente y verificar: puntos descontados, canje creado en estado 'pending', notificación WhatsApp enviada con código.

**Acceptance Scenarios**:

1. **Given** un cliente con saldo suficiente, **When** el staff procesa un canje de una recompensa, **Then** los puntos se descuentan, el canje se crea en estado 'pending' y se envía WhatsApp al cliente con: la recompensa canjeada (nombre y descripción), el saldo de puntos restante, y el código de canje para presentar al staff.
2. **Given** un cliente con saldo insuficiente, **When** se intenta canjear, **Then** el sistema rechaza con error claro (puntos insuficientes).
3. **Given** un canje en estado 'pending', **When** el staff lo marca como usado, **Then** el estado cambia a 'used', se registra la fecha/hora de uso y el cliente recibe WhatsApp de confirmación.
4. **Given** un canje en estado 'pending' que supera la ventana de expiración configurada, **When** el sistema verifica su estado, **Then** el estado cambia a 'expired' y los puntos NO se reembolsan.
5. **Given** un canje ya marcado como 'used', **When** se intenta marcarlo como usado de nuevo, **Then** el sistema rechaza la operación.

---

### Edge Cases

- ¿Qué pasa si el cliente tiene WhatsApp opt-in en `false`? → Se procesa la transacción pero se omite la notificación WhatsApp.
- ¿Qué ocurre con dos solicitudes concurrentes que intentan descontar puntos simultáneamente? → El sistema debe prevenir saldo negativo mediante control atómico.
- ¿Qué pasa si el valor de puntos-por-visita se modifica? → Las transacciones históricas conservan su valor original; solo las nuevas usan el nuevo valor.
- ¿Qué pasa si se intenta consultar un cliente con `deletedAt`? → Se devuelve not-found (el cliente no existe públicamente).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST allow staff to register a new customer with name and phone number.
- **FR-002**: System MUST prevent duplicate registrations by phone number, returning the existing customer profile instead.
- **FR-003**: System MUST send a WhatsApp welcome notification to the customer upon registration (if opted in).
- **FR-004**: System MUST allow staff to record a visit for a registered, active customer at a specific branch, crediting a configurable fixed number of points.
- **FR-005**: System MUST maintain a running points balance per customer, updated atomically on each earn or redeem event.
- **FR-006**: System MUST send a WhatsApp notification to the customer (if opted in) when points are earned, including the new balance.
- **FR-006b**: After earning points, if the customer's new balance meets or exceeds the cost of one or more active rewards, system MUST send an additional WhatsApp message listing each newly unlocked reward (name, description, points cost).
- **FR-007**: System MUST record every point-change event as an immutable transaction with customer, branch, date, type, and delta.
- **FR-008**: System MUST allow staff (authenticated) to look up a customer's full profile, balance, and transaction history by phone number.
- **FR-008b**: System MUST respond to a customer sending the keyword "saldo" via WhatsApp with a message containing only their current points balance — no history, no personal data beyond the balance total.
- **FR-009**: System MUST expose a catalog of active rewards ordered by points cost ascending.
- **FR-010**: System MUST allow staff to create a redemption for a customer with sufficient balance, atomically deducting points and creating the redemption record.
- **FR-011**: System MUST reject redemption requests when the customer's balance is less than the reward's points cost.
- **FR-012**: System MUST send a WhatsApp notification to the customer (if opted in) when a redemption is created, including: the redeemed reward name and description, the remaining points balance, and the unique redemption code.
- **FR-013**: System MUST allow staff to mark a pending redemption as used, recording the staff member and timestamp.
- **FR-014**: System MUST reject operations on customers marked as deleted.
- **FR-015**: The points-per-visit value MUST be configurable without code changes.

### Key Entities

- **Customer**: Miembro del programa identificado por teléfono. Tiene nombre, flag de opt-in WhatsApp y saldo de puntos actual.
- **LoyaltyTransaction**: Registro inmutable de un cambio de puntos (earn o redeem) para un cliente en una sucursal. Incluye monto, tipo, fecha y referencia opcional.
- **Reward**: Premio o beneficio que un cliente puede canjear. Tiene nombre, descripción, costo en puntos y estado activo/inactivo.
- **Redemption**: Instancia de un cliente solicitando una recompensa específica. Tiene estado (pending, used, expired), código único, fecha de uso y referencia al colaborador que lo validó.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: El staff puede registrar un cliente nuevo y recibir confirmación de alta (incluyendo WhatsApp de bienvenida) en menos de 30 segundos.
- **SC-002**: El registro de una visita actualiza el saldo del cliente y dispara la notificación WhatsApp en menos de 5 segundos.
- **SC-003**: La consulta de saldo e historial devuelve resultados en menos de 2 segundos.
- **SC-004**: El sistema garantiza que ningún cliente pueda llegar a saldo negativo, incluso ante solicitudes concurrentes de canje.
- **SC-005**: Las notificaciones WhatsApp se entregan a clientes con opt-in dentro de los 10 segundos posteriores a registrar una transacción.
- **SC-006**: El 100% de las transacciones de puntos quedan registradas con trazabilidad completa (sucursal, fecha, tipo, monto).

## Assumptions

- Los puntos por visita son un valor entero fijo (no variable según consumo). Se configura mediante variable de entorno.
- El registro de clientes y el registro de visitas son realizados por el staff, no son acciones de autoservicio del cliente en esta versión.
- El cliente inicia la solicitud de canje comunicándolo verbalmente al staff, quien lo procesa en el sistema desde el Staff Portal.
- Los códigos de canje son generados por el sistema (no ingresados manualmente).
- Los canjes expirados no generan reembolso de puntos.
- La integración de WhatsApp reutiliza la implementación existente de feat/003 (Twilio).
- Un cliente con `deletedAt` registrado se considera inactivo y no puede operar en el programa.
- Los puntos son siempre enteros positivos; no se admiten puntos fraccionarios ni negativos.
- Las recompensas y su costo en puntos son gestionadas directamente en base de datos por administradores (no hay CRUD de rewards en esta feature).
