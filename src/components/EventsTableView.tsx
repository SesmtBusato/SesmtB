import React, { useState, useMemo } from 'react';
import { EventRecord, StatusType, FilterState } from '../types';
import { exportEventsListPDF, exportSingleEventDossierPDF } from '../services/pdfService';
import {
  Search,
  Filter,
  FileDown,
  Calendar,
  Eye,
  FileText,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  ExternalLink
} from 'lucide-react';

interface Props {
  events: EventRecord[];
  filterState: FilterState;
  onFilterChange: (newFilters: FilterState) => void;
  onSelectEvent: (event: EventRecord) => void;
  onOpenCalendarModal: (event: EventRecord) => void;
  onQuickStatusChange: (id: string, newStatus: StatusType) => void;
}

export const EventsTableView: React.FC<Props> = ({
  events,
  filterState,
  onFilterChange,
  onSelectEvent,
  onOpenCalendarModal,
  onQuickStatusChange,
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  // Extract unique supervisors and areas for dropdown filters
  const supervisors = useMemo(() => {
    const set = new Set<string>();
    events.forEach((e) => {
      if (e.encarregado && e.encarregado.trim()) set.add(e.encarregado.trim());
    });
    return Array.from(set).sort();
  }, [events]);

  const areas = useMemo(() => {
    const set = new Set<string>();
    events.forEach((e) => {
      if (e.area && e.area.trim()) set.add(e.area.trim().toUpperCase());
    });
    return Array.from(set).sort();
  }, [events]);

  // Filter logic
  const filteredEvents = useMemo(() => {
    return events.filter((ev) => {
      // Search text
      if (filterState.search) {
        const query = filterState.search.toLowerCase();
        const matches =
          ev.descricao.toLowerCase().includes(query) ||
          ev.local.toLowerCase().includes(query) ||
          (ev.envolvido && ev.envolvido.toLowerCase().includes(query)) ||
          (ev.encarregado && ev.encarregado.toLowerCase().includes(query)) ||
          (ev.placaTag && ev.placaTag.toLowerCase().includes(query)) ||
          ev.item.toString().includes(query);
        if (!matches) return false;
      }

      // Status
      if (filterState.status && ev.status !== filterState.status) {
        return false;
      }

      // Area
      if (filterState.area && ev.area.toUpperCase() !== filterState.area.toUpperCase()) {
        return false;
      }

      // Encarregado / Responsável pela organização
      if (
        filterState.encarregado &&
        ev.encarregado.trim().toUpperCase() !== filterState.encarregado.trim().toUpperCase()
      ) {
        return false;
      }

      // Envolvido
      if (
        filterState.envolvido &&
        !ev.envolvido.toLowerCase().includes(filterState.envolvido.toLowerCase())
      ) {
        return false;
      }

      // Data de Início e Fim (dates stored in DD/MM/AAAA or AAAA-MM-DD)
      if (filterState.dataInicio || filterState.dataFim) {
        let evDate: Date | null = null;
        if (ev.data.includes('/')) {
          const [d, m, y] = ev.data.split('/');
          evDate = new Date(`${y}-${m}-${d}`);
        } else if (ev.data.includes('-')) {
          evDate = new Date(ev.data);
        }

        if (evDate && !isNaN(evDate.getTime())) {
          if (filterState.dataInicio) {
            const startDate = new Date(filterState.dataInicio);
            if (evDate < startDate) return false;
          }
          if (filterState.dataFim) {
            const endDate = new Date(filterState.dataFim);
            endDate.setHours(23, 59, 59);
            if (evDate > endDate) return false;
          }
        }
      }

      return true;
    });
  }, [events, filterState]);

  // Pagination
  const totalPages = Math.ceil(filteredEvents.length / itemsPerPage) || 1;
  const paginatedEvents = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredEvents.slice(start, start + itemsPerPage);
  }, [filteredEvents, currentPage]);

  const handleResetFilters = () => {
    onFilterChange({
      search: '',
      status: '',
      area: '',
      encarregado: '',
      envolvido: '',
      equipamento: '',
      dataInicio: '',
      dataFim: '',
      classificacao: '',
    });
    setCurrentPage(1);
  };

  const statusColors: Record<StatusType, { bg: string; text: string; border: string }> = {
    Pendente: { bg: 'bg-rose-500/15', text: 'text-rose-400', border: 'border-rose-500/30' },
    'Em Análise': { bg: 'bg-sky-500/15', text: 'text-sky-400', border: 'border-sky-500/30' },
    'Em Investigação': { bg: 'bg-blue-500/15', text: 'text-blue-400', border: 'border-blue-500/30' },
    'Ação Corretiva': { bg: 'bg-indigo-500/15', text: 'text-indigo-400', border: 'border-indigo-500/30' },
    Concluído: { bg: 'bg-emerald-500/15', text: 'text-emerald-400', border: 'border-emerald-500/30' },
  };

  return (
    <div className="space-y-4">
      {/* Filter Toolbar */}
      <div className="p-4 busato-card rounded-2xl shadow-xs space-y-3">
        {/* Row 1: Search & PDF Export */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por descrição, colaborador, placa/tag, local ou item #..."
              value={filterState.search}
              onChange={(e) => {
                onFilterChange({ ...filterState, search: e.target.value });
                setCurrentPage(1);
              }}
              className="w-full pl-9 pr-3 py-2 bg-[#101726] border border-[#1e2f4a] rounded-xl text-xs text-white placeholder-slate-400 focus:outline-hidden focus:border-[#1e73be] transition"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() =>
                exportEventsListPDF(
                  filteredEvents,
                  `Status: ${filterState.status || 'Todos'} | Área: ${
                    filterState.area || 'Todas'
                  } | Resp: ${filterState.encarregado || 'Todos'}`
                )
              }
              className="flex items-center gap-1.5 px-3.5 py-2 bg-[#131d2e] hover:bg-[#1a273d] text-slate-200 border border-[#20334f] rounded-xl text-xs font-medium transition cursor-pointer"
              title="Exportar dados filtrados em PDF"
            >
              <FileDown className="w-3.5 h-3.5 text-rose-400" />
              <span>Exportar PDF ({filteredEvents.length})</span>
            </button>

            <button
              onClick={handleResetFilters}
              className="p-2 text-slate-400 hover:text-white bg-[#131d2e] hover:bg-[#1a273d] rounded-xl border border-[#20334f] transition cursor-pointer"
              title="Limpar todos os filtros"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Row 2: Status, Responsável/Encarregado, Área, Datas */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 text-xs">
          {/* Status */}
          <div>
            <label className="block text-[11px] font-medium text-slate-400 mb-1">Status</label>
            <select
              value={filterState.status}
              onChange={(e) => {
                onFilterChange({ ...filterState, status: e.target.value });
                setCurrentPage(1);
              }}
              className="w-full px-2.5 py-1.5 bg-[#101726] border border-[#1e2f4a] rounded-lg text-white focus:outline-hidden focus:border-[#1e73be]"
            >
              <option value="">Todos os Status</option>
              <option value="Pendente">Pendente</option>
              <option value="Em Análise">Em Análise</option>
              <option value="Em Investigação">Em Investigação</option>
              <option value="Ação Corretiva">Ação Corretiva</option>
              <option value="Concluído">Concluído</option>
            </select>
          </div>

          {/* Responsável pela Organização / Encarregado */}
          <div>
            <label className="block text-[11px] font-medium text-slate-400 mb-1">
              Responsável / Encarregado
            </label>
            <select
              value={filterState.encarregado}
              onChange={(e) => {
                onFilterChange({ ...filterState, encarregado: e.target.value });
                setCurrentPage(1);
              }}
              className="w-full px-2.5 py-1.5 bg-[#101726] border border-[#1e2f4a] rounded-lg text-white focus:outline-hidden focus:border-[#1e73be]"
            >
              <option value="">Todos os Responsáveis</option>
              {supervisors.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          {/* Área */}
          <div>
            <label className="block text-[11px] font-medium text-slate-400 mb-1">Área</label>
            <select
              value={filterState.area}
              onChange={(e) => {
                onFilterChange({ ...filterState, area: e.target.value });
                setCurrentPage(1);
              }}
              className="w-full px-2.5 py-1.5 bg-[#101726] border border-[#1e2f4a] rounded-lg text-white focus:outline-hidden focus:border-[#1e73be]"
            >
              <option value="">Todas as Áreas</option>
              {areas.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          </div>

          {/* Período de Data */}
          <div>
            <label className="block text-[11px] font-medium text-slate-400 mb-1">Período (De - Até)</label>
            <div className="flex items-center gap-1.5">
              <input
                type="date"
                value={filterState.dataInicio}
                onChange={(e) => {
                  onFilterChange({ ...filterState, dataInicio: e.target.value });
                  setCurrentPage(1);
                }}
                className="w-1/2 px-2 py-1 bg-[#101726] border border-[#1e2f4a] rounded-lg text-white text-[11px] focus:outline-hidden focus:border-[#1e73be]"
              />
              <span className="text-slate-500">-</span>
              <input
                type="date"
                value={filterState.dataFim}
                onChange={(e) => {
                  onFilterChange({ ...filterState, dataFim: e.target.value });
                  setCurrentPage(1);
                }}
                className="w-1/2 px-2 py-1 bg-[#101726] border border-[#1e2f4a] rounded-lg text-white text-[11px] focus:outline-hidden focus:border-[#1e73be]"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Table Container */}
      <div className="busato-card rounded-2xl shadow-xs overflow-hidden border border-[#1e2f4a]">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#121c2c] border-b border-[#1e2f4a] text-[11px] font-semibold text-slate-300">
                <th className="py-3 px-3.5 text-center">Item</th>
                <th className="py-3 px-3">Data / Hora</th>
                <th className="py-3 px-3">Área / Local</th>
                <th className="py-3 px-3">Envolvido</th>
                <th className="py-3 px-3">Encarregado / Resp.</th>
                <th className="py-3 px-3">Equipamento / Tag</th>
                <th className="py-3 px-3">Gravidade</th>
                <th className="py-3 px-3 text-center">Status</th>
                <th className="py-3 px-3.5 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#18273d]">
              {paginatedEvents.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400">
                    Nenhuma ocorrência encontrada para os filtros selecionados.
                  </td>
                </tr>
              ) : (
                paginatedEvents.map((ev) => (
                  <tr
                    key={ev.id}
                    className="hover:bg-[#162438]/60 transition group"
                  >
                    {/* Item */}
                    <td className="py-2.5 px-3.5 text-center whitespace-nowrap">
                      <button
                        onClick={() => onSelectEvent(ev)}
                        className="font-mono font-bold text-[#38bdf8] hover:text-sky-300 hover:underline cursor-pointer px-1 py-0.5 rounded transition"
                        title="Clique para editar dados e número do item"
                      >
                        #{ev.item}
                      </button>
                    </td>

                    {/* Data / Hora */}
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <div className="font-medium text-slate-200">{ev.data}</div>
                      <div className="text-[10px] text-slate-400">{ev.horario || '--:--'}</div>
                    </td>

                    {/* Área / Local */}
                    <td className="py-2.5 px-3 max-w-[150px]">
                      <span className="font-semibold text-slate-200 block truncate">{ev.area}</span>
                      <span className="text-[11px] text-slate-400 block truncate">{ev.local}</span>
                    </td>

                    {/* Envolvido */}
                    <td className="py-2.5 px-3 max-w-[140px]">
                      <div className="font-medium text-slate-200 truncate">
                        {ev.envolvido || 'Não identificado'}
                      </div>
                      {ev.reincidente === 'Sim' && (
                        <span className="text-[10px] text-rose-400 font-semibold">
                          Reincidente
                        </span>
                      )}
                    </td>

                    {/* Encarregado */}
                    <td className="py-2.5 px-3 max-w-[130px] truncate text-slate-300 font-medium">
                      {ev.encarregado || 'N/A'}
                    </td>

                    {/* Equipamento / Tag */}
                    <td className="py-2.5 px-3 max-w-[130px]">
                      <div className="text-slate-200 truncate">{ev.equipamento || 'N/A'}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{ev.placaTag || '--'}</div>
                    </td>

                    {/* Gravidade */}
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                          ev.classificacaoReal === 'Crítico'
                            ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                            : ev.classificacaoReal === 'Grave'
                            ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                            : ev.classificacaoReal === 'Moderado'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            : 'bg-slate-800 text-slate-300'
                        }`}
                      >
                        {ev.classificacaoReal}
                      </span>
                    </td>

                    {/* Quick Status Dropdown */}
                    <td className="py-2.5 px-3 text-center whitespace-nowrap">
                      <select
                        value={ev.status}
                        onChange={(e) =>
                          onQuickStatusChange(ev.id, e.target.value as StatusType)
                        }
                        className={`text-[11px] font-semibold px-2 py-1 rounded-lg border cursor-pointer focus:outline-hidden ${
                          statusColors[ev.status]?.bg || 'bg-slate-800'
                        } ${statusColors[ev.status]?.text || 'text-slate-300'} ${
                          statusColors[ev.status]?.border || 'border-slate-700'
                        }`}
                      >
                        <option value="Pendente" className="bg-slate-900 text-slate-200">Pendente</option>
                        <option value="Em Análise" className="bg-slate-900 text-slate-200">Em Análise</option>
                        <option value="Em Investigação" className="bg-slate-900 text-slate-200">Em Investigação</option>
                        <option value="Ação Corretiva" className="bg-slate-900 text-slate-200">Ação Corretiva</option>
                        <option value="Concluído" className="bg-slate-900 text-slate-200">Concluído</option>
                      </select>
                    </td>

                    {/* Ações */}
                    <td className="py-2.5 px-3.5 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Agendar Google Calendar */}
                        <button
                          onClick={() => onOpenCalendarModal(ev)}
                          title="Agendar na Google Agenda"
                          className="p-1.5 text-slate-400 hover:text-blue-400 hover:bg-slate-800 rounded-lg transition cursor-pointer"
                        >
                          <Calendar className="w-3.5 h-3.5" />
                        </button>

                        {/* Boletim PDF */}
                        <button
                          onClick={() => exportSingleEventDossierPDF(ev)}
                          title="Gerar B.O. em PDF"
                          className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition cursor-pointer"
                        >
                          <FileText className="w-3.5 h-3.5" />
                        </button>

                        {/* Detalhes */}
                        <button
                          onClick={() => onSelectEvent(ev)}
                          title="Visualizar e Editar Detalhes"
                          className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="p-3 bg-[#101726] border-t border-[#1e2f4a] flex items-center justify-between text-xs text-slate-400">
          <div>
            Mostrando <strong>{filteredEvents.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1}</strong> a{' '}
            <strong>{Math.min(currentPage * itemsPerPage, filteredEvents.length)}</strong> de{' '}
            <strong>{filteredEvents.length}</strong> eventos filtrados (Total: {events.length})
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded-lg bg-[#131d2e] hover:bg-[#1a273d] text-slate-300 disabled:opacity-30 border border-[#1e2f4a] transition cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-mono text-sky-300 px-2 font-medium">
              {currentPage} / {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded-lg bg-[#131d2e] hover:bg-[#1a273d] text-slate-300 disabled:opacity-30 border border-[#1e2f4a] transition cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
