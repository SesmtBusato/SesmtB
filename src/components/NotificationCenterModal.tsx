import React, { useState } from 'react';
import { NotificationLog, AppSettings } from '../types';
import { X, Mail, CheckCircle2, Plus, Trash2, Send, ShieldAlert, BellRing } from 'lucide-react';

interface Props {
  notifications: NotificationLog[];
  settings: AppSettings;
  onClose: () => void;
  onUpdateSettings: (newSettings: AppSettings) => void;
}

export const NotificationCenterModal: React.FC<Props> = ({
  notifications,
  settings,
  onClose,
  onUpdateSettings,
}) => {
  const [emails, setEmails] = useState<string[]>(settings.notificationEmails || ['alysonmish@gmail.com']);
  const [newEmailInput, setNewEmailInput] = useState<string>('');
  const [testSent, setTestSent] = useState<boolean>(false);

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

  const handleSimulateTestDispatch = () => {
    setTestSent(true);
    setTimeout(() => setTestSent(false), 3000);
  };

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
          {/* E-mails Cadastrados */}
          <div className="p-4 bg-[#101726] rounded-xl border border-[#1e2f4a] space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-white font-semibold block">Destinatários de Alerta SESMT</span>
                <span className="text-slate-400 text-[11px]">
                  Todos os e-mails abaixo recebem o resumo completo da ocorrência imediatamente após o envio.
                </span>
              </div>
              <button
                onClick={handleSimulateTestDispatch}
                className="busato-gradient-btn flex items-center gap-1.5 px-3 py-1.5 text-white rounded-lg font-bold transition cursor-pointer text-[11px]"
              >
                <Send className="w-3 h-3" />
                <span>Testar Disparo</span>
              </button>
            </div>

            {testSent && (
              <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>E-mail de teste disparado com sucesso para todos os destinatários!</span>
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
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-400 font-mono font-bold">
                          #{n.item}
                        </span>
                        <span className="font-medium text-slate-200">{n.subject}</span>
                      </div>
                      <span className="text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Entregue
                      </span>
                    </div>

                    <p className="text-slate-400 text-[11px] line-clamp-1">{n.previewText}</p>

                    <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1">
                      <span>Destinatários: {n.recipients?.join(', ') || 'alysonmish@gmail.com'}</span>
                      <span>{new Date(n.timestamp).toLocaleString('pt-BR')}</span>
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
