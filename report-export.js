(() => {
  'use strict';

  const base = document.currentScript.src;
  const dependencies = {
    xlsx: ['XLSX', 'xlsx-0.20.3.min.js'],
    pdf: ['jspdf', 'jspdf-4.2.0.min.js'],
    pptx: ['PptxGenJS', 'pptxgen-4.0.1.min.js'],
  };
  const loading = new Map();
  const formats = {
    integer: new Intl.NumberFormat('pt-BR', {maximumFractionDigits: 1}),
    percent: new Intl.NumberFormat('pt-BR', {style: 'percent', maximumFractionDigits: 1}),
    money: new Intl.NumberFormat('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2}),
  };
  const safe = (value) => String(value ?? '—').replace(/→/g, '>').replace(/↔/g, '<>').replace(/\u00a0/g, ' ');
  const rowsAsText = (block, rows) => rows.map((row) => row.map((value, column) => {
    if (value == null) return '—';
    return typeof value === 'number' ? (formats[block.formats?.[column]] || formats.integer).format(value) : safe(value);
  }));
  const note = 'ClickBus: passageiros e receita estimados. Nos mapas, indisponibilidade pode indicar venda, reserva ou bloqueio.';

  function load(format) {
    const [name, file] = dependencies[format];
    if (window[name]) return Promise.resolve(window[name]);
    if (!loading.has(format)) {
      loading.set(format, new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = new URL('vendor/' + file, base).href;
        script.onload = () => window[name] ? resolve(window[name]) : reject(new Error('Biblioteca incompleta'));
        script.onerror = () => { script.remove(); reject(new Error('Biblioteca indisponível')); };
        document.head.append(script);
      }).catch((error) => { loading.delete(format); throw error; }));
    }
    return loading.get(format);
  }

  function excel(XLSX, report) {
    const wb = XLSX.utils.book_new();
    const append = (title, headers, rows, styles = {}) => {
      const sheet = XLSX.utils.aoa_to_sheet([headers, ...rows]);
      sheet['!cols'] = headers.map((header, index) => ({wch: Math.max(12, Math.min(index ? 58 : 36,
        Math.max(header.length, ...rows.slice(0, 150).map((r) => String(r[index] ?? '').length)) + 3))}));
      if (headers.length > 1 && rows.length) sheet['!autofilter'] = {ref: sheet['!ref']};
      for (let r = 1; r <= rows.length; r++) {
        for (const [column, format] of Object.entries(styles)) {
          const cell = sheet[XLSX.utils.encode_cell({r, c: Number(column)})];
          if (cell?.t === 'n') cell.z = {integer: '#,##0.0', percent: '0.0%', money: '#,##0.00'}[format];
        }
      }
      XLSX.utils.book_append_sheet(wb, sheet, title);
    };
    append('Recorte', ['Informação'], [[report.period], [report.scope], ...report.summary.map((line) => [line]), [note]]);
    const receipt = wb.Sheets.Recorte;
    receipt['!cols'] = [{wch: 105}];
    for (const block of [...report.blocks, ...report.details]) append(block.title, block.headers, block.rows, block.formats);
    XLSX.writeFile(wb, report.file + '.xlsx', {compression: true});
  }

  function pdf({jsPDF}, report) {
    const doc = new jsPDF({orientation: 'landscape', unit: 'mm', format: 'a4'});
    doc.setProperties({title: 'Hélios · Recorte de mercado', author: 'Hélios Mercado'});
    let page = 0;
    for (const block of report.blocks) {
      for (let offset = 0; offset < Math.max(1, block.rows.length); offset += 12) {
        if (page++) doc.addPage();
        doc.setFillColor(19, 20, 22); doc.rect(0, 0, 297, 52, 'F');
        doc.setTextColor(233, 203, 146); doc.setFontSize(10); doc.text('HÉLIOS  /  MERCADO', 15, 13);
        doc.setTextColor(255, 255, 255); doc.setFontSize(22); doc.text(safe(block.title), 15, 26);
        doc.setFontSize(10); doc.text(safe(report.period), 15, 35);
        doc.text(doc.splitTextToSize(safe(report.scope), 265).slice(0, 2), 15, 42);
        doc.setTextColor(39, 39, 39); doc.setFontSize(9);
        const summary = doc.splitTextToSize(safe(report.summary.join('  |  ')), 267).slice(0, 3);
        doc.text(summary, 15, 60);
        const widths = [67, ...block.headers.slice(1).map(() => 200 / (block.headers.length - 1))];
        const table = [block.headers, ...rowsAsText(block, block.rows.slice(offset, offset + 12))];
        if (table.length === 1) table.push(['Sem dados no recorte']);
        table.forEach((row, index) => {
          const y = 74 + 8.5 * index;
          if (index % 2 === 0) { doc.setFillColor(243, 241, 237); doc.rect(15, y - 5, 267, 8.5, 'F'); }
          doc.setFont('helvetica', index ? 'normal' : 'bold');
          let x = 17;
          row.forEach((value, column) => {
            const lines = doc.splitTextToSize(safe(value), widths[column] - 4).slice(0, 2);
            doc.text(lines, x, lines.length > 1 ? y - 2 : y);
            x += widths[column];
          });
        });
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.text(note, 15, 197);
        doc.text(String(page), 282, 197, {align: 'right'});
      }
    }
    doc.save(report.file + '.pdf');
  }

  async function powerpoint(PptxGenJS, report) {
    const pptx = new PptxGenJS();
    pptx.layout = 'LAYOUT_WIDE';
    pptx.author = 'Hélios Mercado';
    pptx.title = 'Hélios · Recorte de mercado';
    let page = 0;
    for (const block of report.blocks) {
      for (let offset = 0; offset < Math.max(1, block.rows.length); offset += 9) {
        const slide = pptx.addSlide();
        slide.background = {color:'101113'};
        slide.addText('HÉLIOS  /  MERCADO', {x:.6,y:.3,w:12,h:.3,fontSize:12,color:'E9CB92',bold:true});
        slide.addText(block.title, {x:.6,y:.7,w:12,h:.62,fontSize:34,color:'F6F3EA',bold:true});
        slide.addText(report.period + '  |  ' + report.scope, {x:.6,y:1.35,w:12.1,h:.6,fontSize:12,color:'C9C7C2',margin:0,fit:'shrink'});
        slide.addText(report.summary.join('  |  '), {x:.6,y:2.01,w:12.1,h:.55,fontSize:12,color:'E9CB92',margin:0,fit:'shrink'});
        const rows = rowsAsText(block, block.rows.slice(offset, offset + 9));
        slide.addTable([block.headers.map((text) => ({text, options:{bold:true,fill:'363126',color:'F5D8A1'}})),
          ...(rows.length ? rows : [['Sem dados no recorte', ...block.headers.slice(1).map(() => '')]])],
          {x:.6,y:2.74,w:12.1,colW:[3.3, ...block.headers.slice(1).map(() => 8.8 / (block.headers.length - 1))],
            rowH:.36,margin:.09,fontSize:12,color:'F6F3EA',fill:'222427',border:{color:'3A3C41',pt:.45},autoPage:false});
        slide.addText(note, {x:.6,y:6.99,w:11.4,h:.22,fontSize:9,color:'ABA9A5',margin:0});
        slide.addText(String(++page), {x:12.1,y:6.99,w:.6,h:.22,fontSize:9,color:'ABA9A5',align:'right',margin:0});
      }
    }
    await pptx.writeFile({fileName: report.file + '.pptx', compression: true});
  }

  window.exportHelios = async (format, report) => {
    const write = {xlsx: excel, pdf, pptx: powerpoint}[format];
    if (!write) throw new Error('Formato inválido');
    await write(await load(format), report);
  };
})();
