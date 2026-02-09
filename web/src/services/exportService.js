import { carregarLogs } from './logService';
import { parse, format } from 'date-fns';

let showToastFn = null;

export function setToastFunction(fn) {
  showToastFn = fn;
}

export async function exportarParaExcel() {
  try {
    const logs = await carregarLogs();
    
    if (!logs || logs.length === 0) {
      if (showToastFn) {
        showToastFn('Nenhum log para exportar.', 'warning');
      } else {
        console.warn('Nenhum log para exportar.');
      }
      return;
    }

    const dados = [];
    dados.push(['Data', 'Hora', 'Personagem', 'Derrotado', 'Item']);

    for (const log of logs) {
      const dtStr = log.datetime || '';
      let dataPtbr = '';
      let hora = '';

      try {
        const dt = parse(dtStr, 'dd/MM/yyyy HH:mm:ss', new Date());
        dataPtbr = format(dt, 'dd/MM/yyyy');
        hora = format(dt, 'HH:mm:ss');
      } catch {
        try {
          const dt = parse(dtStr, 'yyyy-MM-dd HH:mm:ss', new Date());
          dataPtbr = format(dt, 'dd/MM/yyyy');
          hora = format(dt, 'HH:mm:ss');
        } catch {
          dataPtbr = dtStr.split(' ')[0] || '';
          hora = dtStr.split(' ')[1] || '';
        }
      }

      const player = log.player || '';
      const derrotado = log.defeated || '';
      const itens = log.items || [];

      if (itens.length > 0) {
        for (const item of itens) {
          dados.push([dataPtbr, hora, player, derrotado, item]);
        }
      } else {
        dados.push([dataPtbr, hora, player, derrotado, '']);
      }
    }

    const csv = dados.map(row => 
      row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')
    ).join('\n');

    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `logs_loot_${format(new Date(), 'yyyy-MM-dd')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    if (showToastFn) {
      showToastFn('Logs exportados com sucesso!', 'success');
    } else {
      console.log('Logs exportados com sucesso!');
    }
  } catch (error) {
    console.error('Erro ao exportar logs:', error);
    if (showToastFn) {
      showToastFn('Erro ao exportar logs.', 'error');
    }
  }
}
