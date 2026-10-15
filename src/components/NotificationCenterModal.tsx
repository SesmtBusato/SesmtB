import React, { useEffect, useState } from 'react';
import { NotificationLog, AppSettings } from '../types';
import { X, Mail, CheckCircle2, Plus, Trash2, Send, ShieldAlert, BellRing, Loader2, XCircle, Server } from 'lucide-react';
import { api, EmailDispatchResult, EmailEngineStatus } from '../services/api';

interface Props {
  notifications: NotificationLog[];
  settings: AppSettings;
  onClose: () => void;
  onUpdateSettings: (newSettings: AppSettings) => void;
  onRefresh?: () => void;
}

export const NotificationCenterModal: React.FC<Props> = ({
  notifications,
  settings,
  onClose,
  onUpdateSettings,
  onRefresh,
}) => {
  const [emails, setEmails] = useState<string[]>(settings.notificationEmails || []);
  const [newEmailInput, setNewEmailInput] = useState<string>('');
  const [sending, setSending] = useState<boolean>(false);
  const [testResult, setTestResult] = useState<EmailDispatchResult | null>(null);
  const [engine, setEngine] = useState<EmailEngineStatus | null | 'loading'>('loading');

  useEffect(() => {
    api.getEmailStatus().then(setEngine);
  }, []);

  const handleAddEmail = (e: React.FormEvent) => {
    e.preventDefault();
    const val = newEmailInput.trim().toLowerCase();
    if (val && val.includes('@') && !emails.includes(val)) {
      const updated = [...emails, val];
      setEmails(updated);
      onUpdateSettings({ ...settings, notificationEmails: updated });
      setNewEmailInput('');
    }
  };

  const handleRemoveEmail = (target: string) => {
    const updated = emails.filter((e) => e !== target);
    setEmails(updated);
    onUpdateSettings({ ...settings, notificationEmails: updated });
  };

  const handleTestDispatch = async () => {
    setSending(true);
    setTestResult(null);
    const result = await api.sendTestEmail(emails);
    setTestResult(result);
    setSending(false);
    onRefresh?.();
  };

  const engineReady = engine !== 'loading' && engine?.configured;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-2xl busato-card border-[#1e2f4a] rounded-2xl shadow-2xl p-6 text-slate-100 my-8 max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#1e2f4a] shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-[#1e73be]/15 text-[#38bdf8] border border-[#1e73be]/30">
              <BellRing className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white font-brand">
                Central de Notificações Automáticas por E-mail
              </h3>
              <p className="text-xs text-slate-400">
                Disparos instantâneos a cada novo evento e ocorrência registrada
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-[#1a283f] transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto space-y-5 py-4 text-xs pr-1">
          {/* Status do Motor de Disparo */}
          <div
            className={`p-3.5 rounded-xl border flex items-start gap-3 ${
              engine === 'loading'
                ? 'bg-[#101726] border-[#1e2f4a]'
                : engineReady
                  ? 'bg-emerald-500/5 border-emerald-500/30'
                  : 'bg-amber-500/5 border-amber-500/30'
            }`}
          >
            <div
              className={`p-2 rounded-lg shrink-0 ${
                engineReady ? 'bg-emerald-500/15 text-emerald-400' : 'bg-amber-500/15 text-amber-400'
              }`}
            >
              {engine === 'loading' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Server className="w-4 h-4" />}
            </div>
            <div className="space-y-0.5 min-w-0">
              <span className="text-white font-semibold block">
                Motor de Disparo:{' '}
                {engine === 'loading'
                  ? 'verificando...'
                  : engineReady
                    ? `Ativo via ${(engine as EmailEngineStatus).provider.toUpperCase()}`
                    : engine === null
                      ? 'Endpoint indisponível'
                      : 'Não configurado'}
              </span>
              {engine !== 'loading' && engineReady && (
                <span className="text-slate-400 text-[11px] block truncate">
                  Servidor: <span className="font-mono text-slate-300">{(engine as EmailEngineStatus).host}</span>
                  {(engine as EmailEngineStatus).from && (
                    <>
                      {' '}• Remetente: <span className="font-mono text-slate-300">{(engine as EmailEngineStatus).from}</span>
                    </>
                  )}
                </span>
              )}
              {engine !== 'loading' && !engineReady && (
                <span className="text-amber-200/80 text-[11px] block leading-relaxed">
                  Configure as variáveis de ambiente de um provedor SMTP (Outlook/Microsoft 365, Zoho, Hostinger,
                  Locaweb, Brevo...) — <span className="font-mono">SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, EMAIL_FROM</span>{' '}
                  — ou do Resend (<span className="font-mono">RESEND_API_KEY</span>) no arquivo .env e na Vercel.
                </span>
              )}
            </div>
          </div>

          {/* E-mails Cadastrados */}
          <div className="p-4 bg-[#101726] rounded-xl border border-[#1e2f4a] space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <span className="text-white font-semibold block">Destinatários de Alerta SESMT</span>
                <span className="text-slate-400 text-[11px]">
                  Todos os e-mails abaixo recebem o resumo completo da ocorrência imediatamente após o envio.
                </span>
              </div>
              <button
                onClick={handleTestDispatch}
                disabled={sending || emails.length === 0}
                className="busato-gradient-btn flex items-center gap-1.5 px-3 py-1.5 text-white rounded-lg font-bold transition cursor-pointer text-[11px] shrink-0 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {sending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
                <span>{sending ? 'Enviando...' : 'Testar Disparo'}</span>
              </button>
            </div>

            {testResult && testResult.ok && (
              <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>
                  E-mail de teste enviado via {testResult.provider?.toUpperCase()} para{' '}
                  {testResult.recipients?.join(', ')}. Verifique a caixa de entrada (e o spam).
                </span>
              </div>
            )}

            {testResult && !testResult.ok && (
              <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2">
                <XCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span className="break-words">Falha no disparo: {testResult.error}</span>
              </div>
            )}

            <div className="flex flex-wrap gap-2 pt-1">
              {emails.map((email) => (
                <div
                  key={email}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-200"
                >
                  <Mail className="w-3.5 h-3.5 text-purple-400" />
                  <span className="font-mono text-[11px]">{email}</span>
                  {emails.length > 1 && (
                    <button
                      onClick={() => handleRemoveEmail(email)}
                      className="text-slate-400 hover:text-rose-400 transition"
                      title="Remover destinatário"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            <form onSubmit={handleAddEmail} className="flex gap-2 pt-2">
              <input
                type="email"
                placeholder="Adicionar novo e-mail (ex: supervisor@empresa.com)"
                value={newEmailInput}
                onChange={(e) => setNewEmailInput(e.target.value)}
                className="flex-1 px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-white text-xs focus:outline-hidden focus:border-purple-500"
              />
              <button
                type="submit"
                className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Adicionar</span>
              </button>
            </form>
          </div>

          {/* Histórico de Envios */}
          <div className="space-y-3">
            <span className="text-white font-semibold block">Registro de Alertas Disparados Recentemente</span>
            <div className="space-y-2">
              {notifications.length === 0 ? (
                <p className="text-slate-500 italic py-4 text-center">Nenhum envio registrado ainda.</p>
              ) : (
                notifications.slice(0, 10).map((n) => (
                  <div
                    key={n.id}
                    className="p-3 bg-slate-800/50 rounded-xl border border-slate-800 space-y-1 hover:border-slate-700 transition"
                  >
                    <div className="flex items-center justify-between text-[11px]">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-400 font-mono font-bold shrink-0">
                          {n.item ? `#${n.item}` : 'TESTE'}
                        </span>
                        <span className="font-medium text-slate-200 truncate">{n.subject}</span>
                      </div>
                      {n.status === 'Falha' ? (
                        <span className="text-rose-400 flex items-center gap-1 shrink-0">
                          <XCircle className="w-3 h-3" /> Falha
                        </span>
                      ) : (
                        <span className="text-emerald-400 flex items-center gap-1 shrink-0">
                          <CheckCircle2 className="w-3 h-3" /> Entregue
                        </span>
                      )}
                    </div>

                    <p className={`text-[11px] line-clamp-2 ${n.status === 'Falha' ? 'text-rose-300/80' : 'text-slate-400'}`}>
                      {n.previewText}
                    </p>

                    <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 gap-2">
                      <span className="truncate">Destinatários: {n.recipients?.join(', ') || '—'}</span>
                      <span className="shrink-0">{new Date(n.timestamp).toLocaleString('pt-BR')}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-slate-800 shrink-0 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg font-medium transition cursor-pointer text-xs"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
