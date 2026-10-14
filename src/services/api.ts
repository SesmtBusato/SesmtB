import { EventRecord, NotificationLog, AppSettings } from '../types';
import { INITIAL_EVENTS } from '../data/initialEvents';

const LOCAL_STORAGE_KEY = 'safetrack_events_db_v1';
const LOCAL_NOTIFS_KEY = 'safetrack_notifications_v1';
const LOCAL_SETTINGS_KEY = 'safetrack_settings_v1';

export const DEFAULT_SETTINGS: AppSettings = {
  companyName: 'BUSATO - Gestão e Monitoramento de Ocorrências',
  notificationEmails: [
    'alysonmish@gmail.com',
    'sesmt.operacional@busato.com.br',
    'gestao.risco@busato.com.br'
  ],
  autoNotifyOnCreate: true,
  notifyOnUpdate: true,
  googleCalendarEnabled: true,
  publicFormEnabled: true,
  supervisors: [
    'CRISTALLY NETTO',
    'DIEGO NEVES',
    'THIAGO DIAS',
    'HENRIQUE ZANOLI',
    'GABRIELE MONTARROYOS',
    'DEIVID ROGESTER',
    'EDUARDO BOY',
    'WADSON ANTONIO',
    'WELLINGTON REIS',
    'EDUANE PEROVANO',
    'AGRIMALDO DIAS',
    'LEONE PAIVA',
    'KURT COUTO',
    'PAULO GONDORINE',
    'CLEITON CONCEIÇÃO'
  ],
  shifts: [
    'Turno A (Manhã)',
    'Turno B (Tarde)',
    'Turno C (Noite/Madrugada)',
    'Turno D',
    'Administrativo'
  ],
  equipments: [
    'CAMINHÃO PIPA',
    'MINI CARREGADEIRA',
    'PÁ CARREGADEIRA',
    'CAMINHÃO CAÇAMBA',
    'CAMINHÃO BROOK',
    'VEICULO LEVE OPERACIONAL',
    'EMPILHADEIRA',
    'CARRETA PRANCHA',
    'MOTONIVELADORA',
    'N/A'
  ],
  areas: ['USINA', 'PORTO', 'BASE', 'EXTERNO', 'OUTROS']
};

function getLocalEvents(): EventRecord[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.error('Error reading localStorage events:', e);
  }
  // Initialize with initial events
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(INITIAL_EVENTS));
  } catch {}
  return INITIAL_EVENTS;
}

function saveLocalEvents(events: EventRecord[]) {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(events));
  } catch (e) {
    console.error('Error saving events to localStorage:', e);
  }
}

export const api = {
  async getEvents(): Promise<EventRecord[]> {
    try {
      const res = await fetch('/api/events');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          saveLocalEvents(data);
          return data;
        }
      }
    } catch (e) {
      console.warn('API /api/events offline, fallback to local storage:', e);
    }
    return getLocalEvents();
  },

  async createEvent(eventData: Partial<EventRecord>): Promise<EventRecord> {
    const localList = getLocalEvents();
    const maxItem = localList.reduce((max, ev) => Math.max(max, Number(ev.item) || 0), 1003);
    const newItemNumber = eventData.item || maxItem + 1;

    const fullEvent: EventRecord = {
      id: eventData.id || `ev-${Date.now()}`,
      item: newItemNumber,
      data: eventData.data || new Date().toLocaleDateString('pt-BR'),
      horario: eventData.horario || new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      diaSemana: eventData.diaSemana || new Intl.DateTimeFormat('pt-BR', { weekday: 'long' }).format(new Date()),
      descricao: eventData.descricao || '',
      local: eventData.local || '',
      area: eventData.area || 'USINA',
      equipamento: eventData.equipamento || '',
      placaTag: eventData.placaTag || '',
      envolvido: eventData.envolvido || '',
      letraTurno: eventData.letraTurno || 'Turno A',
      estavaDeExtra: eventData.estavaDeExtra || 'Não',
      encarregado: eventData.encarregado || '',
      dataAdmissao: eventData.dataAdmissao || '',
      tempoEmpresa: eventData.tempoEmpresa || '',
      dataNascimento: eventData.dataNascimento || '',
      idade: eventData.idade || '',
      tipoOcorrencia: eventData.tipoOcorrencia || 'Incidente Operacional',
      reincidente: eventData.reincidente || 'Não',
      quandoOcorreu: eventData.quandoOcorreu || 'Durante atividade',
      descricaoDano: eventData.descricaoDano || '',
      classificacaoReal: eventData.classificacaoReal || 'Leve',
      classificacaoPotencial: eventData.classificacaoPotencial || 'Moderado',
      numeroCat: eventData.numeroCat || '',
      periodoAfastamento: eventData.periodoAfastamento || '',
      prazoAnalise: eventData.prazoAnalise || '',
      status: eventData.status || 'Pendente',
      observacao: eventData.observacao || '',
      notificadoEmail: true,
      emailsNotificados: ['alysonmish@gmail.com'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    try {
      const res = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fullEvent)
      });
      if (res.ok) {
        const serverEvent = await res.json();
        const updated = [serverEvent, ...localList.filter((e) => e.id !== serverEvent.id)];
        saveLocalEvents(updated);
        return serverEvent;
      }
    } catch (e) {
      console.warn('API POST /api/events failed, saving locally:', e);
    }

    const updated = [fullEvent, ...localList];
    saveLocalEvents(updated);

    // Save notification locally too
    const notifs = api.getLocalNotifications();
    notifs.unshift({
      id: `notif-${Date.now()}`,
      eventId: fullEvent.id,
      item: fullEvent.item,
      envolvido: fullEvent.envolvido,
      encarregado: fullEvent.encarregado,
      area: fullEvent.area,
      recipients: ['alysonmish@gmail.com'],
      subject: `[Alerta Ocorrência #${fullEvent.item}] ${fullEvent.area} - ${fullEvent.tipoOcorrencia}`,
      timestamp: new Date().toISOString(),
      status: 'Entregue',
      previewText: fullEvent.descricao.substring(0, 120)
    });
    localStorage.setItem(LOCAL_NOTIFS_KEY, JSON.stringify(notifs.slice(0, 50)));

    return fullEvent;
  },

  async updateEvent(id: string, updates: Partial<EventRecord>): Promise<EventRecord> {
    const localList = getLocalEvents();
    const index = localList.findIndex((e) => e.id === id);

    let merged: EventRecord;
    if (index !== -1) {
      merged = { ...localList[index], ...updates, updatedAt: new Date().toISOString() };
      localList[index] = merged;
      saveLocalEvents(localList);
    } else {
      merged = updates as EventRecord;
    }

    try {
      const res = await fetch(`/api/events/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      if (res.ok) {
        const serverUpdated = await res.json();
        return serverUpdated;
      }
    } catch (e) {
      console.warn('API PUT failed, updated locally:', e);
    }

    return merged;
  },

  async deleteEvent(id: string): Promise<boolean> {
    const localList = getLocalEvents().filter((e) => e.id !== id);
    saveLocalEvents(localList);

    try {
      await fetch(`/api/events/${id}`, { method: 'DELETE' });
    } catch (e) {
      console.warn('API DELETE failed, removed locally:', e);
    }
    return true;
  },

  getLocalNotifications(): NotificationLog[] {
    try {
      const raw = localStorage.getItem(LOCAL_NOTIFS_KEY);
      if (raw) return JSON.parse(raw);
    } catch {}
    return [
      {
        id: 'notif-seed-1',
        eventId: 'ev-1003',
        item: 1003,
        envolvido: 'JOÃO CARLOS CHAGAS',
        encarregado: 'THIAGO DIAS',
        area: 'USINA',
        recipients: ['alysonmish@gmail.com'],
        subject: '[Alerta Ocorrência #1003] USINA - Incidente Operacional / Atolamento em Minério',
        timestamp: new Date().toISOString(),
        status: 'Entregue',
        previewText: 'Pá carregadeira atolada no leito de minério saturado no 7PA5 lado sul...'
      },
      {
        id: 'notif-seed-2',
        eventId: 'ev-1001',
        item: 1001,
        envolvido: 'MOTORISTA E AUXILIARES SODEXO',
        encarregado: 'CRISTALLY NETTO',
        area: 'PORTO',
        recipients: ['alysonmish@gmail.com'],
        subject: '[Alerta Ocorrência #1001] PORTO - Incidente Ambiental Crítico / Derramamento de Diesel',
        timestamp: new Date().toISOString(),
        status: 'Entregue',
        previewText: 'Tanque de combustível furado com derramamento de diesel na via...'
      }
    ];
  },

  async getNotifications(): Promise<NotificationLog[]> {
    try {
      const res = await fetch('/api/notifications');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) return data;
      }
    } catch {}
    return api.getLocalNotifications();
  },

  async getSettings(): Promise<AppSettings> {
    try {
      const res = await fetch('/api/settings');
      if (res.ok) {
        return await res.json();
      }
    } catch {}
    try {
      const raw = localStorage.getItem(LOCAL_SETTINGS_KEY);
      if (raw) return JSON.parse(raw);
    } catch {}
    return DEFAULT_SETTINGS;
  },

  async saveSettings(settings: AppSettings): Promise<AppSettings> {
    try {
      localStorage.setItem(LOCAL_SETTINGS_KEY, JSON.stringify(settings));
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      console.warn('Failed saving settings to server, saved locally:', e);
    }
    return settings;
  }
};
