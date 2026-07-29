import React from 'react';
import { StyledContainer } from '../common/StyledComponents';
import OverviewMetrics from './OverviewMetrics';
import MarketStrategy from './MarketStrategy';
import PortfolioComposition from './PortfolioComposition';
import HistoricalMetrics from './HistoricalMetrics';
import {
  DashboardContentStyled,
  DashboardSplitLayout
} from './styled/DashboardStyles';

const DashboardContent = () => {
  return (
    <DashboardContentStyled>
      <StyledContainer>
        <DashboardSplitLayout>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <OverviewMetrics />
            <MarketStrategy />
          </div>
          <PortfolioComposition />
        </DashboardSplitLayout>
        <HistoricalMetrics />
      </StyledContainer>
    </DashboardContentStyled>
  );
};

export default DashboardContent;