import { format, parse } from 'date-fns';

export function formatarDataPtbr(dtStr) {
  try {
    let dt;
    try {
      dt = parse(dtStr, 'dd/MM/yyyy HH:mm:ss', new Date());
    } catch {
      dt = parse(dtStr, 'yyyy-MM-dd HH:mm:ss', new Date());
    }
    return format(dt, 'dd/MM/yyyy');
  } catch {
    return dtStr;
  }
}

export function formatarDataHoraPtbr(dtStr) {
  try {
    let dt;
    try {
      dt = parse(dtStr, 'dd/MM/yyyy HH:mm:ss', new Date());
    } catch {
      dt = parse(dtStr, 'yyyy-MM-dd HH:mm:ss', new Date());
    }
    return format(dt, 'dd/MM/yyyy HH:mm:ss');
  } catch {
    return dtStr;
  }
}

export function obterDataChave(dtStr) {
  try {
    let dt;
    try {
      dt = parse(dtStr, 'dd/MM/yyyy HH:mm:ss', new Date());
    } catch {
      dt = parse(dtStr, 'yyyy-MM-dd HH:mm:ss', new Date());
    }
    return format(dt, 'yyyy-MM-dd');
  } catch {
    return dtStr.split(' ')[0] || dtStr;
  }
}

export function obterChaveDiaPlayer(log) {
  const dataChave = obterDataChave(log.datetime);
  const player = log.player || 'Sem nome';
  return `${dataChave}|${player}`;
}
