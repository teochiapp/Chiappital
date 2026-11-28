import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import * as XLSX from 'xlsx';
import apiService from '../../services/apiService';
import { parseIebRows, tradeVersion } from '../../services/iebImport';

const number = value => value == null ? '—' : value.toLocaleString('es-AR', { maximumFractionDigits: 4 });
const symbolKey = value => value.trim().toUpperCase();

export default function IebImportModal({ file, accountType, onClose, onImported }) {
  const [report, setReport] = useState(null);
  const [trades, setTrades] = useState([]);
  const [rows, setRows] = useState([]);
  const [minimum, setMinimum] = useState('0');
  const [absentPolicy, setAbsentPolicy] = useState('');
  const [busy, setBusy] = useState(false);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const [buffer, current] = await Promise.all([file.arrayBuffer(), apiService.getTrades(accountType)]);
        const workbook = XLSX.read(buffer, { type: 'array' });
        const name = workbook.SheetNames.find(sheet => sheet.trim().toLowerCase() === 'patrimonio')
          || workbook.SheetNames.find(sheet => {
            const rows = XLSX.utils.sheet_to_json(workbook.Sheets[sheet], { header: 1 });
            return rows.some(row => String(row[0]).trim().toLowerCase() === 'patrimonio total')
              && rows.some(row => ['especie', 'instrumento'].includes(String(row[0]).trim().toLowerCase()));
          });
        if (!name) throw new Error('El archivo debe contener la hoja Patrimonio.');
        const parsed = parseIebRows(XLSX.utils.sheet_to_json(workbook.Sheets[name], { header: 1 }), file.name);
        const open = current.filter(trade => trade.status === 'open');
        const items = parsed.items.map(item => {
          const matches = open.filter(trade => symbolKey(trade.symbol) === item.symbol);
          const valid = item.percentage != null && item.percentage >= 0 && item.percentage <= 100;
          const target = matches.length === 1 && matches[0].type === 'buy' ? String(matches[0].id)
            : matches.length ? '' : 'create';
          return { ...item, enabled: !item.cash && valid, target };
        });
        if (active) { setReport(parsed); setTrades(open); setRows(items); setReady(true); }
      } catch (err) { if (active) setError(err.message); }
    }
    load();
    return () => { active = false; };
  }, [file, accountType]);

  const patch = (key, values) => setRows(prev => prev.map(row => row.key === key ? { ...row, ...values } : row));
  const validMinimum = minimum !== '' && Number.isFinite(Number(minimum)) && Number(minimum) >= 0;
  const selected = rows.filter(row => row.enabled && row.percentage != null && row.percentage >= Number(minimum));
  const fileSymbols = new Set(rows.map(row => symbolKey(row.symbol)));
  const absent = trades.filter(trade => !selected.some(row => row.target === String(trade.id))
    && (!fileSymbols.has(symbolKey(trade.symbol)) || selected.some(row => symbolKey(row.symbol) === symbolKey(trade.symbol))));
  const duplicateSymbols = selected.some((row, index) => selected.findIndex(other => symbolKey(other.symbol) === symbolKey(row.symbol)) !== index);
  const duplicateTargets = selected.some((row, index) => row.target !== 'create' && selected.findIndex(other => other.target === row.target) !== index);
  const unresolved = selected.some(row => !/^[A-Z0-9.^=_/-]{1,20}$/.test(symbolKey(row.symbol)) || !row.target
    || (row.target === 'create' && trades.some(trade => symbolKey(trade.symbol) === symbolKey(row.symbol))));
  const totalPercentage = selected.reduce((sum, row) => sum + row.percentage, 0);
  const resultingPercentage = totalPercentage + trades.reduce((sum, trade) => {
    const replaced = selected.some(row => row.target === String(trade.id));
    const zeroed = absentPolicy === 'zero' && absent.some(row => row.id === trade.id);
    return sum + (replaced || zeroed ? 0 : Number(trade.portfolio_percentage || 0));
  }, 0);
  const changedAccount = accountType !== (localStorage.getItem('st_account_type') || 'propia');

  async function apply() {
    setBusy(true); setError('');
    try {
      const saved = await apiService.importIeb({
        accountType, report: { fileName: report.fileName, date: report.date, total: report.total },
        expected: tradeVersion(trades),
        items: selected.map(row => ({ symbol: symbolKey(row.symbol), percentage: row.percentage,
          targetId: row.target === 'create' ? null : Number(row.target),
          description: row.name + ' · ' + row.section + ' · Cantidad ' + number(row.quantity)
            + ' · PPP ' + number(row.ppp) + ' ' + row.currency, amount: row.amount })),
        zeroIds: absentPolicy === 'zero' ? absent.map(trade => Number(trade.id)) : [],
      });
      setResult({ ...saved, omitted: rows.length - selected.length });
      await onImported();
    } catch (err) { setError(err.message); }
    finally { setBusy(false); }
  }

  return <Overlay>
    <Panel role="dialog" aria-modal="true" aria-labelledby="ieb-title">
      <fieldset disabled={busy}>
      <Header><h2 id="ieb-title">{result ? 'Importación completada' : 'Revisar portafolio IEB'}</h2>
        <button onClick={onClose} disabled={busy} aria-label="Cerrar importación">✕</button></Header>
      {error && <Notice role="alert">{error}</Notice>}
      {!ready && !error && <p>Leyendo archivo y cartera…</p>}
      {result ? <div role="status">
        <p>Actualizados: <b>{result.updated}</b> · Nuevos: <b>{result.created}</b> · Omitidos del archivo: <b>{result.omitted}</b></p>
        <p>Porcentajes llevados a cero: <b>{result.zeroed}</b></p>
        <button onClick={onClose}>Volver a Portfolio</button>
      </div> : ready && <>
        <p><b>{file.name}</b></p>
        <p>Reporte del <b>{report.date || 'Fecha no reconocida'}</b> · Cuenta <b>{accountType === 'propia' ? 'propia' : 'compartida'}</b> ·
          Patrimonio <b>{report.currency} {number(report.total)}</b></p>
        <p>Los porcentajes toman como base el patrimonio completo del reporte. Las filas Disponible, Liquidar y Subtotal quedan incluidas en la posición principal.</p>
        <label>Porcentaje mínimo a incluir <input aria-label="Porcentaje mínimo" type="number" min="0" max="100" step="0.1" value={minimum} onChange={e => setMinimum(e.target.value)} /></label>
        <TableWrap><table><thead><tr><th>Incluir</th><th>Ticker de destino</th><th>Instrumento / tipo</th><th>Importe {report.currency}</th><th>% patrimonio</th><th>Acción prevista</th></tr></thead>
          <tbody>{rows.map(row => {
            const included = selected.includes(row);
            const invalid = row.percentage == null || row.percentage < 0 || row.percentage > 100;
            return <tr key={row.key} style={{ opacity: included ? 1 : .6 }}>
              <td><input aria-label={'Incluir ' + row.rawSymbol} type="checkbox" checked={row.enabled} disabled={invalid} onChange={e => patch(row.key, { enabled: e.target.checked })} /></td>
              <td><input aria-label={'Ticker ' + row.rawSymbol} value={row.symbol} onChange={e => {
                const symbol = symbolKey(e.target.value);
                const matches = trades.filter(trade => symbolKey(trade.symbol) === symbol);
                patch(row.key, { symbol, target: matches.length === 1 && matches[0].type === 'buy' ? String(matches[0].id) : matches.length ? '' : 'create' });
              }} /><small>IEB: {row.rawSymbol}</small></td>
              <td>{row.name}<small>{row.section} · Cantidad {number(row.quantity)} · PPP {number(row.ppp)} {row.currency}</small>
                {row.cash && <small>Tenencia monetaria. Revisá el ticker antes de incorporarla.</small>}</td>
              <td>{number(row.amount)}</td><td>{number(row.percentage)} %<small>{row.calculated ? 'Calculado por importe / patrimonio' : 'Informado por IEB'}</small></td>
              <td>{!included ? invalid ? 'Omitir · porcentaje inválido' : 'Omitir' : <>
                <select aria-label={'Acción ' + row.rawSymbol} value={row.target} onChange={e => patch(row.key, { target: e.target.value })}>
                  <option value="">Elegí una posición</option>
                  <option value="create">Crear posición</option>
                  {trades.filter(trade => trade.type === 'buy' && symbolKey(trade.symbol) === symbolKey(row.symbol)).map(trade => <option key={trade.id} value={String(trade.id)}>
                    Actualizar {trade.symbol} · #{trade.id} · {number(trade.portfolio_percentage)} %
                  </option>)}
                </select>
              </>}</td>
            </tr>;
          })}</tbody></table></TableWrap>
        <p>Seleccionados <b>{selected.length}</b> de {rows.length} · Peso a importar <b>{number(totalPercentage)} %</b></p>
        <p>Peso total resultante en Chiappital <b>{number(resultingPercentage)} %</b></p>
        <p>Las posiciones nuevas se crean con precio de entrada 0 para completar después. El PPP en moneda de origen figura en la revisión.</p>
        {absent.length > 0 && <section><h3>Posiciones ausentes o sin asignación ({absent.length})</h3>
          <p>{absent.map(trade => trade.symbol + ' #' + trade.id + ' (' + number(trade.portfolio_percentage) + ' %)').join(' · ')}</p>
          <label>Qué hacer con sus porcentajes <select aria-label="Posiciones ausentes" value={absentPolicy} onChange={e => setAbsentPolicy(e.target.value)}>
            <option value="">Elegí una opción</option><option value="keep">Conservar porcentajes actuales</option><option value="zero">Llevar sus porcentajes a cero</option>
          </select></label></section>}
        {(duplicateSymbols || duplicateTargets || unresolved) && <Notice>Revisá las coincidencias. Cada ticker y posición de destino deben aparecer una sola vez. Si hay varias operaciones del mismo ticker, elegí cuál recibirá el porcentaje total y revisá las restantes en Portfolio.</Notice>}
        {resultingPercentage > 100.01 && <Notice>La cartera resultante supera el 100 %. Revisá los porcentajes que estás conservando y las posiciones seleccionadas.</Notice>}
        {changedAccount && <Notice>Cambió la cuenta seleccionada. Cerrá esta revisión y abrí el archivo desde la cuenta de destino.</Notice>}
        <Footer><button onClick={onClose} disabled={busy}>Cancelar</button>
          <button disabled={busy || changedAccount || !validMinimum || duplicateSymbols || duplicateTargets || unresolved || (!selected.length && !(absent.length && absentPolicy === 'zero')) || (absent.length > 0 && !absentPolicy) || !/^\d{4}-\d{2}-\d{2}$/.test(report.date)}
            onClick={apply}>{busy ? 'Guardando…' : 'Aplicar importación'}</button></Footer>
      </>}
      </fieldset>
    </Panel>
  </Overlay>;
}

const Overlay = styled.div`position:fixed;inset:0;z-index:10001;background:#020617dd;display:flex;align-items:center;justify-content:center;padding:16px;`;
const Panel = styled.div`
  background:#0f172a;color:#e2e8f0;border:1px solid #334155;border-radius:16px;padding:24px;
  width:min(1400px,100%);max-height:92dvh;overflow:auto;box-sizing:border-box;
  fieldset{border:0;padding:0;margin:0;min-width:0;} p{line-height:1.5;} small{display:block;color:#94a3b8;font-size:12px;margin-top:5px;}
  button,input,select{font:inherit;color:inherit;background:#1e293b;border:1px solid #475569;border-radius:6px;padding:8px;}
  input[type=number]{width:90px;margin-left:10px;} button{cursor:pointer;} button:disabled{opacity:.45;cursor:default;}
  input[type=text],td input:not([type=checkbox]){width:100px;} select{max-width:280px;}
  @media(max-width:600px){padding:14px;h2{font-size:18px;}}
`;
const Header = styled.div`display:flex;justify-content:space-between;align-items:center;gap:16px;h2{margin:0;}`;
const Notice = styled.p`padding:12px;background:#78350f55;color:#fde68a;border:1px solid #92400e;border-radius:8px;`;
const TableWrap = styled.div`overflow:auto;margin-top:16px;max-height:45dvh;table{width:100%;border-collapse:collapse;font-size:13px;}th,td{padding:10px;text-align:left;border-bottom:1px solid #334155;}th{position:sticky;top:0;background:#1e293b;z-index:1;}`;
const Footer = styled.div`display:flex;gap:12px;justify-content:flex-end;margin-top:24px;button:last-child{background:#9f2638;}`;
