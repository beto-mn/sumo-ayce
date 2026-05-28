interface UnlockedReward {
  name: string
  description: string | null
  pointsCost: number
}

export function msgLoyaltyBienvenida(name: string): string {
  return `🍣 *SUMO Lealtad*

¡Bienvenido al programa de lealtad, ${name}!

Acumula puntos en cada visita y canjéalos por premios exclusivos.
Tu saldo actual es *0 puntos*.

¡Gracias por ser parte de SUMO!`
}

export function msgLoyaltyPuntosGanados(
  name: string,
  pointsEarned: number,
  newBalance: number
): string {
  return `🍣 *SUMO Lealtad*

¡Hola ${name}! Acumulaste *${pointsEarned} puntos* en tu visita de hoy.

Tu saldo actual: *${newBalance} puntos*

¡Sigue visitándonos para canjear tus recompensas!`
}

export function msgLoyaltyRecompensasDesbloqueadas(
  rewards: UnlockedReward[]
): string {
  const list = rewards
    .map(
      r =>
        `• *${r.name}* (${r.pointsCost} pts)${r.description ? ` — ${r.description}` : ''}`
    )
    .join('\n')

  return `🎁 *SUMO Lealtad — ¡Tienes recompensas disponibles!*

Ya tienes puntos suficientes para canjear:

${list}

Dile al mesero en tu próxima visita que quieres canjear una recompensa.`
}

export function msgLoyaltyCanje(
  name: string,
  rewardName: string,
  rewardDescription: string | null,
  remainingBalance: number
): string {
  const desc = rewardDescription ? `\n_${rewardDescription}_` : ''
  return `✅ *SUMO Lealtad — Recompensa canjeada*

¡Hola ${name}! Se canjeó tu recompensa:

🎁 *${rewardName}*${desc}

Tu saldo actual: *${remainingBalance} puntos*

¡Gracias por visitarnos!`
}

export function msgLoyaltySaldo(name: string, balance: number): string {
  return `🍣 *SUMO Lealtad*

Hola ${name}, tienes *${balance} puntos* acumulados.

Puedes canjearlos en tu próxima visita.
¡Gracias por ser parte de SUMO!`
}

export function msgLoyaltySaldoNoEncontrado(): string {
  return `🍣 *SUMO Lealtad*

No encontramos una cuenta asociada a este número.

Visita cualquiera de nuestras sucursales para registrarte en el programa de lealtad. ¡Es gratis!`
}

export function msgLoyaltyVelocityAlert(
  staffName: string,
  staffId: string,
  transactionCount: number,
  windowMinutes: number,
  branchName: string
): string {
  return `⚠️ *SUMO Lealtad — Actividad inusual*

Se detectó actividad elevada en *${branchName}*:

👤 Colaborador: ${staffName}
🆔 ID: ${staffId}
📊 Transacciones: *${transactionCount}* en los últimos ${windowMinutes} min

Por favor verifica con el colaborador.`
}
