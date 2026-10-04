import React from 'react';
import { useStrapiTrades } from '../../hooks/useApiTrades';
import Diversification from '../Trades/Diversification';

const PortfolioComposition = () => {
  const { openTrades, loading, error } = useStrapiTrades();

  return (
    <Diversification 
      openTrades={openTrades} 
      loading={loading} 
      error={error} 
    />
  );
};

export default PortfolioComposition;
