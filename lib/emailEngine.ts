/**
 * Motor de Disparo de E-mails de Alerta SESMT (server-side only)
 *
 * Independente de provedor. Suporta:
 *  - SMTP genérico (Microsoft 365/Outlook, Zoho, Hostinger, Locaweb, KingHost,
 *    Brevo, Amazon SES SMTP, Gmail, servidor próprio, etc.) via Nodemailer
 *  - Resend (API HTTP) — ideal para ambientes serverless como a Vercel
 *
 * Variáveis de ambiente:
 *  EMAIL_PROVIDER   = smtp | resend   (opcional, detectado automaticamente)
 *  EMAIL_FROM       = "SESMT Busato <alertas@suaempresa.com.br>"
 *  SMTP_HOST, SMTP_PORT, SMTP_SECURE (true/false), SMTP_USER, SMTP_PASS
 *  RESEND_API_KEY
 *  ALERT_RECIPIENTS = lista separada por vírgula (opcional, complementa a lista do sistema)
 *  APP_URL          = URL pública do sistema (link no corpo do e-mail)
 */
import nodemailer from 'nodemailer';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

export type EmailProvider = 'smtp' | 'resend' | 'none';
export type AlertType = 'create' | 'update' | 'test';

export interface SendResult {
  ok: boolean;
  provider: EmailProvider;
  messageId?: string;
  error?: string;
}

export interface SmtpConfigInput {
  provider?: EmailProvider;
  host?: string;
  port?: number | string;
  secure?: boolean;
  user?: string;
  pass?: string;
  from?: string;
  resendApiKey?: string;
}

export interface DispatchInput {
  type: AlertType;
  eventId?: string;
  event?: Record<string, any>;
  oldStatus?: string;
  recipients?: string[];
  smtpConfig?: SmtpConfigInput;
}

export interface DispatchResult extends SendResult {
  recipients: string[];
  subject: string;
  notificationId?: string;
}

const env = (k: string) => (process.env[k] || '').trim();

// ---------------------------------------------------------------------------
// Configuração / Provedor
// ---------------------------------------------------------------------------
export function getProvider(override?: SmtpConfigInput): EmailProvider {
  if (override) {
    if (override.provider === 'resend' || override.resendApiKey) return 'resend';
    if (override.provider === 'smtp' || override.host) return 'smtp';
  }
  const forced = env('EMAIL_PROVIDER').toLowerCase();
  if (forced === 'smtp' && env('SMTP_HOST')) return 'smtp';
  if (forced === 'resend' && env('RESEND_API_KEY')) return 'resend';
  if (env('RESEND_API_KEY')) return 'resend';
  if (env('SMTP_HOST')) return 'smtp';
  return 'none';
}

export function getEmailStatus(override?: SmtpConfigInput) {
  const provider = getProvider(override);
  const host = override?.host || (provider === 'smtp' ? env('SMTP_HOST') : provider === 'resend' ? 'api.resend.com' : null);
  const from = override?.from || override?.user || env('EMAIL_FROM') || env('SMTP_USER') || null;
  return {
    provider,
    configured: provider !== 'none',
    from,
    host,
  };
}

function getFrom(override?: SmtpConfigInput): string {
  if (override?.from && override.from.trim()) return override.from.trim();
  if (override?.user && override.user.trim()) return `SESMT Busato <${override.user.trim()}>`;
  return env('EMAIL_FROM') || (env('SMTP_USER') ? `SESMT Busato <${env('SMTP_USER')}>` : 'SESMT Busato <onboarding@resend.dev>');
}

let cachedTransport: ReturnType<typeof nodemailer.createTransport> | null = null;
function getSmtpTransport(override?: SmtpConfigInput) {
  if (override && override.host) {
    const port = Number(override.port || 587);
    const secure = override.secure !== undefined ? override.secure : port === 465;
    return nodemailer.createTransport({
      host: override.host.trim(),
      port,
      secure,
      auth: override.user ? { user: override.user.trim(), pass: override.pass || '' } : undefined,
      connectionTimeout: 15000,
      greetingTimeout: 15000,
      socketTimeout: 20000,
      family: 4, // Força IPv4 no Node.js / AWS Lambda / Vercel para evitar timeout de rota IPv6
      tls: {
        rejectUnauthorized: false,
        minVersion: 'TLSv1.2'
      }
    } as any);
  }

  if (cachedTransport) return cachedTransport;
  const port = Number(env('SMTP_PORT') || 587);
  const secure = env('SMTP_SECURE') ? env('SMTP_SECURE') === 'true' : port === 465;
  cachedTransport = nodemailer.createTransport({
    host: env('SMTP_HOST'),
    port,
    secure,
    auth: env('SMTP_USER') ? { user: env('SMTP_USER'), pass: env('SMTP_PASS') } : undefined,
    connectionTimeout: 15000,
    greetingTimeout: 15000,
    socketTimeout: 20000,
    family: 4, // Força IPv4
    tls: {
      rejectUnauthorized: false,
      minVersion: 'TLSv1.2'
    }
  } as any);
  return cachedTransport;
}

// ---------------------------------------------------------------------------
// Envio genérico
// ---------------------------------------------------------------------------
export async function sendEmail(
  opts: { to: string[]; subject: string; html: string; text: string },
  override?: SmtpConfigInput
): Promise<SendResult> {
  const provider = getProvider(override);
  if (provider === 'none') {
    return {
      ok: false,
      provider,
      error: 'Nenhum servidor de e-mail configurado. Clique em "Configurar Servidor de Envio" e preencha os dados de SMTP ou API Key.',
    };
  }
  if (opts.to.length === 0) {
    return { ok: false, provider, error: 'Nenhum destinatário cadastrado para envio.' };
  }

  const fromAddress = getFrom(override);
  const resendKey = override?.resendApiKey || env('RESEND_API_KEY');

  try {
    if (provider === 'resend') {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${resendKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ from: fromAddress, to: opts.to, subject: opts.subject, html: opts.html, text: opts.text }),
      });
      const body: any = await res.json().catch(() => ({}));
      if (!res.ok) return { ok: false, provider, error: body?.message || `Resend HTTP ${res.status}` };
      return { ok: true, provider, messageId: body?.id };
    }

    const transport = getSmtpTransport(override);
    const info = await transport.sendMail({
      from: fromAddress,
      to: opts.to.join(', '),
      subject: opts.subject,
      html: opts.html,
      text: opts.text,
    });
    return { ok: true, provider, messageId: info.messageId };
  } catch (err: any) {
    const rawMsg = err?.message || String(err);
    let friendlyError = rawMsg;
    if (rawMsg.includes('EAUTH') || rawMsg.includes('Invalid login') || rawMsg.includes('authentication failed')) {
      friendlyError = 'Falha de autenticação: usuário ou senha do e-mail incorretos. Em contas corporativas ou Gmail, utilize uma Senha de Aplicativo.';
    } else if (
      rawMsg.includes('ECONNREFUSED') ||
      rawMsg.includes('ETIMEDOUT') ||
      rawMsg.includes('ENOTFOUND') ||
      rawMsg.includes('Connection timeout') ||
      rawMsg.includes('Greeting never received')
    ) {
      const hostName = override?.host || env('SMTP_HOST') || 'servidor';
      const portNum = override?.port || env('SMTP_PORT') || '587';
      friendlyError = `Tempo de conexão esgotado (${rawMsg}) ao conectar em ${hostName}:${portNum}. Servidores de nuvem (Vercel) podem ter restrições em portas SMTP tradicionais. Dica: teste a porta 465 com SSL ativado, ou utilize o atalho "⚡ Resend" (API HTTP porta 443, 100% estável na Vercel).`;
    }
    return { ok: false, provider, error: friendlyError };
  }
}

// ---------------------------------------------------------------------------
// Supabase (server-side)
// ---------------------------------------------------------------------------
let cachedSupabase: SupabaseClient | null | undefined;
export function getServerSupabase(): SupabaseClient | null {
  if (cachedSupabase !== undefined) return cachedSupabase;
  const url = env('SUPABASE_URL') || env('VITE_SUPABASE_URL') || 'https://olrtzxamixygmrftcczc.supabase.co';
  const key =
    env('SUPABASE_SECRET_KEY') ||
    env('SUPABASE_PUBLISHABLE_KEY') ||
    env('VITE_SUPABASE_ANON_KEY') ||
    'sb_publishable_yMjEr3IZPAu7ncs40hMtPg_mbcZtCPw';
  cachedSupabase = key ? createClient(url, key) : null;
  return cachedSupabase;
}

function mapDbEvent(db: any): Record<string, any> {
  return {
    id: db.id,
    item: db.item,
    data: db.data,
    horario: db.horario,
    descricao: db.descricao,
    local: db.local,
    area: db.area,
    equipamento: db.equipamento,
    placaTag: db.placa_tag,
    envolvido: db.envolvido,
    letraTurno: db.letra_turno,
    estavaDeExtra: db.estava_de_extra,
    encarregado: db.encarregado,
    tipoOcorrencia: db.tipo_ocorrencia,
    classificacaoReal: db.classificacao_real,
    classificacaoPotencial: db.classificacao_potencial,
    prazoAnalise: db.prazo_analise,
    status: db.status,
  };
}

const isEmail = (s: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
const normalizeList = (list: unknown): string[] =>
  Array.isArray(list) ? list.map((x) => String(x).trim().toLowerCase()).filter(isEmail) : [];

/**
 * Destinatários autorizados = lista salva no sistema (Supabase) + ALERT_RECIPIENTS.
 * Se o cliente enviar destinatários, só os autorizados são usados (evita uso do
 * endpoint como relay aberto de e-mails).
 */
async function resolveRecipients(requested?: string[]): Promise<string[]> {
  const allowed = new Set<string>(normalizeList(env('ALERT_RECIPIENTS').split(',')));
  const sb = getServerSupabase();
  if (sb) {
    try {
      const { data } = await sb.from('settings').select('notification_emails').eq('id', 'app_settings').single();
      normalizeList(data?.notification_emails).forEach((e) => allowed.add(e));
    } catch {}
  }

  const req = normalizeList(requested);
  if (allowed.size === 0) return req.slice(0, 20);
  if (req.length === 0) return [...allowed];
  const filtered = req.filter((e) => allowed.has(e));
  return filtered.length > 0 ? filtered : [...allowed];
}

// ---------------------------------------------------------------------------
// Template do e-mail
// ---------------------------------------------------------------------------
const esc = (v: unknown) =>
  String(v ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

const SEVERITY_COLOR: Record<string, string> = {
  Leve: '#10b981',
  Moderado: '#f59e0b',
  Grave: '#f97316',
  Crítico: '#ef4444',
};

export function buildAlertEmail(type: AlertType, ev: Record<string, any>, oldStatus?: string, override?: SmtpConfigInput) {
  const appUrl = env('APP_URL') || 'https://sesmt-b.vercel.app';
  const item = ev.item ?? '—';

  let subject: string;
  let headline: string;
  let intro: string;

  if (type === 'test') {
    subject = '[SESMT Busato] Teste do motor de alertas por e-mail';
    headline = 'Teste de disparo realizado com sucesso ✅';
    intro = 'Este é um e-mail de teste. Se você recebeu esta mensagem, o motor de alertas está configurado corretamente e você receberá as notificações de novas ocorrências.';
  } else if (type === 'update') {
    subject = `[Atualização Ocorrência #${item}] Novo status: ${ev.status}`;
    headline = `Ocorrência #${item} teve o status atualizado`;
    intro = `O status foi alterado de <b>${esc(oldStatus || '—')}</b> para <b>${esc(ev.status)}</b>.`;
  } else {
    subject = `[Alerta Ocorrência #${item}] ${ev.area || 'Operação'} - ${ev.tipoOcorrencia || 'Novo Registro'}`;
    headline = `Nova ocorrência registrada — #${item}`;
    intro = 'Uma nova ocorrência foi registrada no sistema e requer atenção da equipe SESMT e liderança responsável.';
  }

  const rows: [string, unknown][] =
    type === 'test'
      ? [
          ['Provedor', getProvider(override).toUpperCase()],
          ['Data/Hora', new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })],
        ]
      : [
          ['Data / Horário', `${ev.data || '—'} ${ev.horario || ''}`],
          ['Área / Local', `${ev.area || '—'} — ${ev.local || '—'}`],
          ['Tipo', ev.tipoOcorrencia],
          ['Envolvido', ev.envolvido],
          ['Encarregado', ev.encarregado],
          ['Equipamento / Tag', `${ev.equipamento || '—'} ${ev.placaTag ? `(${ev.placaTag})` : ''}`],
          ['Turno / Extra', `${ev.letraTurno || '—'} • Extra: ${ev.estavaDeExtra || '—'}`],
          ['Prazo de Análise', ev.prazoAnalise],
          ['Status', ev.status],
        ];

  const sevReal = ev.classificacaoReal;
  const sevPot = ev.classificacaoPotencial;
  const badge = (label: string, sev?: string) =>
    sev
      ? `<span style="display:inline-block;padding:4px 10px;border-radius:999px;background:${SEVERITY_COLOR[sev] || '#64748b'}22;color:${SEVERITY_COLOR[sev] || '#94a3b8'};border:1px solid ${SEVERITY_COLOR[sev] || '#64748b'}66;font-size:12px;font-weight:700;margin-right:6px">${label}: ${esc(sev)}</span>`
      : '';

  const hiddenRisk =
    type !== 'test' &&
    (sevReal === 'Leve' || sevReal === 'Moderado') &&
    (sevPot === 'Grave' || sevPot === 'Crítico');

  const html = `<!doctype html><html><body style="margin:0;background:#0b1220;font-family:Segoe UI,Arial,sans-serif;color:#e2e8f0">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#0b1220;padding:24px 0"><tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#111a2b;border:1px solid #1e2f4a;border-radius:16px;overflow:hidden">
<tr><td style="background:linear-gradient(90deg,#155592,#1e73be);padding:20px 24px">
<div style="font-size:11px;letter-spacing:2px;color:#bae6fd;font-weight:700">SESMT • BUSATO</div>
<div style="font-size:20px;font-weight:800;color:#fff;margin-top:4px">${esc(headline)}</div>
</td></tr>
<tr><td style="padding:20px 24px">
<p style="margin:0 0 14px;font-size:14px;line-height:1.5;color:#cbd5e1">${intro}</p>
${type !== 'test' ? `<div style="margin-bottom:14px">${badge('Real', sevReal)}${badge('Potencial', sevPot)}</div>` : ''}
${hiddenRisk ? `<div style="margin-bottom:14px;padding:10px 12px;border-radius:10px;background:#f59e0b1a;border:1px solid #f59e0b55;color:#fcd34d;font-size:13px">⚠️ <b>Risco Oculto:</b> gravidade real baixa, porém com potencial ${esc(sevPot)}. Priorize a investigação.</div>` : ''}
${ev.descricao ? `<div style="margin-bottom:14px;padding:12px;border-radius:10px;background:#0e1626;border:1px solid #1e2f4a;font-size:13px;line-height:1.5;color:#e2e8f0"><b style="color:#38bdf8">Descrição:</b><br/>${esc(ev.descricao)}</div>` : ''}
<table width="100%" cellpadding="0" cellspacing="0" style="font-size:13px">
${rows
  .map(
    ([k, v]) =>
      `<tr><td style="padding:7px 0;border-bottom:1px solid #1e2f4a;color:#94a3b8;width:40%">${esc(k)}</td><td style="padding:7px 0;border-bottom:1px solid #1e2f4a;color:#f1f5f9;font-weight:600">${esc(v || '—')}</td></tr>`
  )
  .join('')}
</table>
<div style="text-align:center;margin-top:22px"><a href="${esc(appUrl)}" style="display:inline-block;background:#1e73be;color:#fff;text-decoration:none;font-weight:700;font-size:13px;padding:11px 22px;border-radius:10px">Abrir no Sistema SESMT</a></div>
</td></tr>
<tr><td style="padding:14px 24px;border-top:1px solid #1e2f4a;font-size:11px;color:#64748b;text-align:center">Mensagem automática do Sistema de Gestão de Ocorrências SESMT Busato. Não responda este e-mail.</td></tr>
</table></td></tr></table></body></html>`;

  const text = [
    headline,
    '',
    intro.replace(/<[^>]+>/g, ''),
    '',
    ...(ev.descricao ? [`Descrição: ${ev.descricao}`, ''] : []),
    ...rows.map(([k, v]) => `${k}: ${v || '—'}`),
    ...(type !== 'test' ? [`Gravidade Real: ${sevReal || '—'} | Potencial: ${sevPot || '—'}`] : []),
    '',
    `Acesse: ${appUrl}`,
  ].join('\n');

  return { subject, html, text };
}

// ---------------------------------------------------------------------------
// Orquestração: resolve evento + destinatários, envia e registra o log
// ---------------------------------------------------------------------------
export async function dispatchAlert(input: DispatchInput): Promise<DispatchResult> {
  const sb = getServerSupabase();
  let ev: Record<string, any> = input.event || {};

  // Prioriza o registro persistido no banco (fonte confiável)
  if (input.type !== 'test' && input.eventId && sb) {
    try {
      const { data } = await sb.from('events').select('*').eq('id', input.eventId).single();
      if (data) ev = { ...ev, ...mapDbEvent(data) };
    } catch {}
  }

  const recipients = await resolveRecipients(input.recipients);
  const { subject, html, text } = buildAlertEmail(input.type, ev, input.oldStatus, input.smtpConfig);
  const result = await sendEmail({ to: recipients, subject, html, text }, input.smtpConfig);

  // Registro do log de disparo (com status real)
  const notificationId = `notif-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const preview =
    input.type === 'test'
      ? result.ok
        ? `E-mail de teste enviado via ${result.provider.toUpperCase()}.`
        : `Falha no teste: ${result.error}`
      : result.ok
        ? `${String(ev.descricao || '').substring(0, 140)}${ev.descricao && ev.descricao.length > 140 ? '...' : ''} (Responsável: ${ev.encarregado || 'N/A'})`
        : `Falha no envio: ${result.error}`;

  if (sb) {
    try {
      await sb.from('notifications').insert({
        id: notificationId,
        event_id: input.type === 'test' ? null : ev.id || input.eventId || null,
        item: input.type === 'test' ? 0 : Number(ev.item) || 0,
        envolvido: ev.envolvido || (input.type === 'test' ? 'Teste' : 'Não informado'),
        encarregado: ev.encarregado || 'SESMT',
        area: ev.area || 'Geral',
        recipients,
        subject,
        status: result.ok ? 'Entregue' : 'Falha',
        preview_text: preview,
      });

      if (result.ok && input.type === 'create' && (ev.id || input.eventId)) {
        await sb
          .from('events')
          .update({ notificado_email: true, emails_notificados: recipients })
          .eq('id', ev.id || input.eventId);
      }
    } catch (e) {
      console.warn('[emailEngine] Falha ao registrar log de notificação:', e);
    }
  }

  if (!result.ok) console.warn(`[emailEngine] Falha no disparo (${result.provider}):`, result.error);

  return { ...result, recipients, subject, notificationId };
}
