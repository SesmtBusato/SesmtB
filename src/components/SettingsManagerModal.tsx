import React, { useState } from 'react';
import { AppSettings } from '../types';
import {
  X,
  Settings,
  Mail,
  UserCheck,
  Truck,
  Layers,
  Clock,
  Plus,
  Trash2,
  Save,
  CheckCircle2,
  Bell,
  Sliders,
  AlertOctagon
} from 'lucide-react';

interface Props {
  settings: AppSettings;
  onClose: () => void;
  onSave: (newSettings: AppSettings) => Promise<void>;
  onClearAllData?: () => Promise<void>;
}

export const SettingsManagerModal: React.FC<Props> = ({
  settings,
  onClose,
  onSave,
  onClearAllData,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'notifications' | 'supervisors' | 'equipments' | 'shifts' | 'areas' | 'systemData'>('notifications');
  const [formData, setFormData] = useState<AppSettings>(() => ({
    companyName: settings?.companyName || 'BUSATO - Gestão e Monitoramento de Ocorrências',
    notificationEmails: settings?.notificationEmails ?? ['alysonmish@gmail.com', 'sesmt@busato.com.br', 'operacoes@busato.com.br'],
    autoNotifyOnCreate: settings?.autoNotifyOnCreate ?? true,
    notifyOnUpdate: settings?.notifyOnUpdate ?? true,
    googleCalendarEnabled: settings?.googleCalendarEnabled ?? true,
    publicFormEnabled: settings?.publicFormEnabled ?? true,
    supervisors: settings?.supervisors ?? [
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
    shifts: settings?.shifts ?? [
      'Turno A (Manhã)',
      'Turno B (Tarde)',
      'Turno C (Noite/Madrugada)',
      'Turno D',
      'Administrativo'
    ],
    equipments: settings?.equipments ?? [
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
    areas: settings?.areas ?? ['USINA', 'PORTO', 'BASE', 'EXTERNO', 'OUTROS']
  }));
  const [newEmail, setNewEmail] = useState('');
  const [newSupervisor, setNewSupervisor] = useState('');
  const [newEquipment, setNewEquipment] = useState('');
  const [newShift, setNewShift] = useState('');
  const [newArea, setNewArea] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  // Sync state if settings prop arrives/updates asynchronously
  React.useEffect(() => {
    if (settings) {
      setFormData({
        companyName: settings.companyName || 'BUSATO - Gestão e Monitoramento de Ocorrências',
        notificationEmails: settings.notificationEmails ?? [],
        autoNotifyOnCreate: settings.autoNotifyOnCreate ?? true,
        notifyOnUpdate: settings.notifyOnUpdate ?? true,
        googleCalendarEnabled: settings.googleCalendarEnabled ?? true,
        publicFormEnabled: settings.publicFormEnabled ?? true,
        supervisors: settings.supervisors ?? [],
        shifts: settings.shifts ?? [],
        equipments: settings.equipments ?? [],
        areas: settings.areas ?? [],
      });
    }
  }, [settings]);

  // Email handlers
  const handleAddEmail = (e: React.FormEvent) => {
    e.preventDefault();
    const val = newEmail.trim().toLowerCase();
    if (val && val.includes('@') && !formData.notificationEmails.includes(val)) {
      setFormData({
        ...formData,
        notificationEmails: [...formData.notificationEmails, val]
      });
      setNewEmail('');
    }
  };

  const handleRemoveEmail = (target: string) => {
    setFormData({
      ...formData,
      notificationEmails: formData.notificationEmails.filter((e) => e !== target)
    });
  };

  // Supervisors handlers
  const handleAddSupervisor = (e: React.FormEvent) => {
    e.preventDefault();
    const val = newSupervisor.trim().toUpperCase();
    if (val && !formData.supervisors.includes(val)) {
      setFormData({
        ...formData,
        supervisors: [...formData.supervisors, val]
      });
      setNewSupervisor('');
    }
  };

  const handleRemoveSupervisor = (target: string) => {
    setFormData({
      ...formData,
      supervisors: formData.supervisors.filter((s) => s !== target)
    });
  };

  // Equipments handlers
  const handleAddEquipment = (e: React.FormEvent) => {
    e.preventDefault();
    const val = newEquipment.trim().toUpperCase();
    if (val && !formData.equipments.includes(val)) {
      setFormData({
        ...formData,
        equipments: [...formData.equipments, val]
      });
      setNewEquipment('');
    }
  };

  const handleRemoveEquipment = (target: string) => {
    setFormData({
      ...formData,
      equipments: formData.equipments.filter((eq) => eq !== target)
    });
  };

  // Shifts handlers
  const handleAddShift = (e: React.FormEvent) => {
    e.preventDefault();
    const val = newShift.trim();
    if (val && !formData.shifts.includes(val)) {
      setFormData({
        ...formData,
        shifts: [...formData.shifts, val]
      });
      setNewShift('');
    }
  };

  const handleRemoveShift = (target: string) => {
    setFormData({
      ...formData,
      shifts: formData.shifts.filter((sh) => sh !== target)
    });
  };

  // Areas handlers
  const handleAddArea = (e: React.FormEvent) => {
    e.preventDefault();
    const val = newArea.trim().toUpperCase();
    if (val && !formData.areas.includes(val)) {
      setFormData({
        ...formData,
        areas: [...formData.areas, val]
      });
      setNewArea('');
    }
  };

  const handleRemoveArea = (target: string) => {
    setFormData({
      ...formData,
      areas: formData.areas.filter((a) => a !== target)
    });
  };

  const handleSaveAll = async () => {
    setIsSaving(true);
    await onSave(formData);
    setIsSaving(false);
    setSuccess(true);
    setTimeout(() => setSuccess(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-3xl busato-card rounded-2xl shadow-2xl p-6 my-8 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#1e2f4a] shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-[#1e73be]/15 text-[#38bdf8] border border-[#1e73be]/30">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold font-brand tracking-wide">
                Configurações & Gestão de Dados Cadastrais
              </h3>
              <p className="text-xs text-slate-400">
                Gerencie quem recebe alertas por e-mail e edite as opções dos formulários (Encarregados, Turnos, Equipamentos e Áreas).
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-[#1a283f] transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs inside modal */}
        <div className="flex items-center gap-1.5 pt-4 pb-3 border-b border-[#1e2f4a] overflow-x-auto text-xs shrink-0">
          <button
            onClick={() => setActiveSubTab('notifications')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg font-medium transition cursor-pointer whitespace-nowrap ${
              activeSubTab === 'notifications'
                ? 'bg-[#1e73be] text-white shadow-xs font-semibold'
                : 'text-slate-400 hover:bg-[#121c2d] hover:text-white'
            }`}
          >
            <Mail className="w-3.5 h-3.5" />
            <span>Alertas & Destinatários ({formData.notificationEmails?.length || 0})</span>
          </button>

          <button
            onClick={() => setActiveSubTab('supervisors')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg font-medium transition cursor-pointer whitespace-nowrap ${
              activeSubTab === 'supervisors'
                ? 'bg-[#1e73be] text-white shadow-xs font-semibold'
                : 'text-slate-400 hover:bg-[#121c2d] hover:text-white'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>Encarregados ({formData.supervisors?.length || 0})</span>
          </button>

          <button
            onClick={() => setActiveSubTab('equipments')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg font-medium transition cursor-pointer whitespace-nowrap ${
              activeSubTab === 'equipments'
                ? 'bg-[#1e73be] text-white shadow-xs font-semibold'
                : 'text-slate-400 hover:bg-[#121c2d] hover:text-white'
            }`}
          >
            <Truck className="w-3.5 h-3.5" />
            <span>Equipamentos ({formData.equipments?.length || 0})</span>
          </button>

          <button
            onClick={() => setActiveSubTab('shifts')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg font-medium transition cursor-pointer whitespace-nowrap ${
              activeSubTab === 'shifts'
                ? 'bg-[#1e73be] text-white shadow-xs font-semibold'
                : 'text-slate-400 hover:bg-[#121c2d] hover:text-white'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Turnos ({formData.shifts?.length || 0})</span>
          </button>

          <button
            onClick={() => setActiveSubTab('areas')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg font-medium transition cursor-pointer whitespace-nowrap ${
              activeSubTab === 'areas'
                ? 'bg-[#1e73be] text-white shadow-xs font-semibold'
                : 'text-slate-400 hover:bg-[#121c2d] hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Áreas ({formData.areas?.length || 0})</span>
          </button>

          <button
            onClick={() => setActiveSubTab('systemData')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg font-medium transition cursor-pointer whitespace-nowrap ${
              activeSubTab === 'systemData'
                ? 'bg-rose-600 text-white shadow-xs font-semibold'
                : 'text-rose-400 hover:bg-rose-950/40 hover:text-rose-300'
            }`}
          >
            <AlertOctagon className="w-3.5 h-3.5" />
            <span>Limpeza de Dados</span>
          </button>
        </div>

        {/* Tab Body */}
        <div className="overflow-y-auto space-y-4 py-4 text-xs pr-1 flex-1">
          {/* TAB 1: NOTIFICATIONS & EMAILS */}
          {activeSubTab === 'notifications' && (
            <div className="space-y-4">
              <div className="p-4 bg-[#101726] rounded-xl border border-[#1e2f4a] space-y-3">
                <span className="font-bold block text-sm">Regras de Disparo Automático</span>
                <div className="space-y-2">
                  <label className="flex items-center gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.autoNotifyOnCreate}
                      onChange={(e) => setFormData({ ...formData, autoNotifyOnCreate: e.target.checked })}
                      className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 bg-slate-900 border-slate-700"
                    />
                    <div>
                      <span className="font-semibold block">Disparar alerta ao criar nova ocorrência</span>
                      <span className="text-slate-400 text-[11px]">Envia os dados completos imediatamente para os e-mails da lista abaixo.</span>
                    </div>
                  </label>

                  <label className="flex items-center gap-2.5 cursor-pointer pt-1">
                    <input
                      type="checkbox"
                      checked={formData.notifyOnUpdate}
                      onChange={(e) => setFormData({ ...formData, notifyOnUpdate: e.target.checked })}
                      className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 bg-slate-900 border-slate-700"
                    />
                    <div>
                      <span className="font-semibold block">Disparar alerta quando o status for alterado (tratativas / conclusão)</span>
                      <span className="text-slate-400 text-[11px]">Notifica quando uma ocorrência avança de "Pendente" para "Em Investigação", "Ação Corretiva" ou "Concluído".</span>
                    </div>
                  </label>
                </div>
              </div>

              {/* Emails List */}
              <div className="p-4 bg-[#101726] rounded-xl border border-[#1e2f4a] space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-bold block text-sm">Quem receberá os alertas</span>
                    <span className="text-slate-400 text-[11px]">Adicione ou remova e-mails responsáveis por acompanhar os incidentes.</span>
                  </div>
                  <span className="text-[11px] font-mono text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded-full border border-sky-500/20">
                    {(formData.notificationEmails || []).length} cadastrados
                  </span>
                </div>

                <form onSubmit={handleAddEmail} className="flex gap-2 pt-1">
                  <input
                    type="email"
                    placeholder="novo.gestor@busato.com.br"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    className="flex-1 px-3 py-2 bg-slate-900 border border-[#1e2f4a] rounded-xl text-xs focus:outline-hidden focus:border-[#1e73be]"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-[#1e73be] hover:bg-[#2c8be8] text-white rounded-xl font-semibold flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Adicionar</span>
                  </button>
                </form>

                <div className="space-y-1.5 max-h-48 overflow-y-auto pt-2">
                  {(formData.notificationEmails || []).map((email) => (
                    <div
                      key={email}
                      className="flex items-center justify-between px-3 py-2 bg-[#131d2e] rounded-xl border border-[#1e2f4a] text-xs hover:border-slate-500/50 transition"
                    >
                      <div className="flex items-center gap-2">
                        <Mail className="w-3.5 h-3.5 text-sky-400" />
                        <span className="font-mono font-medium">{email}</span>
                      </div>
                      <button
                        onClick={() => handleRemoveEmail(email)}
                        className="text-rose-400 hover:text-rose-300 p-1 hover:bg-rose-500/10 rounded-lg transition cursor-pointer"
                        title="Remover destinatário"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: ENCARREGADOS / SUPERVISORES */}
          {activeSubTab === 'supervisors' && (
            <div className="p-4 bg-[#101726] rounded-xl border border-[#1e2f4a] space-y-3">
              <div>
                <span className="font-bold block text-sm">Gestão de Encarregados / Responsáveis</span>
                <span className="text-slate-400 text-[11px]">
                  Os nomes aqui cadastrados aparecerão nos menus suspensos (select) de cadastro e edição de ocorrências.
                </span>
              </div>

              <form onSubmit={handleAddSupervisor} className="flex gap-2 pt-1">
                <input
                  type="text"
                  placeholder="Ex: NOVO ENCARREGADO SILVA"
                  value={newSupervisor}
                  onChange={(e) => setNewSupervisor(e.target.value)}
                  className="flex-1 px-3 py-2 bg-slate-900 border border-[#1e2f4a] rounded-xl text-xs uppercase focus:outline-hidden focus:border-[#1e73be]"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#1e73be] hover:bg-[#2c8be8] text-white rounded-xl font-semibold flex items-center gap-1.5 transition cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Cadastrar</span>
                </button>
              </form>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-72 overflow-y-auto pt-2">
                {(formData.supervisors || []).map((name) => (
                  <div
                    key={name}
                    className="flex items-center justify-between px-3 py-2 bg-[#131d2e] rounded-xl border border-[#1e2f4a] text-xs hover:border-slate-500/50 transition"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <UserCheck className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span className="font-semibold truncate">{name}</span>
                    </div>
                    <button
                      onClick={() => handleRemoveSupervisor(name)}
                      className="text-rose-400 hover:text-rose-300 p-1 hover:bg-rose-500/10 rounded-lg transition cursor-pointer shrink-0 ml-2"
                      title="Remover encarregado"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: EQUIPAMENTOS */}
          {activeSubTab === 'equipments' && (
            <div className="p-4 bg-[#101726] rounded-xl border border-[#1e2f4a] space-y-3">
              <div>
                <span className="font-bold block text-sm">Gestão de Equipamentos / Maquinários</span>
                <span className="text-slate-400 text-[11px]">
                  Equipamentos disponíveis para seleção nos registros de danos ou incidentes.
                </span>
              </div>

              <form onSubmit={handleAddEquipment} className="flex gap-2 pt-1">
                <input
                  type="text"
                  placeholder="Ex: ESCAVADEIRA HIDRÁULICA"
                  value={newEquipment}
                  onChange={(e) => setNewEquipment(e.target.value)}
                  className="flex-1 px-3 py-2 bg-slate-900 border border-[#1e2f4a] rounded-xl text-xs uppercase focus:outline-hidden focus:border-[#1e73be]"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#1e73be] hover:bg-[#2c8be8] text-white rounded-xl font-semibold flex items-center gap-1.5 transition cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Cadastrar</span>
                </button>
              </form>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-72 overflow-y-auto pt-2">
                {(formData.equipments || []).map((eq) => (
                  <div
                    key={eq}
                    className="flex items-center justify-between px-3 py-2 bg-[#131d2e] rounded-xl border border-[#1e2f4a] text-xs hover:border-slate-500/50 transition"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <Truck className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                      <span className="font-semibold truncate">{eq}</span>
                    </div>
                    <button
                      onClick={() => handleRemoveEquipment(eq)}
                      className="text-rose-400 hover:text-rose-300 p-1 hover:bg-rose-500/10 rounded-lg transition cursor-pointer shrink-0 ml-2"
                      title="Remover equipamento"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: TURNOS */}
          {activeSubTab === 'shifts' && (
            <div className="p-4 bg-[#101726] rounded-xl border border-[#1e2f4a] space-y-3">
              <div>
                <span className="font-bold block text-sm">Gestão de Turnos / Letras</span>
                <span className="text-slate-400 text-[11px]">
                  Turnos operacionais utilizados para enquadramento das equipes.
                </span>
              </div>

              <form onSubmit={handleAddShift} className="flex gap-2 pt-1">
                <input
                  type="text"
                  placeholder="Ex: Turno E (Intermediário)"
                  value={newShift}
                  onChange={(e) => setNewShift(e.target.value)}
                  className="flex-1 px-3 py-2 bg-slate-900 border border-[#1e2f4a] rounded-xl text-xs focus:outline-hidden focus:border-[#1e73be]"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#1e73be] hover:bg-[#2c8be8] text-white rounded-xl font-semibold flex items-center gap-1.5 transition cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Cadastrar</span>
                </button>
              </form>

              <div className="space-y-1.5 max-h-72 overflow-y-auto pt-2">
                {(formData.shifts || []).map((sh) => (
                  <div
                    key={sh}
                    className="flex items-center justify-between px-3 py-2 bg-[#131d2e] rounded-xl border border-[#1e2f4a] text-xs hover:border-slate-500/50 transition"
                  >
                    <div className="flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-indigo-400" />
                      <span className="font-semibold">{sh}</span>
                    </div>
                    <button
                      onClick={() => handleRemoveShift(sh)}
                      className="text-rose-400 hover:text-rose-300 p-1 hover:bg-rose-500/10 rounded-lg transition cursor-pointer"
                      title="Remover turno"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 5: ÁREAS */}
          {activeSubTab === 'areas' && (
            <div className="p-4 bg-[#101726] rounded-xl border border-[#1e2f4a] space-y-3">
              <div>
                <span className="font-bold block text-sm">Gestão de Áreas Operacionais</span>
                <span className="text-slate-400 text-[11px]">
                  Áreas e polos de operação monitorados no painel e nos indicadores.
                </span>
              </div>

              <form onSubmit={handleAddArea} className="flex gap-2 pt-1">
                <input
                  type="text"
                  placeholder="Ex: FERROVIA, MINERAÇÃO..."
                  value={newArea}
                  onChange={(e) => setNewArea(e.target.value)}
                  className="flex-1 px-3 py-2 bg-slate-900 border border-[#1e2f4a] rounded-xl text-xs uppercase focus:outline-hidden focus:border-[#1e73be]"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#1e73be] hover:bg-[#2c8be8] text-white rounded-xl font-semibold flex items-center gap-1.5 transition cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Cadastrar</span>
                </button>
              </form>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-72 overflow-y-auto pt-2">
                {(formData.areas || []).map((ar) => (
                  <div
                    key={ar}
                    className="flex items-center justify-between px-3 py-2 bg-[#131d2e] rounded-xl border border-[#1e2f4a] text-xs hover:border-slate-500/50 transition"
                  >
                    <div className="flex items-center gap-2">
                      <Layers className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="font-semibold">{ar}</span>
                    </div>
                    <button
                      onClick={() => handleRemoveArea(ar)}
                      className="text-rose-400 hover:text-rose-300 p-1 hover:bg-rose-500/10 rounded-lg transition cursor-pointer"
                      title="Remover área"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 6: DANGER ZONE / LIMPEZA DE DADOS */}
          {activeSubTab === 'systemData' && (
            <div className="p-5 bg-rose-950/20 border border-rose-500/30 rounded-2xl space-y-4">
              <div className="flex items-start gap-3">
                <div className="p-2.5 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30">
                  <AlertOctagon className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-white">Zona de Limpeza do Sistema</h4>
                  <p className="text-xs text-rose-200/80 mt-0.5">
                    Utilize esta opção quando quiser zerar todos os registros de ocorrências e notificações geradas.
                  </p>
                </div>
              </div>

              <div className="p-4 bg-[#0e1626] rounded-xl border border-rose-900/40 text-xs text-slate-300 space-y-2">
                <p>
                  Esta ação irá apagar <strong>todas as ocorrências cadastradas</strong> tanto na base de dados (Supabase) quanto no cache do seu navegador e arquivos locais.
                </p>
                <p className="text-slate-400 text-[11px]">
                  Os cadastros de encarregados, maquinários e áreas não serão afetados.
                </p>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={async () => {
                    if (window.confirm('TEM CERTEZA ABSOLUTA? Esta ação irá excluir todas as ocorrências e notificações do sistema permanentemente.')) {
                      if (onClearAllData) {
                        await onClearAllData();
                        onClose();
                      }
                    }
                  }}
                  className="px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl font-bold flex items-center gap-2 transition cursor-pointer shadow-lg shadow-rose-900/30"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Excluir Todos os Registros do Sistema</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-[#1e2f4a] shrink-0 flex items-center justify-between">
          <div>
            {success && (
              <span className="text-xs text-emerald-400 flex items-center gap-1.5 font-bold">
                <CheckCircle2 className="w-4 h-4" /> Configurações salvas e aplicadas em todo o sistema!
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-[#131d2e] hover:bg-[#1a273d] text-slate-300 border border-[#20334f] rounded-xl font-medium transition cursor-pointer"
            >
              Fechar
            </button>
            <button
              onClick={handleSaveAll}
              disabled={isSaving}
              className="busato-gradient-btn px-5 py-2 text-white rounded-xl font-bold transition flex items-center gap-2 cursor-pointer disabled:opacity-60 shadow-md shadow-blue-500/20"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Salvando...' : 'Salvar Todas as Configurações'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
