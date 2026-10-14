import express, { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json());

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
  googleCalendarEnabled: true,
  publicFormEnabled: true
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

// API Routes
app.get('/api/events', async (_req: Request, res: Response) => {
  try {
    let events = readJsonFile<any[]>(EVENTS_FILE, []);
    if (!events || events.length === 0) {
      // Load initial events from TypeScript source if available
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
    res.status(500).json({ error: 'Erro ao carregar eventos' });
  }
});

app.post('/api/events', (req: Request, res: Response) => {
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

    // Log notification if auto-notify is enabled
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
    }

    events.unshift(newEvent);
    writeJsonFile(EVENTS_FILE, events);

    res.status(201).json(newEvent);
  } catch (err) {
    console.error('Error creating event:', err);
    res.status(500).json({ error: 'Erro ao registrar evento' });
  }
});

app.put('/api/events/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const events = readJsonFile<any[]>(EVENTS_FILE, []);
    const index = events.findIndex((e) => e.id === id);

    if (index === -1) {
      return res.status(404).json({ error: 'Evento não encontrado' });
    }

    const updatedEvent = {
      ...events[index],
      ...req.body,
      updatedAt: new Date().toISOString()
    };

    events[index] = updatedEvent;
    writeJsonFile(EVENTS_FILE, events);

    res.json(updatedEvent);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao atualizar evento' });
  }
});

app.delete('/api/events/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const events = readJsonFile<any[]>(EVENTS_FILE, []);
    const filtered = events.filter((e) => e.id !== id);

    writeJsonFile(EVENTS_FILE, filtered);
    res.json({ success: true, deletedId: id });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao remover evento' });
  }
});

app.get('/api/notifications', (_req: Request, res: Response) => {
  try {
    const notifications = readJsonFile<any[]>(NOTIFICATIONS_FILE, []);
    res.json(notifications);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao carregar notificações' });
  }
});

app.post('/api/notifications/send', (req: Request, res: Response) => {
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

    notifications.unshift(notif);
    writeJsonFile(NOTIFICATIONS_FILE, notifications.slice(0, 100));

    res.json({ success: true, notification: notif });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao registrar envio de notificação' });
  }
});

app.get('/api/settings', (_req: Request, res: Response) => {
  const settings = readJsonFile(SETTINGS_FILE, DEFAULT_SETTINGS);
  res.json(settings);
});

app.post('/api/settings', (req: Request, res: Response) => {
  const settings = { ...DEFAULT_SETTINGS, ...req.body };
  writeJsonFile(SETTINGS_FILE, settings);
  res.json(settings);
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
