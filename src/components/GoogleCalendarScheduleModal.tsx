import React, { useState } from 'react';
import { EventRecord } from '../types';
import { createGoogleCalendarEvent, buildGoogleCalendarWebUrl } from '../services/googleCalendarService';
import { Calendar, Clock, MapPin, Users, Check, AlertCircle, ExternalLink, X } from 'lucide-react';

interface Props {
  event: EventRecord;
  accessToken: string | null;
  onClose: () => void;
  onSuccess: (updatedEvent: EventRecord) => void;
}

export const GoogleCalendarScheduleModal: React.FC<Props> = ({
  event,
  accessToken,
  onClose,
  onSuccess,
}) => {
  // Compute default meeting time: tomorrow at 10:00
  const defaultDate = () => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    d.setHours(10, 0, 0, 0);
    return d.toISOString().slice(0, 16);
  };

  const [startDateTime, setStartDateTime] = useState<string>(defaultDate());
  const [durationMinutes, setDurationMinutes] = useState<number>(60);
  const [summary, setSummary] = useState<string>(
    `[SafeTrack] Análise e Investigação: Evento #${event.item} (${event.area})`
  );
  const [location, setLocation] = useState<string>(`${event.local || 'Base Operacional'} - ${event.area}`);
  const [attendeesInput, setAttendeesInput] = useState<string>(
    'alysonmish@gmail.com, seguranca@safetrack.com.br'
  );
  const [notes, setNotes] = useState<string>(
    `Reunião de Análise de Causa Raiz e Plano de Ação\n\n` +
    `Item: #${event.item}\n` +
    `Data Ocorrência: ${event.data} às ${event.horario}\n` +
    `Envolvido: ${event.envolvido || 'N/A'}\n` +
    `Encarregado: ${event.encarregado || 'N/A'}\n` +
    `Equipamento/Placa: ${event.equipamento} - ${event.placaTag}\n` +
    `Descrição:\n${event.descricao}`
  );

  const [showConfirmDialog, setShowConfirmDialog] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [calendarResult, setCalendarResult] = useState<{ id: string; htmlLink: string } | null>(null);

  const handlePreSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken) {
      // If not logged in, redirect to Google Calendar Web Link directly
      const url = buildGoogleCalendarWebUrl(event, startDateTime);
      window.open(url, '_blank', 'noopener,noreferrer');
      return;
    }
    // Must show explicit confirmation dialog per Workspace instructions
    setShowConfirmDialog(true);
  };

  const handleConfirmedSchedule = async () => {
    setShowConfirmDialog(false);
    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const start = new Date(startDateTime);
      const end = new Date(start.getTime() + durationMinutes * 60 * 1000);

      const attendees = attendeesInput
        .split(',')
        .map((s) => s.trim())
        .filter((s) => s.length > 0 && s.includes('@'));

      const result = await createGoogleCalendarEvent(accessToken!, {
        summary,
        description: notes,
        location,
        startDateTime: start.toISOString(),
        endDateTime: end.toISOString(),
        attendees,
      });

      setCalendarResult(result);
      const updated: EventRecord = {
        ...event,
        googleCalendarEventId: result.id,
        googleCalendarHtmlLink: result.htmlLink,
        prazoAnalise: start.toLocaleDateString('pt-BR'),
      };
      onSuccess(updated);
    } catch (err: any) {
      console.error('Failed to create calendar event:', err);
      setErrorMsg(err.message || 'Falha ao agendar na Google Agenda.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-xl busato-card border-[#1e2f4a] rounded-2xl shadow-2xl p-6 text-slate-100 my-8">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#1e2f4a]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-[#1e73be]/15 text-[#38bdf8] border border-[#1e73be]/30">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white font-brand">
                Agendar Investigação na Google Agenda
              </h3>
              <p className="text-xs text-slate-400">
                Evento #{event.item} • {event.area} • {event.data}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMsg && (
          <div className="mt-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {calendarResult ? (
          <div className="py-8 text-center space-y-4">
            <div className="w-12 h-12 mx-auto rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <Check className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-lg font-semibold text-white">
                Compromisso Agendado com Sucesso!
              </h4>
              <p className="text-sm text-slate-300 mt-1">
                A reunião foi registrada na sua Google Agenda e os participantes foram notificados.
              </p>
            </div>
            <div className="pt-2 flex justify-center gap-3">
              <a
                href={calendarResult.htmlLink}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-medium transition"
              >
                Abrir na Google Agenda <ExternalLink className="w-3.5 h-3.5" />
              </a>
              <button
                onClick={onClose}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium transition"
              >
                Fechar
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handlePreSubmit} className="space-y-4 mt-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Título do Evento na Agenda
              </label>
              <input
                type="text"
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                required
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white focus:outline-hidden focus:border-blue-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-blue-400" />
                  Data e Horário de Início
                </label>
                <input
                  type="datetime-local"
                  value={startDateTime}
                  onChange={(e) => setStartDateTime(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white focus:outline-hidden focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Duração
                </label>
                <select
                  value={durationMinutes}
                  onChange={(e) => setDurationMinutes(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white focus:outline-hidden focus:border-blue-500"
                >
                  <option value={30}>30 minutos</option>
                  <option value={45}>45 minutos</option>
                  <option value={60}>1 hora (Padrão)</option>
                  <option value={90}>1 hora e 30 min</option>
                  <option value={120}>2 horas</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                Local da Reunião / Inspeção
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white focus:outline-hidden focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-slate-400" />
                Convidados (E-mails separados por vírgula)
              </label>
              <input
                type="text"
                value={attendeesInput}
                onChange={(e) => setAttendeesInput(e.target.value)}
                placeholder="exemplo1@empresa.com, exemplo2@empresa.com"
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white focus:outline-hidden focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Pauta & Informações da Ocorrência
              </label>
              <textarea
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white focus:outline-hidden focus:border-blue-500 font-mono"
              />
            </div>

            <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
              <a
                href={buildGoogleCalendarWebUrl(event, startDateTime)}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 transition"
              >
                Abrir template web direto <ExternalLink className="w-3 h-3" />
              </a>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-medium transition flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
                >
                  <Calendar className="w-3.5 h-3.5" />
                  {isSubmitting ? 'Agendando...' : 'Criar no Google Agenda'}
                </button>
              </div>
            </div>
          </form>
        )}

        {/* User Confirmation Dialog (MANDATORY per Workspace Skill) */}
        {showConfirmDialog && (
          <div className="absolute inset-0 z-60 bg-slate-950/90 rounded-2xl p-6 flex flex-col justify-center items-center text-center">
            <div className="w-12 h-12 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center mb-3 border border-amber-500/30">
              <Calendar className="w-6 h-6" />
            </div>
            <h4 className="text-base font-semibold text-white">
              Confirmar Agendamento no Google Agenda
            </h4>
            <p className="text-xs text-slate-300 mt-2 max-w-md">
              Você confirma a criação do evento <strong>"{summary}"</strong> para{' '}
              <strong>{new Date(startDateTime).toLocaleString('pt-BR')}</strong> na sua conta do Google Agenda, com envio de convites para os participantes?
            </p>
            <div className="mt-6 flex items-center gap-3">
              <button
                type="button"
                onClick={() => setShowConfirmDialog(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmedSchedule}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-medium transition cursor-pointer"
              >
                Confirmar e Inserir no Calendário
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
