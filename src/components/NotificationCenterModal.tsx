import React, { useEffect, useState } from 'react';
import { NotificationLog, AppSettings } from '../types';
import {
  X,
  Mail,
  CheckCircle2,
  Plus,
  Trash2,
  Send,
  ShieldAlert,
  BellRing,
  Loader2,
  XCircle,
  Server,
  Settings,
  Eye,
  EyeOff,
  Save,
  Check,
  ChevronDown,
  ChevronUp,
  Sparkles
} from 'lucide-react';
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

  // Estado do painel de configuração de envio
  const [showConfig, setShowConfig] = useState<boolean>(false);
  const [providerType, setProviderType] = useState<'office365' | 'gmail' | 'resend' | 'custom'>(() => {
    if (settings.resendApiKey) return 'resend';
    if (settings.smtpHost?.includes('office365') || settings.smtpHost?.includes('outlook')) return 'office365';
    if (settings.smtpHost?.includes('gmail')) return 'gmail';
    return 'custom';
  });
  const [smtpHost, setSmtpHost] = useState(settings.smtpHost || '');
  const [smtpPort, setSmtpPort] = useState<number>(settings.smtpPort || 587);
  const [smtpSecure, setSmtpSecure] = useState<boolean>(settings.smtpSecure || false);
  const [smtpUser, setSmtpUser] = useState(settings.smtpUser || '');
  const [smtpPass, setSmtpPass] = useState(settings.smtpPass || '');
  const [emailFrom, setEmailFrom] = useState(settings.emailFrom || 'SESMT Busato <alertas@busato.com.br>');
  const [resendApiKey, setResendApiKey] = useState(settings.resendApiKey || '');
  const [showPassword, setShowPassword] = useState(false);
  const [savingConfig, setSavingConfig] = useState(false);
  const [configSavedSuccess, setConfigSavedSuccess] = useState(false);

  useEffect(() => {
    api.getEmailStatus(settings).then(setEngine);
  }, [settings]);

  const applyPreset = (preset: 'office365' | 'gmail' | 'resend' | 'custom') => {
    setProviderType(preset);
    if (preset === 'office365') {
      setSmtpHost('smtp.office365.com');
      setSmtpPort(587);
      setSmtpSecure(false);
      if (!emailFrom || emailFrom.includes('resend')) {
        setEmailFrom('SESMT Busato <alyson.oliveira@busatoloc.com.br>');
      }
    } else if (preset === 'gmail') {
      setSmtpHost('smtp.gmail.com');
      setSmtpPort(465);
      setSmtpSecure(true);
    } else if (preset === 'resend') {
      if (!emailFrom || emailFrom.includes('busato')) {
        setEmailFrom('SESMT Busato <onboarding@resend.dev>');
      }
    }
  };

  const handleSaveEmailConfig = async () => {
    setSavingConfig(true);
    const updatedSettings: AppSettings = {
      ...settings,
      emailProvider: providerType === 'resend' ? 'resend' : 'smtp',
      smtpHost: providerType === 'resend' ? '' : smtpHost.trim(),
      smtpPort: Number(smtpPort) || 587,
      smtpSecure: smtpSecure,
      smtpUser: smtpUser.trim(),
      smtpPass: smtpPass.trim(),
      emailFrom: emailFrom.trim(),
      resendApiKey: resendApiKey.trim(),
    };

    await api.saveSettings(updatedSettings);
    onUpdateSettings(updatedSettings);

    const newStatus = await api.getEmailStatus(updatedSettings);
    setEngine(newStatus);

    setSavingConfig(false);
    setConfigSavedSuccess(true);
    setTimeout(() => setConfigSavedSuccess(false), 3000);
  };

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

    // Passa as credenciais atuais na chamada para testar imediatamente
    const currentSmtpConfig = {
      provider: providerType === 'resend' ? ('resend' as const) : ('smtp' as const),
      host: smtpHost.trim(),
      port: Number(smtpPort) || 587,
      secure: smtpSecure,
      user: smtpUser.trim(),
      pass: smtpPass.trim(),
      from: emailFrom.trim(),
      resendApiKey: resendApiKey.trim(),
    };

    const result = await api.sendTestEmail(emails, currentSmtpConfig);
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
          {/* Status do Motor de Disparo + Botão de Configuração */}
          <div
            className={`p-4 rounded-xl border space-y-3 ${
              engine === 'loading'
                ? 'bg-[#101726] border-[#1e2f4a]'
                : engineReady
                  ? 'bg-emerald-500/5 border-emerald-500/30'
                  : 'bg-amber-500/5 border-amber-500/30'
            }`}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-start gap-3 min-w-0">
                <div
                  className={`p-2 rounded-lg shrink-0 ${
                    engineReady ? 'bg-emerald-500/15 text-emerald-400' : 'bg-amber-500/15 text-amber-400'
                  }`}
                >
                  {engine === 'loading' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Server className="w-4 h-4" />}
                </div>
                <div className="space-y-0.5 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-white font-semibold block">
                      Motor de Disparo:{' '}
                      {engine === 'loading'
                        ? 'verificando...'
                        : engineReady
                          ? `Ativo via ${(engine as EmailEngineStatus).provider.toUpperCase()}`
                          : 'Pendente de Configuração'}
                    </span>
                    {engineReady && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-medium">
                        <Check className="w-3 h-3" /> Conectado
                      </span>
                    )}
                  </div>

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
                    <span className="text-amber-200/90 text-[11px] block leading-relaxed">
                      Configure os dados do seu e-mail corporativo (Microsoft 365 / Outlook, Gmail, Resend ou outro SMTP) abaixo para liberar os disparos.
                    </span>
                  )}
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowConfig(!showConfig)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer shrink-0 border ${
                  showConfig
                    ? 'bg-[#1e73be] text-white border-[#38bdf8]/40 shadow-xs'
                    : 'bg-[#152338] text-slate-200 hover:text-white border-[#273f63] hover:bg-[#1d314e]'
                }`}
              >
                <Settings className="w-3.5 h-3.5" />
                <span>{showConfig ? 'Ocultar Configuração' : 'Configurar E-mail / SMTP'}</span>
                {showConfig ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>
            </div>

            {/* Painel Expansível de Configuração do Servidor */}
            {showConfig && (
              <div className="pt-3 border-t border-[#1e2f4a] space-y-4">
                {/* Presets Rápidos */}
                <div>
                  <span className="text-[11px] text-slate-400 font-medium block mb-1.5 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-amber-400" />
                    Escolha o tipo de servidor ou provedor:
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-xs">
                    <button
                      type="button"
                      onClick={() => applyPreset('office365')}
                      className={`p-2 rounded-lg border text-left transition cursor-pointer ${
                        providerType === 'office365'
                          ? 'bg-[#1e73be]/20 border-[#38bdf8] text-white'
                          : 'bg-[#101726] border-[#1e2f4a] text-slate-300 hover:bg-[#142036]'
                      }`}
                    >
                      <strong className="block text-[11px]">🏢 Microsoft 365</strong>
                      <span className="text-[10px] text-slate-400 block truncate">Outlook Corporativo</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => applyPreset('gmail')}
                      className={`p-2 rounded-lg border text-left transition cursor-pointer ${
                        providerType === 'gmail'
                          ? 'bg-[#1e73be]/20 border-[#38bdf8] text-white'
                          : 'bg-[#101726] border-[#1e2f4a] text-slate-300 hover:bg-[#142036]'
                      }`}
                    >
                      <strong className="block text-[11px]">📧 Gmail</strong>
                      <span className="text-[10px] text-slate-400 block truncate">Senha de App</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => applyPreset('resend')}
                      className={`p-2 rounded-lg border text-left transition cursor-pointer ${
                        providerType === 'resend'
                          ? 'bg-[#1e73be]/20 border-[#38bdf8] text-white'
                          : 'bg-[#101726] border-[#1e2f4a] text-slate-300 hover:bg-[#142036]'
                      }`}
                    >
                      <strong className="block text-[11px]">⚡ Resend</strong>
                      <span className="text-[10px] text-slate-400 block truncate">API Key (Nuvem)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => applyPreset('custom')}
                      className={`p-2 rounded-lg border text-left transition cursor-pointer ${
                        providerType === 'custom'
                          ? 'bg-[#1e73be]/20 border-[#38bdf8] text-white'
                          : 'bg-[#101726] border-[#1e2f4a] text-slate-300 hover:bg-[#142036]'
                      }`}
                    >
                      <strong className="block text-[11px]">🌐 Outro SMTP</strong>
                      <span className="text-[10px] text-slate-400 block truncate">Zoho, Hostinger...</span>
                    </button>
                  </div>
                </div>

                {/* Formulário de Campos */}
                {providerType === 'resend' ? (
                  <div className="space-y-3 p-3 bg-[#0d1422] rounded-xl border border-[#1e2f4a]">
                    <div>
                      <label className="block text-[11px] text-slate-300 font-medium mb-1">
                        Chave de API do Resend (API Key):
                      </label>
                      <input
                        type="password"
                        placeholder="re_1234567890abcdef..."
                        value={resendApiKey}
                        onChange={(e) => setResendApiKey(e.target.value)}
                        className="w-full px-3 py-1.5 bg-[#101726] border border-[#1e2f4a] rounded-lg text-white font-mono text-xs focus:outline-hidden focus:border-[#38bdf8]"
                      />
                      <span className="text-[10px] text-slate-400 block mt-1">
                        Obtenha sua chave gratuita em <a href="https://resend.com" target="_blank" rel="noreferrer" className="text-sky-400 underline">resend.com</a>.
                      </span>
                    </div>

                    <div>
                      <label className="block text-[11px] text-slate-300 font-medium mb-1">
                        Remetente Exibido (From):
                      </label>
                      <input
                        type="text"
                        placeholder="SESMT Busato <onboarding@resend.dev>"
                        value={emailFrom}
                        onChange={(e) => setEmailFrom(e.target.value)}
                        className="w-full px-3 py-1.5 bg-[#101726] border border-[#1e2f4a] rounded-lg text-white text-xs focus:outline-hidden focus:border-[#38bdf8]"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3 p-3 bg-[#0d1422] rounded-xl border border-[#1e2f4a]">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      <div className="sm:col-span-2">
                        <label className="block text-[11px] text-slate-300 font-medium mb-1">
                          Servidor SMTP (Host):
                        </label>
                        <input
                          type="text"
                          placeholder="ex: smtp.office365.com ou smtp.gmail.com"
                          value={smtpHost}
                          onChange={(e) => setSmtpHost(e.target.value)}
                          className="w-full px-3 py-1.5 bg-[#101726] border border-[#1e2f4a] rounded-lg text-white font-mono text-xs focus:outline-hidden focus:border-[#38bdf8]"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] text-slate-300 font-medium mb-1">
                          Porta:
                        </label>
                        <input
                          type="number"
                          placeholder="587 ou 465"
                          value={smtpPort}
                          onChange={(e) => setSmtpPort(Number(e.target.value))}
                          className="w-full px-3 py-1.5 bg-[#101726] border border-[#1e2f4a] rounded-lg text-white font-mono text-xs focus:outline-hidden focus:border-[#38bdf8]"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <div>
                        <label className="block text-[11px] text-slate-300 font-medium mb-1">
                          E-mail / Usuário SMTP:
                        </label>
                        <input
                          type="email"
                          placeholder="seu.email@busatoloc.com.br"
                          value={smtpUser}
                          onChange={(e) => setSmtpUser(e.target.value)}
                          className="w-full px-3 py-1.5 bg-[#101726] border border-[#1e2f4a] rounded-lg text-white text-xs focus:outline-hidden focus:border-[#38bdf8]"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] text-slate-300 font-medium mb-1">
                          Senha / Senha de Aplicativo:
                        </label>
                        <div className="relative">
                          <input
                            type={showPassword ? 'text' : 'password'}
                            placeholder="Sua senha ou senha de app"
                            value={smtpPass}
                            onChange={(e) => setSmtpPass(e.target.value)}
                            className="w-full px-3 py-1.5 pr-8 bg-[#101726] border border-[#1e2f4a] rounded-lg text-white text-xs focus:outline-hidden focus:border-[#38bdf8]"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                            title={showPassword ? 'Ocultar senha' : 'Ver senha'}
                          >
                            {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] text-slate-300 font-medium mb-1">
                        Nome e E-mail de Exibição (Remetente):
                      </label>
                      <input
                        type="text"
                        placeholder="SESMT Busato <alyson.oliveira@busatoloc.com.br>"
                        value={emailFrom}
                        onChange={(e) => setEmailFrom(e.target.value)}
                        className="w-full px-3 py-1.5 bg-[#101726] border border-[#1e2f4a] rounded-lg text-white text-xs focus:outline-hidden focus:border-[#38bdf8]"
                      />
                      <span className="text-[10px] text-slate-400 block mt-1">
                        Dica: contas do Microsoft 365 e Google exigem que o remetente seja o mesmo do usuário autenticado.
                      </span>
                    </div>
                  </div>
                )}

                {/* Botão de Salvar e Feedback */}
                <div className="flex items-center justify-between pt-1">
                  {configSavedSuccess ? (
                    <span className="text-emerald-400 text-xs font-semibold flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4" /> Configurações de e-mail salvas com sucesso!
                    </span>
                  ) : (
                    <span className="text-slate-400 text-[11px]">
                      Clique em salvar para aplicar os dados ao motor de envio.
                    </span>
                  )}

                  <button
                    type="button"
                    onClick={handleSaveEmailConfig}
                    disabled={savingConfig}
                    className="busato-gradient-btn flex items-center gap-1.5 px-4 py-2 text-white rounded-lg font-bold text-xs cursor-pointer disabled:opacity-60"
                  >
                    {savingConfig ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                    <span>{savingConfig ? 'Salvando...' : 'Salvar Configuração'}</span>
                  </button>
                </div>
              </div>
            )}
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
              <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex flex-col gap-2">
                <div className="flex items-start gap-2">
                  <XCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
                  <span className="break-words font-medium">{testResult.error}</span>
                </div>

                {(testResult.error?.includes('timeout') || testResult.error?.includes('Timeout') || testResult.error?.includes('conectar')) && (
                  <div className="p-2.5 rounded-lg bg-[#0e1626] border border-amber-500/40 text-amber-200 text-[11px] space-y-1.5">
                    <strong className="block text-amber-300">💡 Como resolver o Connection timeout na Vercel:</strong>
                    <p className="leading-relaxed">
                      Provedores de nuvem como a Vercel executam funções em servidores com restrições de saída para portas SMTP (587/465) tradicionais.
                    </p>
                    <div className="pt-0.5 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setShowConfig(true);
                          setSmtpPort(465);
                          setSmtpSecure(true);
                        }}
                        className="px-2.5 py-1 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 rounded-md text-[10px] text-amber-200 font-semibold cursor-pointer"
                      >
                        Testar Porta 465 (SSL)
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setShowConfig(true);
                          applyPreset('resend');
                        }}
                        className="px-2.5 py-1 bg-sky-500/20 hover:bg-sky-500/30 border border-sky-500/40 rounded-md text-[10px] text-sky-200 font-semibold cursor-pointer"
                      >
                        Usar Resend (API HTTP - Sem Bloqueio)
                      </button>
                    </div>
                  </div>
                )}
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
