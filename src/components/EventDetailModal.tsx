import React, { useState } from 'react';
import { EventRecord, StatusType, AppSettings } from '../types';
import { exportSingleEventDossierPDF } from '../services/pdfService';
import { buildGoogleCalendarWebUrl } from '../services/googleCalendarService';
import {
  X,
  FileText,
  Calendar,
  Clock,
  MapPin,
  Truck,
  User,
  ShieldAlert,
  CheckCircle,
  ExternalLink,
  Save,
  Trash2,
  Edit3
} from 'lucide-react';

interface Props {
  event: EventRecord;
  settings?: AppSettings;
  nextItemNumber?: number;
  onClose: () => void;
  onUpdate: (updated: EventRecord) => void;
  onDelete?: (id: string) => void;
  onOpenCalendarModal: (event: EventRecord) => void;
}

export const EventDetailModal: React.FC<Props> = ({
  event,
  settings,
  nextItemNumber,
  onClose,
  onUpdate,
  onDelete,
  onOpenCalendarModal,
}) => {
  const [itemNumber, setItemNumber] = useState<number>(event.item);
  const [currentStatus, setCurrentStatus] = useState<StatusType>(event.status);
  const [observacao, setObservacao] = useState<string>(event.observacao || '');
  const [prazoAnalise, setPrazoAnalise] = useState<string>(event.prazoAnalise || '');
  const [encarregado, setEncarregado] = useState<string>(event.encarregado || '');
  const [envolvido, setEnvolvido] = useState<string>(event.envolvido || '');
  const [letraTurno, setLetraTurno] = useState<string>(event.letraTurno || '');
  const [equipamento, setEquipamento] = useState<string>(event.equipamento || '');
  const [area, setArea] = useState<string>(event.area || '');
  const [local, setLocal] = useState<string>(event.local || '');
  const [placaTag, setPlacaTag] = useState<string>(event.placaTag || '');
  const [descricao, setDescricao] = useState<string>(event.descricao || '');
  const [descricaoDano, setDescricaoDano] = useState<string>(event.descricaoDano || '');

  const [isEditingFull, setIsEditingFull] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const supervisorsList = settings?.supervisors || [];
  const equipmentsList = settings?.equipments || [];
  const shiftsList = settings?.shifts || [];
  const areasList = settings?.areas || [];

  const handleSave = () => {
    setIsSaving(true);
    const updated: EventRecord = {
      ...event,
      item: Number(itemNumber) || event.item,
      status: currentStatus,
      observacao,
      prazoAnalise,
      encarregado,
      envolvido,
      letraTurno,
      equipamento,
      area,
      local,
      placaTag,
      descricao,
      descricaoDano,
    };
    onUpdate(updated);
    setIsSaving(false);
    setSavedSuccess(true);
    setIsEditingFull(false);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const statusColors: Record<StatusType, { bg: string; text: string; border: string }> = {
    Pendente: { bg: 'bg-rose-500/10', text: 'text-rose-400', border: 'border-rose-500/30' },
    'Em Análise': { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/30' },
    'Em Investigação': { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/30' },
    'Ação Corretiva': { bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/30' },
    Concluído: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/30' },
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-3xl busato-card border-[#1e2f4a] rounded-2xl shadow-2xl p-6 text-slate-100 my-8 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-[#1e2f4a] shrink-0">
          <div className="flex items-center gap-3">
            {isEditingFull ? (
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-1.5 px-3 py-1 bg-[#121c2d] border border-[#38bdf8]/50 rounded-lg shadow-xs">
                  <span className="text-[#38bdf8] font-bold font-mono text-sm">ITEM #</span>
                  <input
                    type="number"
                    value={itemNumber}
                    onChange={(e) => setItemNumber(parseInt(e.target.value) || 0)}
                    className="w-20 bg-transparent text-[#38bdf8] font-bold font-mono text-sm focus:outline-hidden"
                    title="Editar número do item"
                  />
                </div>
                {nextItemNumber && itemNumber !== nextItemNumber && (
                  <button
                    type="button"
                    onClick={() => setItemNumber(nextItemNumber)}
                    className="text-[10px] text-amber-400 hover:text-amber-300 underline cursor-pointer text-left"
                    title="Preencher com a próxima sequência automática"
                  >
                    Sugerir próxima: #{nextItemNumber}
                  </button>
                )}
              </div>
            ) : (
              <span className="px-3 py-1 bg-[#121c2d] text-[#38bdf8] font-bold font-mono text-sm rounded-lg border border-[#1e2f4a] shadow-xs">
                ITEM #{event.item}
              </span>
            )}
            <div>
              <div className="flex items-center gap-2">
                <span
                  className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${
                    statusColors[event.status]?.bg || 'bg-slate-800'
                  } ${statusColors[event.status]?.text || 'text-slate-300'} ${
                    statusColors[event.status]?.border || 'border-slate-700'
                  }`}
                >
                  {event.status}
                </span>
                <span className="text-xs text-slate-400 font-medium">
                  {event.area} • {event.local}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Registrado em {event.data} às {event.horario} ({event.diaSemana})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => exportSingleEventDossierPDF(event)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium border border-slate-700 transition cursor-pointer"
              title="Baixar Boletim em PDF"
            >
              <FileText className="w-3.5 h-3.5 text-rose-400" />
              <span>Emitir B.O. PDF</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="overflow-y-auto space-y-4 py-4 pr-1 text-xs">
          {/* Top Quick Actions Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-slate-800/40 rounded-xl border border-slate-800">
            <div className="flex items-center gap-2">
              <span className="text-slate-400">Alterar Status:</span>
              <select
                value={currentStatus}
                onChange={(e) => setCurrentStatus(e.target.value as StatusType)}
                className="px-2.5 py-1 bg-slate-800 border border-slate-700 rounded-lg text-white font-medium focus:outline-hidden focus:border-blue-500"
              >
                <option value="Pendente">Pendente</option>
                <option value="Em Análise">Em Análise</option>
                <option value="Em Investigação">Em Investigação</option>
                <option value="Ação Corretiva">Ação Corretiva</option>
                <option value="Concluído">Concluído</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsEditingFull(!isEditingFull)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition cursor-pointer border ${
                  isEditingFull
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                }`}
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>{isEditingFull ? 'Visualizar Detalhes' : 'Editar Dados Cadastrais'}</span>
              </button>

              <button
                onClick={() => onOpenCalendarModal(event)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 rounded-lg font-medium transition cursor-pointer"
              >
                <Calendar className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Google Agenda</span>
              </button>

              <a
                href={buildGoogleCalendarWebUrl(event)}
                target="_blank"
                rel="noreferrer"
                className="p-1.5 text-slate-400 hover:text-blue-400 bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 transition"
                title="Abrir diretamente no Google Calendar"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Responsáveis e Envolvidos */}
            <div className="p-3.5 bg-slate-800/50 rounded-xl border border-slate-700/60 space-y-2">
              <div className="flex items-center justify-between border-b border-slate-700/50 pb-1.5">
                <div className="flex items-center gap-2 text-slate-300 font-semibold">
                  <User className="w-4 h-4 text-amber-400" />
                  <span>Pessoas e Gestão</span>
                </div>
                {isEditingFull && <span className="text-[10px] text-amber-400 font-mono">Modo Edição Ativo</span>}
              </div>
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div>
                  <span className="text-slate-400 block">Colaborador Envolvido</span>
                  {isEditingFull ? (
                    <input
                      type="text"
                      value={envolvido}
                      onChange={(e) => setEnvolvido(e.target.value)}
                      className="w-full px-2 py-1 bg-slate-900 border border-slate-700 rounded text-white"
                    />
                  ) : (
                    <span className="text-white font-medium">{event.envolvido || 'Não informado'}</span>
                  )}
                </div>
                <div>
                  <span className="text-slate-400 block">Encarregado / Supervisor</span>
                  {isEditingFull ? (
                    supervisorsList.length > 0 ? (
                      <select
                        value={encarregado}
                        onChange={(e) => setEncarregado(e.target.value)}
                        className="w-full px-2 py-1 bg-slate-900 border border-slate-700 rounded text-white"
                      >
                        <option value="">Selecione...</option>
                        {supervisorsList.map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type="text"
                        placeholder="Nome do encarregado"
                        value={encarregado}
                        onChange={(e) => setEncarregado(e.target.value)}
                        className="w-full px-2 py-1 bg-slate-900 border border-slate-700 rounded text-white"
                      />
                    )
                  ) : (
                    <span className="text-white font-medium">{event.encarregado || 'Não informado'}</span>
                  )}
                </div>
                <div>
                  <span className="text-slate-400 block">Turno / Horário</span>
                  {isEditingFull ? (
                    shiftsList.length > 0 ? (
                      <select
                        value={letraTurno}
                        onChange={(e) => setLetraTurno(e.target.value)}
                        className="w-full px-2 py-1 bg-slate-900 border border-slate-700 rounded text-white"
                      >
                        <option value="">Selecione...</option>
                        {shiftsList.map((sh) => (
                          <option key={sh} value={sh}>{sh}</option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type="text"
                        placeholder="Turno"
                        value={letraTurno}
                        onChange={(e) => setLetraTurno(e.target.value)}
                        className="w-full px-2 py-1 bg-slate-900 border border-slate-700 rounded text-white"
                      />
                    )
                  ) : (
                    <span className="text-slate-200">{event.letraTurno || 'Geral'}</span>
                  )}
                </div>
                <div>
                  <span className="text-slate-400 block">Estava de Extra?</span>
                  <span className="text-slate-200">{event.estavaDeExtra || 'Não'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Histórico de Reincidência</span>
                  <span className={`font-semibold ${event.reincidente === 'Sim' ? 'text-rose-400' : 'text-slate-300'}`}>
                    {event.reincidente === 'Sim' ? '⚠️ Sim (Reincidente)' : 'Não'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block">Tempo de Empresa / Idade</span>
                  <span className="text-slate-200">{event.tempoEmpresa || 'N/A'} {event.idade ? `(${event.idade})` : ''}</span>
                </div>
              </div>
            </div>

            {/* Equipamento & Local */}
            <div className="p-3.5 bg-slate-800/50 rounded-xl border border-slate-700/60 space-y-2">
              <div className="flex items-center justify-between border-b border-slate-700/50 pb-1.5">
                <div className="flex items-center gap-2 text-slate-300 font-semibold">
                  <Truck className="w-4 h-4 text-blue-400" />
                  <span>Equipamento & Localização</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div>
                  <span className="text-slate-400 block">Tipo de Equipamento</span>
                  {isEditingFull ? (
                    equipmentsList.length > 0 ? (
                      <select
                        value={equipamento}
                        onChange={(e) => setEquipamento(e.target.value)}
                        className="w-full px-2 py-1 bg-slate-900 border border-slate-700 rounded text-white"
                      >
                        <option value="">Selecione...</option>
                        {equipmentsList.map((eq) => (
                          <option key={eq} value={eq}>{eq}</option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type="text"
                        placeholder="Equipamento"
                        value={equipamento}
                        onChange={(e) => setEquipamento(e.target.value)}
                        className="w-full px-2 py-1 bg-slate-900 border border-slate-700 rounded text-white"
                      />
                    )
                  ) : (
                    <span className="text-white font-medium">{event.equipamento || 'N/A'}</span>
                  )}
                </div>
                <div>
                  <span className="text-slate-400 block">Placa / Tag Operacional</span>
                  {isEditingFull ? (
                    <input
                      type="text"
                      value={placaTag}
                      onChange={(e) => setPlacaTag(e.target.value.toUpperCase())}
                      className="w-full px-2 py-1 bg-slate-900 border border-slate-700 rounded text-white font-mono"
                    />
                  ) : (
                    <span className="text-white font-mono">{event.placaTag || '--'}</span>
                  )}
                </div>
                <div>
                  <span className="text-slate-400 block">Área Macro</span>
                  {isEditingFull ? (
                    areasList.length > 0 ? (
                      <select
                        value={area}
                        onChange={(e) => setArea(e.target.value)}
                        className="w-full px-2 py-1 bg-slate-900 border border-slate-700 rounded text-white"
                      >
                        <option value="">Selecione...</option>
                        {areasList.map((ar) => (
                          <option key={ar} value={ar}>{ar}</option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type="text"
                        placeholder="Área"
                        value={area}
                        onChange={(e) => setArea(e.target.value)}
                        className="w-full px-2 py-1 bg-slate-900 border border-slate-700 rounded text-white"
                      />
                    )
                  ) : (
                    <span className="text-slate-200">{event.area}</span>
                  )}
                </div>
                <div>
                  <span className="text-slate-400 block">Local Específico</span>
                  {isEditingFull ? (
                    <input
                      type="text"
                      value={local}
                      onChange={(e) => setLocal(e.target.value)}
                      className="w-full px-2 py-1 bg-slate-900 border border-slate-700 rounded text-white"
                    />
                  ) : (
                    <span className="text-slate-200">{event.local}</span>
                  )}
                </div>
                <div>
                  <span className="text-slate-400 block">Momento da Ocorrência</span>
                  <span className="text-slate-200">{event.quandoOcorreu || 'Durante atividade'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Tipo de Ocorrência</span>
                  <span className="text-slate-200">{event.tipoOcorrencia || 'Incidente Operacional'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Gravidade & Risco */}
          <div className="p-3.5 bg-slate-800/50 rounded-xl border border-slate-700/60 space-y-2">
            <div className="flex items-center gap-2 text-slate-300 font-semibold border-b border-slate-700/50 pb-1.5">
              <ShieldAlert className="w-4 h-4 text-rose-400" />
              <span>Avaliação de Severidade & Risco</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
              <div>
                <span className="text-slate-400 block">Classificação Real</span>
                <span className="font-bold text-slate-200">{event.classificacaoReal}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Classificação Potencial</span>
                <span className="font-bold text-amber-400">{event.classificacaoPotencial}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Nº da CAT</span>
                <span className="text-slate-200">{event.numeroCat || 'Não aplicável'}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Período de Afastamento</span>
                <span className="text-slate-200">{event.periodoAfastamento || 'Nenhum'}</span>
              </div>
            </div>
          </div>

          {/* Relato do Evento */}
          <div className="p-3.5 bg-slate-800/50 rounded-xl border border-slate-700/60 space-y-1.5">
            <span className="text-slate-300 font-semibold block">Descrição do Evento</span>
            <p className="text-slate-200 text-xs leading-relaxed bg-slate-900/60 p-3 rounded-lg border border-slate-800">
              {event.descricao || 'Sem descrição cadastrada.'}
            </p>
          </div>

          {/* Danos Materiais */}
          <div className="p-3.5 bg-slate-800/50 rounded-xl border border-slate-700/60 space-y-1.5">
            <span className="text-slate-300 font-semibold block">Descrição dos Danos</span>
            <p className="text-slate-300 text-xs bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
              {event.descricaoDano || 'Nenhum dano material específico detalhado.'}
            </p>
          </div>

          {/* Análise, Prazos & Observações */}
          <div className="p-3.5 bg-slate-800/50 rounded-xl border border-slate-700/60 space-y-3">
            <span className="text-slate-300 font-semibold block">Tratativas, Prazos e Observações Operacionais</span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-slate-400 mb-1 text-[11px]">Prazo de Análise / Reunião</label>
                <input
                  type="text"
                  placeholder="Ex: 15/10/2026"
                  value={prazoAnalise}
                  onChange={(e) => setPrazoAnalise(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-white"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-slate-400 mb-1 text-[11px]">Observações / Medidas Preventivas</label>
                <input
                  type="text"
                  placeholder="Ações adotadas, orientações da liderança..."
                  value={observacao}
                  onChange={(e) => setObservacao(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-white"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="pt-4 border-t border-slate-800 shrink-0 flex items-center justify-between">
          <div>
            {onDelete && (
              <button
                onClick={() => {
                  if (window.confirm(`Tem certeza que deseja excluir o evento #${event.item}?`)) {
                    onDelete(event.id);
                    onClose();
                  }
                }}
                className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1 transition cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Excluir Ocorrência</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {savedSuccess && (
              <span className="text-xs text-emerald-400 flex items-center gap-1 font-medium">
                <CheckCircle className="w-3.5 h-3.5" /> Atualizado!
              </span>
            )}
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg font-medium transition cursor-pointer"
            >
              Fechar
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium transition flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isSaving ? 'Salvando...' : 'Salvar Alterações'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
