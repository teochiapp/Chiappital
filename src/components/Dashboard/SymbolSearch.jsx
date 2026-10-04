import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import styled from 'styled-components';
import { useSymbolSearch } from '../../hooks/useTradingData';
import PriceDisplay from './PriceDisplay';
import finnhubService from '../../services/finnhubService';

const SearchContainer = styled.div`
  margin-bottom: 2rem;
`;

const SearchHeader = styled.div`
  margin-bottom: 1rem;
`;

const Title = styled.h2`
  font-size: 1.8rem;
  font-weight: 600;
  font-family: 'Unbounded', sans-serif;
  color: #2c3e50;
  margin: 0 0 0.5rem 0;
`;

const SearchInput = styled.input`
  width: 100%;
  padding: 1rem;
  border: 2px solid #e1e8ed;
  border-radius: 8px;
  font-size: 1rem;
  font-family: 'Unbounded', sans-serif;
  transition: border-color 0.2s ease;
  box-sizing: border-box;

  &:focus {
    outline: none;
    border-color: #3498db;
  }

  &::placeholder {
    color: #bdc3c7;
  }
`;

const SearchResults = styled.div`
  margin-top: 1rem;
`;

const ResultsList = styled.div`
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  max-height: 300px;
  overflow-y: auto;
`;

const ResultItem = styled.div`
  padding: 1rem;
  border-bottom: 1px solid #e1e8ed;
  cursor: pointer;
  transition: background-color 0.2s ease;

  &:hover {
    background-color: #f8f9fa;
  }

  &:last-child {
    border-bottom: none;
  }
`;

const SymbolName = styled.div`
  font-weight: 600;
  font-family: 'Unbounded', sans-serif;
  color: #2c3e50;
  margin-bottom: 0.25rem;
`;

const SymbolDetails = styled.div`
  font-size: 0.9rem;
  color: #7f8c8d;
  font-family: 'Unbounded', sans-serif;
`;

const SelectedSymbolContainer = styled.div`
  margin-top: 1.5rem;
`;

const LoadingText = styled.div`
  padding: 1rem;
  text-align: center;
  color: #7f8c8d;
  font-family: 'Unbounded', sans-serif;
  font-weight: 500;
`;

const ErrorText = styled.div`
  padding: 1rem;
  text-align: center;
  color: #e74c3c;
  font-family: 'Unbounded', sans-serif;
  font-weight: 500;
`;

const SymbolSearch = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSymbol, setSelectedSymbol] = useState(null);
  const [symbolData, setSymbolData] = useState(null);
  const [dataLoading, setDataLoading] = useState(false);
  const [dataError, setDataError] = useState(null);
  const { results, loading, error } = useSymbolSearch(searchTerm);

  const handleSymbolSelect = async (symbol) => {
    setSelectedSymbol(symbol);
    setSearchTerm('');
    setDataError(null);
    setDataLoading(true);
    
    try {
      const quote = await finnhubService.getQuote(symbol.symbol);
      setSymbolData(quote);
    } catch (err) {
      setDataError(err.message);
      setSymbolData(null);
    } finally {
      setDataLoading(false);
    }
  };

  return (
    <SearchContainer>
      <SearchHeader>
        <Title>Buscar Acciones</Title>
        <SearchInput
          type="text"
          placeholder="Buscar símbolo (ej: AAPL, Tesla, Microsoft...)"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </SearchHeader>

      {searchTerm && (
        <SearchResults>
          {loading && <LoadingText>Buscando...</LoadingText>}
          {error && <ErrorText>Error: {error}</ErrorText>}
          {results.length > 0 && !loading && !error && (
            <ResultsList>
              {results.slice(0, 10).map((result, index) => (
                <motion.div
                  key={result.symbol}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                >
                  <ResultItem onClick={() => handleSymbolSelect(result)}>
                    <SymbolName>{result.symbol} - {result.name}</SymbolName>
                    <SymbolDetails>
                      {result.type} • {result.displaySymbol || result.symbol}
                    </SymbolDetails>
                  </ResultItem>
                </motion.div>
              ))}
            </ResultsList>
          )}
        </SearchResults>
      )}

      {selectedSymbol && (
        <SelectedSymbolContainer>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <PriceDisplay
              symbol={selectedSymbol.symbol}
              data={symbolData}
              error={dataError}
              loading={dataLoading}
            />
          </motion.div>
        </SelectedSymbolContainer>
      )}
    </SearchContainer>
  );
};

export default SymbolSearch;