import React, { useState } from 'react';
import { EventRecord, AreaType, SeverityType, AppSettings } from '../types';
import { api } from '../services/api';
import { ShieldCheck, Send, CheckCircle2, ArrowLeft, Copy, Check } from 'lucide-react';

interface Props {
  onBackToDashboard: () => void;
  nextItemNumber: number;
  settings?: AppSettings;
  isExternal?: boolean;
}

export const PublicFormView: React.FC<Props> = ({ onBackToDashboard, nextItemNumber, settings, isExternal }) => {
  const commonAreas = Array.isArray(settings?.areas) ? settings.areas : [];
  const commonSupervisors = Array.isArray(settings?.supervisors) ? settings.supervisors : [];
  const commonEquipments = Array.isArray(settings?.equipments) ? settings.equipments : [];
  const commonShifts = Array.isArray(settings?.shifts) ? settings.shifts : [];

  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10);
  const nowTime = today.toTimeString().slice(0, 5);

  const [dateInput, setDateInput] = useState<string>(todayStr);
  const [horario, setHorario] = useState<string>(nowTime);
  const [area, setArea] = useState<string>(commonAreas[0] || '');
  const [local, setLocal] = useState<string>('');
  const [equipamento, setEquipamento] = useState<string>(commonEquipments[0] || '');
  const [placaTag, setPlacaTag] = useState<string>('');
  const [envolvido, setEnvolvido] = useState<string>('');
  const [letraTurno, setLetraTurno] = useState<string>(commonShifts[0] || '');
  const [estavaDeExtra, setEstavaDeExtra] = useState<'Sim' | 'Não'>('Não');
  const [encarregado, setEncarregado] = useState<string>(commonSupervisors[0] || '');
  const [tipoOcorrencia, setTipoOcorrencia] = useState<string>('Dano Material / Manobra');
  const [classificacaoReal, setClassificacaoReal] = useState<SeverityType>('Leve');
  const [descricao, setDescricao] = useState<string>('');
  const [descricaoDano, setDescricaoDano] = useState<string>('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedEvent, setSubmittedEvent] = useState<EventRecord | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  const handleCopyLink = () => {
    const url = window.location.origin + window.location.pathname + '?form=public';
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!descricao.trim()) return;

    setIsSubmitting(true);
    const [year, month, day] = dateInput.split('-');
    const formattedDate = `${day}/${month}/${year}`;
    const diaSemana = new Intl.DateTimeFormat('pt-BR', { weekday: 'long' }).format(new Date(dateInput + 'T12:00:00'));

    const payload: Partial<EventRecord> = {
      item: nextItemNumber,
      data: formattedDate,
      horario,
      diaSemana,
      area,
      local: local.trim() || 'Área Operacional',
      equipamento,
      placaTag: placaTag.trim().toUpperCase(),
      envolvido: envolvido.trim(),
      letraTurno,
      estavaDeExtra,
      encarregado,
      tipoOcorrencia,
      classificacaoReal,
      classificacaoPotencial: 'Moderado',
      status: 'Pendente',
      descricao: descricao.trim(),
      descricaoDano: descricaoDano.trim()
    };

    try {
      const created = await api.createEvent(payload);
      setSubmittedEvent(created);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0b111c] text-slate-100 flex flex-col justify-between p-4 sm:p-8 font-sans">
      <div className="max-w-2xl w-full mx-auto">
        {/* Top bar */}
        <div className={`flex items-center ${isExternal ? 'justify-end' : 'justify-between'} mb-6`}>
          {!isExternal && (
            <button
              onClick={onBackToDashboard}
              className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Voltar ao Sistema BUSATO</span>
            </button>
          )}

          <button
            onClick={handleCopyLink}
            className="flex items-center gap-1.5 text-xs bg-[#131d2e] hover:bg-[#1a273d] text-slate-200 px-3 py-1.5 rounded-lg border border-[#20334f] transition cursor-pointer"
          >
            {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedLink ? 'Link Copiado!' : 'Copiar Link deste Formulário'}</span>
          </button>
        </div>

        {submittedEvent ? (
          <div className="busato-card border-[#1e2f4a] rounded-2xl p-8 text-center space-y-6 shadow-2xl">
            <div className="w-16 h-16 bg-emerald-500/15 text-emerald-400 rounded-full flex items-center justify-center mx-auto border border-emerald-500/30">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white font-brand">
                Ocorrência #{submittedEvent.item} Registrada!
              </h2>
              <p className="text-sm text-slate-300 mt-2">
                O evento foi transmitido em tempo real para a equipe de segurança e liderança operacional BUSATO.
              </p>
              <div className="mt-4 p-4 rounded-xl bg-[#101726] border border-[#1e2f4a] text-xs text-slate-300 text-left space-y-1">
                <div><strong>Área:</strong> {submittedEvent.area} ({submittedEvent.local})</div>
                <div><strong>Envolvido:</strong> {submittedEvent.envolvido}</div>
                <div><strong>Encarregado:</strong> {submittedEvent.encarregado}</div>
                <div><strong>Notificação enviada:</strong> Sim (alysonmish@gmail.com)</div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row justify-center gap-3 pt-2">
              <button
                onClick={() => setSubmittedEvent(null)}
                className="busato-gradient-btn px-5 py-2.5 text-white rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Preencher Outro Registro
              </button>
              {!isExternal && (
                <button
                  onClick={onBackToDashboard}
                  className="px-5 py-2.5 bg-[#131d2e] hover:bg-[#1a273d] text-slate-200 border border-[#20334f] rounded-xl text-xs font-semibold transition cursor-pointer"
                >
                  Acessar Painel de Controle
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="busato-card border-[#1e2f4a] rounded-2xl p-6 sm:p-8 shadow-2xl">
            {/* Header */}
            <div className="border-b border-[#1e2f4a] pb-5 mb-6">
              <div className="flex items-center gap-3 mb-3">
                <img src="/logo-icon.png" alt="Busato" className="w-7 h-7 object-contain drop-shadow-[0_2px_6px_rgba(30,115,190,0.5)]" />
                <span className="font-brand font-black text-white text-lg tracking-wider">BUSATO</span>
              </div>
              <div className="flex items-center gap-2 text-[#38bdf8] text-xs font-bold uppercase tracking-wider mb-1">
                <span className="w-2 h-2 rounded-full bg-[#38bdf8] animate-pulse"></span>
                Formulário de Comunicação Rápida de Campo
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-white font-brand">
                Registro de Ocorrência & Evento Operacional
              </h1>
              <p className="text-xs text-slate-400 mt-1">
                Preenchimento direto para motoristas, operadores e encarregados em campo.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-medium text-slate-300 mb-1">Data do Fato *</label>
                  <input
                    type="date"
                    required
                    value={dateInput}
                    onChange={(e) => setDateInput(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-300 mb-1">Horário Aproximado *</label>
                  <input
                    type="time"
                    required
                    value={horario}
                    onChange={(e) => setHorario(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-medium text-slate-300 mb-1">Área Principal *</label>
                  {commonAreas.length > 0 ? (
                    <select
                      value={area}
                      onChange={(e) => setArea(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
                    >
                      <option value="">Selecione a área...</option>
                      {commonAreas.map((a) => (
                        <option key={a} value={a}>{a}</option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      required
                      placeholder="Digite a área (ex: USINA, PORTO...)"
                      value={area}
                      onChange={(e) => setArea(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
                    />
                  )}
                </div>
                <div>
                  <label className="block font-medium text-slate-300 mb-1">Local Exato *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Bica 4, Lavador de Pneus, Pátio B..."
                    value={local}
                    onChange={(e) => setLocal(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-medium text-slate-300 mb-1">Nome do Envolvido / Motorista *</label>
                  <input
                    type="text"
                    required
                    placeholder="Nome completo do colaborador"
                    value={envolvido}
                    onChange={(e) => setEnvolvido(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-300 mb-1">Encarregado da Frente *</label>
                  {commonSupervisors.length > 0 ? (
                    <select
                      value={encarregado}
                      onChange={(e) => setEncarregado(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
                    >
                      <option value="">Selecione o encarregado...</option>
                      {commonSupervisors.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      placeholder="Digite o nome do encarregado..."
                      value={encarregado}
                      onChange={(e) => setEncarregado(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
                    />
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block font-medium text-slate-300 mb-1">Equipamento</label>
                  {commonEquipments.length > 0 ? (
                    <select
                      value={equipamento}
                      onChange={(e) => setEquipamento(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
                    >
                      <option value="">Selecione o equipamento...</option>
                      {commonEquipments.map((eq) => (
                        <option key={eq} value={eq}>{eq}</option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      placeholder="Digite o equipamento..."
                      value={equipamento}
                      onChange={(e) => setEquipamento(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
                    />
                  )}
                </div>
                <div>
                  <label className="block font-medium text-slate-300 mb-1">Placa ou TAG</label>
                  <input
                    type="text"
                    placeholder="Ex: SFX7E23"
                    value={placaTag}
                    onChange={(e) => setPlacaTag(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white font-mono uppercase"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-300 mb-1">Turno</label>
                  {commonShifts.length > 0 ? (
                    <select
                      value={letraTurno}
                      onChange={(e) => setLetraTurno(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
                    >
                      <option value="">Selecione o turno...</option>
                      {commonShifts.map((sh) => (
                        <option key={sh} value={sh}>{sh}</option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      placeholder="Digite o turno..."
                      value={letraTurno}
                      onChange={(e) => setLetraTurno(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
                    />
                  )}
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-300 mb-1">
                  Relato do Ocorrido (O que aconteceu?) *
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="Explique com detalhes como ocorreu o evento, obstáculos, condições da pista, manobra realizada..."
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-300 mb-1">
                  Avarias ou Danos Constatados
                </label>
                <input
                  type="text"
                  placeholder="Ex: Pneu cortado, para-choque amassado, mangote rompido..."
                  value={descricaoDano}
                  onChange={(e) => setDescricaoDano(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
                />
              </div>

              <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-2 text-[11px] text-slate-400">
                  <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Notificação automática por e-mail para a equipe de segurança</span>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full sm:w-auto px-6 py-2.5 busato-gradient-btn text-white rounded-xl font-bold transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 shadow-md shadow-blue-500/25"
                >
                  <Send className="w-4 h-4" />
                  <span>{isSubmitting ? 'Enviando...' : 'Enviar Registro de Ocorrência'}</span>
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
