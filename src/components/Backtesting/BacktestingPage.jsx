import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import {
  ComposedChart, LineChart, AreaChart, Line, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine, Scatter
} from 'recharts';
import { HelpCircle, X } from 'lucide-react';
import backtestingService from '../../services/backtestingService';
import { colors } from '../../styles/colors';

const BacktestingPage = () => {
  const { ticker } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const queryTicker = searchParams.get('symbol');
  const querySetup = searchParams.get('setup');
  const queryScore = searchParams.get('score');
  const activeTicker = (ticker || queryTicker || '').toUpperCase();

  // Config State
  const [config, setConfig] = useState({
    startDate: '2022-01-01',
    endDate: new Date().toISOString().split('T')[0],
    initialCapital: 10000,
    entryScoreThreshold: queryScore ? parseFloat(queryScore) : 55,
    exitStrategy: 'setup_deterioration',
    stopLossPct: 0.0,
    takeProfitPct: 0.0,
    benchmarkSymbol: 'SPY',
    allowedSetups: querySetup ? [querySetup] : []
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [results, setResults] = useState(null);
  const [showHelpModal, setShowHelpModal] = useState(false);

  useEffect(() => {
    if (activeTicker) {
      runBacktest();
    }
  }, [activeTicker]); // Corre al montar si hay ticker, pero luego a demanda con el botón

  const handleConfigChange = (e) => {
    const { name, value } = e.target;
    setConfig(prev => ({ ...prev, [name]: value }));
  };

  const handleSetupFilterChange = (e) => {
    const val = e.target.value;
    setConfig(prev => ({
      ...prev,
      allowedSetups: val === 'ALL' ? [] : [val]
    }));
  };

  const runBacktest = async () => {
    if (!activeTicker) return;
    setLoading(true);
    setError(null);
    setResults(null);
    
    try {
      const data = await backtestingService.runBacktest(activeTicker, {
        ...config,
        debug: true // Requerido para ver los indicadores en el chart
      });
      setResults(data);
    } catch (err) {
      setError(err.message || 'Ocurrió un error al ejecutar el backtest.');
    } finally {
      setLoading(false);
    }
  };

  const onSearch = (e) => {
    if (e.key === 'Enter' && e.target.value) {
      navigate(`/backtesting/${e.target.value.toUpperCase()}`);
    }
  };

  // Preparar datos para gráficos
  let chartData = [];
  if (results && results.indicatorHistory) {
    chartData = results.indicatorHistory.map(hist => {
      const d = { date: hist.date, ...hist.indicators, opScore: hist.opScore };
      
      // Adjuntar señales a la fecha correspondiente
      const signal = results.signals.find(s => s.date === hist.date);
      if (signal) {
        if (signal.type === 'BUY') {
          d.buySignal = signal.price;
        } else if (signal.type === 'SELL') {
          d.sellSignal = signal.price;
        }
      }
      return d;
    });
  }

  // Preparar datos de Equity unificados (Estrategia vs Benchmark)
  let equityData = [];
  if (results && results.equityCurve) {
    equityData = results.equityCurve.map((eq, i) => {
      const d = { date: eq.date, equity: eq.equity };
      if (results.buyAndHoldCurve && results.buyAndHoldCurve[i]) {
        d.benchmarkEquity = results.buyAndHoldCurve[i].equity;
      }
      return d;
    });
  }

  return (
    <PageWrapper>
      <PageContainer>
        <Header>
        <HeaderLeft>
          <div>
            <Title>Backtesting Lab</Title>
            <Subtitle>Simulación histórica de la estrategia OP Score</Subtitle>
          </div>
          <HelpButton onClick={() => setShowHelpModal(true)} title="Ver glosario de métricas">
            <HelpCircle size={20} />
          </HelpButton>
        </HeaderLeft>
        <SearchBox>
          <input 
            type="text" 
            placeholder="Buscar Ticker (ej. TSLA)..." 
            defaultValue={activeTicker}
            onKeyDown={onSearch}
          />
        </SearchBox>
      </Header>

      {!activeTicker ? (
        <EmptyState>
          <Icon>📊</Icon>
          <h2>Ingresa un Ticker para comenzar</h2>
          <p>El motor de backtesting probará la estrategia actual usando datos históricos.</p>
        </EmptyState>
      ) : (
        <ContentLayout>
          {/* Panel Lateral de Configuración */}
          <ConfigPanel>
            <h3>Configuración</h3>
            
            <FormGroup>
              <label>Fecha de Inicio</label>
              <input type="date" name="startDate" value={config.startDate} onChange={handleConfigChange} />
            </FormGroup>
            
            <FormGroup>
              <label>Fecha Fin</label>
              <input type="date" name="endDate" value={config.endDate} onChange={handleConfigChange} />
            </FormGroup>
            
            <FormGroup>
              <label>Capital Inicial (USD)</label>
              <input type="number" name="initialCapital" value={config.initialCapital} onChange={handleConfigChange} />
            </FormGroup>

            <Divider />

            <FormGroup>
              <label>Filtro de Setup</label>
              <select
                name="allowedSetups"
                value={config.allowedSetups.length === 0 ? 'ALL' : config.allowedSetups[0]}
                onChange={handleSetupFilterChange}
              >
                <option value="ALL">Cualquier Setup Alcista (Todos)</option>
                <option value="bullish_breakout">Breakout</option>
                <option value="bullish_pullback">Pullback</option>
                <option value="strong_uptrend">Fuerte Alcista (Uptrend)</option>
                <option value="strong_uptrend_extended">Alcista Extendido</option>
                <option value="bullish_reversal_confirmed">Reversión Confirmada</option>
                <option value="early_bullish_reversal">Reversión Temprana</option>
              </select>
            </FormGroup>

            <FormGroup>
              <label>Threshold de Entrada (OP Score)</label>
              <input type="number" name="entryScoreThreshold" value={config.entryScoreThreshold} onChange={handleConfigChange} />
            </FormGroup>
            <FormGroup>
              <label>Estrategia de Salida</label>
              <select name="exitStrategy" value={config.exitStrategy} onChange={handleConfigChange}>
                <option value="setup_deterioration">Deterioro de Setup (Recomendado)</option>
                <option value="loss_sma30">Pérdida de SMA 30 (Estándar)</option>
                <option value="loss_ema21">Pérdida de EMA 21 (Rápida)</option>
              </select>
            </FormGroup>

            <FormGroup>
              <label>Stop Loss (%) 0 = Inactivo</label>
              <input type="number" step="0.01" name="stopLossPct" value={config.stopLossPct} onChange={handleConfigChange} />
            </FormGroup>
            
            <FormGroup>
              <label>Take Profit (%) 0 = Inactivo</label>
              <input type="number" step="0.01" name="takeProfitPct" value={config.takeProfitPct} onChange={handleConfigChange} />
            </FormGroup>

            <FormGroup>
              <label>Benchmark (RS)</label>
              <input type="text" name="benchmarkSymbol" value={config.benchmarkSymbol} onChange={handleConfigChange} />
            </FormGroup>

            <RunButton onClick={runBacktest} disabled={loading}>
              {loading ? 'Ejecutando...' : 'Ejecutar Backtest'}
            </RunButton>
          </ConfigPanel>

          {/* Área Principal de Resultados */}
          <ResultsArea>
            {error && <ErrorAlert>{error}</ErrorAlert>}
            
            {loading && !results && (
              <LoadingState>
                <div className="spinner"></div>
                <p>Procesando años de historia... ⏳</p>
              </LoadingState>
            )}

            {results && !loading && (
              <>
                <ResultHeader>
                  <h2>{activeTicker} <span>{results.companyName}</span></h2>
                  <Badge>{results.period.startDate} a {results.period.endDate}</Badge>
                </ResultHeader>

                {/* Métricas Resumen */}
                <MetricsGrid>
                  <MetricCard highlight={results.summary.netProfit > 0}>
                    <h4>Retorno Neto</h4>
                    <div className="value">{(results.summary.returnPct ?? 0).toFixed(2)}%</div>
                    <div className="sub">Profit: ${(results.summary.netProfit ?? 0).toLocaleString()}</div>
                  </MetricCard>
                  
                  <MetricCard highlight={(results.summary.cagr ?? 0) > 0}>
                    <h4>CAGR Total (Cuenta)</h4>
                    <div className="value">{(results.summary.cagr ?? 0).toFixed(2)}%</div>
                    <div className="sub">Con cash ocioso</div>
                  </MetricCard>

                  <MetricCard highlight={(results.summary.investedCagr ?? 0) > (results.summary.buyAndHold?.cagr ?? 0)}>
                    <h4>CAGR Invertido (Señal)</h4>
                    <div className="value">{(results.summary.investedCagr ?? 0).toFixed(2)}%</div>
                    <div className="sub">vs B&H: {(results.summary.buyAndHold?.cagr ?? 0).toFixed(2)}%</div>
                  </MetricCard>
                  
                  <MetricCard>
                    <h4>Max Drawdown</h4>
                    <div className="value warning">{(results.summary.maxDrawdownPct ?? 0).toFixed(2)}%</div>
                    <div className="sub">vs B&H: {(results.summary.buyAndHold?.maxDrawdownPct ?? 0).toFixed(2)}%</div>
                  </MetricCard>

                  <MetricCard>
                    <h4>Win Rate</h4>
                    <div className="value">{(results.summary.winRate ?? 0).toFixed(1)}%</div>
                    <div className="sub">{results.summary.numWinners ?? 0}W - {results.summary.numLosers ?? 0}L</div>
                  </MetricCard>

                  <MetricCard>
                    <h4>Profit Factor</h4>
                    <div className="value">{results.summary.profitFactor === null ? '∞' : (results.summary.profitFactor ?? 0).toFixed(2)}</div>
                    <div className="sub">Trades Totales: {results.summary.numTrades ?? 0}</div>
                  </MetricCard>

                  <MetricCard>
                    <h4>Expectancy / Avg Hold</h4>
                    <div className="value">${results.summary.expectancy ?? 0}</div>
                    <div className="sub">{results.summary.avgHoldingDays ?? 0} días / trade</div>
                  </MetricCard>

                  <MetricCard>
                    <h4>Tiempo en Mercado</h4>
                    <div className="value">{(results.summary.timeInMarketPct ?? 0).toFixed(1)}%</div>
                    <div className="sub">Exposición de Capital</div>
                  </MetricCard>
                </MetricsGrid>

                {/* Gráfico de Equidad */}
                <ChartSection>
                  <h3>Curva de Capital (Equity) vs Benchmark</h3>
                  <div className="chart-wrapper">
                    <ResponsiveContainer width="100%" height={300}>
                      <AreaChart data={equityData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorEquity" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={colors.secondary} stopOpacity={0.3}/>
                            <stop offset="95%" stopColor={colors.secondary} stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
                        <XAxis dataKey="date" stroke="#94a3b8" tick={{fontSize: 12}} minTickGap={30} />
                        <YAxis domain={['auto', 'auto']} stroke="#94a3b8" tickFormatter={(val) => `$${val.toLocaleString()}`} />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px' }}
                          formatter={(value) => `$${value.toLocaleString()}`}
                        />
                        <Legend />
                        <Area type="monotone" name="Estrategia (Equity)" dataKey="equity" stroke={colors.secondary} fillOpacity={1} fill="url(#colorEquity)" />
                        <Line type="monotone" name={`Buy & Hold (${results.benchmarkSymbol})`} dataKey="benchmarkEquity" stroke="#94a3b8" dot={false} strokeDasharray="5 5" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </ChartSection>

                {/* Gráfico de Precio y Señales */}
                {results.indicatorHistory && (
                  <ChartSection>
                    <h3>Acción del Precio y Señales</h3>
                    <div className="chart-wrapper">
                      <ResponsiveContainer width="100%" height={400}>
                        <ComposedChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                          <XAxis dataKey="date" stroke="#94a3b8" minTickGap={40} />
                          <YAxis domain={['auto', 'auto']} stroke="#94a3b8" />
                          <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', zIndex: 100 }} />
                          <Legend />
                          <Line type="monotone" dataKey="close" name="Price" stroke="#ffffff" dot={false} strokeWidth={2} />
                          <Line type="monotone" dataKey="ema21" name="EMA 21" stroke="#f472b6" dot={false} strokeWidth={1} />
                          <Line type="monotone" dataKey="sma30" name="SMA 30" stroke="#fbbf24" dot={false} strokeWidth={1} />
                          <Line type="monotone" dataKey="sma50" name="SMA 50" stroke={colors.secondary} dot={false} strokeWidth={1} />
                          <Line type="monotone" dataKey="ema200" name="EMA 200" stroke="#94a3b8" dot={false} strokeWidth={1} />
                          
                          <Scatter name="Buy Signal" dataKey="buySignal" fill="#22c55e" shape="triangle" />
                          <Scatter name="Sell Signal" dataKey="sellSignal" fill="#ef4444" shape="square" />
                        </ComposedChart>
                      </ResponsiveContainer>
                    </div>
                  </ChartSection>
                )}

                {/* Gráfico de OP Score */}
                {results.indicatorHistory && (
                  <ChartSection>
                    <h3>Evolución del OP Score</h3>
                    <div className="chart-wrapper">
                      <ResponsiveContainer width="100%" height={200}>
                        <LineChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                          <XAxis dataKey="date" stroke="#94a3b8" minTickGap={40} />
                          <YAxis domain={[0, 100]} stroke="#94a3b8" />
                          <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px' }} />
                          <ReferenceLine y={config.entryScoreThreshold} label="Entry" stroke="#22c55e" strokeDasharray="3 3" />
                          <Line type="monotone" dataKey="opScore" name="OP Score" stroke="#8b5cf6" dot={false} strokeWidth={2} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </ChartSection>
                )}

                {/* Tabla de Operaciones */}
                <Section>
                  <h3>Historial de Operaciones ({results.trades.length})</h3>
                  <TableWrapper>
                    <Table>
                      <thead>
                        <tr>
                          <th>Entrada</th>
                          <th>Salida</th>
                          <th>Días</th>
                          <th>Precio In</th>
                          <th>Precio Out</th>
                          <th>Shares</th>
                          <th>P&L</th>
                          <th>Retorno %</th>
                          <th>Motivo Salida</th>
                        </tr>
                      </thead>
                      <tbody>
                        {results.trades.map((trade, i) => (
                          <tr key={i}>
                            <td>{trade.entryDate}</td>
                            <td>{trade.exitDate}</td>
                            <td>{trade.holdingDays}</td>
                            <td>${trade.entryPrice}</td>
                            <td>${trade.exitPrice}</td>
                            <td>{trade.shares}</td>
                            <td className={trade.pnl >= 0 ? 'pos' : 'neg'}>
                              ${trade.pnl > 0 ? '+' : ''}{trade.pnl.toLocaleString()}
                            </td>
                            <td className={trade.returnPct >= 0 ? 'pos' : 'neg'}>
                              {trade.returnPct > 0 ? '+' : ''}{trade.returnPct}%
                            </td>
                            <td>{trade.exitType}</td>
                          </tr>
                        ))}
                        {results.trades.length === 0 && (
                          <tr>
                            <td colSpan="9" style={{textAlign:'center', padding:'2rem'}}>No se ejecutaron operaciones en este período.</td>
                          </tr>
                        )}
                      </tbody>
                    </Table>
                  </TableWrapper>
                </Section>
              </>
            )}
          </ResultsArea>
        </ContentLayout>
      )}

      {/* Modal de Ayuda */}
      {showHelpModal && (
        <ModalOverlay onClick={() => setShowHelpModal(false)}>
          <ModalContent onClick={e => e.stopPropagation()}>
            <ModalHeader>
              <h2>Glosario de Métricas</h2>
              <CloseButton onClick={() => setShowHelpModal(false)}><X size={24} /></CloseButton>
            </ModalHeader>
            <ModalBody>
              <MetricDef>
                <dt>Retorno Neto</dt>
                <dd>La ganancia o pérdida total generada por la estrategia, incluyendo tanto capital como porcentaje de crecimiento.</dd>
              </MetricDef>
              <MetricDef>
                <dt>CAGR (Compound Annual Growth Rate)</dt>
                <dd>Tasa de crecimiento anual compuesto. Mide el rendimiento anualizado de la cuenta, permitiendo compararlo fácilmente contra el rendimiento de Buy & Hold (mantener el activo) independientemente de la duración del backtest.</dd>
              </MetricDef>
              <MetricDef>
                <dt>Max Drawdown</dt>
                <dd>La caída máxima porcentual que experimentó la cuenta desde su punto más alto (pico) hasta su punto más bajo (valle) durante el período. Mide el riesgo extremo y estrés de la estrategia.</dd>
              </MetricDef>
              <MetricDef>
                <dt>Win Rate</dt>
                <dd>El porcentaje de operaciones que cerraron en ganancia (Winners) frente al total de operaciones (Winners + Losers).</dd>
              </MetricDef>
              <MetricDef>
                <dt>Profit Factor</dt>
                <dd>La relación entre las ganancias brutas totales y las pérdidas brutas totales. Un valor mayor a 1.0 indica que el sistema generó ganancias netas. Por encima de 2.0 se considera excelente.</dd>
              </MetricDef>
              <MetricDef>
                <dt>Expectancy (Esperanza Matemática)</dt>
                <dd>La ganancia promedio en dólares (o pérdida) que se espera estadísticamente por cada nueva operación, combinando la probabilidad de acierto (Win Rate) y el ratio riesgo/beneficio (Average Win / Average Loss).</dd>
              </MetricDef>
              <MetricDef>
                <dt>Avg Hold (Holding Days)</dt>
                <dd>El promedio de días calendario que cada operación se mantuvo abierta antes de cerrar por alguna de las reglas (Exit Score, Stop Loss o Take Profit).</dd>
              </MetricDef>
              <MetricDef>
                <dt>Stop Loss / Take Profit</dt>
                <dd>Niveles de protección de capital estáticos ingresados por el usuario. El sistema simula salidas intradía conservadoras, asumiendo que el Stop Loss tiene prioridad si ambos eventos ocurren el mismo día.</dd>
              </MetricDef>
            </ModalBody>
          </ModalContent>
        </ModalOverlay>
      )}
    </PageContainer>
    </PageWrapper>
  );
};

// ─── Estilos (Premium UI) ──────────────────────────────────────────────────

const PageWrapper = styled.div`
  background: #0f172a;
  min-height: 100vh;
  width: 100%;
`;

const PageContainer = styled.div`
  padding: 2rem;
  max-width: 1400px;
  margin: 0 auto;
  color: #f8fafc;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-bottom: 2rem;
  
  @media (max-width: 768px) {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }
`;

const HeaderLeft = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 1rem;
`;

const HelpButton = styled.button`
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: #94a3b8;
  border-radius: 50%;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  margin-top: 0.25rem;

  &:hover {
    background: ${colors.primary}20;
    color: ${colors.secondary};
    border-color: ${colors.secondary}50;
    transform: translateY(-2px);
  }
`;

const Title = styled.h1`
  font-size: 2.5rem;
  font-weight: 800;
  background: ${colors.gradients.primary};
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  margin-bottom: 0.5rem;
`;

const Subtitle = styled.p`
  color: #94a3b8;
  font-size: 1.1rem;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  
  label {
    font-size: 0.85rem;
    font-weight: 600;
    color: #94a3b8;
  }
  
  input, select {
    background: #0f172a;
    border: 1px solid #334155;
    border-radius: 8px;
    padding: 0.75rem;
    color: white;
    font-size: 0.95rem;
    transition: all 0.2s;
    
    &:focus {
      outline: none;
      border-color: ${colors.secondary};
    }
  }

  select {
    cursor: pointer;
    appearance: none;
    background-image: url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='%2394a3b8' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3E%3C/svg%3E");
    background-position: right 0.5rem center;
    background-repeat: no-repeat;
    background-size: 1.5em 1.5em;
    padding-right: 2.5rem;
  }
`;

const SearchBox = styled.div`
  input {
    width: 300px;
    padding: 0.75rem 1.25rem;
    border-radius: 99px;
    background: #1e293b;
    border: 1px solid #334155;
    color: white;
    font-size: 1rem;
    transition: all 0.3s ease;
    
    &:focus {
      outline: none;
      border-color: ${colors.secondary};
      box-shadow: 0 0 0 3px rgba(212, 175, 55, 0.2);
    }
  }
`;

const EmptyState = styled.div`
  background: rgba(30, 41, 59, 0.5);
  border: 1px dashed #334155;
  border-radius: 16px;
  padding: 5rem 2rem;
  text-align: center;
  backdrop-filter: blur(10px);
  
  h2 {
    font-size: 1.5rem;
    margin-bottom: 0.5rem;
    color: #e2e8f0;
  }
  
  p {
    color: #94a3b8;
  }
`;

const Icon = styled.div`
  font-size: 4rem;
  margin-bottom: 1rem;
`;

const ContentLayout = styled.div`
  display: grid;
  grid-template-columns: 320px 1fr;
  gap: 2rem;
  
  @media (max-width: 1024px) {
    grid-template-columns: 1fr;
  }
`;

const ConfigPanel = styled.div`
  background: #1e293b;
  border-radius: 16px;
  padding: 1.5rem;
  border: 1px solid rgba(255, 255, 255, 0.05);
  height: fit-content;
  position: sticky;
  top: 2rem;
  
  h3 {
    margin-bottom: 1.5rem;
    font-size: 1.25rem;
    color: #f1f5f9;
    border-bottom: 1px solid #334155;
    padding-bottom: 0.5rem;
  }
`;

const Divider = styled.hr`
  border: none;
  border-top: 1px dashed #334155;
  margin: 2rem 0;
`;

const RunButton = styled.button`
  width: 100%;
  padding: 1rem;
  background: ${colors.gradients.primary};
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 700;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.2s;
  margin-top: 1rem;
  
  &:hover:not(:disabled) {
    background: ${colors.primaryDark};
    transform: translateY(-2px);
    box-shadow: ${colors.shadows.primary};
  }
  
  &:disabled {
    background: #334155;
    color: #64748b;
    cursor: not-allowed;
  }
`;

const ResultsArea = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2rem;
`;

const ResultHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  
  h2 {
    font-size: 2rem;
    color: #fff;
    margin: 0;
    
    span {
      font-size: 1.2rem;
      color: #94a3b8;
      font-weight: 400;
      margin-left: 0.5rem;
    }
  }
`;

const Badge = styled.span`
  background: ${colors.primary}20;
  color: ${colors.secondary};
  border: 1px solid ${colors.primary}40;
  padding: 0.25rem 0.75rem;
  border-radius: 99px;
  font-size: 0.85rem;
  font-weight: 600;
`;

const MetricsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
`;

const MetricCard = styled.div`
  background: #1e293b;
  border-radius: 12px;
  padding: 1.5rem;
  border: 1px solid ${props => props.highlight ? 'rgba(34, 197, 94, 0.3)' : 'rgba(255, 255, 255, 0.05)'};
  position: relative;
  overflow: hidden;
  
  @media (min-width: 1024px) {
    &:first-child {
      grid-column: span 2;
    }
  }
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 4px;
    height: 100%;
    background: ${props => props.highlight ? '#22c55e' : colors.secondary};
    opacity: ${props => props.highlight ? 1 : 0};
  }
  
  h4 {
    color: #94a3b8;
    font-size: 0.9rem;
    font-weight: 500;
    margin-bottom: 0.5rem;
  }
  
  .value {
    font-size: 1.75rem;
    font-weight: 700;
    color: #f8fafc;
    
    &.warning {
      color: #f59e0b;
    }
  }
  
  .sub {
    font-size: 0.85rem;
    color: #64748b;
    margin-top: 0.5rem;
  }
`;

const ChartSection = styled.div`
  background: #1e293b;
  border-radius: 16px;
  padding: 1.5rem;
  border: 1px solid rgba(255, 255, 255, 0.05);
  
  h3 {
    margin-bottom: 1.5rem;
    font-size: 1.25rem;
    color: #f1f5f9;
  }
  
  .chart-wrapper {
    background: #0f172a;
    border-radius: 8px;
    padding: 1rem 1rem 0 0;
  }
`;

const Section = styled.div`
  background: #1e293b;
  border-radius: 16px;
  padding: 1.5rem;
  border: 1px solid rgba(255, 255, 255, 0.05);
  
  h3 {
    margin-bottom: 1.5rem;
    font-size: 1.25rem;
    color: #f1f5f9;
  }
`;

const TableWrapper = styled.div`
  overflow-x: auto;
  border-radius: 8px;
  border: 1px solid #334155;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  font-size: 0.9rem;
  
  th, td {
    padding: 1rem;
    text-align: left;
    border-bottom: 1px solid #334155;
  }
  
  th {
    background: #0f172a;
    color: #94a3b8;
    font-weight: 600;
    text-transform: uppercase;
    font-size: 0.8rem;
    letter-spacing: 0.05em;
  }
  
  tr:last-child td {
    border-bottom: none;
  }
  
  tr:nth-child(even) {
    background: rgba(0,0,0,0.1);
  }
  
  td {
    color: #cbd5e1;
    
    &.pos { color: #22c55e; font-weight: 600; }
    &.neg { color: #ef4444; font-weight: 600; }
  }
`;

const LoadingState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 5rem;
  
  .spinner {
    width: 50px;
    height: 50px;
    border: 4px solid rgba(212, 175, 55, 0.2);
    border-top-color: ${colors.secondary};
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin-bottom: 1.5rem;
  }
  
  p {
    color: #94a3b8;
    font-size: 1.1rem;
  }
  
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
`;

const ErrorAlert = styled.div`
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
  color: #ef4444;
  padding: 1.5rem;
  border-radius: 8px;
  font-weight: 500;
`;

// ─── Estilos Modal Ayuda ───────────────────────────────────────────────────

const ModalOverlay = styled.div`
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  padding: 1rem;
`;

const ModalContent = styled.div`
  background: #0f172a;
  border: 1px solid #334155;
  border-radius: 16px;
  width: 100%;
  max-width: 650px;
  max-height: 85vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
  animation: modalIn 0.3s cubic-bezier(0.16, 1, 0.3, 1);

  @keyframes modalIn {
    from { opacity: 0; transform: translateY(20px) scale(0.95); }
    to { opacity: 1; transform: translateY(0) scale(1); }
  }
`;

const ModalHeader = styled.div`
  padding: 1.5rem;
  border-bottom: 1px solid #1e293b;
  display: flex;
  align-items: center;
  justify-content: space-between;

  h2 {
    margin: 0;
    font-size: 1.25rem;
    color: #f8fafc;
    font-family: 'Unbounded', sans-serif;
  }
`;

const CloseButton = styled.button`
  background: transparent;
  border: none;
  color: #94a3b8;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.25rem;
  border-radius: 50%;
  transition: all 0.2s;

  &:hover {
    background: rgba(255, 255, 255, 0.05);
    color: white;
  }
`;

const ModalBody = styled.div`
  padding: 1.5rem;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

const MetricDef = styled.dl`
  margin: 0;
  
  dt {
    font-weight: 700;
    color: ${colors.secondary};
    margin-bottom: 0.4rem;
    font-size: 1rem;
  }
  
  dd {
    margin: 0;
    color: #cbd5e1;
    font-size: 0.95rem;
    line-height: 1.5;
  }
`;

export default BacktestingPage;
