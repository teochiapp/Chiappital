import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import { motion } from 'framer-motion';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import { TrendingUp, PlusCircle, History, PieChart, Search, DownloadCloud, RefreshCw, CalendarDays } from 'lucide-react';
import TradeForm from './TradeForm';
import ClosedTradesHistory from './ClosedTradesHistory';
import TradeStats from './TradeStats';
import ActivePositions from './ActivePositions';
import MonthlyMovements from './MonthlyMovements';
// import TradesDebug from '../Debug/TradesDebug'; // Removido temporalmente
import Logo from '../common/Logo';
import { useStrapiTrades } from '../../hooks/useApiTrades';
import { useAccount } from '../../context/AccountContext';
import { colors, componentColors, getTradingColor, withOpacity } from '../../styles/colors';

const PageWrapper = styled.div`
  min-height: calc(100vh - 80px); /* 80px is approx header height */
  background-color: #0f172a;
  width: 100%;
`;

const PageContainer = styled.div`
  max-width: 1500px;
  margin: 0 auto;
  padding: 2rem;
  color: white;
`;

const PageHeader = styled.div`
  text-align: center;
  margin-bottom: 3rem;
`;

const PageTitle = styled.h1`
  font-size: 2.5rem;
  font-weight: 700;
  font-family: 'Unbounded', sans-serif;
  color: white;
  margin: 0 0 1rem 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
`;

const PageSubtitle = styled.p`
  font-size: 1.2rem;
  color: #94a3b8;
  font-family: 'Unbounded', sans-serif;
  font-weight: 300;
  margin: 0;
`;

const TabContainer = styled.div`
  display: flex;
  margin-bottom: 2rem;
  background: #1e293b;
  border-radius: 8px;
  padding: 0.5rem;
  border: 1px solid rgba(255, 255, 255, 0.05);
`;

const Tab = styled.button`
  flex: 1;
  padding: 1rem;
  border: none;
  background: ${props => props.$active ? 'rgba(255, 255, 255, 0.1)' : 'transparent'};
  color: ${props => props.$active ? 'white' : '#94a3b8'};
  font-size: 1rem;
  font-weight: 500;
  font-family: 'Unbounded', sans-serif;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: none;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;

  &:hover {
    background: ${props => props.$active ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.05)'};
    color: white;
  }
`;

const TabContent = styled.div`
  min-height: 400px;
`;

const HeaderActions = styled.div`
  display: flex;
  justify-content: flex-end;
  margin-top: -60px;
  margin-bottom: 40px;
`;

const ImportButton = styled.button`
  background: ${colors.primary};
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  font-family: 'Unbounded', sans-serif;
  &:hover {
    opacity: 0.9;
  }
`;

const TradeLogs = () => {
  const navigate = useNavigate();
  const { accountType } = useAccount();
  const [activeTab, setActiveTab] = useState('stats');
  const { trades, openTrades, closedTrades, stats, loading, error, createTrade, updateTrade, deleteTrade, closeTrade, refreshTrades } = useStrapiTrades();

  const handleTradeAdded = async (tradeData) => {
    try {
      await createTrade(tradeData);
      setActiveTab('stats'); // Cambiar a stats después de agregar
    } catch (err) {
      console.error('Error adding trade:', err);
    }
  };

  const handleTradeDeleted = async (tradeId) => {
    try {
      await deleteTrade(tradeId);
    } catch (err) {
      console.error('Error deleting trade:', err);
    }
  };

  const handleLogoClick = () => {
    navigate('/');
  };

  const handleCloseTrade = async (tradeId, exitPrice, result, notes) => {
    try {
      await closeTrade(tradeId, exitPrice, result, notes);
    } catch (err) {
      console.error('Error closing trade:', err);
    }
  };

  const handleUpdateTrade = async (tradeId, updateData) => {
    try {
      await updateTrade(tradeId, updateData);
    } catch (err) {
      console.error('Error updating trade:', err);
      throw err;
    }
  };

  const fileInputRef = useRef(null);


  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const data = new Uint8Array(event.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });

        const parsedTrades = [];

        // Mapeo común de Cedears a tickers de NYSE/NASDAQ
        const cedearToNyseMap = {
          'GOOGL': 'GOOG',
          'BRKB': 'BRK-B',
          // Agregar más si es necesario
        };

        for (let i = 0; i < rows.length; i++) {
          const row = rows[i];
          if (!row || row.length < 5) continue;
          
          const especie = row[0];
          if (typeof especie !== 'string' || !especie.includes(' - ')) continue;

          let rawSymbol = especie.split(' - ')[0].trim();
          // Aplicar mapeo
          const symbol = cedearToNyseMap[rawSymbol] || rawSymbol;

          const pct = row[4]; // % del total
          if (typeof pct !== 'number') continue;

          parsedTrades.push({
            symbol: symbol,
            portfolio_percentage: pct,
          });
        }

        if (parsedTrades.length === 0) {
          alert('No se encontraron trades válidos en el archivo Excel.');
          return;
        }

        if (window.confirm(`¿Seguro que querés procesar ${parsedTrades.length} activos del portafolio IEB?\nLos existentes solo actualizarán su % de cartera, y los nuevos se crearán vacíos.`)) {
          const token = localStorage.getItem('st_token');
          if (!token) throw new Error('No hay sesión iniciada');
          
          let updated = 0;
          let created = 0;

          for (const pt of parsedTrades) {
            const existingTrade = openTrades.find(t => (t.symbol || t.attributes?.symbol) === pt.symbol);

            if (existingTrade) {
              // Actualizar trade existente
              const tradeId = existingTrade.id;
              await updateTrade(tradeId, {
                portfolio_percentage: pt.portfolio_percentage
              });
              updated++;
            } else {
              // Crear trade nuevo vacío
              await createTrade({
                 symbol: pt.symbol,
                 type: 'buy',
                 status: 'open',
                 entry_price: 0, // Precio vacío
                 portfolio_percentage: pt.portfolio_percentage,
                 notes: 'Creado desde IEB',
                 created_at: new Date().toISOString()
              });
              created++;
            }
          }
          alert(`¡Portafolio procesado con éxito!\nActualizados: ${updated}\nNuevos: ${created}`);
          // Ya no es estrictamente necesario refreshTrades() porque createTrade/updateTrade ya lo llaman internamente, pero lo dejamos por seguridad.
          refreshTrades();
        }
      } catch (err) {
        console.error(err);
        alert('Error importando: ' + err.message);
      }
      
      // Limpiar el input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    };
    
    reader.readAsArrayBuffer(file);
  };

  return (
    <PageWrapper>
      <PageContainer>
      <PageHeader>
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <PageTitle>
            <Logo 
              size="80px" 
              fontSize="3.5rem" 
              gap="1.5rem"
              onClick={handleLogoClick}
              style={{ cursor: 'pointer' }}
            />
          </PageTitle>
        </motion.div>
      </PageHeader>

      <HeaderActions>

        <input 
          type="file" 
          accept=".xlsx, .xls, .csv" 
          ref={fileInputRef} 
          style={{ display: 'none' }} 
          onChange={handleFileUpload} 
        />
        <ImportButton onClick={() => fileInputRef.current?.click()}>
          <DownloadCloud size={18} />
          Importar Portafolio IEB
        </ImportButton>
      </HeaderActions>

      <TabContainer>
        <Tab 
          $active={activeTab === 'stats'} 
          onClick={() => setActiveTab('stats')}
        >
          <TrendingUp size={20} />
          Resumen
        </Tab>
        <Tab 
          $active={activeTab === 'portfolio'} 
          onClick={() => setActiveTab('portfolio')}
        >
          <PieChart size={20} />
          Portfolio
        </Tab>
        <Tab 
          $active={activeTab === 'form'} 
          onClick={() => setActiveTab('form')}
        >
          <PlusCircle size={20} />
          Nuevo Trade
        </Tab>
        <Tab 
          $active={activeTab === 'list'} 
          onClick={() => setActiveTab('list')}
        >
          <History size={20} />
          Historial
        </Tab>
        <Tab 
          $active={activeTab === 'movements'} 
          onClick={() => setActiveTab('movements')}
        >
          <CalendarDays size={20} />
          Movimientos
        </Tab>
      </TabContainer>

      <TabContent>
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
        >
          {activeTab === 'stats' ? (
            <TradeStats 
              stats={stats}
              trades={trades}
              openTrades={openTrades}
              loading={loading}
              error={error}
            />
          ) : activeTab === 'portfolio' ? (
            <ActivePositions
              openTrades={openTrades}
              loading={loading}
              error={error}
              onCloseTrade={handleCloseTrade}
              onUpdateTrade={handleUpdateTrade}
            />
          ) : activeTab === 'form' ? (
            <TradeForm onTradeAdded={handleTradeAdded} />
          ) : activeTab === 'movements' ? (
            <MonthlyMovements
              trades={trades}
              loading={loading}
              error={error}
            />
          ) : (
            <ClosedTradesHistory 
              closedTrades={closedTrades}
              loading={loading}
              error={error}
              onDeleteTrade={deleteTrade}
              onUpdateTrade={handleUpdateTrade}
            />
          )}
        </motion.div>
      </TabContent>
      </PageContainer>
    </PageWrapper>
  );
};

export default TradeLogs;
