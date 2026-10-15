import React, { useState } from 'react';
import { EventRecord, AreaType, SeverityType, StatusType, AppSettings } from '../types';
import { api } from '../services/api';
import { X, Send, AlertTriangle, ShieldCheck, CheckCircle2 } from 'lucide-react';

interface Props {
  onClose: () => void;
  onSuccess: (newEvent: EventRecord) => void;
  nextItemNumber: number;
  settings?: AppSettings;
}

export const EventFormModal: React.FC<Props> = ({ onClose, onSuccess, nextItemNumber, settings }) => {
  const commonAreas = Array.isArray(settings?.areas) ? settings.areas : [];
  const commonSupervisors = Array.isArray(settings?.supervisors) ? settings.supervisors : [];
  const commonEquipments = Array.isArray(settings?.equipments) ? settings.equipments : [];
  const commonShifts = Array.isArray(settings?.shifts) ? settings.shifts : [];

  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10);
  const nowTime = today.toTimeString().slice(0, 5);

  const getDayOfWeekName = (dateStr: string) => {
    try {
      const d = new Date(dateStr + 'T12:00:00');
      return new Intl.DateTimeFormat('pt-BR', { weekday: 'long' }).format(d);
    } catch {
      return '';
    }
  };

  const [customItemNumber, setCustomItemNumber] = useState<number>(nextItemNumber);

  // Sincroniza se nextItemNumber for recalculado
  React.useEffect(() => {
    setCustomItemNumber(nextItemNumber);
  }, [nextItemNumber]);

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
  const [reincidente, setReincidente] = useState<'Sim' | 'Não'>('Não');
  const [quandoOcorreu, setQuandoOcorreu] = useState<string>('Durante atividade');
  const [classificacaoReal, setClassificacaoReal] = useState<SeverityType>('Leve');
  const [classificacaoPotencial, setClassificacaoPotencial] = useState<SeverityType>('Moderado');
  const [status, setStatus] = useState<StatusType>('Pendente');
  const [descricao, setDescricao] = useState<string>('');
  const [descricaoDano, setDescricaoDano] = useState<string>('');
  const [prazoAnalise, setPrazoAnalise] = useState<string>('');
  const [observacao, setObservacao] = useState<string>('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionSuccess, setSubmissionSuccess] = useState<EventRecord | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!descricao.trim()) return;

    setIsSubmitting(true);

    const [year, month, day] = dateInput.split('-');
    const formattedDate = `${day}/${month}/${year}`;
    const diaSemana = getDayOfWeekName(dateInput);

    const payload: Partial<EventRecord> = {
      item: Number(customItemNumber) || nextItemNumber,
      data: formattedDate,
      horario,
      diaSemana,
      area,
      local: local.trim() || 'Área Operacional',
      equipamento,
      placaTag: placaTag.trim().toUpperCase(),
      envolvido: envolvido.trim() || 'Colaborador Operacional',
      letraTurno,
      estavaDeExtra,
      encarregado,
      tipoOcorrencia,
      reincidente,
      quandoOcorreu,
      classificacaoReal,
      classificacaoPotencial,
      status,
      descricao: descricao.trim(),
      descricaoDano: descricaoDano.trim(),
      prazoAnalise: prazoAnalise || '',
      observacao: observacao.trim()
    };

    try {
      const created = await api.createEvent(payload);
      setSubmissionSuccess(created);
      onSuccess(created);
    } catch (err) {
      console.error('Error creating event:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-2xl busato-card border-[#1e2f4a] rounded-2xl shadow-2xl p-6 text-slate-100 my-8">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#1e2f4a]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-[#1e73be]/15 text-[#38bdf8] border border-[#1e73be]/30">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white font-brand">
                Registro de Nova Ocorrência / Evento
              </h3>
              <div className="flex items-center gap-2 mt-1 text-xs text-slate-400">
                <span>Nº do Item:</span>
                <div className="flex items-center gap-1.5 bg-[#101726] px-2 py-0.5 rounded-lg border border-[#1e2f4a]">
                  <span className="text-[#38bdf8] font-bold font-mono">#</span>
                  <input
                    type="number"
                    value={customItemNumber}
                    onChange={(e) => setCustomItemNumber(parseInt(e.target.value) || 0)}
                    className="w-20 bg-transparent text-[#38bdf8] font-bold font-mono text-xs focus:outline-hidden"
                    title="Clique para editar manualmente o número do item"
                  />
                </div>
                {customItemNumber !== 1 && (
                  <button
                    type="button"
                    onClick={() => setCustomItemNumber(1)}
                    className="px-2 py-0.5 rounded-md bg-[#131d2e] hover:bg-[#1a273d] text-[10px] text-sky-300 border border-[#20334f] transition cursor-pointer font-medium"
                    title="Definir número do item para #1"
                  >
                    Zerar (#1)
                  </button>
                )}
                {customItemNumber !== nextItemNumber && (
                  <button
                    type="button"
                    onClick={() => setCustomItemNumber(nextItemNumber)}
                    className="text-[10px] text-amber-400 hover:text-amber-300 underline cursor-pointer"
                    title="Restaurar para a sequência automática calculada"
                  >
                    (Sugerido: #{nextItemNumber})
                  </button>
                )}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-[#1a283f] transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {submissionSuccess ? (
          <div className="py-8 text-center space-y-4">
            <div className="w-12 h-12 mx-auto rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-lg font-semibold text-white">
                Ocorrência #{submissionSuccess.item} Registrada com Sucesso!
              </h4>
              <p className="text-sm text-slate-300 mt-1 max-w-md mx-auto">
                Notificação automática disparada por e-mail para a equipe do SESMT (alysonmish@gmail.com).
              </p>
            </div>
            <div className="pt-2 flex justify-center gap-3">
              <button
                onClick={onClose}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-medium transition cursor-pointer"
              >
                Concluir e Voltar ao Painel
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 mt-4 text-xs">
            {/* Info Grid 1: Data, Hora, Área, Local */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div>
                <label className="block font-medium text-slate-300 mb-1">Data</label>
                <input
                  type="date"
                  value={dateInput}
                  onChange={(e) => setDateInput(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-hidden focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-300 mb-1">Horário</label>
                <input
                  type="time"
                  value={horario}
                  onChange={(e) => setHorario(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-hidden focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-300 mb-1">Área</label>
                {commonAreas.length > 0 ? (
                  <select
                    value={area}
                    onChange={(e) => setArea(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-hidden focus:border-orange-500"
                  >
                    <option value="">Selecione a área...</option>
                    {commonAreas.map((a) => (
                      <option key={a} value={a}>{a}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    placeholder="Digite a área..."
                    value={area}
                    onChange={(e) => setArea(e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-hidden focus:border-orange-500"
                  />
                )}
              </div>

              <div>
                <label className="block font-medium text-slate-300 mb-1">Local Específico</label>
                <input
                  type="text"
                  placeholder="Ex: Pátio B, Bica 4..."
                  value={local}
                  onChange={(e) => setLocal(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-hidden focus:border-orange-500"
                />
              </div>
            </div>

            {/* Info Grid 2: Equipamento, Placa/Tag, Encarregado, Envolvido */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div>
                <label className="block font-medium text-slate-300 mb-1">Equipamento</label>
                {commonEquipments.length > 0 ? (
                  <select
                    value={equipamento}
                    onChange={(e) => setEquipamento(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-hidden focus:border-orange-500"
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
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-hidden focus:border-orange-500"
                  />
                )}
              </div>

              <div>
                <label className="block font-medium text-slate-300 mb-1">Placa / TAG</label>
                <input
                  type="text"
                  placeholder="Ex: SFX7E23"
                  value={placaTag}
                  onChange={(e) => setPlacaTag(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-hidden focus:border-orange-500 font-mono"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-300 mb-1">Nome do Envolvido</label>
                <input
                  type="text"
                  placeholder="Nome do operador"
                  value={envolvido}
                  onChange={(e) => setEnvolvido(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-hidden focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-300 mb-1">Encarregado / Responsável</label>
                {commonSupervisors.length > 0 ? (
                  <select
                    value={encarregado}
                    onChange={(e) => setEncarregado(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-hidden focus:border-orange-500"
                  >
                    <option value="">Selecione o encarregado...</option>
                    {commonSupervisors.map((sup) => (
                      <option key={sup} value={sup}>{sup}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    placeholder="Digite o nome do encarregado..."
                    value={encarregado}
                    onChange={(e) => setEncarregado(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-hidden focus:border-orange-500"
                  />
                )}
              </div>
            </div>

            {/* Info Grid 3: Turno, Extra, Tipo Ocorrência, Quando */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div>
                <label className="block font-medium text-slate-300 mb-1">Turno / Letra</label>
                {commonShifts.length > 0 ? (
                  <select
                    value={letraTurno}
                    onChange={(e) => setLetraTurno(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-hidden focus:border-orange-500"
                  >
                    <option value="">Selecione o turno...</option>
                    {commonShifts.map((sh) => (
                      <option key={sh} value={sh}>{sh}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    placeholder="Digite o turno (ex: Turno A, ADM...)"
                    value={letraTurno}
                    onChange={(e) => setLetraTurno(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-hidden focus:border-orange-500"
                  />
                )}
              </div>

              <div>
                <label className="block font-medium text-slate-300 mb-1">Estava de Extra?</label>
                <select
                  value={estavaDeExtra}
                  onChange={(e) => setEstavaDeExtra(e.target.value as 'Sim' | 'Não')}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-hidden focus:border-orange-500"
                >
                  <option value="Não">Não</option>
                  <option value="Sim">Sim</option>
                </select>
              </div>

              <div>
                <label className="block font-medium text-slate-300 mb-1">Reincidente?</label>
                <select
                  value={reincidente}
                  onChange={(e) => setReincidente(e.target.value as 'Sim' | 'Não')}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-hidden focus:border-orange-500"
                >
                  <option value="Não">Não</option>
                  <option value="Sim">Sim</option>
                </select>
              </div>

              <div>
                <label className="block font-medium text-slate-300 mb-1">Status Inicial</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as StatusType)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-hidden focus:border-orange-500"
                >
                  <option value="Pendente">Pendente</option>
                  <option value="Em Análise">Em Análise</option>
                  <option value="Em Investigação">Em Investigação</option>
                  <option value="Ação Corretiva">Ação Corretiva</option>
                  <option value="Concluído">Concluído</option>
                </select>
              </div>
            </div>

            {/* Grid 4: Gravidade Real vs Potencial */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-medium text-slate-300 mb-1">Classificação Real</label>
                <select
                  value={classificacaoReal}
                  onChange={(e) => setClassificacaoReal(e.target.value as SeverityType)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-hidden focus:border-orange-500"
                >
                  <option value="Leve">Leve (Sem interrupção / danos mínimos)</option>
                  <option value="Moderado">Moderado (Dano material ou parada temporária)</option>
                  <option value="Grave">Grave (Avaria expressiva ou lesão/afastamento)</option>
                  <option value="Crítico">Crítico (Dano ambiental / alto potencial de fatalidade)</option>
                </select>
              </div>

              <div>
                <label className="block font-medium text-slate-300 mb-1">Classificação Potencial</label>
                <select
                  value={classificacaoPotencial}
                  onChange={(e) => setClassificacaoPotencial(e.target.value as SeverityType)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-hidden focus:border-orange-500"
                >
                  <option value="Leve">Leve</option>
                  <option value="Moderado">Moderado</option>
                  <option value="Grave">Grave</option>
                  <option value="Crítico">Crítico</option>
                </select>
              </div>
            </div>

            {/* Descrição */}
            <div>
              <label className="block font-medium text-slate-300 mb-1">
                Descrição Detalhada do Evento *
              </label>
              <textarea
                rows={3}
                required
                placeholder="Descreva exatamente o que ocorreu, dinâmica dos fatos, manobra, interferências..."
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-hidden focus:border-orange-500"
              />
            </div>

            {/* Descrição do Dano */}
            <div>
              <label className="block font-medium text-slate-300 mb-1">
                Descrição dos Danos Materiais / Físicos
              </label>
              <input
                type="text"
                placeholder="Ex: Para-choque amassado, corte no pneu traseiro, sem vítimas..."
                value={descricaoDano}
                onChange={(e) => setDescricaoDano(e.target.value)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-hidden focus:border-orange-500"
              />
            </div>

            {/* Footer Alert & Actions */}
            <div className="pt-3 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-[11px] text-slate-400">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>
                  Alerta automático configurado para:{' '}
                  <strong className="text-sky-300">
                    {settings?.notificationEmails && settings.notificationEmails.length > 0
                      ? settings.notificationEmails.slice(0, 2).join(', ') + (settings.notificationEmails.length > 2 ? ` (+${settings.notificationEmails.length - 2})` : '')
                      : 'Equipe SESMT'}
                  </strong>
                </span>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 bg-[#131d2e] hover:bg-[#1a273d] text-slate-300 border border-[#20334f] rounded-lg font-medium transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="busato-gradient-btn px-5 py-2 text-white rounded-lg font-bold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-60 shadow-md shadow-blue-500/25"
                >
                  <Send className="w-3.5 h-3.5" />
                  {isSubmitting ? 'Registrando...' : 'Registrar Ocorrência'}
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
