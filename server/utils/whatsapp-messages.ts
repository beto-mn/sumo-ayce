interface ReservationData {
  folio: string
  contactName: string
  contactPhone: string
  branchName: string
  reservationDate: string
  reservationTime: string
  partySize: number
}

export function msgClientePendiente(data: ReservationData): string {
  return `🍣 *SUMO All You Can Eat*

Hola ${data.contactName}, recibimos tu solicitud de reservación.

📍 Sucursal: ${data.branchName}
📅 Fecha: ${data.reservationDate}
🕐 Hora: ${data.reservationTime}
👥 Personas: ${data.partySize}

En breve te confirmamos si hay disponibilidad. ¡Gracias por preferirnos!`
}

export function msgEncargadoSolicitud(data: ReservationData): string {
  return `🍣 *SUMO — Nueva Reservación*

*Folio:* ${data.folio}
*Cliente:* ${data.contactName}
*Teléfono:* ${data.contactPhone}
*Sucursal:* ${data.branchName}
*Fecha:* ${data.reservationDate}
*Hora:* ${data.reservationTime}
*Personas:* ${data.partySize}

Para responder escribe:
✅ ACEPTAR ${data.folio}
❌ RECHAZAR ${data.folio}`
}

export function msgClienteConfirmado(data: ReservationData): string {
  return `✅ *Reservación Confirmada — SUMO*

¡Tu reservación está confirmada, ${data.contactName}!

🔖 Folio: ${data.folio}
📍 Sucursal: ${data.branchName}
📅 Fecha: ${data.reservationDate}
🕐 Hora: ${data.reservationTime}
👥 Personas: ${data.partySize}

*Condiciones:*
• Se aceptará un máximo de 15 minutos de tolerancia
• En caso de no presentarse, la reservación será liberada
• Si necesitas cancelar, contáctanos directamente a la sucursal

¡Te esperamos!`
}

export function msgClienteRechazado(data: ReservationData): string {
  return `❌ *SUMO All You Can Eat*

Hola ${data.contactName}, lamentamos informarte que en este momento la sucursal *${data.branchName}* no tiene disponibilidad para tu reservación el ${data.reservationDate} a las ${data.reservationTime}.

Puedes:
• Visitar la sucursal para verificar disponibilidad directamente
• Intentar reservar en otra de nuestras sucursales

¡Gracias por tu comprensión!`
}

export function msgEncargadoKeywordInvalido(): string {
  return `❓ No reconocí tu respuesta.

Para aceptar: ACEPTAR [FOLIO]
Para rechazar: RECHAZAR [FOLIO]

El folio aparece en el mensaje de la reservación.`
}

export function msgEncargadoRecordatorio(data: ReservationData): string {
  return `🔔 *Recordatorio — Reservación Pendiente*

*Folio:* ${data.folio}
Aún está pendiente la siguiente reservación:

*Cliente:* ${data.contactName}
*Fecha:* ${data.reservationDate} · ${data.reservationTime}
*Personas:* ${data.partySize}

Responde:
✅ ACEPTAR ${data.folio}
❌ RECHAZAR ${data.folio}`
}

export function msgSecundarioEscalacion(data: ReservationData): string {
  return `⚠️ *SUMO — Alerta Reservación Sin Respuesta*

La siguiente reservación lleva más de 30 minutos sin respuesta en el número principal:

*Folio:* ${data.folio}
*Sucursal:* ${data.branchName}
*Cliente:* ${data.contactName}
*Fecha:* ${data.reservationDate} · ${data.reservationTime}
*Personas:* ${data.partySize}

Por favor verificar con el encargado de sucursal.`
}

export function msgClienteCanceladoAuto(data: ReservationData): string {
  return `ℹ️ *SUMO All You Can Eat*

Hola ${data.contactName}, lamentamos informarte que tu reservación (Folio: ${data.folio}) en la sucursal *${data.branchName}* fue cancelada automáticamente por no recibir confirmación a tiempo.

Puedes:
• Hacer una nueva reservación
• Visitar la sucursal directamente

Disculpa los inconvenientes.`
}

export function msgEncargadoCanceladoAuto(data: ReservationData): string {
  return `ℹ️ *SUMO — Reservación Cancelada Automáticamente*

La reservación *${data.folio}* fue cancelada automáticamente por falta de respuesta.

*Cliente:* ${data.contactName} · ${data.contactPhone}
*Fecha:* ${data.reservationDate} · ${data.reservationTime}
*Personas:* ${data.partySize}`
}
