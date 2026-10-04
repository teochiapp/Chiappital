// Componente temporal de debug para verificar datos de trades
import React from 'react';
import styled from 'styled-components';

const DebugContainer = styled.div`
  background: #f8f9fa;
  border: 2px solid #e9ecef;
  border-radius: 8px;
  padding: 1rem;
  margin: 1rem 0;
  font-family: monospace;
`;

const DebugTitle = styled.h3`
  color: #dc3545;
  margin: 0 0 1rem 0;
`;

const DebugSection = styled.div`
  margin-bottom: 1rem;
  padding: 0.5rem;
  background: white;
  border-radius: 4px;
`;

const TradesDebug = ({ trades, openTrades, closedTrades, loading, error, refreshTrades }) => {
  // Agregar logs para diagnóstico
  console.log('🐛 TradesDebug - Props recibidos:', {
    tradesLength: trades?.length,
    openTradesLength: openTrades?.length,
    closedTradesLength: closedTrades?.length,
    loading,
    error
  });

  // Test de conectividad
  const [testResult, setTestResult] = React.useState('No probado');
  const [authResult, setAuthResult] = React.useState('No probado');
  
  const testConnectivity = async () => {
    try {
      setTestResult('Probando...');
      const response = await fetch('http://localhost:1337/api/trades');
      const data = await response.json();
      setTestResult(`Status: ${response.status}, Datos: ${JSON.stringify(data)}`);
    } catch (err) {
      setTestResult(`Error: ${err.message}`);
    }
  };

  const testAuthenticated = async () => {
    try {
      setAuthResult('Probando...');
      const token = localStorage.getItem('strapi_token');
      
      if (!token) {
        setAuthResult('❌ No hay token guardado');
        return;
      }

      // Primero obtener info del usuario
      const userResponse = await fetch('http://localhost:1337/api/users/me', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const userData = await userResponse.json();

      // Luego obtener trades
      const response = await fetch('http://localhost:1337/api/trades', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const data = await response.json();
      setAuthResult(`User ID: ${userData.id}, Email: ${userData.email} | Trades Status: ${response.status}, Count: ${data.data?.length || 0}, Data: ${JSON.stringify(data).substring(0, 200)}...`);
    } catch (err) {
      setAuthResult(`Error: ${err.message}`);
    }
  };

  return (
    <DebugContainer>
      <DebugTitle>🐛 DEBUG - Datos de Trades</DebugTitle>
      
      <DebugSection>
        <strong>Loading:</strong> {loading ? 'true' : 'false'}
      </DebugSection>
      
      <DebugSection>
        <strong>Error:</strong> {error || 'null'}
      </DebugSection>

      <DebugSection>
        <strong>Test API (Sin auth):</strong> {testResult}
        <br />
        <button 
          onClick={testConnectivity}
          style={{marginTop: '0.5rem', padding: '0.5rem', background: '#007bff', color: 'white', border: 'none', borderRadius: '4px', marginRight: '0.5rem'}}
        >
          Probar API /trades
        </button>
        <button 
          onClick={testAuthenticated}
          style={{marginTop: '0.5rem', padding: '0.5rem', background: '#28a745', color: 'white', border: 'none', borderRadius: '4px'}}
        >
          Probar Con Token
        </button>
      </DebugSection>

      <DebugSection>
        <strong>Test Autenticado:</strong> {authResult}
      </DebugSection>

      <DebugSection>
        <strong>Token en localStorage:</strong> {localStorage.getItem('strapi_token') ? '✅ SÍ' : '❌ NO'}
        {localStorage.getItem('strapi_token') && (
          <div style={{marginTop: '0.5rem', fontSize: '0.8rem', wordBreak: 'break-all'}}>
            Token: {localStorage.getItem('strapi_token').substring(0, 50)}...
          </div>
        )}
      </DebugSection>

      <DebugSection>
        <strong>Acciones:</strong>
        <br />
        <button 
          onClick={() => refreshTrades && refreshTrades()}
          style={{marginTop: '0.5rem', padding: '0.5rem', background: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', marginRight: '0.5rem'}}
        >
          🔄 Refrescar Trades
        </button>
        <button 
          onClick={() => {
            localStorage.removeItem('strapi_token');
            alert('Token eliminado. Haz logout y login nuevamente.');
          }}
          style={{marginTop: '0.5rem', padding: '0.5rem', background: '#6c757d', color: 'white', border: 'none', borderRadius: '4px', marginRight: '0.5rem'}}
        >
          🔑 Limpiar Token
        </button>
        <button 
          onClick={async () => {
            try {
              const token = localStorage.getItem('strapi_token');
              const userResponse = await fetch('http://localhost:1337/api/users/me', {
                headers: { 'Authorization': `Bearer ${token}` }
              });
              const userData = await userResponse.json();
              
              const testTrade = {
                data: {
                  symbol: 'TEST',
                  type: 'buy',
                  entry_price: 100,
                  notes: 'Debug test',
                  status: 'open',
                  user: userData.id
                }
              };
              
              console.log('🧪 Enviando trade:', testTrade);
              console.log('🧪 User actual:', userData);
              
              const response = await fetch('http://localhost:1337/api/trades', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(testTrade)
              });
              
              const result = await response.json();
              console.log('🧪 Resultado:', result);
              alert(`Trade creado con User ID: ${result.data?.attributes?.user?.data?.id || 'ERROR'}`);
            } catch (err) {
              alert('Error: ' + err.message);
            }
          }}
          style={{marginTop: '0.5rem', padding: '0.5rem', background: '#fd7e14', color: 'white', border: 'none', borderRadius: '4px'}}
        >
          🧪 Test Crear Trade
        </button>
      </DebugSection>
      
      <DebugSection>
        <strong>Total Trades:</strong> {trades?.length || 0}
        {trades && trades.length > 0 && (
          <div style={{marginTop: '0.5rem'}}>
            <strong>Datos del primer trade:</strong>
            <pre style={{fontSize: '0.8rem', overflow: 'auto'}}>
              {JSON.stringify(trades[0], null, 2)}
            </pre>
          </div>
        )}
      </DebugSection>
      
      <DebugSection>
        <strong>Open Trades:</strong> {openTrades?.length || 0}
        {openTrades && openTrades.length > 0 && (
          <div style={{marginTop: '0.5rem'}}>
            <strong>Status de todos los trades abiertos:</strong>
            <ul>
              {openTrades.map((trade, index) => (
                <li key={trade.id || index}>
                  ID: {trade.id}, Status: "{trade.attributes?.status}", Symbol: {trade.attributes?.symbol}
                </li>
              ))}
            </ul>
          </div>
        )}
      </DebugSection>
      
      <DebugSection>
        <strong>Closed Trades:</strong> {closedTrades?.length || 0}
      </DebugSection>
      
      {trades && trades.length > 0 && (
        <DebugSection>
          <strong>Status de TODOS los trades:</strong>
          <ul>
            {trades.map((trade, index) => (
              <li key={trade.id || index}>
                ID: {trade.id}, Status: "{trade.attributes?.status}", Symbol: {trade.attributes?.symbol}
              </li>
            ))}
          </ul>
        </DebugSection>
      )}
    </DebugContainer>
  );
};

export default TradesDebug;
