import { EventRecord, NotificationLog, AppSettings } from '../types';
import { supabase } from './supabaseClient';

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
    if (raw !== null) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.error('Error reading localStorage events:', e);
  }
  return [];
}

function saveLocalEvents(events: EventRecord[]) {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(events));
  } catch (e) {
    console.error('Error saving events to localStorage:', e);
  }
}

function mapDbEventToApp(db: any): EventRecord {
  return {
    id: db.id,
    item: Number(db.item),
    data: db.data,
    horario: db.horario,
    diaSemana: db.dia_semana,
    descricao: db.descricao,
    local: db.local,
    area: db.area,
    equipamento: db.equipamento || '',
    placaTag: db.placa_tag || '',
    envolvido: db.envolvido || '',
    letraTurno: db.letra_turno || '',
    estavaDeExtra: db.estava_de_extra || '',
    encarregado: db.encarregado || '',
    dataAdmissao: db.data_admissao || '',
    tempoEmpresa: db.tempo_empresa || '',
    dataNascimento: db.data_nascimento || '',
    idade: db.idade || '',
    tipoOcorrencia: db.tipo_ocorrencia,
    reincidente: db.reincidente || '',
    quandoOcorreu: db.quando_ocorreu || '',
    descricaoDano: db.descricao_dano || '',
    classificacaoReal: db.classificacao_real,
    classificacaoPotencial: db.classificacao_potencial,
    numeroCat: db.numero_cat || '',
    periodoAfastamento: db.periodo_afastamento || '',
    prazoAnalise: db.prazo_analise || '',
    status: db.status,
    observacao: db.observacao || '',
    notificadoEmail: db.notificado_email,
    emailsNotificados: db.emails_notificados || [],
    googleCalendarEventId: db.google_calendar_event_id,
    googleCalendarHtmlLink: db.google_calendar_html_link,
    createdAt: db.created_at,
    updatedAt: db.updated_at
  };
}

function mapAppEventToDb(appEvent: any) {
  return {
    id: appEvent.id,
    item: Number(appEvent.item),
    data: appEvent.data,
    horario: appEvent.horario,
    dia_semana: appEvent.diaSemana,
    descricao: appEvent.descricao,
    local: appEvent.local,
    area: appEvent.area,
    equipamento: appEvent.equipamento,
    placa_tag: appEvent.placaTag,
    envolvido: appEvent.envolvido,
    letra_turno: appEvent.letraTurno,
    estava_de_extra: appEvent.estavaDeExtra,
    encarregado: appEvent.encarregado,
    data_admissao: appEvent.dataAdmissao,
    tempo_empresa: appEvent.tempoEmpresa,
    data_nascimento: appEvent.dataNascimento,
    idade: appEvent.idade,
    tipo_ocorrencia: appEvent.tipoOcorrencia,
    reincidente: appEvent.reincidente,
    quando_ocorreu: appEvent.quandoOcorreu,
    descricao_dano: appEvent.descricaoDano,
    classificacao_real: appEvent.classificacaoReal,
    classificacao_potencial: appEvent.classificacaoPotencial,
    numero_cat: appEvent.numeroCat,
    periodo_afastamento: appEvent.periodoAfastamento,
    prazo_analise: appEvent.prazoAnalise,
    status: appEvent.status,
    observacao: appEvent.observacao,
    notificado_email: appEvent.notificadoEmail || false,
    emails_notificados: appEvent.emailsNotificados || [],
    google_calendar_event_id: appEvent.googleCalendarEventId,
    google_calendar_html_link: appEvent.googleCalendarHtmlLink,
    updated_at: new Date().toISOString()
  };
}

export const api = {
  async getEvents(): Promise<EventRecord[]> {
    // 1. Tenta buscar no backend (quando rodando local ou em servidor com API)
    try {
      const res = await fetch('/api/events');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          saveLocalEvents(data);
          return data;
        }
      }
    } catch {}

    // 2. Tenta buscar direto no Supabase (produção estática como Vercel)
    if (supabase) {
      try {
        const { data, error } = await supabase.from('events').select('*').order('item', { ascending: false });
        if (!error && Array.isArray(data)) {
          const mapped = data.map(mapDbEventToApp);
          saveLocalEvents(mapped);
          return mapped;
        }
      } catch (e) {
        console.warn('Supabase direct query failed:', e);
      }
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

    // 1. Backend /api/events se disponível
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
    } catch {}

    // 2. Supabase direto (produção Vercel)
    if (supabase) {
      try {
        await supabase.from('events').insert(mapAppEventToDb(fullEvent));
      } catch (e) {
        console.warn('Supabase direct insert error:', e);
      }
    }

    const updated = [fullEvent, ...localList];
    saveLocalEvents(updated);

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
    } catch {}

    if (supabase) {
      try {
        await supabase.from('events').update(mapAppEventToDb(merged)).eq('id', id);
      } catch (e) {
        console.warn('Supabase direct update error:', e);
      }
    }

    return merged;
  },

  async deleteEvent(id: string): Promise<boolean> {
    const localList = getLocalEvents().filter((e) => e.id !== id);
    saveLocalEvents(localList);

    try {
      await fetch(`/api/events/${id}`, { method: 'DELETE' });
    } catch {}

    if (supabase) {
      try {
        await supabase.from('events').delete().eq('id', id);
      } catch (e) {
        console.warn('Supabase direct delete error:', e);
      }
    }

    return true;
  },

  async deleteAllEvents(): Promise<boolean> {
    saveLocalEvents([]);
    localStorage.removeItem(LOCAL_STORAGE_KEY);
    localStorage.removeItem(LOCAL_NOTIFS_KEY);

    try {
      await fetch('/api/events/all', { method: 'DELETE' });
    } catch {}

    if (supabase) {
      try {
        await supabase.from('events').delete().neq('id', 'dummy_never_match');
        await supabase.from('notifications').delete().neq('id', 'dummy_never_match');
      } catch (e) {
        console.warn('Supabase direct delete all error:', e);
      }
    }

    return true;
  },

  getLocalNotifications(): NotificationLog[] {
    try {
      const raw = localStorage.getItem(LOCAL_NOTIFS_KEY);
      if (raw) return JSON.parse(raw);
    } catch {}
    return [];
  },

  async getNotifications(): Promise<NotificationLog[]> {
    try {
      const res = await fetch('/api/notifications');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) return data;
      }
    } catch {}

    if (supabase) {
      try {
        const { data, error } = await supabase.from('notifications').select('*').order('timestamp', { ascending: false }).limit(100);
        if (!error && Array.isArray(data)) {
          return data.map((d: any) => ({
            id: d.id,
            eventId: d.event_id,
            item: d.item,
            envolvido: d.envolvido,
            encarregado: d.encarregado,
            area: d.area,
            recipients: d.recipients || [],
            subject: d.subject,
            timestamp: d.timestamp,
            status: d.status,
            previewText: d.preview_text
          }));
        }
      } catch (e) {
        console.warn('Supabase direct notifications query error:', e);
      }
    }

    return api.getLocalNotifications();
  },

  async getSettings(): Promise<AppSettings> {
    // 1. Tenta carregar do localStorage primeiro para manter as customizações do usuário
    try {
      const raw = localStorage.getItem(LOCAL_SETTINGS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        return {
          ...DEFAULT_SETTINGS,
          ...parsed,
          // Garante que se o usuário deletou todos ou alguns, a lista do usuário é respeitada
          supervisors: parsed.supervisors !== undefined ? parsed.supervisors : DEFAULT_SETTINGS.supervisors,
          equipments: parsed.equipments !== undefined ? parsed.equipments : DEFAULT_SETTINGS.equipments,
          shifts: parsed.shifts !== undefined ? parsed.shifts : DEFAULT_SETTINGS.shifts,
          areas: parsed.areas !== undefined ? parsed.areas : DEFAULT_SETTINGS.areas,
          notificationEmails: parsed.notificationEmails !== undefined ? parsed.notificationEmails : DEFAULT_SETTINGS.notificationEmails,
        };
      }
    } catch {}

    // 2. Tenta carregar do backend ou Supabase
    try {
      const res = await fetch('/api/settings');
      if (res.ok) {
        return await res.json();
      }
    } catch {}

    if (supabase) {
      try {
        const { data } = await supabase.from('settings').select('*').eq('id', 'app_settings').single();
        if (data) {
          return {
            ...DEFAULT_SETTINGS,
            companyName: data.company_name || DEFAULT_SETTINGS.companyName,
            notificationEmails: data.notification_emails || DEFAULT_SETTINGS.notificationEmails,
            autoNotifyOnCreate: data.auto_notify_on_create ?? DEFAULT_SETTINGS.autoNotifyOnCreate,
            googleCalendarEnabled: data.google_calendar_enabled ?? DEFAULT_SETTINGS.googleCalendarEnabled,
            publicFormEnabled: data.public_form_enabled ?? DEFAULT_SETTINGS.publicFormEnabled
          };
        }
      } catch {}
    }

    return DEFAULT_SETTINGS;
  },

  async saveSettings(settings: AppSettings): Promise<AppSettings> {
    try {
      localStorage.setItem(LOCAL_SETTINGS_KEY, JSON.stringify(settings));
    } catch (e) {
      console.warn('Failed saving settings to localStorage:', e);
    }

    try {
      await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });
    } catch {}

    if (supabase) {
      try {
        await supabase.from('settings').upsert({
          id: 'app_settings',
          company_name: settings.companyName,
          notification_emails: settings.notificationEmails,
          auto_notify_on_create: settings.autoNotifyOnCreate,
          google_calendar_enabled: settings.googleCalendarEnabled,
          public_form_enabled: settings.publicFormEnabled,
          updated_at: new Date().toISOString()
        });
      } catch (e) {
        console.warn('Supabase direct settings upsert error:', e);
      }
    }

    return settings;
  }
};
