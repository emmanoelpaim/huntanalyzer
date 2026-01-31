const PREFIXO = "Você recebeu: ";
const DERROTOU_PATTERN = /derrotou\s+o(s)?\s+/i;
const ENFRAQUECEU_O_PATTERN = /enfraqueceu\s+o\s+/i;
const ENFRAQUECEU_A_PATTERN = /enfraqueceu\s+a\s+/i;
const VENCEU_O_PATTERN = /venceu\s+o\s+/i;
const VENCEU_A_PATTERN = /venceu\s+a\s+/i;

function extrairLootLinha(linha) {
  if (!linha.includes(PREFIXO)) {
    return [];
  }
  
  const pos = linha.indexOf(PREFIXO) + PREFIXO.length;
  const lootBruto = linha.substring(pos).trim();
  const partes = lootBruto.split(/,\s*/).map(p => p.trim());
  const itens = [];
  
  for (const p of partes) {
    const sub = p.split(/\s+e\s+/i).map(s => s.trim().replace(/\.$/, ''));
    for (const x of sub) {
      if (!x) continue;
      if (/^\d/.test(x)) {
        itens.push(x);
      } else {
        itens.push(`1 ${x}`);
      }
    }
  }
  
  return itens;
}

function extrairDerrotou(linha) {
  let match = linha.match(DERROTOU_PATTERN);
  if (match) {
    const pos = match.index + match[0].length;
    const alvo = linha.substring(pos).trim().replace(/\.$/, '');
    return alvo || null;
  }
  
  match = linha.match(ENFRAQUECEU_O_PATTERN);
  if (match) {
    const pos = match.index + match[0].length;
    const alvo = linha.substring(pos).trim().replace(/\.$/, '');
    return alvo || null;
  }
  
  match = linha.match(ENFRAQUECEU_A_PATTERN);
  if (match) {
    const pos = match.index + match[0].length;
    const alvo = linha.substring(pos).trim().replace(/\.$/, '');
    return alvo || null;
  }
  
  match = linha.match(VENCEU_O_PATTERN);
  if (match) {
    const pos = match.index + match[0].length;
    const alvo = linha.substring(pos).trim().replace(/\.$/, '');
    return alvo || null;
  }
  
  match = linha.match(VENCEU_A_PATTERN);
  if (match) {
    const pos = match.index + match[0].length;
    const alvo = linha.substring(pos).trim().replace(/\.$/, '');
    return alvo || null;
  }
  
  return null;
}

export function extrairTudo(texto) {
  const resultado = [];
  const linhas = texto.split('\n');
  
  for (const linha of linhas) {
    const linhaLimpa = linha.trim();
    if (!linhaLimpa) continue;
    
    if (/Você recebeu\s+\d+\s*XP/i.test(linhaLimpa)) {
      continue;
    }
    
    if (DERROTOU_PATTERN.test(linhaLimpa) || 
        ENFRAQUECEU_O_PATTERN.test(linhaLimpa) || 
        ENFRAQUECEU_A_PATTERN.test(linhaLimpa) || 
        VENCEU_O_PATTERN.test(linhaLimpa) || 
        VENCEU_A_PATTERN.test(linhaLimpa)) {
      const alvo = extrairDerrotou(linhaLimpa);
      if (alvo) {
        resultado.push(alvo);
      }
      continue;
    }
    
    const itens = extrairLootLinha(linhaLimpa);
    resultado.push(...itens);
  }
  
  return resultado;
}

export function extrairDerrotadoEItens(texto) {
  let derrotado = null;
  const itens = [];
  const linhas = texto.split('\n');
  
  for (const linha of linhas) {
    const linhaLimpa = linha.trim();
    if (!linhaLimpa) continue;
    
    if (/Você recebeu\s+\d+\s*XP/i.test(linhaLimpa)) {
      continue;
    }
    
    if (DERROTOU_PATTERN.test(linhaLimpa) || 
        ENFRAQUECEU_O_PATTERN.test(linhaLimpa) || 
        ENFRAQUECEU_A_PATTERN.test(linhaLimpa) || 
        VENCEU_O_PATTERN.test(linhaLimpa) || 
        VENCEU_A_PATTERN.test(linhaLimpa)) {
      const alvo = extrairDerrotou(linhaLimpa);
      if (alvo) {
        derrotado = alvo;
      }
      continue;
    }
    
    const loots = extrairLootLinha(linhaLimpa);
    itens.push(...loots);
  }
  
  return [derrotado, itens];
}
