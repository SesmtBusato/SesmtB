import express, { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json());

// Supabase Client Setup (Backend with Service Secret)
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://olrtzxamixygmrftcczc.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_PUBLISHABLE_KEY || '';

export const supabase = SUPABASE_KEY ? createClient(SUPABASE_URL, SUPABASE_KEY) : null;

const DATA_DIR = path.resolve(__dirname, 'data');
const EVENTS_FILE = path.resolve(DATA_DIR, 'events.json');
const NOTIFICATIONS_FILE = path.resolve(DATA_DIR, 'notifications.json');
const SETTINGS_FILE = path.resolve(DATA_DIR, 'settings.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Default settings
const DEFAULT_SETTINGS = {
  companyName: 'BUSATO - Gestão e Monitoramento de Ocorrências',
  notificationEmails: ['alysonmish@gmail.com', 'sesmt@busato.com.br', 'operacoes@busato.com.br'],
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

function readJsonFile<T>(filePath: string, fallback: T): T {
  try {
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, JSON.stringify(fallback, null, 2), 'utf-8');
      return fallback;
    }
    const data = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(data);
  } catch (err) {
    console.error(`Error reading ${filePath}:`, err);
    return fallback;
  }
}

function writeJsonFile(filePath: string, data: unknown): void {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error(`Error writing ${filePath}:`, err);
  }
}

// Map database snake_case to frontend camelCase
function mapDbEventToApp(db: any) {
  if (!db) return null;
  return {
    id: db.id,
    item: db.item,
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

// API Routes
app.get('/api/events', async (_req: Request, res: Response) => {
  try {
    if (supabase) {
      const { data, error } = await supabase.from('events').select('*').order('item', { ascending: false });
      if (!error && data && data.length > 0) {
        const mapped = data.map(mapDbEventToApp);
        writeJsonFile(EVENTS_FILE, mapped);
        return res.json(mapped);
      }
    }

    let events = readJsonFile<any[]>(EVENTS_FILE, []);
    if (!events || events.length === 0) {
      try {
        const { INITIAL_EVENTS } = await import('./src/data/initialEvents.ts');
        events = INITIAL_EVENTS;
        writeJsonFile(EVENTS_FILE, events);
      } catch (e) {
        console.warn('Could not auto-import INITIAL_EVENTS:', e);
      }
    }
    res.json(events);
  } catch (err) {
    console.error('Error fetching events:', err);
    res.status(500).json({ error: 'Erro ao carregar eventos' });
  }
});

app.post('/api/events', async (req: Request, res: Response) => {
  try {
    const events = readJsonFile<any[]>(EVENTS_FILE, []);
    const newEvent = req.body;

    if (!newEvent.id) {
      newEvent.id = `ev-${Date.now()}`;
    }
    if (!newEvent.item) {
      const maxItem = events.reduce((max, ev) => Math.max(max, Number(ev.item) || 0), 1003);
      newEvent.item = maxItem + 1;
    }
    newEvent.createdAt = new Date().toISOString();
    newEvent.updatedAt = new Date().toISOString();

    const settings = readJsonFile(SETTINGS_FILE, DEFAULT_SETTINGS);
    if (settings.autoNotifyOnCreate) {
      const notifications = readJsonFile<any[]>(NOTIFICATIONS_FILE, []);
      const notif = {
        id: `notif-${Date.now()}`,
        eventId: newEvent.id,
        item: newEvent.item,
        envolvido: newEvent.envolvido || 'Não informado',
        encarregado: newEvent.encarregado || 'Não informado',
        area: newEvent.area || 'Geral',
        recipients: settings.notificationEmails,
        subject: `[Alerta Ocorrência #${newEvent.item}] ${newEvent.area || 'Operação'} - ${newEvent.tipoOcorrencia || 'Novo Registro'}`,
        timestamp: new Date().toISOString(),
        status: 'Entregue',
        previewText: `${newEvent.descricao?.substring(0, 140)}... (Responsável: ${newEvent.encarregado || 'N/A'})`
      };
      notifications.unshift(notif);
      writeJsonFile(NOTIFICATIONS_FILE, notifications.slice(0, 100));
      newEvent.notificadoEmail = true;
      newEvent.emailsNotificados = settings.notificationEmails;

      if (supabase) {
        try {
          await supabase.from('notifications').insert({
            id: notif.id,
            event_id: notif.eventId,
            item: notif.item,
            envolvido: notif.envolvido,
            encarregado: notif.encarregado,
            area: notif.area,
            recipients: notif.recipients,
            subject: notif.subject,
            status: notif.status,
            preview_text: notif.previewText
          });
        } catch (e) {
          console.warn('Failed to insert notification into Supabase:', e);
        }
      }
    }

    if (supabase) {
      try {
        const dbPayload = mapAppEventToDb(newEvent);
        const { error } = await supabase.from('events').insert(dbPayload);
        if (error) {
          console.warn('Supabase insert warning (fallbacking to local):', error.message);
        }
      } catch (supErr) {
        console.warn('Supabase insert exception:', supErr);
      }
    }

    events.unshift(newEvent);
    writeJsonFile(EVENTS_FILE, events);

    res.status(201).json(newEvent);
  } catch (err) {
    console.error('Error creating event:', err);
    res.status(500).json({ error: 'Erro ao registrar evento' });
  }
});

app.put('/api/events/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const events = readJsonFile<any[]>(EVENTS_FILE, []);
    const index = events.findIndex((e) => e.id === id);

    if (index === -1) {
      return res.status(404).json({ error: 'Evento não encontrado' });
    }

    const oldStatus = events[index].status;
    const updatedEvent = {
      ...events[index],
      ...req.body,
      updatedAt: new Date().toISOString()
    };

    // Trigger notification if status was changed and notifyOnUpdate is active
    const settings = readJsonFile(SETTINGS_FILE, DEFAULT_SETTINGS);
    if (settings.notifyOnUpdate && req.body.status && req.body.status !== oldStatus) {
      const notifications = readJsonFile<any[]>(NOTIFICATIONS_FILE, []);
      const notif = {
        id: `notif-${Date.now()}`,
        eventId: updatedEvent.id,
        item: updatedEvent.item,
        envolvido: updatedEvent.envolvido || 'Geral',
        encarregado: updatedEvent.encarregado || 'SESMT',
        area: updatedEvent.area || 'Geral',
        recipients: settings.notificationEmails,
        subject: `[Atualização Ocorrência #${updatedEvent.item}] Novo Status: ${updatedEvent.status}`,
        timestamp: new Date().toISOString(),
        status: 'Entregue',
        previewText: `Ocorrência #${updatedEvent.item} (${updatedEvent.area}) teve o status alterado de "${oldStatus}" para "${updatedEvent.status}".`
      };
      notifications.unshift(notif);
      writeJsonFile(NOTIFICATIONS_FILE, notifications.slice(0, 100));

      if (supabase) {
        try {
          await supabase.from('notifications').insert({
            id: notif.id,
            event_id: notif.eventId,
            item: notif.item,
            envolvido: notif.envolvido,
            encarregado: notif.encarregado,
            area: notif.area,
            recipients: notif.recipients,
            subject: notif.subject,
            status: notif.status,
            preview_text: notif.previewText
          });
        } catch {}
      }
    }

    if (supabase) {
      try {
        const dbPayload = mapAppEventToDb(updatedEvent);
        await supabase.from('events').update(dbPayload).eq('id', id);
      } catch (e) {
        console.warn('Supabase update warning:', e);
      }
    }

    events[index] = updatedEvent;
    writeJsonFile(EVENTS_FILE, events);

    res.json(updatedEvent);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao atualizar evento' });
  }
});

app.delete('/api/events/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const events = readJsonFile<any[]>(EVENTS_FILE, []);
    const filtered = events.filter((e) => e.id !== id);

    if (supabase) {
      try {
        await supabase.from('events').delete().eq('id', id);
      } catch (e) {
        console.warn('Supabase delete warning:', e);
      }
    }

    writeJsonFile(EVENTS_FILE, filtered);
    res.json({ success: true, deletedId: id });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao remover evento' });
  }
});

app.get('/api/notifications', async (_req: Request, res: Response) => {
  try {
    if (supabase) {
      const { data, error } = await supabase.from('notifications').select('*').order('timestamp', { ascending: false }).limit(100);
      if (!error && data && data.length > 0) {
        return res.json(data);
      }
    }
    const notifications = readJsonFile<any[]>(NOTIFICATIONS_FILE, []);
    res.json(notifications);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao carregar notificações' });
  }
});

app.post('/api/notifications/send', async (req: Request, res: Response) => {
  try {
    const { eventId, subject, recipients, previewText } = req.body;
    const notifications = readJsonFile<any[]>(NOTIFICATIONS_FILE, []);
    const events = readJsonFile<any[]>(EVENTS_FILE, []);
    const event = events.find((e) => e.id === eventId);

    const notif = {
      id: `notif-${Date.now()}`,
      eventId,
      item: event?.item || 0,
      envolvido: event?.envolvido || 'Geral',
      encarregado: event?.encarregado || 'SESMT',
      area: event?.area || 'Geral',
      recipients: recipients || ['alysonmish@gmail.com'],
      subject: subject || `Notificação de Ocorrência #${event?.item}`,
      timestamp: new Date().toISOString(),
      status: 'Entregue',
      previewText: previewText || 'Notificação enviada com sucesso.'
    };

    if (supabase) {
      try {
        await supabase.from('notifications').insert({
          id: notif.id,
          event_id: notif.eventId,
          item: notif.item,
          envolvido: notif.envolvido,
          encarregado: notif.encarregado,
          area: notif.area,
          recipients: notif.recipients,
          subject: notif.subject,
          status: notif.status,
          preview_text: notif.previewText
        });
      } catch (e) {
        console.warn('Supabase notification insert warning:', e);
      }
    }

    notifications.unshift(notif);
    writeJsonFile(NOTIFICATIONS_FILE, notifications.slice(0, 100));

    res.json({ success: true, notification: notif });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao registrar envio de notificação' });
  }
});

app.get('/api/settings', async (_req: Request, res: Response) => {
  const localSettings = readJsonFile(SETTINGS_FILE, DEFAULT_SETTINGS);
  if (supabase) {
    try {
      const { data } = await supabase.from('settings').select('*').eq('id', 'app_settings').single();
      if (data) {
        return res.json({
          companyName: data.company_name || localSettings.companyName,
          notificationEmails: data.notification_emails || localSettings.notificationEmails,
          autoNotifyOnCreate: data.auto_notify_on_create ?? localSettings.autoNotifyOnCreate,
          notifyOnUpdate: localSettings.notifyOnUpdate ?? true,
          googleCalendarEnabled: data.google_calendar_enabled ?? localSettings.googleCalendarEnabled,
          publicFormEnabled: data.public_form_enabled ?? localSettings.publicFormEnabled,
          supervisors: localSettings.supervisors || DEFAULT_SETTINGS.supervisors,
          shifts: localSettings.shifts || DEFAULT_SETTINGS.shifts,
          equipments: localSettings.equipments || DEFAULT_SETTINGS.equipments,
          areas: localSettings.areas || DEFAULT_SETTINGS.areas
        });
      }
    } catch (e) {
      console.warn('Supabase get settings error, fallback to local:', e);
    }
  }
  res.json(localSettings);
});

app.post('/api/settings', async (req: Request, res: Response) => {
  const currentSettings = readJsonFile(SETTINGS_FILE, DEFAULT_SETTINGS);
  const updatedSettings = { ...currentSettings, ...req.body };
  writeJsonFile(SETTINGS_FILE, updatedSettings);

  if (supabase) {
    try {
      await supabase.from('settings').upsert({
        id: 'app_settings',
        company_name: updatedSettings.companyName,
        notification_emails: updatedSettings.notificationEmails,
        auto_notify_on_create: updatedSettings.autoNotifyOnCreate,
        google_calendar_enabled: updatedSettings.googleCalendarEnabled,
        public_form_enabled: updatedSettings.publicFormEnabled,
        updated_at: new Date().toISOString()
      });
    } catch (e) {
      console.warn('Supabase settings upsert warning:', e);
    }
  }

  res.json(updatedSettings);
});

// Server configuration & static/vite middleware mounting
async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();

