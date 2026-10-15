import React, { useState, useMemo } from 'react';
import { EventRecord } from '../types';
import { exportEventsListPDF } from '../services/pdfService';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Layers,
  Users,
  Truck,
  TrendingUp,
  ShieldAlert,
  BarChart3,
  CalendarDays,
  Calendar,
  RotateCcw,
  FileDown,
  ArrowRight,
  Filter,
  Zap,
  Activity,
  Hourglass,
  HelpCircle,
  Shield,
  Award,
  AlertOctagon,
  Target
} from 'lucide-react';

interface Props {
  events: EventRecord[];
  onSelectFilterArea: (area: string, startDate?: string, endDate?: string) => void;
  onSelectFilterSupervisor: (supervisor: string, startDate?: string, endDate?: string) => void;
  onSelectFilterPerson: (person: string, startDate?: string, endDate?: string) => void;
  onSelectFilterStatus: (status: string, startDate?: string, endDate?: string) => void;
  onNavigateToTableWithDates?: (startDate: string, endDate: string) => void;
}

type DatePreset = 'todos' | 'mes-atual' | 'ultimos-30' | 'ultimos-60' | 't1' | 't2' | 't3' | 't4' | 'custom';

function parseEventDate(dataStr: string): Date | null {
  if (!dataStr) return null;
  const clean = dataStr.trim();
  if (clean.includes('/')) {
    const parts = clean.split('/');
    if (parts.length === 3) {
      const d = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10) - 1;
      const y = parseInt(parts[2], 10);
      const date = new Date(y, m, d);
      return isNaN(date.getTime()) ? null : date;
    }
  } else if (clean.includes('-')) {
    const parts = clean.split('-');
    if (parts.length === 3) {
      const y = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10) - 1;
      const d = parseInt(parts[2], 10);
      const date = new Date(y, m, d);
      return isNaN(date.getTime()) ? null : date;
    }
  }
  return null;
}

export const DashboardView: React.FC<Props> = ({
  events,
  onSelectFilterArea,
  onSelectFilterSupervisor,
  onSelectFilterPerson,
  onSelectFilterStatus,
  onNavigateToTableWithDates,
}) => {
  // Date filter state
  const [activePreset, setActivePreset] = useState<DatePreset>('todos');
  const [startDateInput, setStartDateInput] = useState<string>('');
  const [endDateInput, setEndDateInput] = useState<string>('');

  // Handle Preset Selection
  const applyPreset = (preset: DatePreset) => {
    setActivePreset(preset);

    if (preset === 'todos') {
      setStartDateInput('');
      setEndDateInput('');
    } else if (preset === 'mes-atual') {
      // Current month: October 2026 based on dataset timeline
      setStartDateInput('2026-10-01');
      setEndDateInput('2026-10-31');
    } else if (preset === 'ultimos-30') {
      setStartDateInput('2026-09-08');
      setEndDateInput('2026-10-08');
    } else if (preset === 'ultimos-60') {
      setStartDateInput('2026-08-08');
      setEndDateInput('2026-10-08');
    } else if (preset === 't1') {
      setStartDateInput('2026-01-01');
      setEndDateInput('2026-03-31');
    } else if (preset === 't2') {
      setStartDateInput('2026-04-01');
      setEndDateInput('2026-06-30');
    } else if (preset === 't3') {
      setStartDateInput('2026-07-01');
      setEndDateInput('2026-09-30');
    } else if (preset === 't4') {
      setStartDateInput('2026-10-01');
      setEndDateInput('2026-12-31');
    }
  };

  const handleCustomDateChange = (start: string, end: string) => {
    setStartDateInput(start);
    setEndDateInput(end);
    setActivePreset('custom');
  };

  const handleClearDateFilter = () => {
    setActivePreset('todos');
    setStartDateInput('');
    setEndDateInput('');
  };

  // Filter events based on date range
  const filteredEvents = useMemo(() => {
    if (!startDateInput && !endDateInput) {
      return events;
    }

    const startObj = startDateInput ? new Date(`${startDateInput}T00:00:00`) : null;
    const endObj = endDateInput ? new Date(`${endDateInput}T23:59:59`) : null;

    return events.filter((e) => {
      const evDate = parseEventDate(e.data);
      if (!evDate) return true;

      if (startObj && evDate < startObj) return false;
      if (endObj && evDate > endObj) return false;

      return true;
    });
  }, [events, startDateInput, endDateInput]);

  // Aggregate Metrics over filtered events
  const metrics = useMemo(() => {
    const total = filteredEvents.length;
    const pendentes = filteredEvents.filter((e) => e.status === 'Pendente').length;
    const emAnalise = filteredEvents.filter((e) => e.status === 'Em Análise' || e.status === 'Em Investigação').length;
    const concluidos = filteredEvents.filter((e) => e.status === 'Concluído').length;
    const reincidentes = filteredEvents.filter((e) => e.reincidente === 'Sim').length;
    const criticos = filteredEvents.filter((e) => e.classificacaoReal === 'Crítico' || e.classificacaoReal === 'Grave').length;

    // 1. Risco Oculto / Quase-Acidentes Graves: Real Leve/Moderado com Potencial Grave/Crítico
    const riscoOculto = filteredEvents.filter(
      (e) =>
        (e.classificacaoReal === 'Leve' || e.classificacaoReal === 'Moderado') &&
        (e.classificacaoPotencial === 'Grave' || e.classificacaoPotencial === 'Crítico')
    ).length;

    // 2. Fadiga & Turnos: Trabalho Extra
    const extraSim = filteredEvents.filter((e) => e.estavaDeExtra === 'Sim').length;
    const taxaExtra = total > 0 ? Math.round((extraSim / total) * 100) : 0;

    // Distribuição por Turno
    const shiftMap: Record<string, number> = {};
    filteredEvents.forEach((e) => {
      const shiftKey = (e.letraTurno || 'Geral').trim();
      shiftMap[shiftKey] = (shiftMap[shiftKey] || 0) + 1;
    });

    // 3. Tempo de Empresa (Curva de Experiência / Integração)
    const tenureDist = {
      novatos: 0,    // < 1 ano
      intermediario: 0, // 1 a 3 anos
      veteranos: 0,  // > 3 anos
      naoInformado: 0
    };

    filteredEvents.forEach((e) => {
      const te = (e.tempoEmpresa || '').toLowerCase();
      if (!te || te === 'n/a') {
        tenureDist.naoInformado++;
      } else if (te.includes('0 anos') || te.includes('meses') && !te.includes('ano')) {
        tenureDist.novatos++;
      } else if (te.includes('1 anos') || te.includes('2 anos')) {
        tenureDist.intermediario++;
      } else if (te.match(/([3-9]|\d{2})\s*anos/)) {
        tenureDist.veteranos++;
      } else {
        tenureDist.novatos++;
      }
    });

    // 4. SLA & Eficiência de Análise / Atrasos
    const now = new Date();
    let emAtraso = 0;
    filteredEvents.forEach((e) => {
      if (e.status !== 'Concluído' && e.prazoAnalise) {
        const prazoDate = parseEventDate(e.prazoAnalise);
        if (prazoDate && prazoDate < now) {
          emAtraso++;
        }
      }
    });

    // 5. Placas / Tags Mais Ofensoras
    const tagMap: Record<string, number> = {};
    filteredEvents.forEach((e) => {
      const tag = (e.placaTag || '').trim().toUpperCase();
      if (tag && tag !== '--' && tag !== 'N/A') {
        tagMap[tag] = (tagMap[tag] || 0) + 1;
      }
    });
    const topTags = Object.entries(tagMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    // Distribution by Area
    const areaMap: Record<string, number> = {};
    filteredEvents.forEach((e) => {
      const areaKey = (e.area || 'OUTROS').toUpperCase();
      areaMap[areaKey] = (areaMap[areaKey] || 0) + 1;
    });

    // Distribution by Supervisor
    const supervisorMap: Record<string, number> = {};
    filteredEvents.forEach((e) => {
      if (e.encarregado && e.encarregado.trim()) {
        supervisorMap[e.encarregado.trim()] = (supervisorMap[e.encarregado.trim()] || 0) + 1;
      }
    });

    // Distribution by Person (Envolvido)
    const personMap: Record<string, { count: number; reincidente: boolean }> = {};
    filteredEvents.forEach((e) => {
      if (e.envolvido && e.envolvido.trim() && e.envolvido !== 'N/A') {
        const name = e.envolvido.trim();
        if (!personMap[name]) {
          personMap[name] = { count: 0, reincidente: e.reincidente === 'Sim' };
        }
        personMap[name].count += 1;
        if (e.reincidente === 'Sim') personMap[name].reincidente = true;
      }
    });

    // Distribution by Equipment
    const equipmentMap: Record<string, number> = {};
    filteredEvents.forEach((e) => {
      const eq = (e.equipamento || 'OUTROS').toUpperCase();
      equipmentMap[eq] = (equipmentMap[eq] || 0) + 1;
    });

    // Distribution by Time Period
    const periods = {
      Madrugada: 0, // 00:00 - 05:59
      Manhã: 0,     // 06:00 - 11:59
      Tarde: 0,     // 12:00 - 17:59
      Noite: 0,     // 18:00 - 23:59
    };

    filteredEvents.forEach((e) => {
      if (e.horario) {
        const match = e.horario.match(/(\d\d):/);
        if (match) {
          const hour = parseInt(match[1], 10);
          if (hour >= 0 && hour < 6) periods.Madrugada++;
          else if (hour >= 6 && hour < 12) periods.Manhã++;
          else if (hour >= 12 && hour < 18) periods.Tarde++;
          else periods.Noite++;
        }
      }
    });

    // Top Supervisors sorted
    const topSupervisors = Object.entries(supervisorMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6);

    // Top Persons sorted
    const topPersons = Object.entries(personMap)
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 6);

    // Top Equipments sorted
    const topEquipments = Object.entries(equipmentMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    return {
      total,
      pendentes,
      emAnalise,
      concluidos,
      reincidentes,
      criticos,
      riscoOculto,
      extraSim,
      taxaExtra,
      shiftMap,
      tenureDist,
      emAtraso,
      topTags,
      areaMap,
      topSupervisors,
      topPersons,
      topEquipments,
      periods,
    };
  }, [filteredEvents]);

  const maxAreaCount = Math.max(...Object.values(metrics.areaMap), 1);
  const maxEqCount = Math.max(...metrics.topEquipments.map(([, c]) => c), 1);
  const maxPeriodCount = Math.max(...Object.values(metrics.periods), 1);

  const isDateFiltered = Boolean(startDateInput || endDateInput);

  return (
    <div className="space-y-6">
      {/* 📅 Interactive Date Filters Panel on Dashboard */}
      <div className="p-4 sm:p-5 busato-card rounded-2xl shadow-sm space-y-4">
        {/* Header of Filter Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#1e2f4a]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[#1e73be]/15 text-[#38bdf8] border border-[#1e73be]/30">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2 font-brand tracking-wide">
                Filtros por Período & Análise Temporal
                {isDateFiltered && (
                  <span className="text-[10px] bg-sky-500/10 text-sky-400 border border-sky-500/30 px-2 py-0.5 rounded-full font-mono">
                    Período Ativo
                  </span>
                )}
              </h2>
              <p className="text-[11px] text-slate-400">
                Selecione o intervalo de datas para recalcular indicadores, áreas e reincidências em tempo real.
              </p>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex items-center gap-2">
            {isDateFiltered && (
              <button
                onClick={handleClearDateFilter}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-300 hover:text-white bg-[#131d2e] hover:bg-[#1a273d] border border-[#20334f] rounded-xl transition cursor-pointer"
                title="Limpar filtro de data"
              >
                <RotateCcw className="w-3.5 h-3.5 text-sky-400" />
                <span>Limpar Filtro</span>
              </button>
            )}

            <button
              onClick={() =>
                exportEventsListPDF(
                  filteredEvents,
                  `Período: ${startDateInput || 'Início'} até ${endDateInput || 'Atual'}`
                )
              }
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-200 bg-[#131d2e] hover:bg-[#1a273d] border border-[#20334f] rounded-xl transition cursor-pointer"
              title="Exportar PDF do período filtrado"
            >
              <FileDown className="w-3.5 h-3.5 text-rose-400" />
              <span>Exportar PDF ({metrics.total})</span>
            </button>

            {onNavigateToTableWithDates && isDateFiltered && (
              <button
                onClick={() => onNavigateToTableWithDates(startDateInput, endDateInput)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-sky-300 bg-sky-500/15 hover:bg-sky-500/25 border border-sky-500/30 rounded-xl transition cursor-pointer"
              >
                <span>Ver na Tabela</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Date Presets Buttons Bar */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          <span className="text-[11px] text-slate-400 font-medium mr-1 flex items-center gap-1">
            <Filter className="w-3 h-3 text-slate-400" />
            Atalhos:
          </span>

          <button
            onClick={() => applyPreset('todos')}
            className={`px-3 py-1.5 rounded-lg font-medium transition cursor-pointer ${
              activePreset === 'todos'
                ? 'bg-[#1e73be] text-white shadow-xs font-semibold'
                : 'bg-[#121c2d] text-slate-300 hover:bg-[#19273e] hover:text-white border border-[#20334f]'
            }`}
          >
            Todos os Períodos
          </button>

          <button
            onClick={() => applyPreset('mes-atual')}
            className={`px-3 py-1.5 rounded-lg font-medium transition cursor-pointer ${
              activePreset === 'mes-atual'
                ? 'bg-[#1e73be] text-white shadow-xs font-semibold'
                : 'bg-[#121c2d] text-slate-300 hover:bg-[#19273e] hover:text-white border border-[#20334f]'
            }`}
          >
            Mês Atual (Outubro)
          </button>

          <button
            onClick={() => applyPreset('ultimos-30')}
            className={`px-3 py-1.5 rounded-lg font-medium transition cursor-pointer ${
              activePreset === 'ultimos-30'
                ? 'bg-[#1e73be] text-white shadow-xs font-semibold'
                : 'bg-[#121c2d] text-slate-300 hover:bg-[#19273e] hover:text-white border border-[#20334f]'
            }`}
          >
            Últimos 30 dias
          </button>

          <button
            onClick={() => applyPreset('ultimos-60')}
            className={`px-3 py-1.5 rounded-lg font-medium transition cursor-pointer ${
              activePreset === 'ultimos-60'
                ? 'bg-[#1e73be] text-white shadow-xs font-semibold'
                : 'bg-[#121c2d] text-slate-300 hover:bg-[#19273e] hover:text-white border border-[#20334f]'
            }`}
          >
            Últimos 60 dias
          </button>

          <button
            onClick={() => applyPreset('t1')}
            className={`px-3 py-1.5 rounded-lg font-medium transition cursor-pointer ${
              activePreset === 't1'
                ? 'bg-[#1e73be] text-white shadow-xs font-semibold'
                : 'bg-[#121c2d] text-slate-300 hover:bg-[#19273e] hover:text-white border border-[#20334f]'
            }`}
          >
            1º Tri (Jan - Mar)
          </button>

          <button
            onClick={() => applyPreset('t2')}
            className={`px-3 py-1.5 rounded-lg font-medium transition cursor-pointer ${
              activePreset === 't2'
                ? 'bg-[#1e73be] text-white shadow-xs font-semibold'
                : 'bg-[#121c2d] text-slate-300 hover:bg-[#19273e] hover:text-white border border-[#20334f]'
            }`}
          >
            2º Tri (Abr - Jun)
          </button>

          <button
            onClick={() => applyPreset('t3')}
            className={`px-3 py-1.5 rounded-lg font-medium transition cursor-pointer ${
              activePreset === 't3'
                ? 'bg-[#1e73be] text-white shadow-xs font-semibold'
                : 'bg-[#121c2d] text-slate-300 hover:bg-[#19273e] hover:text-white border border-[#20334f]'
            }`}
          >
            3º Tri (Jul - Set)
          </button>

          <button
            onClick={() => applyPreset('t4')}
            className={`px-3 py-1.5 rounded-lg font-medium transition cursor-pointer ${
              activePreset === 't4'
                ? 'bg-[#1e73be] text-white shadow-xs font-semibold'
                : 'bg-[#121c2d] text-slate-300 hover:bg-[#19273e] hover:text-white border border-[#20334f]'
            }`}
          >
            4º Tri (Out - Dez)
          </button>
        </div>

        {/* Custom Date Pickers Inputs */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-center pt-1 text-xs">
          <div>
            <label className="block text-[11px] font-medium text-slate-300 mb-1 flex items-center gap-1">
              <span>Data Inicial</span>
              {startDateInput && <span className="text-[#38bdf8]">•</span>}
            </label>
            <input
              type="date"
              value={startDateInput}
              onChange={(e) => handleCustomDateChange(e.target.value, endDateInput)}
              className="w-full px-3 py-2 bg-[#101726] border border-[#1e2f4a] rounded-xl text-white focus:outline-hidden focus:border-[#1e73be] font-mono transition"
            />
          </div>

          <div>
            <label className="block text-[11px] font-medium text-slate-300 mb-1 flex items-center gap-1">
              <span>Data Final</span>
              {endDateInput && <span className="text-[#38bdf8]">•</span>}
            </label>
            <input
              type="date"
              value={endDateInput}
              onChange={(e) => handleCustomDateChange(startDateInput, e.target.value)}
              className="w-full px-3 py-2 bg-[#101726] border border-[#1e2f4a] rounded-xl text-white focus:outline-hidden focus:border-[#1e73be] font-mono transition"
            />
          </div>

          {/* Active Range Summary Pill */}
          <div className="p-3 bg-[#101726] rounded-xl border border-[#1e2f4a] text-[11px] text-slate-300 flex items-center justify-between">
            <div>
              <span className="text-slate-400 block text-[10px]">Total no Intervalo:</span>
              <strong className="text-white text-xs font-semibold">
                {metrics.total} de {events.length} ocorrências
              </strong>
            </div>
            <div className="text-right">
              <span className="text-[#38bdf8] font-mono font-bold">
                {events.length > 0 ? Math.round((metrics.total / events.length) * 100) : 0}%
              </span>
              <span className="text-slate-400 text-[10px] block">do total geral</span>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total */}
        <div
          onClick={() => onSelectFilterStatus('', startDateInput, endDateInput)}
          className="p-4.5 rounded-2xl busato-card busato-card-hover transition shadow-sm cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-300">Total no Período</span>
            <div className="p-2 rounded-xl bg-[#1e73be]/15 text-[#38bdf8] group-hover:scale-110 transition border border-[#1e73be]/30">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-white font-brand">{metrics.total}</span>
            <span className="text-[11px] text-slate-400">eventos</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-400 flex items-center gap-1">
            <TrendingUp className="w-3 h-3 text-emerald-400" />
            <span>
              {isDateFiltered ? 'Intervalo selecionado' : 'Consolidado total 2026'}
            </span>
          </div>
        </div>

        {/* Pendentes / Em Investigação */}
        <div
          onClick={() => onSelectFilterStatus('Pendente', startDateInput, endDateInput)}
          className="p-4.5 rounded-2xl busato-card busato-card-hover hover:border-rose-500/50 transition shadow-sm cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-300">Pendentes / Em Análise</span>
            <div className="p-2 rounded-xl bg-rose-500/15 text-rose-400 group-hover:scale-110 transition border border-rose-500/30">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-rose-400 font-brand">
              {metrics.pendentes + metrics.emAnalise}
            </span>
            <span className="text-[11px] text-slate-400">em tratativa</span>
          </div>
          <div className="mt-2 text-[11px] text-rose-300/80">
            {metrics.pendentes} pendentes • {metrics.emAnalise} em investigação
          </div>
        </div>

        {/* Concluídos */}
        <div
          onClick={() => onSelectFilterStatus('Concluído', startDateInput, endDateInput)}
          className="p-4.5 rounded-2xl busato-card busato-card-hover hover:border-emerald-500/50 transition shadow-sm cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-300">Eventos Concluídos</span>
            <div className="p-2 rounded-xl bg-emerald-500/15 text-emerald-400 group-hover:scale-110 transition border border-emerald-500/30">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-emerald-400 font-brand">
              {metrics.concluidos}
            </span>
            <span className="text-[11px] text-emerald-400/80 font-medium">
              ({metrics.total > 0 ? Math.round((metrics.concluidos / metrics.total) * 100) : 0}%)
            </span>
          </div>
          <div className="mt-2 text-[11px] text-slate-400">
            Ações e análises finalizadas
          </div>
        </div>

        {/* Severidade & Reincidência */}
        <div className="p-4.5 rounded-2xl busato-card busato-card-hover transition shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-300">Casos Críticos & Reincidência</span>
            <div className="p-2 rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/30">
              <ShieldAlert className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-amber-400 font-brand">
              {metrics.criticos}
            </span>
            <span className="text-[11px] text-slate-400">severos</span>
          </div>
          <div className="mt-2 text-[11px] text-amber-300/80">
            {metrics.reincidentes} ocorrências com reincidência
          </div>
        </div>
      </div>

      {/* 🔬 Seção Analista de Dados: Indicadores de Diagnóstico Operacional & Risco Oculto */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 px-1">
          <Activity className="w-4 h-4 text-amber-400" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400 font-brand">
            Diagnóstico Operacional & Identificação de Causa Raiz
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Risco Oculto / Quase-Acidentes */}
          <div className="p-4 rounded-2xl busato-card border-amber-500/30 bg-amber-950/10 shadow-sm relative overflow-hidden group">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-bold text-amber-300">
                <AlertOctagon className="w-3.5 h-3.5 text-amber-400" />
                <span>Risco Oculto / Quase-Acidente</span>
              </div>
              <span className="text-[10px] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded-md font-mono">
                {metrics.total > 0 ? Math.round((metrics.riscoOculto / metrics.total) * 100) : 0}%
              </span>
            </div>
            <div className="mt-2.5 flex items-baseline gap-2">
              <span className="text-2xl font-black text-amber-400 font-brand">{metrics.riscoOculto}</span>
              <span className="text-[11px] text-slate-400">eventos com alto potencial</span>
            </div>
            <p className="mt-1.5 text-[10px] text-slate-400 leading-tight">
              Ocorrências de gravidade real leve, mas com <strong>potencial grave/crítico</strong>.
            </p>
          </div>

          {/* Card 2: Índice de Fadiga & Horas Extras */}
          <div className="p-4 rounded-2xl busato-card border-purple-500/30 bg-purple-950/10 shadow-sm relative overflow-hidden group">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-bold text-purple-300">
                <Zap className="w-3.5 h-3.5 text-purple-400" />
                <span>Fator Fadiga (Trabalho Extra)</span>
              </div>
              <span className="text-[10px] bg-purple-500/20 text-purple-300 px-1.5 py-0.5 rounded-md font-mono">
                {metrics.taxaExtra}%
              </span>
            </div>
            <div className="mt-2.5 flex items-baseline gap-2">
              <span className="text-2xl font-black text-purple-300 font-brand">{metrics.extraSim}</span>
              <span className="text-[11px] text-slate-400">em regime de extra</span>
            </div>
            <p className="mt-1.5 text-[10px] text-slate-400 leading-tight">
              Colaboradores que estavam cumprindo <strong>jornada extra</strong> no momento da falha.
            </p>
          </div>

          {/* Card 3: Atraso de SLA / Eficiência da Liderança */}
          <div className="p-4 rounded-2xl busato-card border-rose-500/30 bg-rose-950/10 shadow-sm relative overflow-hidden group">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-bold text-rose-300">
                <Hourglass className="w-3.5 h-3.5 text-rose-400" />
                <span>SLA de Investigação</span>
              </div>
              <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-mono ${metrics.emAtraso > 0 ? 'bg-rose-500/20 text-rose-300' : 'bg-emerald-500/20 text-emerald-300'}`}>
                {metrics.emAtraso > 0 ? `${metrics.emAtraso} atrasados` : 'Em dia'}
              </span>
            </div>
            <div className="mt-2.5 flex items-baseline gap-2">
              <span className="text-2xl font-black text-rose-400 font-brand">{metrics.emAtraso}</span>
              <span className="text-[11px] text-slate-400">fora do prazo de análise</span>
            </div>
            <p className="mt-1.5 text-[10px] text-slate-400 leading-tight">
              Ocorrências abertas que já <strong>superaram o prazo estipulado</strong> pela gestão.
            </p>
          </div>

          {/* Card 4: Curva de Tempo de Empresa */}
          <div className="p-4 rounded-2xl busato-card border-sky-500/30 bg-sky-950/10 shadow-sm relative overflow-hidden group">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-bold text-sky-300">
                <Target className="w-3.5 h-3.5 text-sky-400" />
                <span>Perfil de Experiência</span>
              </div>
              <span className="text-[10px] bg-sky-500/20 text-sky-300 px-1.5 py-0.5 rounded-md font-mono">
                {metrics.tenureDist.novatos} novatos
              </span>
            </div>
            <div className="mt-2.5 flex items-baseline gap-2">
              <span className="text-2xl font-black text-sky-400 font-brand">
                {metrics.total > 0 ? Math.round((metrics.tenureDist.novatos / metrics.total) * 100) : 0}%
              </span>
              <span className="text-[11px] text-slate-400">&lt; 1 ano de casa</span>
            </div>
            <p className="mt-1.5 text-[10px] text-slate-400 leading-tight">
              Indica se a falha está concentrada em <strong>falta de treino/integração</strong>.
            </p>
          </div>
        </div>
      </div>

      {/* Main Charts & Indicators Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Controle por Área */}
        <div className="p-5 rounded-2xl busato-card shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-[#1e2f4a]">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-sky-400" />
              <h3 className="text-sm font-bold text-white font-brand">Controle por Área</h3>
            </div>
            <span className="text-[11px] text-slate-400">Clique para filtrar</span>
          </div>

          <div className="space-y-3">
            {Object.keys(metrics.areaMap).length === 0 ? (
              <p className="text-xs text-slate-500 italic py-4 text-center">Nenhum evento no período.</p>
            ) : (
              Object.entries(metrics.areaMap).map(([areaName, count]) => {
                const pct = metrics.total > 0 ? Math.round((count / metrics.total) * 100) : 0;
                const barWidth = Math.round((count / maxAreaCount) * 100);

                return (
                  <div
                    key={areaName}
                    onClick={() => onSelectFilterArea(areaName, startDateInput, endDateInput)}
                    className="space-y-1.5 p-2 rounded-xl hover:bg-[#1a283f]/60 cursor-pointer transition"
                  >
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-semibold text-slate-200">{areaName}</span>
                      <span className="text-sky-300/80 font-mono text-[11px]">
                        {count} eventos ({pct}%)
                      </span>
                    </div>
                    <div className="h-2 w-full bg-[#101726] rounded-full overflow-hidden border border-[#1e2f4a]/50">
                      <div
                        className="h-full bg-linear-to-r from-[#1e73be] to-[#38bdf8] rounded-full transition-all duration-500"
                        style={{ width: `${barWidth}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Controle de Pessoas & Encarregados */}
        <div className="p-5 rounded-2xl busato-card shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-[#1e2f4a]">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-sky-400" />
              <h3 className="text-sm font-bold text-white font-brand">Liderança / Encarregados</h3>
            </div>
            <span className="text-[11px] text-slate-400">Volume no Período</span>
          </div>

          <div className="space-y-2.5">
            {metrics.topSupervisors.length === 0 ? (
              <p className="text-xs text-slate-500 italic py-4 text-center">Nenhum encarregado no período.</p>
            ) : (
              metrics.topSupervisors.map(([name, count]) => (
                <div
                  key={name}
                  onClick={() => onSelectFilterSupervisor(name, startDateInput, endDateInput)}
                  className="flex items-center justify-between p-2 rounded-xl hover:bg-[#1a283f]/60 cursor-pointer transition text-xs"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-6 h-6 rounded-full bg-[#1e73be]/20 text-sky-300 border border-[#1e73be]/30 flex items-center justify-center font-bold text-[10px] shrink-0 font-brand">
                      {name.charAt(0)}
                    </div>
                    <span className="font-medium text-slate-200 truncate">{name}</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-md bg-[#121c2c] text-sky-300 font-mono text-[11px] font-semibold shrink-0 border border-[#1e2f4a]">
                    {count}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Equipamentos Mais Envolvidos */}
        <div className="p-5 rounded-2xl busato-card shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-[#1e2f4a]">
            <div className="flex items-center gap-2">
              <Truck className="w-4 h-4 text-emerald-400" />
              <h3 className="text-sm font-bold text-white font-brand">Tipos de Equipamento</h3>
            </div>
            <span className="text-[11px] text-slate-400">Maquinário</span>
          </div>

          <div className="space-y-3">
            {metrics.topEquipments.length === 0 ? (
              <p className="text-xs text-slate-500 italic py-4 text-center">Nenhum equipamento no período.</p>
            ) : (
              metrics.topEquipments.map(([eqName, count]) => {
                const barWidth = Math.round((count / maxEqCount) * 100);

                return (
                  <div key={eqName} className="space-y-1.5 p-2 rounded-xl hover:bg-[#1a283f]/60 transition">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-medium text-slate-200 truncate">{eqName}</span>
                      <span className="text-slate-400 font-mono text-[11px]">{count}</span>
                    </div>
                    <div className="h-2 w-full bg-[#101726] rounded-full overflow-hidden border border-[#1e2f4a]/50">
                      <div
                        className="h-full bg-linear-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-500"
                        style={{ width: `${barWidth}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Second Row: Envolvidos & Distribuição de Horários */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pessoas Envolvidas / Reincidência */}
        <div className="p-5 rounded-2xl busato-card shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-[#1e2f4a]">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-indigo-400" />
              <h3 className="text-sm font-bold text-white font-brand">Controle de Pessoas & Envolvidos</h3>
            </div>
            <span className="text-[11px] text-slate-400">Reincidência</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {metrics.topPersons.length === 0 ? (
              <p className="text-xs text-slate-500 italic py-4 text-center col-span-2">Nenhuma pessoa registrada no período.</p>
            ) : (
              metrics.topPersons.map(([personName, data]) => (
                <div
                  key={personName}
                  onClick={() => onSelectFilterPerson(personName, startDateInput, endDateInput)}
                  className="p-3 bg-[#101726]/80 rounded-xl border border-[#1e2f4a] hover:border-[#2f4973] cursor-pointer transition space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-xs text-slate-200 truncate">{personName}</span>
                    <span className="px-2 py-0.5 rounded-md bg-[#1e73be]/15 text-[#38bdf8] font-mono text-[11px] font-bold border border-[#1e73be]/25">
                      {data.count} {data.count === 1 ? 'registro' : 'registros'}
                    </span>
                  </div>
                  <div className="text-[10px]">
                    {data.count > 1 ? (
                      <span className="text-rose-400 font-semibold">⚠️ Reincidência no período</span>
                    ) : (
                      <span className="text-slate-400">Registro único no período</span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Faixa Horária das Ocorrências */}
        <div className="p-5 rounded-2xl busato-card shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-[#1e2f4a]">
            <div className="flex items-center gap-2">
              <CalendarDays className="w-4 h-4 text-sky-400" />
              <h3 className="text-sm font-bold text-white font-brand">Distribuição por Faixa Horária</h3>
            </div>
            <span className="text-[11px] text-slate-400">Picos de Turno</span>
          </div>

          <div className="grid grid-cols-4 gap-2 pt-2">
            {Object.entries(metrics.periods).map(([period, count]) => {
              const heightPct = count > 0 ? Math.max(Math.round((count / maxPeriodCount) * 100), 15) : 5;

              return (
                <div key={period} className="flex flex-col items-center justify-end h-36 gap-2">
                  <span className="text-xs font-mono font-bold text-sky-300">{count}</span>
                  <div className="w-full bg-[#101726] rounded-lg p-1 flex items-end justify-center h-24 border border-[#1e2f4a]/50">
                    <div
                      className="w-full bg-linear-to-t from-[#155592] to-[#38bdf8] rounded-md transition-all duration-500 shadow-sm"
                      style={{ height: `${heightPct}%` }}
                    />
                  </div>
                  <span className="text-[11px] text-slate-400 font-medium text-center">{period}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 📊 Terceira Linha: Diagnóstico Avançado de Causa Raiz */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Curva de Experiência / Tempo de Empresa */}
        <div className="p-5 rounded-2xl busato-card shadow-sm space-y-4 border-sky-500/20">
          <div className="flex items-center justify-between pb-2 border-b border-[#1e2f4a]">
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-sky-400" />
              <h3 className="text-sm font-bold text-white font-brand">Curva de Experiência</h3>
            </div>
            <span className="text-[11px] text-slate-400">Tempo de Casa</span>
          </div>

          <p className="text-[11px] text-slate-400 leading-relaxed">
            Identifica se os incidentes decorrem de <strong>curva de aprendizado</strong> (&lt; 1 ano) ou <strong>complacência / rotina</strong> (&gt; 3 anos).
          </p>

          <div className="space-y-3 pt-1">
            {/* Novatos */}
            <div className="p-2.5 rounded-xl bg-[#101726] border border-[#1e2f4a] space-y-1.5">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-200 font-medium flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                  Novatos (&lt; 1 ano)
                </span>
                <span className="font-mono text-amber-300 font-bold text-[11px]">
                  {metrics.tenureDist.novatos} ({metrics.total > 0 ? Math.round((metrics.tenureDist.novatos / metrics.total) * 100) : 0}%)
                </span>
              </div>
              <div className="h-1.5 w-full bg-[#182337] rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-400 rounded-full transition-all duration-500"
                  style={{ width: `${metrics.total > 0 ? (metrics.tenureDist.novatos / metrics.total) * 100 : 0}%` }}
                />
              </div>
            </div>

            {/* Intermediários */}
            <div className="p-2.5 rounded-xl bg-[#101726] border border-[#1e2f4a] space-y-1.5">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-200 font-medium flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-sky-400"></span>
                  Intermediários (1 a 3 anos)
                </span>
                <span className="font-mono text-sky-300 font-bold text-[11px]">
                  {metrics.tenureDist.intermediario} ({metrics.total > 0 ? Math.round((metrics.tenureDist.intermediario / metrics.total) * 100) : 0}%)
                </span>
              </div>
              <div className="h-1.5 w-full bg-[#182337] rounded-full overflow-hidden">
                <div
                  className="h-full bg-sky-400 rounded-full transition-all duration-500"
                  style={{ width: `${metrics.total > 0 ? (metrics.tenureDist.intermediario / metrics.total) * 100 : 0}%` }}
                />
              </div>
            </div>

            {/* Veteranos */}
            <div className="p-2.5 rounded-xl bg-[#101726] border border-[#1e2f4a] space-y-1.5">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-200 font-medium flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-indigo-400"></span>
                  Veteranos (&gt; 3 anos)
                </span>
                <span className="font-mono text-indigo-300 font-bold text-[11px]">
                  {metrics.tenureDist.veteranos} ({metrics.total > 0 ? Math.round((metrics.tenureDist.veteranos / metrics.total) * 100) : 0}%)
                </span>
              </div>
              <div className="h-1.5 w-full bg-[#182337] rounded-full overflow-hidden">
                <div
                  className="h-full bg-indigo-400 rounded-full transition-all duration-500"
                  style={{ width: `${metrics.total > 0 ? (metrics.tenureDist.veteranos / metrics.total) * 100 : 0}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Turnos Operacionais & Fator Extra */}
        <div className="p-5 rounded-2xl busato-card shadow-sm space-y-4 border-purple-500/20">
          <div className="flex items-center justify-between pb-2 border-b border-[#1e2f4a]">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-purple-400" />
              <h3 className="text-sm font-bold text-white font-brand">Turnos & Horas Extras</h3>
            </div>
            <span className="text-[11px] text-purple-300 font-mono font-semibold">{metrics.taxaExtra}% em Extra</span>
          </div>

          <p className="text-[11px] text-slate-400 leading-relaxed">
            Concentração de eventos por escala de trabalho (Letra de Turno) versus trabalho extraordinário.
          </p>

          <div className="space-y-2.5 pt-1">
            {Object.entries(metrics.shiftMap).length === 0 ? (
              <p className="text-xs text-slate-500 italic py-4 text-center">Nenhum turno registrado no período.</p>
            ) : (
              Object.entries(metrics.shiftMap)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 4)
                .map(([turno, count]) => {
                  const pct = metrics.total > 0 ? Math.round((count / metrics.total) * 100) : 0;
                  return (
                    <div key={turno} className="flex items-center justify-between p-2.5 rounded-xl bg-[#101726] border border-[#1e2f4a] text-xs">
                      <div className="flex items-center gap-2">
                        <span className="w-7 h-7 rounded-lg bg-purple-500/15 text-purple-300 border border-purple-500/30 font-bold flex items-center justify-center font-brand text-xs">
                          {turno}
                        </span>
                        <div>
                          <span className="text-slate-200 font-medium block">Turno {turno}</span>
                          <span className="text-[10px] text-slate-400">{count} ocorrências</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="font-mono text-purple-300 font-bold text-xs">{pct}%</span>
                        <span className="text-[10px] text-slate-500 block">do volume</span>
                      </div>
                    </div>
                  );
                })
            )}
          </div>
        </div>

        {/* Placas & Tags Mais Ofensoras */}
        <div className="p-5 rounded-2xl busato-card shadow-sm space-y-4 border-rose-500/20">
          <div className="flex items-center justify-between pb-2 border-b border-[#1e2f4a]">
            <div className="flex items-center gap-2">
              <Truck className="w-4 h-4 text-rose-400" />
              <h3 className="text-sm font-bold text-white font-brand">Tags / Placas Ofensoras</h3>
            </div>
            <span className="text-[11px] text-slate-400">Ativos Críticos</span>
          </div>

          <p className="text-[11px] text-slate-400 leading-relaxed">
            Equipamentos com maior número de ocorrências acumuladas no período selecionado.
          </p>

          <div className="space-y-2 pt-1">
            {metrics.topTags.length === 0 ? (
              <p className="text-xs text-slate-500 italic py-4 text-center">Nenhuma placa/tag registrada no período.</p>
            ) : (
              metrics.topTags.map(([tag, count], idx) => (
                <div key={tag} className="flex items-center justify-between p-2 rounded-xl bg-[#101726] border border-[#1e2f4a] text-xs">
                  <div className="flex items-center gap-2.5">
                    <span className={`w-5 h-5 rounded-md flex items-center justify-center font-bold text-[10px] font-mono ${
                      idx === 0 ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40' : 'bg-[#182337] text-slate-300'
                    }`}>
                      #{idx + 1}
                    </span>
                    <span className="font-mono font-semibold text-slate-200">{tag}</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-md bg-rose-500/10 text-rose-300 font-mono text-[11px] font-bold border border-rose-500/25">
                    {count} {count === 1 ? 'evento' : 'eventos'}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
