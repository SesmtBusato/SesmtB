/**
 * Vercel Serverless Function — Motor de Alertas por E-mail
 *
 * GET  /api/send-alert  -> status do provedor configurado (sem expor segredos)
 * POST /api/send-alert  -> { type: 'create' | 'update' | 'test', eventId?, event?, oldStatus?, recipients? }
 */
import { dispatchAlert, getEmailStatus, AlertType } from '../lib/emailEngine.js';

export default async function handler(req: any, res: any) {
  if (req.method === 'GET') {
    return res.status(200).json(getEmailStatus());
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'GET, POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {};
    const type: AlertType = ['create', 'update', 'test'].includes(body.type) ? body.type : 'create';

    const result = await dispatchAlert({
      type,
      eventId: body.eventId,
      event: body.event,
      oldStatus: body.oldStatus,
      recipients: body.recipients,
      smtpConfig: body.smtpConfig,
    });

    return res.status(result.ok ? 200 : 502).json(result);
  } catch (err: any) {
    return res.status(500).json({ ok: false, error: err?.message || 'Erro interno no motor de e-mail' });
  }
}
