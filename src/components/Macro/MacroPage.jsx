import React from 'react';
import { 
  
  TrendingUp, 
  DollarSign, 
  BarChart2, 
  Newspaper,
  Calendar,
  Package
} from 'lucide-react';
import { SiTradingview } from 'react-icons/si';
import {
  MacroContainer,
  Header,
  TitleArea,
  Title,
  Sub,
  MacroGrid,
  CommoditiesGrid,
  MacroCard,
  CardHeader,
  ListContainer,
  ListItem,
  NewsGrid,
  NewsCard,
  SectionDivider,
  LoadingContainer,
  TVLink,
  ItemRightContainer
} from './styled/MacroStyles';
import AppLogo from '../common/Logo';

const MacroPage = ({ data, sectionLoading = {}, error }) => {
  // Ya no bloqueamos toda la página: cada sección muestra su propio skeleton.

  if (error) {
    return (
      <MacroContainer>
        <div style={{ color: '#f87171', textAlign: 'center', marginTop: '2rem' }}>
          {error}
        </div>
      </MacroContainer>
    );
  }

  // Skeleton animado reutilizable
  const SectionSkeleton = ({ rows = 4 }) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', padding: '4px 0' }}>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} style={{
          height: '36px', borderRadius: '6px',
          background: 'linear-gradient(90deg, rgba(255,255,255,0.04) 25%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.04) 75%)',
          backgroundSize: '200% 100%',
          animation: 'macroSkeletonPulse 1.4s ease-in-out infinite',
          animationDelay: `${i * 0.08}s`
        }} />
      ))}
      <style>{`@keyframes macroSkeletonPulse { 0%,100%{background-position:200% 0} 50%{background-position:0% 0} }`}</style>
    </div>
  );

  const formatPrice = (price, isPercentage = false, noDecimals = false) => {
    if (!price && price !== 0) return '-';
    if (isPercentage) return `${price.toFixed(2)}%`;
    if (noDecimals) return price.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
    return price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 });
  };

  const getChangeClass = (change) => {
    if (change > 0) return 'positive';
    if (change < 0) return 'negative';
    return 'neutral';
  };

  const formatChange = (change) => {
    if (!change && change !== 0) return '';
    const sign = change > 0 ? '+' : '';
    return `${sign}${change.toFixed(2)}%`;
  };

  const formatDate = (unixTimestamp) => {
    if (!unixTimestamp) return '';
    const date = new Date(unixTimestamp * 1000);
    return date.toLocaleDateString('es-AR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  };

  const getEarningsDateDisplay = () => {
    if (!data.earningsDate) return '';
    const [year, month, day] = data.earningsDate.split('-');
    const dateObj = new Date(year, month - 1, day);
    
    const today = new Date();
    if (today.getDate() === dateObj.getDate() && today.getMonth() === dateObj.getMonth() && today.getFullYear() === dateObj.getFullYear()) {
      return '(Hoy)';
    }
    
    return `(${dateObj.toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })})`;
  };

  const getTradingViewUrl = (symbol) => {
    let tvSymbol = symbol;
    switch (symbol) {
      case 'EURUSD=X': tvSymbol = 'EURUSD'; break;
      case 'JPY=X': tvSymbol = 'USDJPY'; break;
      case 'BRL=X': tvSymbol = 'USDBRL'; break;
      case 'CNY=X': tvSymbol = 'USDCNY'; break;
      case 'KRW=X': tvSymbol = 'USDKRW'; break;
      case 'ARS_OFICIAL': tvSymbol = 'FX_IDC:USDARS'; break;
      case 'ARS_MEP': tvSymbol = 'BCBA:MEP'; break;
      case 'ARS_CCL': tvSymbol = 'BCBA:CCL'; break;
      case '^TNX': tvSymbol = 'US10Y'; break;
      case 'DX-Y.NYB': tvSymbol = 'DXY'; break;
      case '^VIX': tvSymbol = 'VIX'; break;
      case 'QQQ/SPY': tvSymbol = 'QQQ/SPY'; break;
      case 'IGV/SMH': tvSymbol = 'IGV/SMH'; break;
      case 'IWM/SPY': tvSymbol = 'IWM/SPY'; break;
      case 'CL=F': tvSymbol = 'CL1!'; break;
      case 'XAUUSD=X': tvSymbol = 'XAUUSD'; break;
      case 'XAGUSD=X': tvSymbol = 'XAGUSD'; break;
      case 'HG=F': tvSymbol = 'HG1!'; break;
      case 'ZS=F': tvSymbol = 'ZS1!'; break;
      case 'ZW=F': tvSymbol = 'ZW1!'; break;
      case 'ZC=F': tvSymbol = 'ZC1!'; break;
      case 'NG=F': tvSymbol = 'NG1!'; break;
      default: tvSymbol = symbol;
    }
    return `https://es.tradingview.com/chart/iI2KiaxW/?symbol=${tvSymbol}`;
  };

  return (
    <MacroContainer>
      <Header>
        <TitleArea>
          <Title>Panorama Macro</Title>
          <Sub>Mercado global, noticias y calendario de earnings en tiempo real</Sub>
        </TitleArea>
      </Header>

      <MacroGrid>
        {/* EARNINGS CARD */}
        <MacroCard className="col-span-4">
          <CardHeader>
            <TrendingUp size={20} color="#818cf8" />
            <h2>Earnings <span style={{ fontSize: '0.85rem', color: '#94a3b8', marginLeft: '4px' }}>{getEarningsDateDisplay()}</span></h2>
          </CardHeader>
          
          <ListContainer>
            {sectionLoading.earnings ? <SectionSkeleton rows={5} /> : (
            <>
            <div style={{ fontSize: '0.85rem', color: '#94a3b8', fontWeight: 600, marginTop: '0.5rem' }}>
              Before Open
            </div>
            {data.earnings.bmo.length === 0 ? (
              <div style={{ fontSize: '0.85rem', color: '#64748b' }}>Sin reportes destacables</div>
            ) : (
              data.earnings.bmo.slice(0, 5).map((earn, i) => (
                <ListItem key={i}>
                  <div className="item-left">
                    <span className="item-title">{earn.symbol}</span>
                    <span className="item-subtitle">EPS Est: {earn.epsEstimate ? earn.epsEstimate : 'N/A'}</span>
                  </div>
                  <ItemRightContainer>
                    <Calendar size={16} color="#64748b" />
                    {getTradingViewUrl(earn.symbol) && (
                      <TVLink 
                        className="tv-link"
                        href={getTradingViewUrl(earn.symbol)} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        title="Ver en TradingView"
                      >
                        <SiTradingview size={14} />
                      </TVLink>
                    )}
                  </ItemRightContainer>
                </ListItem>
              ))
            )}

            <SectionDivider />

            <div style={{ fontSize: '0.85rem', color: '#94a3b8', fontWeight: 600 }}>
              Post Open / AMC
            </div>
            {data.earnings.amc.length === 0 ? (
              <div style={{ fontSize: '0.85rem', color: '#64748b' }}>Sin reportes destacables</div>
            ) : (
              data.earnings.amc.slice(0, 5).map((earn, i) => (
                <ListItem key={i}>
                  <div className="item-left">
                    <span className="item-title">{earn.symbol}</span>
                    <span className="item-subtitle">EPS Est: {earn.epsEstimate ? earn.epsEstimate : 'N/A'}</span>
                  </div>
                  <ItemRightContainer>
                    <Calendar size={16} color="#64748b" />
                    {getTradingViewUrl(earn.symbol) ? (
                      <TVLink 
                        className="tv-link"
                        href={getTradingViewUrl(earn.symbol)} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        title="Ver en TradingView"
                      >
                        <SiTradingview size={14} />
                      </TVLink>
                    ) : (
                      <div style={{ width: '26px', marginLeft: '10px' }} />
                    )}
                  </ItemRightContainer>
                </ListItem>
              ))
            )}
            </>
            )}
          </ListContainer>
        </MacroCard>

        {/* FOREX CARD */}
        <MacroCard className="col-span-4">
          <CardHeader>
            <DollarSign size={20} color="#34d399" />
            <h2>Forex</h2>
          </CardHeader>
          
          <ListContainer>
            {sectionLoading.forex ? <SectionSkeleton rows={6} /> : data.forex.map((fx, i) => (
              <ListItem key={i}>
                <div className="item-left" style={{ flexDirection: 'row', alignItems: 'center', gap: '8px' }}>
                  {fx.iso && (
                    <img
                      src={`https://flagcdn.com/20x15/${fx.iso}.png`}
                      srcSet={`https://flagcdn.com/40x30/${fx.iso}.png 2x`}
                      width="20" height="15"
                      alt={fx.iso}
                      style={{ borderRadius: 2, objectFit: 'cover', flexShrink: 0 }}
                    />
                  )}
                  <span className="item-title">{fx.name}</span>
                </div>
                <ItemRightContainer>
                  <div className="item-right">
                    <span className="item-value">
                      {fx.symbol.startsWith('ARS_') 
                        ? formatPrice(fx.price, false, true) 
                        : formatPrice(fx.price)}
                    </span>
                    <span className={`item-change ${getChangeClass(fx.change)}`}>
                      {formatChange(fx.change)}
                    </span>
                  </div>
                  {getTradingViewUrl(fx.symbol) ? (
                    <TVLink 
                      className="tv-link"
                      href={getTradingViewUrl(fx.symbol)} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      title="Ver en TradingView"
                    >
                      <SiTradingview size={14} />
                    </TVLink>
                  ) : (
                    <div style={{ width: '26px', marginLeft: '10px' }} />
                  )}
                </ItemRightContainer>
              </ListItem>
            ))}
          </ListContainer>
        </MacroCard>

        {/* MACRO RATES CARD */}
        <MacroCard className="col-span-4">
          <CardHeader>
            <BarChart2 size={20} color="#f472b6" />
            <h2>Macro</h2>
          </CardHeader>
          
          <ListContainer>
            {sectionLoading.macro ? <SectionSkeleton rows={6} /> : data.macro.map((m, i) => (
              <ListItem key={i}>
                <div className="item-left">
                  <span className="item-title">{m.name}</span>
                </div>
                <ItemRightContainer>
                  <div className="item-right">
                    <span className="item-value">
                      {m.symbol === '^TNX' ? formatPrice(m.price, true) : formatPrice(m.price)}
                    </span>
                    <span className={`item-change ${getChangeClass(m.change)}`}>
                      {formatChange(m.change)}
                    </span>
                  </div>
                  {getTradingViewUrl(m.symbol) ? (
                    <TVLink 
                      className="tv-link"
                      href={getTradingViewUrl(m.symbol)} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      title="Ver en TradingView"
                    >
                      <SiTradingview size={14} />
                    </TVLink>
                  ) : (
                    <div style={{ width: '26px', marginLeft: '10px' }} />
                  )}
                </ItemRightContainer>
              </ListItem>
            ))}
          </ListContainer>
        </MacroCard>

        {/* COMMODITIES CARD */}
        <MacroCard className="col-span-12">
          <CardHeader>
            <Package size={20} color="#f59e0b" />
            <h2>Materias Primas</h2>
          </CardHeader>
          
          <CommoditiesGrid>
            {sectionLoading.commodities ? <SectionSkeleton rows={4} /> : data.commodities && data.commodities.map((c, i) => (
              <ListItem key={i}>
                <div className="item-left">
                  <span className="item-title">{c.name}</span>
                </div>
                <ItemRightContainer>
                  <div className="item-right">
                    <span className="item-value">{formatPrice(c.price)}</span>
                    <span className={`item-change ${getChangeClass(c.change)}`}>
                      {formatChange(c.change)}
                    </span>
                  </div>
                  {getTradingViewUrl(c.symbol) ? (
                    <TVLink 
                      className="tv-link"
                      href={getTradingViewUrl(c.symbol)} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      title="Ver en TradingView"
                    >
                      <SiTradingview size={14} />
                    </TVLink>
                  ) : (
                    <div style={{ width: '26px', marginLeft: '10px' }} />
                  )}
                </ItemRightContainer>
              </ListItem>
            ))}
          </CommoditiesGrid>
        </MacroCard>

        {/* NEWS CARD */}
        <MacroCard className="col-span-12">
          <CardHeader>
            <Newspaper size={20} color="#fbbf24" />
            <h2>Noticias</h2>
          </CardHeader>
          
          <NewsGrid>
            {sectionLoading.news ? (
              <div style={{ gridColumn: '1/-1' }}><SectionSkeleton rows={3} /></div>
            ) : data.news.map((n, i) => (
              <NewsCard key={i} href={n.url} target="_blank" rel="noopener noreferrer">
                {n.image && (
                  <img src={n.image} alt="News" className="news-image" loading="lazy" />
                )}
                <div className="news-content">
                  <span className="news-source">{n.source}</span>
                  <span className="news-title">{n.headline}</span>
                  <span className="news-date">{formatDate(n.datetime)}</span>
                </div>
              </NewsCard>
            ))}
          </NewsGrid>
        </MacroCard>
      </MacroGrid>
    </MacroContainer>
  );
};

export default MacroPage;
