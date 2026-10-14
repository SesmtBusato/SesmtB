import React from 'react';
import { EventRecord, StatusType } from '../types';
import { Clock, CheckCircle2, AlertCircle, FileText, Calendar } from 'lucide-react';

interface Props {
  events: EventRecord[];
  onSelectEvent: (event: EventRecord) => void;
  onOpenCalendarModal: (event: EventRecord) => void;
  onStatusChange: (id: string, newStatus: StatusType) => void;
}

const COLUMNS: { status: StatusType; label: string; color: string; border: string; bg: string }[] = [
  { status: 'Pendente', label: 'Pendentes', color: 'text-rose-400', border: 'border-rose-500/30', bg: 'bg-rose-500/5' },
  { status: 'Em Análise', label: 'Em Análise', color: 'text-amber-400', border: 'border-amber-500/30', bg: 'bg-amber-500/5' },
  { status: 'Em Investigação', label: 'Em Investigação', color: 'text-blue-400', border: 'border-blue-500/30', bg: 'bg-blue-500/5' },
  { status: 'Ação Corretiva', label: 'Ação Corretiva', color: 'text-purple-400', border: 'border-purple-500/30', bg: 'bg-purple-500/5' },
  { status: 'Concluído', label: 'Concluídos', color: 'text-emerald-400', border: 'border-emerald-500/30', bg: 'bg-emerald-500/5' },
];

export const KanbanBoardView: React.FC<Props> = ({
  events,
  onSelectEvent,
  onOpenCalendarModal,
  onStatusChange,
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-5 gap-4 overflow-x-auto pb-4">
      {COLUMNS.map((col) => {
        const colEvents = events.filter((e) => e.status === col.status);

        return (
          <div
            key={col.status}
            className={`flex flex-col bg-[#0e1624] border ${col.border} rounded-2xl p-3 shadow-xs min-w-[260px]`}
          >
            {/* Column Header */}
            <div className="flex items-center justify-between pb-3 border-b border-[#1e2f4a]">
              <div className="flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full ${col.bg} border ${col.border}`}></span>
                <span className={`text-xs font-bold ${col.color} font-brand tracking-wide`}>{col.label}</span>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-[#121c2c] text-sky-300 font-mono text-[11px] font-bold border border-[#1e2f4a]">
                {colEvents.length}
              </span>
            </div>

            {/* Column Cards */}
            <div className="flex-1 space-y-2.5 pt-3 overflow-y-auto max-h-[72vh] pr-1">
              {colEvents.length === 0 ? (
                <div className="py-8 text-center text-slate-500 text-xs italic">
                  Nenhum evento neste estágio
                </div>
              ) : (
                colEvents.map((ev) => (
                  <div
                    key={ev.id}
                    onClick={() => onSelectEvent(ev)}
                    className="p-3 bg-[#131d2e] hover:bg-[#18263c] border border-[#1e2f4a] hover:border-[#2b4d79] rounded-xl cursor-pointer transition space-y-2 group shadow-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[#38bdf8] font-mono font-bold text-xs">
                        #{ev.item}
                      </span>
                      <span className="text-[10px] text-slate-400">{ev.data}</span>
                    </div>

                    <div className="text-xs font-semibold text-slate-200 line-clamp-1">
                      {ev.area} • {ev.local}
                    </div>

                    <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                      {ev.descricao}
                    </p>

                    <div className="pt-1.5 border-t border-slate-700/40 flex items-center justify-between text-[10px] text-slate-400">
                      <span className="truncate max-w-[120px] font-medium text-slate-300">
                        {ev.envolvido || 'N/A'}
                      </span>

                      <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => onOpenCalendarModal(ev)}
                          title="Agendar no Google Agenda"
                          className="p-1 hover:text-blue-400 rounded transition"
                        >
                          <Calendar className="w-3.5 h-3.5" />
                        </button>
                        <select
                          value={ev.status}
                          onChange={(e) => onStatusChange(ev.id, e.target.value as StatusType)}
                          className="text-[10px] bg-slate-900 border border-slate-700 rounded px-1.5 py-0.5 text-slate-300 focus:outline-hidden"
                        >
                          {COLUMNS.map((c) => (
                            <option key={c.status} value={c.status}>
                              {c.status}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
