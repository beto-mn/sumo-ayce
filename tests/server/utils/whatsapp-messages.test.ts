import { describe, expect, it } from 'vitest'
import {
  msgClienteCanceladoAuto,
  msgClienteConfirmado,
  msgClientePendiente,
  msgClienteRechazado,
  msgEncargadoCanceladoAuto,
  msgEncargadoKeywordInvalido,
  msgEncargadoRecordatorio,
  msgEncargadoSolicitud,
  msgSecundarioEscalacion,
} from '../../../server/utils/whatsapp-messages'

const data = {
  folio: 'A3F9B21C',
  contactName: 'Juan Pérez',
  contactPhone: '+528112345678',
  branchName: 'Sucursal Centro',
  reservationDate: '2026-07-01',
  reservationTime: '19:00',
  partySize: 4,
}

describe('whatsapp-messages', () => {
  it('msgClientePendiente includes all required fields', () => {
    const msg = msgClientePendiente(data)
    expect(msg).toContain(data.contactName)
    expect(msg).toContain(data.branchName)
    expect(msg).toContain(data.reservationDate)
    expect(msg).toContain(data.reservationTime)
    expect(msg).toContain(String(data.partySize))
  })

  it('msgEncargadoSolicitud includes folio and accept/reject instructions', () => {
    const msg = msgEncargadoSolicitud(data)
    expect(msg).toContain(data.folio)
    expect(msg).toContain(data.contactName)
    expect(msg).toContain(data.contactPhone)
    expect(msg).toContain(`ACEPTAR ${data.folio}`)
    expect(msg).toContain(`RECHAZAR ${data.folio}`)
  })

  it('msgClienteConfirmado includes conditions and all reservation fields', () => {
    const msg = msgClienteConfirmado(data)
    expect(msg).toContain(data.contactName)
    expect(msg).toContain(data.branchName)
    expect(msg).toContain(data.reservationDate)
    expect(msg).toContain('15 minutos')
  })

  it('msgClienteRechazado includes branch name and alternatives', () => {
    const msg = msgClienteRechazado(data)
    expect(msg).toContain(data.contactName)
    expect(msg).toContain(data.branchName)
    expect(msg).toContain(data.reservationDate)
  })

  it('msgEncargadoKeywordInvalido shows generic format instructions', () => {
    const msg = msgEncargadoKeywordInvalido()
    expect(msg).toContain('ACEPTAR [FOLIO]')
    expect(msg).toContain('RECHAZAR [FOLIO]')
  })

  it('msgEncargadoRecordatorio includes folio and accept/reject instructions', () => {
    const msg = msgEncargadoRecordatorio(data)
    expect(msg).toContain(data.folio)
    expect(msg).toContain(data.contactName)
    expect(msg).toContain(`ACEPTAR ${data.folio}`)
    expect(msg).toContain(`RECHAZAR ${data.folio}`)
  })

  it('msgSecundarioEscalacion includes folio and branch name', () => {
    const msg = msgSecundarioEscalacion(data)
    expect(msg).toContain(data.folio)
    expect(msg).toContain(data.branchName)
    expect(msg).toContain(data.contactName)
  })

  it('msgClienteCanceladoAuto includes folio and alternatives', () => {
    const msg = msgClienteCanceladoAuto(data)
    expect(msg).toContain(data.folio)
    expect(msg).toContain(data.contactName)
    expect(msg).toContain(data.branchName)
  })

  it('msgEncargadoCanceladoAuto includes folio and contact info', () => {
    const msg = msgEncargadoCanceladoAuto(data)
    expect(msg).toContain(data.folio)
    expect(msg).toContain(data.contactName)
    expect(msg).toContain(data.contactPhone)
  })
})
