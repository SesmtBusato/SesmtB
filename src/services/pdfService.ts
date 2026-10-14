import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { EventRecord } from '../types';

export const exportEventsListPDF = (events: EventRecord[], filterSummary?: string) => {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  // Header Background: Busato Corporate Blue
  doc.setFillColor(30, 115, 190); // Busato Blue #1E73BE
  doc.rect(0, 0, 297, 24, 'F');

  // Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.setTextColor(255, 255, 255);
  doc.text('BUSATO - RELATÓRIO EXECUTIVO DE CONTROLE DE EVENTOS', 14, 11);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(224, 242, 254); // sky-100
  const dateStr = new Date().toLocaleString('pt-BR');
  doc.text(`Sistema Corporativo BUSATO | Gerado em: ${dateStr} | Total: ${events.length}`, 14, 18);

  if (filterSummary) {
    doc.text(`Filtros: ${filterSummary}`, 150, 18);
  }

  // Summary Metrics Bar
  const total = events.length;
  const pendentes = events.filter((e) => e.status === 'Pendente').length;
  const emAnalise = events.filter((e) => e.status === 'Em Análise' || e.status === 'Em Investigação').length;
  const concluidos = events.filter((e) => e.status === 'Concluído').length;

  doc.setFillColor(241, 245, 249);
  doc.roundedRect(14, 28, 269, 14, 2, 2, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(30, 41, 59);

  doc.text(`TOTAL: ${total}`, 20, 36);
  doc.setTextColor(234, 88, 12); // orange
  doc.text(`PENDENTES: ${pendentes}`, 70, 36);
  doc.setTextColor(37, 99, 235); // blue
  doc.text(`EM ANÁLISE / INVESTIGAÇÃO: ${emAnalise}`, 125, 36);
  doc.setTextColor(22, 163, 74); // green
  doc.text(`CONCLUÍDOS: ${concluidos}`, 205, 36);

  // Table
  const tableData = events.map((ev) => [
    `#${ev.item}`,
    ev.data,
    ev.horario || '--:--',
    ev.area,
    ev.local,
    ev.envolvido || 'N/A',
    ev.encarregado || 'N/A',
    ev.equipamento || 'N/A',
    ev.placaTag || '--',
    ev.status,
    ev.classificacaoReal || 'Leve',
    ev.descricao.length > 70 ? ev.descricao.substring(0, 67) + '...' : ev.descricao,
  ]);

  autoTable(doc, {
    startY: 46,
    head: [[
      'Item',
      'Data',
      'Hora',
      'Área',
      'Local',
      'Envolvido',
      'Encarregado',
      'Equipamento',
      'Placa/Tag',
      'Status',
      'Gravidade',
      'Descrição do Evento',
    ]],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: [30, 41, 59],
      textColor: [255, 255, 255],
      fontSize: 8,
      fontStyle: 'bold',
      halign: 'center',
    },
    bodyStyles: {
      fontSize: 7,
      textColor: [51, 65, 85],
      cellPadding: 2,
    },
    columnStyles: {
      0: { cellWidth: 12, halign: 'center' },
      1: { cellWidth: 18, halign: 'center' },
      2: { cellWidth: 12, halign: 'center' },
      3: { cellWidth: 18, halign: 'center' },
      4: { cellWidth: 26 },
      5: { cellWidth: 26 },
      6: { cellWidth: 24 },
      7: { cellWidth: 24 },
      8: { cellWidth: 16, halign: 'center' },
      9: { cellWidth: 20, halign: 'center' },
      10: { cellWidth: 16, halign: 'center' },
      11: { cellWidth: 'auto' },
    },
    didDrawPage: (data) => {
      // Footer
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text(
        `BUSATO Operações & Segurança do Trabalho - Página ${data.pageNumber}`,
        14,
        doc.internal.pageSize.height - 8
      );
    },
  });

  doc.save(`BUSATO_Relatorio_Eventos_${new Date().toISOString().slice(0, 10)}.pdf`);
};

export const exportSingleEventDossierPDF = (event: EventRecord) => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  // Top header banner: Busato Blue
  doc.setFillColor(30, 115, 190); // Busato Blue #1E73BE
  doc.rect(0, 0, 210, 30, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.setTextColor(255, 255, 255);
  doc.text('BUSATO • BOLETIM TÉCNICO DE OCORRÊNCIA', 14, 13);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(224, 242, 254);
  doc.text(`Sistema Corporativo BUSATO | Registro Oficial de Evento Operacional`, 14, 21);

  // Status badge on header
  doc.setFillColor(21, 85, 146); // deeper navy blue
  doc.roundedRect(145, 8, 50, 14, 2, 2, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(255, 255, 255);
  doc.text(`ITEM #${event.item}`, 155, 17);

  let currentY = 40;

  // Box 1: Identificação do Evento
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(14, currentY, 182, 38, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text('1. DADOS BÁSICOS DA OCORRÊNCIA', 18, currentY + 7);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);

  doc.text(`Data: ${event.data || 'N/A'}`, 18, currentY + 16);
  doc.text(`Horário: ${event.horario || 'N/A'}`, 70, currentY + 16);
  doc.text(`Dia da Semana: ${event.diaSemana || 'N/A'}`, 125, currentY + 16);

  doc.text(`Área: ${event.area || 'N/A'}`, 18, currentY + 24);
  doc.text(`Local Específico: ${event.local || 'N/A'}`, 70, currentY + 24);

  doc.text(`Status Atual: ${event.status || 'N/A'}`, 18, currentY + 32);
  doc.text(`Classificação Real: ${event.classificacaoReal || 'N/A'}`, 70, currentY + 32);
  doc.text(`Classificação Potencial: ${event.classificacaoPotencial || 'N/A'}`, 125, currentY + 32);

  currentY += 46;

  // Box 2: Pessoas & Equipe Envolvida
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(14, currentY, 182, 32, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text('2. CONTROLE DE PESSOAS E RESPONSABILIDADES', 18, currentY + 7);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);

  doc.text(`Colaborador Envolvido: ${event.envolvido || 'Não identificado'}`, 18, currentY + 16);
  doc.text(`Encarregado/Responsável: ${event.encarregado || 'Não informado'}`, 110, currentY + 16);

  doc.text(`Turno / Letra: ${event.letraTurno || 'N/A'}`, 18, currentY + 24);
  doc.text(`Trabalho Extraordinário: ${event.estavaDeExtra || 'Não'}`, 70, currentY + 24);
  doc.text(`Histórico de Reincidência: ${event.reincidente || 'Não'}`, 125, currentY + 24);

  currentY += 40;

  // Box 3: Maquinário e Equipamento
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(14, currentY, 182, 24, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text('3. EQUIPAMENTO & VEÍCULO ENVOLVIDO', 18, currentY + 7);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);

  doc.text(`Tipo de Equipamento: ${event.equipamento || 'N/A'}`, 18, currentY + 16);
  doc.text(`Placa / Tag Operacional: ${event.placaTag || 'N/A'}`, 110, currentY + 16);

  currentY += 32;

  // Box 4: Relato Descritivo do Evento
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(14, currentY, 182, 45, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text('4. RELATO DETALHADO DO EVENTO', 18, currentY + 7);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(51, 65, 85);
  const splitDesc = doc.splitTextToSize(event.descricao || 'Sem descrição cadastrada.', 174);
  doc.text(splitDesc, 18, currentY + 14);

  currentY += 52;

  // Box 5: Danos Materiais, Análise & Ações Corretivas
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(14, currentY, 182, 48, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text('5. DANOS, TRATATIVA E PLANO DE AÇÃO', 18, currentY + 7);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);

  doc.text(`Descrição dos Danos: ${event.descricaoDano || 'Sem avarias relatadas.'}`, 18, currentY + 15);
  doc.text(`Prazo de Análise: ${event.prazoAnalise || 'A definir'}`, 18, currentY + 23);
  doc.text(`CAT (Comunicação de Acidente): ${event.numeroCat || 'Não aplicável'}`, 90, currentY + 23);
  doc.text(`Afastamento: ${event.periodoAfastamento || 'Nenhum'}`, 145, currentY + 23);

  doc.text(`Observações e Tratativas: ${event.observacao || 'Em acompanhamento operacional.'}`, 18, currentY + 33);

  // Assinaturas
  currentY += 58;
  doc.setDrawColor(203, 213, 225);
  doc.line(20, currentY, 80, currentY);
  doc.line(130, currentY, 190, currentY);

  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text('Assinatura do Encarregado / Responsável', 25, currentY + 4);
  doc.text('Técnico de Segurança / SESMT', 140, currentY + 4);

  // Footer
  doc.setFontSize(7.5);
  doc.setTextColor(148, 163, 184);
  doc.text(
    `Documento gerado automaticamente pelo Sistema BUSATO de Controle Operacional em ${new Date().toLocaleString('pt-BR')}`,
    14,
    290
  );

  doc.save(`BUSATO_Boletim_Item_${event.item}_${event.data.replace(/\//g, '-')}.pdf`);
};
