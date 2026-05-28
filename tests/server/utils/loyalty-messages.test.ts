import { describe, expect, it } from 'vitest'
import {
  msgLoyaltyBienvenida,
  msgLoyaltyCanje,
  msgLoyaltyPuntosGanados,
  msgLoyaltyRecompensasDesbloqueadas,
  msgLoyaltySaldo,
  msgLoyaltySaldoNoEncontrado,
  msgLoyaltyVelocityAlert,
} from '../../../server/utils/loyalty-messages'

describe('loyalty-messages', () => {
  it('msgLoyaltyBienvenida includes name', () => {
    const msg = msgLoyaltyBienvenida('Ana')
    expect(msg.length).toBeGreaterThan(0)
    expect(msg).toContain('Ana')
    expect(msg).toContain('0 puntos')
  })

  it('msgLoyaltyPuntosGanados includes earned and new balance', () => {
    const msg = msgLoyaltyPuntosGanados('Juan', 10, 30)
    expect(msg).toContain('Juan')
    expect(msg).toContain('10 puntos')
    expect(msg).toContain('30 puntos')
  })

  it('msgLoyaltyRecompensasDesbloqueadas lists all rewards', () => {
    const rewards = [
      { name: 'Refresco', description: 'Uno gratis', pointsCost: 10 },
      { name: 'Postre', description: null, pointsCost: 20 },
    ]
    const msg = msgLoyaltyRecompensasDesbloqueadas(rewards)
    expect(msg).toContain('Refresco')
    expect(msg).toContain('10 pts')
    expect(msg).toContain('Postre')
    expect(msg).toContain('20 pts')
    expect(msg).toContain('Uno gratis')
  })

  it('msgLoyaltyCanje includes reward name and remaining balance', () => {
    const msg = msgLoyaltyCanje('Ana', 'Postre gratis', 'Selecciona uno', 5)
    expect(msg).toContain('Ana')
    expect(msg).toContain('Postre gratis')
    expect(msg).toContain('Selecciona uno')
    expect(msg).toContain('5 puntos')
  })

  it('msgLoyaltyCanje works with null description', () => {
    const msg = msgLoyaltyCanje('Ana', 'Postre gratis', null, 0)
    expect(msg).toContain('Postre gratis')
    expect(msg.length).toBeGreaterThan(0)
  })

  it('msgLoyaltySaldo includes name and balance', () => {
    const msg = msgLoyaltySaldo('María', 45)
    expect(msg).toContain('María')
    expect(msg).toContain('45 puntos')
  })

  it('msgLoyaltySaldoNoEncontrado is non-empty', () => {
    const msg = msgLoyaltySaldoNoEncontrado()
    expect(msg.length).toBeGreaterThan(0)
    expect(msg).toContain('No encontramos')
  })

  it('msgLoyaltyVelocityAlert includes staff name, count, and branch', () => {
    const msg = msgLoyaltyVelocityAlert(
      'Pedro',
      'uuid-123',
      8,
      60,
      'SUMO Polanco'
    )
    expect(msg).toContain('Pedro')
    expect(msg).toContain('uuid-123')
    expect(msg).toContain('8')
    expect(msg).toContain('60 min')
    expect(msg).toContain('SUMO Polanco')
  })
})
