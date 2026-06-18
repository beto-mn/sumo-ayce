# Feature Specification: Flujo de Confirmación de Reservaciones vía WhatsApp

**Feature Branch**: `feat/003-twilio-notifications`  
**Created**: 2026-05-24  
**Status**: Draft  

## Flujo General

```
Cliente crea reservación
        │
        ▼
[Estado: PENDIENTE]
        │
        ├──► WhatsApp → Cliente: "Tu reservación está pendiente de confirmación"
        │
        └──► WhatsApp → Encargado (núm. primario): "Nueva reservación, ¿aceptas?"
                    │
           ┌────────┴────────────┐
           │                     │
       ACEPTA                RECHAZA
           │                     │
           ▼                     ▼
  [Estado: CONFIRMADA]   [Estado: RECHAZADA]
           │                     │
  WhatsApp → Cliente:    WhatsApp → Cliente:
  "Confirmada con        "No disponible,
   detalles + condiciones" intenta otra sucursal"


Si el encargado NO responde en X tiempo:
   └──► Reenvío WhatsApp → Encargado (núm. primario)
        │
        Si sigue sin responder en otro X tiempo:
           ├──► Reenvío WhatsApp → Encargado (núm. primario)
           └──► WhatsApp → Encargado (núm. secundario): "Hay reservación sin resolver"
                [Estado: ESCALADA]
                │
                Si sigue sin respuesta en 2X tiempo más (total ~4X desde inicio):
                   [Estado: CANCELADA_AUTO]
                   ├──► WhatsApp → Cliente: "Tu reservación fue cancelada automáticamente"
                   ├──► WhatsApp → Encargado (núm. primario): "Reservación cancelada por falta de respuesta"
                   └──► WhatsApp → Encargado (núm. secundario): "Reservación cancelada por falta de respuesta"
```

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Cliente crea reservación y recibe acuse de pendiente (Priority: P1)

Al crear una reservación, el cliente debe saber de inmediato que su solicitud fue recibida pero que está esperando confirmación de la sucursal. Al mismo tiempo, la sucursal recibe la solicitud para revisarla.

**Why this priority**: Sin esta comunicación inicial, el cliente no sabe si su solicitud llegó y el encargado no se entera de la nueva reservación.

**Independent Test**: Crear una reservación y verificar que el cliente recibe el mensaje de "pendiente" y el encargado recibe la solicitud, ambos dentro de los primeros 10 segundos.

**Acceptance Scenarios**:

1. **Given** un cliente envía una solicitud de reservación válida, **When** el sistema la guarda, **Then** el cliente recibe un WhatsApp indicando que su reservación está pendiente de confirmación, incluyendo los datos que proporcionó (sucursal, fecha, hora, número de personas).
2. **Given** una reservación es creada, **When** el sistema notifica a la sucursal, **Then** el encargado del número primario de la sucursal recibe un WhatsApp con el nombre del cliente, teléfono, sucursal, fecha, hora y número de personas, junto con las opciones para aceptar o rechazar.
3. **Given** una reservación es creada y el envío del WhatsApp al cliente falla, **When** ocurre el error, **Then** la reservación sigue guardada con estado pendiente y el error queda registrado.
4. **Given** la sucursal no tiene número primario registrado, **When** se crea la reservación, **Then** la reservación se guarda como pendiente, se notifica al cliente, y el sistema registra que no pudo notificar al encargado.

---

### User Story 2 - Encargado acepta la reservación (Priority: P1)

El encargado de la sucursal puede indicar que acepta la reservación, lo que actualiza el estado en el sistema y envía al cliente los detalles completos de su reservación confirmada.

**Why this priority**: Es el camino feliz del flujo — sin la capacidad de aceptar, no hay confirmaciones y el sistema no tiene valor.

**Independent Test**: Simular una respuesta de aceptación del encargado y verificar que el estado cambia a "confirmada" y el cliente recibe el mensaje de confirmación con todos los datos y condiciones.

**Acceptance Scenarios**:

1. **Given** una reservación está en estado pendiente y el encargado acepta, **When** el sistema procesa la aceptación, **Then** la reservación cambia a estado "confirmada".
2. **Given** la reservación es confirmada, **When** el sistema actualiza el estado, **Then** el cliente recibe un WhatsApp con: nombre, sucursal, fecha, hora, número de personas, y las condiciones de la reservación (incluyendo tolerancia de 15 minutos).
3. **Given** el cliente ya recibió su confirmación, **When** el encargado envía una aceptación duplicada, **Then** el sistema ignora el duplicado sin enviar otro mensaje al cliente.

---

### User Story 3 - Encargado rechaza la reservación (Priority: P1)

El encargado puede rechazar la reservación, y el cliente recibe una notificación con alternativas para continuar.

**Why this priority**: Igual de importante que la aceptación — sin la capacidad de rechazar, no hay flujo completo y el cliente queda en incertidumbre indefinida.

**Independent Test**: Simular una respuesta de rechazo y verificar que el estado cambia a "rechazada" y el cliente recibe el mensaje con alternativas.

**Acceptance Scenarios**:

1. **Given** una reservación está en estado pendiente y el encargado rechaza, **When** el sistema procesa el rechazo, **Then** la reservación cambia a estado "rechazada".
2. **Given** la reservación es rechazada, **When** el sistema actualiza el estado, **Then** el cliente recibe un WhatsApp indicando que la sucursal no puede recibirlo en ese horario, sugiriendo visitar la sucursal para verificar disponibilidad o hacer una nueva reservación en otra sucursal.

---

### User Story 4 - Escalación por falta de respuesta del encargado (Priority: P2)

Si el encargado no responde en el tiempo establecido, el sistema reenvía el aviso. Si persiste la falta de respuesta, escala a un número secundario de la sucursal.

**Why this priority**: Sin este mecanismo, las reservaciones quedan en estado pendiente indefinidamente y el cliente nunca recibe respuesta.

**Independent Test**: Crear una reservación, esperar a que pase el tiempo de espera sin respuesta del encargado, y verificar que se reenvía el mensaje. Esperar otro período y verificar que se notifica el número secundario.

**Acceptance Scenarios**:

1. **Given** una reservación está pendiente y el encargado no ha respondido en X tiempo, **When** se cumple el primer timeout, **Then** el sistema reenvía el mensaje de solicitud al número primario del encargado.
2. **Given** el encargado recibió el reenvío pero sigue sin responder en otro X tiempo, **When** se cumple el segundo timeout, **Then** el sistema envía nuevamente el mensaje al número primario Y adicionalmente envía un mensaje al número secundario de la sucursal indicando que hay una reservación sin resolver.
3. **Given** la reservación fue escalada al número secundario, **When** el encargado principal finalmente responde (acepta o rechaza), **Then** la reservación se actualiza normalmente y el flujo continúa.
4. **Given** la sucursal no tiene número secundario registrado, **When** ocurre la escalación, **Then** el sistema solo reenvía al número primario y registra que no hay número secundario para escalar.

---

### User Story 5 - Cancelación automática por falta de respuesta (Priority: P2)

Si el encargado nunca responde a pesar de los reenvíos y la escalación, el sistema cancela la reservación automáticamente y notifica a los tres involucrados: cliente, número primario y número secundario de la sucursal.

**Why this priority**: Sin cancelación automática, las reservaciones quedan en estado "escalada" indefinidamente, el cliente queda en incertidumbre y el encargado no recibe una señal clara de cierre.

**Independent Test**: Crear una reservación, dejar pasar los cuatro períodos de tiempo sin respuesta, y verificar que el estado cambia a "cancelada automáticamente" y que los tres números reciben el mensaje de cancelación.

**Acceptance Scenarios**:

1. **Given** una reservación está en estado "escalada" y transcurre el tiempo adicional sin respuesta, **When** se cumple el umbral de cancelación automática, **Then** la reservación cambia a estado "cancelada automáticamente".
2. **Given** la reservación es cancelada automáticamente, **When** el sistema actualiza el estado, **Then** el cliente recibe un WhatsApp informando que su reservación fue cancelada por falta de respuesta de la sucursal, con sugerencia de intentar nuevamente o contactar directamente.
3. **Given** la reservación es cancelada automáticamente, **When** el sistema actualiza el estado, **Then** el número primario de la sucursal recibe un WhatsApp indicando que la reservación fue cancelada por no haber respondido a tiempo.
4. **Given** la reservación es cancelada automáticamente, **When** el sistema actualiza el estado, **Then** el número secundario de la sucursal recibe un WhatsApp con el mismo aviso de cancelación.
5. **Given** el encargado intenta aceptar o rechazar una reservación ya cancelada automáticamente, **When** el sistema recibe la respuesta, **Then** la ignora y el estado permanece "cancelada automáticamente".
6. **Given** la sucursal no tiene número secundario, **When** se cancela automáticamente, **Then** el sistema notifica al cliente y al número primario, y registra que no había número secundario que notificar.

---

### Edge Cases

- ¿Qué pasa si el encargado responde después de que la reservación fue cancelada automáticamente?
- ¿Qué pasa si el número de teléfono del cliente no tiene prefijo de país?
- ¿Qué pasa si el servicio de mensajería falla durante el envío de los mensajes de cancelación automática?
- ¿Qué pasa si el encargado intenta aceptar una reservación que ya fue rechazada (o viceversa)?
- ¿Qué pasa si la hora de la reservación ya pasó y sigue en estado pendiente o escalada?

## Requirements *(mandatory)*

### Functional Requirements

**Creación y notificación inicial:**
- **FR-001**: Al crear una reservación exitosamente, el sistema DEBE guardarla con estado "pendiente".
- **FR-002**: El sistema DEBE enviar al cliente un WhatsApp de acuse indicando que su reservación está pendiente de confirmación, con los datos de la reservación (sucursal, fecha, hora, personas).
- **FR-003**: El sistema DEBE enviar simultáneamente al número primario de la sucursal un WhatsApp con los datos de la reservación y las opciones para aceptar o rechazar.

**Aceptación:**
- **FR-004**: Cuando el encargado acepta la reservación, el sistema DEBE actualizar su estado a "confirmada".
- **FR-005**: Al confirmar una reservación, el sistema DEBE enviar al cliente un WhatsApp con el resumen completo (sucursal, fecha, hora, personas) y las condiciones de la reservación, incluyendo la política de tolerancia de 15 minutos.

**Rechazo:**
- **FR-006**: Cuando el encargado rechaza la reservación, el sistema DEBE actualizar su estado a "rechazada".
- **FR-007**: Al rechazar una reservación, el sistema DEBE enviar al cliente un WhatsApp indicando que la sucursal no puede recibirlo, sugiriendo visitar la sucursal para checar disponibilidad o hacer una nueva reservación en otra sucursal.

**Escalación por timeout:**
- **FR-008**: Si el encargado no responde en X tiempo, el sistema DEBE reenviar el mensaje de solicitud al número primario de la sucursal.
- **FR-009**: Si después del reenvío el encargado sigue sin responder en otro X tiempo, el sistema DEBE reenviar nuevamente al número primario Y enviar un mensaje de alerta al número secundario de la sucursal indicando que hay una reservación sin resolver.
- **FR-010**: La reservación DEBE pasar a estado "escalada" cuando se notifica el número secundario.

**Cancelación automática:**
- **FR-018**: Si una reservación en estado "escalada" no recibe respuesta en 2X tiempo adicional (total aproximado de 4X desde la creación), el sistema DEBE cancelarla automáticamente.
- **FR-019**: Al cancelar automáticamente, el sistema DEBE enviar un mensaje de WhatsApp al cliente indicando que su reservación fue cancelada por falta de respuesta, con sugerencia de intentar nuevamente.
- **FR-020**: Al cancelar automáticamente, el sistema DEBE enviar un mensaje de aviso al número primario de la sucursal.
- **FR-021**: Al cancelar automáticamente, el sistema DEBE enviar un mensaje de aviso al número secundario de la sucursal (si existe).
- **FR-022**: Una reservación en estado "cancelada automáticamente" DEBE ser inmutable — cualquier respuesta posterior del encargado debe ser ignorada.

**Mecanismo de respuesta del encargado:**
- **FR-011**: El encargado DEBE poder aceptar o rechazar una reservación respondiendo directamente en el chat de WhatsApp con una palabra clave (ej. ACEPTAR / RECHAZAR). El sistema escucha los mensajes entrantes y actualiza el estado de la reservación según la respuesta recibida.
- **FR-011a**: El sistema DEBE asociar correctamente la respuesta del encargado con la reservación correspondiente, usando el número de teléfono remitente y el identificador de la reservación incluido en el mensaje original.
- **FR-011b**: Si el encargado responde con una palabra no reconocida, el sistema DEBE enviarle un mensaje indicando las palabras clave válidas para responder.

**Resiliencia:**
- **FR-012**: El fallo en el envío de cualquier mensaje de WhatsApp NO DEBE cancelar ni alterar el estado de la reservación.
- **FR-013**: Todos los errores de envío DEBEN quedar registrados con detalle suficiente para diagnóstico.
- **FR-014**: El sistema DEBE normalizar los números de teléfono al formato internacional (+52) antes de enviar mensajes.
- **FR-015**: El sistema DEBE ignorar respuestas duplicadas del encargado (por ejemplo, aceptar dos veces).

**Datos de sucursal:**
- **FR-016**: La sucursal DEBE tener un campo para el número primario de WhatsApp de reservaciones.
- **FR-017**: La sucursal DEBE tener un campo opcional para el número secundario de WhatsApp de escalaciones.

### Key Entities

- **Reservación**: Nombre del cliente, teléfono, sucursal, fecha, hora, número de personas, **estado** (pendiente / confirmada / rechazada / escalada / cancelada_auto). Ya existe parcialmente — se debe agregar el campo de estado.
- **Sucursal**: Además de sus datos actuales, debe incluir: número primario de WhatsApp para reservaciones, número secundario opcional de WhatsApp para escalaciones.
- **Evento de mensajería**: Registro de cada mensaje enviado o fallido, con destinatario, tipo de mensaje, timestamp y resultado.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: El cliente recibe el mensaje de "reservación pendiente" en menos de 10 segundos después de crear la reservación.
- **SC-002**: El encargado recibe la solicitud de confirmación en menos de 10 segundos después de crearse la reservación.
- **SC-003**: El cliente recibe el mensaje de confirmación o rechazo en menos de 10 segundos después de que el encargado responde.
- **SC-004**: El sistema reenvía la solicitud al encargado dentro de los primeros 2 minutos después de cumplirse el timeout, sin intervención manual.
- **SC-005**: El 100% de las reservaciones creadas quedan guardadas con estado "pendiente" independientemente de si los mensajes se enviaron correctamente.
- **SC-006**: El 100% de los errores de mensajería quedan registrados para diagnóstico.
- **SC-007**: Una reservación en estado final (confirmada, rechazada, o cancelada automáticamente) no puede ser modificada por respuestas posteriores del encargado.
- **SC-008**: Una reservación sin respuesta del encargado entra en cancelación automática en no más de 4X tiempo desde su creación, sin intervención manual.

## Assumptions

- Los números de teléfono sin prefijo de país se asumen como mexicanos (+52).
- El tiempo X de espera es de 30 minutos. La línea de tiempo completa es: T+30min (primer reenvío), T+60min (escalación a secundario), T+120min (cancelación automática). Estos valores son configurables a futuro.
- Los mensajes de WhatsApp se envían en español.
- El texto de las condiciones de la reservación (tolerancia de 15 min, política de cancelación, etc.) es fijo para esta versión. La edición de esos textos es trabajo futuro.
- Una reservación solo puede ser aceptada o rechazada una vez — el sistema ignora respuestas posteriores.
- El número secundario de la sucursal es opcional. Su ausencia no impide el flujo principal.
- El servicio de mensajería de WhatsApp (Twilio) ya está configurado en el proyecto — esta feature lo conecta con el flujo de reservaciones, no lo instala desde cero.
- Todo el flujo de reservaciones es exclusivamente por WhatsApp — no hay correo electrónico, SMS, ni notificaciones push involucradas.
- El sistema distingue la respuesta del encargado por el número de teléfono remitente. Si dos encargados comparten el mismo número, se trata como un solo respondente.
- El mensaje que recibe el encargado incluye un identificador de la reservación (ej. número de folio) para que el sistema pueda asociar la respuesta a la reservación correcta cuando hay múltiples reservaciones pendientes.
