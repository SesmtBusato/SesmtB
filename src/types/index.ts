export type AreaType = 'USINA' | 'PORTO' | 'BASE' | 'EXTERNO' | 'OUTROS';

export type StatusType = 
  | 'Pendente' 
  | 'Em Análise' 
  | 'Em Investigação' 
  | 'Ação Corretiva' 
  | 'Concluído';

export type SeverityType = 'Leve' | 'Moderado' | 'Grave' | 'Crítico';

export interface EventRecord {
  id: string;
  item: number;
  data: string; // DD/MM/AAAA or AAAA-MM-DD
  horario: string; // HH:MM
  diaSemana: string;
  descricao: string;
  local: string;
  area: AreaType | string;
  equipamento: string;
  placaTag: string;
  envolvido: string;
  letraTurno: string;
  estavaDeExtra: 'Sim' | 'Não' | '';
  encarregado: string;
  dataAdmissao: string;
  tempoEmpresa: string;
  dataNascimento: string;
  idade: string;
  tipoOcorrencia: string;
  reincidente: 'Sim' | 'Não' | '';
  quandoOcorreu: string;
  descricaoDano: string;
  classificacaoReal: SeverityType;
  classificacaoPotencial: SeverityType;
  numeroCat: string;
  periodoAfastamento: string;
  prazoAnalise: string;
  status: StatusType;
  observacao: string;
  notificadoEmail?: boolean;
  emailsNotificados?: string[];
  createdAt?: string;
  updatedAt?: string;
  googleCalendarEventId?: string;
  googleCalendarHtmlLink?: string;
}

export interface FilterState {
  search: string;
  status: string;
  area: string;
  encarregado: string;
  envolvido: string;
  equipamento: string;
  dataInicio: string;
  dataFim: string;
  classificacao: string;
}

export interface NotificationLog {
  id: string;
  eventId: string;
  item: number;
  envolvido: string;
  encarregado: string;
  area: string;
  recipients: string[];
  subject: string;
  timestamp: string;
  status: 'Entregue' | 'Simulado';
  previewText: string;
}

export interface AppSettings {
  companyName: string;
  notificationEmails: string[];
  autoNotifyOnCreate: boolean;
  googleCalendarEnabled: boolean;
  publicFormEnabled: boolean;
}
