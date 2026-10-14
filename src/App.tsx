import React, { useState, useEffect, useCallback } from 'react';
import { EventRecord, FilterState, StatusType, NotificationLog, AppSettings } from './types';
import { api, DEFAULT_SETTINGS } from './services/api';
import { DashboardView } from './components/DashboardView';
import { EventsTableView } from './components/EventsTableView';
import { KanbanBoardView } from './components/KanbanBoardView';
import { CalendarAgendaView } from './components/CalendarAgendaView';
import { PublicFormView } from './components/PublicFormView';
import { EventFormModal } from './components/EventFormModal';
import { EventDetailModal } from './components/EventDetailModal';
import { GoogleCalendarScheduleModal } from './components/GoogleCalendarScheduleModal';
import { NotificationCenterModal } from './components/NotificationCenterModal';
import { SettingsManagerModal } from './components/SettingsManagerModal';
import { GoogleAuthButton } from './components/GoogleAuthButton';
import { User } from 'firebase/auth';
import {
  ShieldAlert,
  BarChart3,
  ListFilter,
  Kanban,
  Calendar,
  Plus,
  Bell,
  Share2,
  RefreshCw,
  FileSpreadsheet,
  Sun,
  Moon,
  Sliders
} from 'lucide-react';

export default function App() {
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    return (localStorage.getItem('safetrack_theme') as 'dark' | 'light') || 'dark';
  });
  const [activeTab, setActiveTab] = useState<'dashboard' | 'table' | 'kanban' | 'calendar' | 'public-form'>('dashboard');
  const [events, setEvents] = useState<EventRecord[]>([]);
  const [notifications, setNotifications] = useState<NotificationLog[]>([]);
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  // Sync theme with body element
  useEffect(() => {
    localStorage.setItem('safetrack_theme', theme);
    if (theme === 'light') {
      document.body.classList.add('light-theme');
    } else {
      document.body.classList.remove('light-theme');
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  // Google User & Token State
  const [googleUser, setGoogleUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);

  // Modal States
  const [showNewEventModal, setShowNewEventModal] = useState<boolean>(false);
  const [selectedEvent, setSelectedEvent] = useState<EventRecord | null>(null);
  const [schedulingEvent, setSchedulingEvent] = useState<EventRecord | null>(null);
  const [showNotificationModal, setShowNotificationModal] = useState<boolean>(false);
  const [showSettingsModal, setShowSettingsModal] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Filter State for Table
  const [filterState, setFilterState] = useState<FilterState>({
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

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Check URL query parameters for direct public form
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('form') === 'public' || params.get('form') === 'true') {
      setActiveTab('public-form');
    }
  }, []);

  const loadData = useCallback(async () => {
    try {
      const [eventsData, notifsData, settingsData] = await Promise.all([
        api.getEvents(),
        api.getNotifications(),
        api.getSettings(),
      ]);
      setEvents(eventsData);
      setNotifications(notifsData);
      setSettings(settingsData);
    } catch (err) {
      console.error('Error loading initial data:', err);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadData();
  };

  // Next sequence number calculation
  const nextItemNumber = events.reduce((max, ev) => Math.max(max, Number(ev.item) || 0), 1003) + 1;

  // Event handlers
  const handleEventCreated = (newEvent: EventRecord) => {
    setEvents((prev) => [newEvent, ...prev]);
    showToast(`Ocorrência #${newEvent.item} registrada com sucesso! E-mail enviado.`);
    loadData();
  };

  const handleEventUpdated = async (updated: EventRecord) => {
    const res = await api.updateEvent(updated.id, updated);
    setEvents((prev) => prev.map((e) => (e.id === updated.id ? res : e)));
    setSelectedEvent(res);
    showToast(`Ocorrência #${updated.item} atualizada.`);
  };

  const handleQuickStatusChange = async (id: string, newStatus: StatusType) => {
    const target = events.find((e) => e.id === id);
    if (!target) return;
    const updated = await api.updateEvent(id, { status: newStatus });
    setEvents((prev) => prev.map((e) => (e.id === id ? updated : e)));
    showToast(`Status do item #${target.item} alterado para "${newStatus}".`);
  };

  const handleDeleteEvent = async (id: string) => {
    await api.deleteEvent(id);
    setEvents((prev) => prev.filter((e) => e.id !== id));
    showToast('Ocorrência removida com sucesso.');
  };

  const handleFilterByArea = (area: string, start?: string, end?: string) => {
    setFilterState((prev) => ({
      ...prev,
      area,
      dataInicio: start !== undefined ? start : prev.dataInicio,
      dataFim: end !== undefined ? end : prev.dataFim,
    }));
    setActiveTab('table');
  };

  const handleFilterBySupervisor = (encarregado: string, start?: string, end?: string) => {
    setFilterState((prev) => ({
      ...prev,
      encarregado,
      dataInicio: start !== undefined ? start : prev.dataInicio,
      dataFim: end !== undefined ? end : prev.dataFim,
    }));
    setActiveTab('table');
  };

  const handleFilterByPerson = (envolvido: string, start?: string, end?: string) => {
    setFilterState((prev) => ({
      ...prev,
      search: envolvido,
      dataInicio: start !== undefined ? start : prev.dataInicio,
      dataFim: end !== undefined ? end : prev.dataFim,
    }));
    setActiveTab('table');
  };

  const handleFilterByStatus = (status: string, start?: string, end?: string) => {
    setFilterState((prev) => ({
      ...prev,
      status,
      dataInicio: start !== undefined ? start : prev.dataInicio,
      dataFim: end !== undefined ? end : prev.dataFim,
    }));
    setActiveTab('table');
  };

  const isExternalForm = typeof window !== 'undefined' && 
    (new URLSearchParams(window.location.search).get('form') === 'public' || new URLSearchParams(window.location.search).get('form') === 'true');

  if (activeTab === 'public-form') {
    return (
      <PublicFormView
        nextItemNumber={nextItemNumber}
        settings={settings}
        isExternal={isExternalForm}
        onBackToDashboard={() => setActiveTab('dashboard')}
      />
    );
  }

  return (
    <div className={`min-h-screen theme-bg-main ${theme === 'light' ? 'bg-[#f8fafc] text-slate-800' : 'bg-[#0b111c] text-slate-100'} flex flex-col font-sans selection:bg-blue-600 selection:text-white transition-colors duration-200`}>
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-70 bg-[#121c2d] border border-[#2a456e] text-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2.5 text-xs animate-in slide-in-from-bottom-2">
          <span className="w-2 h-2 rounded-full bg-sky-400 animate-pulse"></span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Navigation Header */}
      <header className={`sticky top-0 z-40 theme-header ${theme === 'light' ? 'bg-white/90 border-slate-200 shadow-sm' : 'bg-[#0d1422]/90 border-[#1b2b44] shadow-lg shadow-black/20'} backdrop-blur-md border-b px-4 sm:px-6 py-3 transition-colors duration-200`}>
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Logo & Title */}
          <div className="flex items-center gap-3">
            <div className={`relative flex items-center justify-center p-1 rounded-xl ${theme === 'light' ? 'bg-slate-100 border-slate-300 shadow-xs' : 'bg-[#131e30] border-[#233a5e] shadow-md shadow-blue-900/30'}`}>
              <img
                src="/logo-icon.png"
                alt="Busato"
                className="w-8 h-8 object-contain drop-shadow-[0_2px_8px_rgba(30,115,190,0.6)]"
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className={`font-brand font-black text-base sm:text-lg tracking-wider ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>
                  BUSATO
                </h1>
                <span className={`text-[10px] font-mono font-semibold px-2.5 py-0.5 rounded-full border ${theme === 'light' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-[#162740] text-[#38bdf8] border-[#23436b]'}`}>
                  Operações & SESMT
                </span>
                <span className="hidden md:inline-flex items-center gap-1.5 text-[10px] text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  Tempo Real
                </span>
              </div>
              <p className={`text-[11px] font-medium ${theme === 'light' ? 'text-slate-500' : 'text-slate-400'}`}>
                Controle, Monitoramento e Gestão de Ocorrências
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 flex-wrap justify-end">
            {/* Theme Toggle Button (Preto / Branco) */}
            <button
              onClick={toggleTheme}
              className={`flex items-center gap-1.5 px-2.5 py-2 text-xs font-medium rounded-xl border transition cursor-pointer ${
                theme === 'light'
                  ? 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-700'
                  : 'bg-[#131d2e] hover:bg-[#1a273d] border-[#20334f] text-slate-300'
              }`}
              title={theme === 'light' ? 'Mudar para Fundo Preto (Modo Escuro)' : 'Mudar para Fundo Branco (Modo Claro)'}
            >
              {theme === 'light' ? (
                <>
                  <Moon className="w-4 h-4 text-indigo-600" />
                  <span className="hidden sm:inline">Preto</span>
                </>
              ) : (
                <>
                  <Sun className="w-4 h-4 text-amber-400" />
                  <span className="hidden sm:inline">Branco</span>
                </>
              )}
            </button>

            {/* Realtime Refresh */}
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className={`p-2 rounded-xl border transition cursor-pointer ${
                theme === 'light'
                  ? 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-600'
                  : 'bg-[#131d2e] hover:bg-[#1a273d] border-[#20334f] text-slate-400 hover:text-white'
              }`}
              title="Atualizar dados em tempo real"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-sky-400' : ''}`} />
            </button>

            {/* Notification Bell */}
            <button
              onClick={() => setShowNotificationModal(true)}
              className="relative p-2 text-slate-400 hover:text-white bg-[#131d2e] hover:bg-[#1a273d] border border-[#20334f] rounded-xl transition cursor-pointer"
              title="Central de Notificações e E-mails"
            >
              <Bell className="w-4 h-4" />
              {notifications.length > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#1e73be] text-[9px] font-bold text-white rounded-full flex items-center justify-center shadow-xs">
                  {notifications.length}
                </span>
              )}
            </button>

            {/* Gestão de Dados e Alertas (Encarregados, Equipamentos, Turnos e E-mails) */}
            <button
              onClick={() => setShowSettingsModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 rounded-xl transition cursor-pointer"
              title="Gerenciar Encarregados, Turnos, Equipamentos e E-mails de Alerta"
            >
              <Sliders className="w-3.5 h-3.5 text-amber-400" />
              <span>Gestão de Cadastros</span>
            </button>

            {/* Public Link Share */}
            <button
              onClick={() => setActiveTab('public-form')}
              className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 bg-[#131d2e] hover:bg-[#1a273d] border border-[#20334f] rounded-xl transition cursor-pointer"
              title="Abrir ou copiar link de formulário para motoristas e operadores"
            >
              <Share2 className="w-3.5 h-3.5 text-sky-400" />
              <span>Link p/ Preenchimento</span>
            </button>

            {/* Google Sign In Component */}
            <GoogleAuthButton
              onAuthStateChange={(u, token) => {
                setGoogleUser(u);
                setAccessToken(token);
              }}
            />

            {/* Novo Evento CTA */}
            <button
              onClick={() => setShowNewEventModal(true)}
              className="busato-gradient-btn flex items-center gap-1.5 px-3.5 py-1.5 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/25 transition active:scale-98 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Novo Evento</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs Bar */}
        <div className={`max-w-7xl mx-auto flex items-center gap-1 mt-3 border-t pt-2 overflow-x-auto text-xs ${theme === 'light' ? 'border-slate-200' : 'border-[#18263a]'}`}>
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg font-medium transition cursor-pointer whitespace-nowrap ${
              activeTab === 'dashboard'
                ? theme === 'light'
                  ? 'bg-blue-600 text-white shadow-xs font-semibold'
                  : 'bg-[#182a44] text-white border border-[#2b4d79] shadow-sm font-semibold'
                : theme === 'light'
                  ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-[#121d2d]'
            }`}
          >
            <BarChart3 className={`w-3.5 h-3.5 ${theme === 'light' && activeTab === 'dashboard' ? 'text-white' : 'text-sky-400'}`} />
            <span>Dashboard & Indicadores</span>
          </button>

          <button
            onClick={() => setActiveTab('table')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg font-medium transition cursor-pointer whitespace-nowrap ${
              activeTab === 'table'
                ? theme === 'light'
                  ? 'bg-blue-600 text-white shadow-xs font-semibold'
                  : 'bg-[#182a44] text-white border border-[#2b4d79] shadow-sm font-semibold'
                : theme === 'light'
                  ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-[#121d2d]'
            }`}
          >
            <ListFilter className={`w-3.5 h-3.5 ${theme === 'light' && activeTab === 'table' ? 'text-white' : 'text-blue-400'}`} />
            <span>Controle de Eventos ({events.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('kanban')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg font-medium transition cursor-pointer whitespace-nowrap ${
              activeTab === 'kanban'
                ? theme === 'light'
                  ? 'bg-blue-600 text-white shadow-xs font-semibold'
                  : 'bg-[#182a44] text-white border border-[#2b4d79] shadow-sm font-semibold'
                : theme === 'light'
                  ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-[#121d2d]'
            }`}
          >
            <Kanban className={`w-3.5 h-3.5 ${theme === 'light' && activeTab === 'kanban' ? 'text-white' : 'text-indigo-400'}`} />
            <span>Quadro de Status (Kanban)</span>
          </button>

          <button
            onClick={() => setActiveTab('calendar')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg font-medium transition cursor-pointer whitespace-nowrap ${
              activeTab === 'calendar'
                ? theme === 'light'
                  ? 'bg-blue-600 text-white shadow-xs font-semibold'
                  : 'bg-[#182a44] text-white border border-[#2b4d79] shadow-sm font-semibold'
                : theme === 'light'
                  ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-[#121d2d]'
            }`}
          >
            <Calendar className={`w-3.5 h-3.5 ${theme === 'light' && activeTab === 'calendar' ? 'text-white' : 'text-emerald-400'}`} />
            <span>Google Agenda & Prazos</span>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-3">
            <div className="w-10 h-10 border-3 border-[#1e73be]/20 border-t-[#1e73be] rounded-full animate-spin" />
            <p className="text-xs text-slate-400">Carregando base de ocorrências e indicadores...</p>
          </div>
        ) : (
          <>
            {activeTab === 'dashboard' && (
              <DashboardView
                events={events}
                onSelectFilterArea={handleFilterByArea}
                onSelectFilterSupervisor={handleFilterBySupervisor}
                onSelectFilterPerson={handleFilterByPerson}
                onSelectFilterStatus={handleFilterByStatus}
                onNavigateToTableWithDates={(start, end) => {
                  setFilterState((prev) => ({
                    ...prev,
                    dataInicio: start,
                    dataFim: end,
                  }));
                  setActiveTab('table');
                }}
              />
            )}

            {activeTab === 'table' && (
              <EventsTableView
                events={events}
                filterState={filterState}
                onFilterChange={setFilterState}
                onSelectEvent={(ev) => setSelectedEvent(ev)}
                onOpenCalendarModal={(ev) => setSchedulingEvent(ev)}
                onQuickStatusChange={handleQuickStatusChange}
              />
            )}

            {activeTab === 'kanban' && (
              <KanbanBoardView
                events={events}
                onSelectEvent={(ev) => setSelectedEvent(ev)}
                onOpenCalendarModal={(ev) => setSchedulingEvent(ev)}
                onStatusChange={handleQuickStatusChange}
              />
            )}

            {activeTab === 'calendar' && (
              <CalendarAgendaView
                events={events}
                user={googleUser}
                accessToken={accessToken}
                onOpenCalendarModal={(ev) => setSchedulingEvent(ev)}
                onSelectEvent={(ev) => setSelectedEvent(ev)}
              />
            )}
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-[#18263a] py-4 px-6 text-center text-xs text-slate-400 bg-[#0d1422]/60">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <img src="/logo-icon.png" alt="Busato" className="w-4 h-4 object-contain opacity-70" />
            <span className="font-semibold text-slate-300">BUSATO</span>
            <span>• Sistema Integrado de Operações, Logística e Segurança do Trabalho</span>
          </div>
          <div className="flex items-center gap-4 text-slate-400">
            <span>Notificações: alysonmish@gmail.com</span>
            <span>Google Agenda Integrado</span>
          </div>
        </div>
      </footer>

      {/* Modals */}
      {showNewEventModal && (
        <EventFormModal
          nextItemNumber={nextItemNumber}
          settings={settings}
          onClose={() => setShowNewEventModal(false)}
          onSuccess={handleEventCreated}
        />
      )}

      {selectedEvent && (
        <EventDetailModal
          event={selectedEvent}
          settings={settings}
          onClose={() => setSelectedEvent(null)}
          onUpdate={handleEventUpdated}
          onDelete={handleDeleteEvent}
          onOpenCalendarModal={(ev) => {
            setSelectedEvent(null);
            setSchedulingEvent(ev);
          }}
        />
      )}

      {schedulingEvent && (
        <GoogleCalendarScheduleModal
          event={schedulingEvent}
          accessToken={accessToken}
          onClose={() => setSchedulingEvent(null)}
          onSuccess={(updated) => {
            handleEventUpdated(updated);
            showToast(`Investigação do item #${updated.item} agendada na Google Agenda!`);
          }}
        />
      )}

      {showNotificationModal && (
        <NotificationCenterModal
          notifications={notifications}
          settings={settings}
          onClose={() => setShowNotificationModal(false)}
          onUpdateSettings={async (newSettings) => {
            const saved = await api.saveSettings(newSettings);
            setSettings(saved);
            showToast('Configurações de e-mail atualizadas.');
          }}
        />
      )}

      {showSettingsModal && (
        <SettingsManagerModal
          settings={settings}
          onClose={() => setShowSettingsModal(false)}
          onSave={async (newSettings) => {
            const saved = await api.saveSettings(newSettings);
            setSettings(saved);
            showToast('Dados cadastrais e alertas salvos com sucesso!');
          }}
        />
      )}
    </div>
  );
}
