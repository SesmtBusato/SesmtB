import React from 'react';
import { EventRecord } from '../types';
import { GoogleAuthButton } from './GoogleAuthButton';
import { buildGoogleCalendarWebUrl } from '../services/googleCalendarService';
import { Calendar, Clock, CheckCircle, ExternalLink, AlertCircle, Plus } from 'lucide-react';
import { User } from 'firebase/auth';

interface Props {
  events: EventRecord[];
  user: User | null;
  accessToken: string | null;
  onOpenCalendarModal: (event: EventRecord) => void;
  onSelectEvent: (event: EventRecord) => void;
}

export const CalendarAgendaView: React.FC<Props> = ({
  events,
  user,
  accessToken,
  onOpenCalendarModal,
  onSelectEvent,
}) => {
  // Filter events with analysis deadlines or active investigations
  const pendingOrScheduled = events.filter(
    (e) => e.prazoAnalise || e.status === 'Em Análise' || e.status === 'Em Investigação' || e.status === 'Pendente'
  );

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-6 busato-card border-[#1e2f4a] rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-sky-400 text-xs font-bold uppercase tracking-wider">
            <Calendar className="w-4 h-4" />
            <span>Integração Google Workspace</span>
          </div>
          <h2 className="text-xl font-bold text-white font-brand">Google Agenda & Gestão de Prazos</h2>
          <p className="text-xs text-slate-400 max-w-xl">
            Sincronize comitês de investigação de incidentes, vistorias técnicas e prazos legais diretamente na sua conta corporativa.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <GoogleAuthButton />
        </div>
      </div>

      {/* Grid: Calendário de Prazos */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Eventos que precisam de Análise / Agendamento */}
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2 font-brand">
              <Clock className="w-4 h-4 text-sky-400" />
              <span>Ocorrências com Prazos e Comitês de Análise ({pendingOrScheduled.length})</span>
            </h3>
            <span className="text-xs text-slate-400">Ordenado por prioridade</span>
          </div>

          <div className="space-y-3">
            {pendingOrScheduled.slice(0, 15).map((ev) => (
              <div
                key={ev.id}
                className="p-4 busato-card busato-card-hover rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
              >
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-[#38bdf8] text-xs">#{ev.item}</span>
                    <span className="text-xs font-semibold text-slate-200 truncate">
                      {ev.area} • {ev.local}
                    </span>
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                        ev.status === 'Pendente'
                          ? 'bg-rose-500/10 text-rose-400'
                          : ev.status === 'Em Investigação'
                          ? 'bg-blue-500/10 text-blue-400'
                          : 'bg-amber-500/10 text-amber-400'
                      }`}
                    >
                      {ev.status}
                    </span>
                  </div>

                  <p className="text-xs text-slate-400 line-clamp-1">{ev.descricao}</p>

                  <div className="text-[11px] text-slate-400 flex items-center gap-3">
                    <span>Encarregado: {ev.encarregado || 'N/A'}</span>
                    <span>Envolvido: {ev.envolvido || 'N/A'}</span>
                    {ev.prazoAnalise && (
                      <span className="text-amber-400 font-medium">
                        Prazo: {ev.prazoAnalise}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => onOpenCalendarModal(ev)}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-medium transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Agendar Reunião</span>
                  </button>

                  <a
                    href={buildGoogleCalendarWebUrl(ev)}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs border border-slate-700 transition"
                    title="Adicionar via Web Link"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Info Box */}
        <div className="space-y-4">
          <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl space-y-4">
            <h4 className="text-sm font-semibold text-white flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-400" />
              <span>Como Funciona a Integração</span>
            </h4>

            <div className="space-y-3 text-xs text-slate-300 leading-relaxed">
              <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 space-y-1">
                <strong className="text-white block">1. Conexão Autorizada</strong>
                <p className="text-slate-400 text-[11px]">
                  Ao clicar em "Conectar Google Agenda", você autentica sua conta corporativa com segurança.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 space-y-1">
                <strong className="text-white block">2. Confirmação Explícita</strong>
                <p className="text-slate-400 text-[11px]">
                  Cada compromisso solicita uma confirmação antes de ser inserido no calendário, respeitando a privacidade dos dados.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 space-y-1">
                <strong className="text-white block">3. Notificação dos Participantes</strong>
                <p className="text-slate-400 text-[11px]">
                  Convites com detalhes da ocorrência, envolvidos e local são enviados automaticamente aos e-mails dos encarregados e segurança do trabalho.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
