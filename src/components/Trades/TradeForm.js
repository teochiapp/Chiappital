import React, { useState } from 'react';
import { motion } from 'framer-motion';
import styled from 'styled-components';
import { Search, TrendingUp, DollarSign, Percent, Shield, Target, BookOpen, Lightbulb } from 'lucide-react';
import SymbolSearch from '../common/SymbolSearch';
import { colors } from '../../styles/colors';
import { getAllCountries, getAllSectors } from '../../config/marketData';

// Helper function para convertir valores de estrategia a nombres legibles
export const getStrategyDisplayName = (strategyValue) => {
  if (!strategyValue) return 'N/A';
  
  const strategyMap = {
    'day_trading': 'Day Trading',
    'swing_trading': 'Swing Trading', 
    'largo_plazo': 'Largo Plazo'
  };
  
  return strategyMap[strategyValue] || strategyValue;
};

const FormContainer = styled.div`
  background: #1e293b;
  padding: 2rem;
  border-radius: 12px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  margin-bottom: 2rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
`;

const FormTitle = styled.h2`
  font-size: 1.8rem;
  font-weight: 600;
  font-family: 'Unbounded', sans-serif;
  color: white;
  margin: 0 0 1.5rem 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const FormGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1.5rem;
  margin-bottom: 1.5rem;

  @media (max-width: 1024px) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const Label = styled.label`
  font-weight: 600;
  font-family: 'Unbounded', sans-serif;
  color: #e2e8f0;
  font-size: 0.9rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const Input = styled.input`
  padding: 0.75rem;
  background: rgba(255, 255, 255, 0.05);
  border: 2px solid rgba(255, 255, 255, 0.1);
  color: white;
  border-radius: 8px;
  font-size: 1rem;
  font-family: 'Unbounded', sans-serif;
  transition: border-color 0.2s ease;

  &:focus {
    outline: none;
    border-color: #3498db;
  }

  &::placeholder {
    color: #bdc3c7;
  }
`;

const Select = styled.select`
  padding: 0.75rem;
  background: #1e293b;
  border: 2px solid rgba(255, 255, 255, 0.1);
  color: white;
  border-radius: 8px;
  font-size: 1rem;
  font-family: 'Unbounded', sans-serif;
  transition: border-color 0.2s ease;

  &:focus {
    outline: none;
    border-color: #3498db;
  }
`;



const ButtonGroup = styled.div`
  display: flex;
  gap: 1rem;
  justify-content: flex-end;

  @media (max-width: 480px) {
    flex-direction: column;
    button { width: 100%; margin-top: 0; }
  }
`;

const Button = styled.button`
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-size: 1rem;
  margin-top: 1rem;
  font-weight: 500;
  font-family: 'Unbounded', sans-serif;
  cursor: pointer;
  transition: all 0.3s ease;
  border: none;

  &.primary {
    background: ${colors.primary};
    color: white;

    &:hover {
      background: ${colors.primaryDark};
    }

    &:disabled {
      background: ${colors.gray[400]};
      cursor: not-allowed;
    }
  }

  &.secondary {
    background: transparent;
    color: #94a3b8;
    border: 2px solid rgba(255, 255, 255, 0.1);

    &:hover {
      background: rgba(255, 255, 255, 0.05);
      color: white;
    }
  }
`;

const SuccessMessage = styled.div`
  background: #d4edda;
  color: #155724;
  padding: 1rem;
  border-radius: 8px;
  margin-bottom: 1rem;
  font-family: 'Unbounded', sans-serif;
  font-weight: 500;
`;

const ErrorMessage = styled.div`
  background: #f8d7da;
  color: #721c24;
  padding: 1rem;
  border-radius: 8px;
  margin-bottom: 1rem;
  font-family: 'Unbounded', sans-serif;
  font-weight: 500;
`;

const InfoBox = styled.div`
  background: #e3f2fd;
  color: #1565c0;
  padding: 1rem;
  border-radius: 8px;
  margin-bottom: 1.5rem;
  font-family: 'Unbounded', sans-serif;
  font-weight: 500;
  font-size: 0.9rem;
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
`;

const SelectedSymbolInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 6px;
  margin-top: 0.5rem;
`;

const SymbolIcon = styled.div`
  font-size: 1.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const SymbolDetails = styled.div`
  flex: 1;
`;

const SymbolTitle = styled.div`
  font-family: 'Unbounded', sans-serif;
  font-weight: 600;
  font-size: 0.9rem;
  color: white;
  margin-bottom: 0.2rem;
`;

const SymbolSubtitle = styled.div`
  font-family: 'Unbounded', sans-serif;
  font-size: 0.75rem;
  color: #94a3b8;
`;

const TradeForm = ({ onTradeAdded }) => {
  const [formData, setFormData] = useState({
    symbol: '',
    symbolData: null, // Datos completos del símbolo seleccionado
    type: 'buy',
    entryPrice: '',
    entryPriceArs: '',
    portfolioPercentage: '',
    stopLoss: '',
    takeProfit: '',
    customCountry: '',
    customSector: ''
  });

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Manejar selección de símbolo desde el buscador
  const handleSymbolSelect = (symbolData) => {
    setFormData(prev => ({
      ...prev,
      symbol: symbolData.symbol,
      symbolData: symbolData
    }));
    console.log('✅ Símbolo seleccionado:', symbolData);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Validar datos requeridos
      if (!formData.symbol || !formData.entryPrice) {
        throw new Error('Por favor completa el símbolo y precio de entrada');
      }

      const tradeData = {
        symbol: formData.symbol,
        type: formData.type,
        entry_price: parseFloat(formData.entryPrice),
        entry_price_ars: formData.entryPriceArs ? parseFloat(formData.entryPriceArs) : null,
        portfolio_percentage: formData.portfolioPercentage ? parseFloat(formData.portfolioPercentage) : null,
        stop_loss: formData.stopLoss ? parseFloat(formData.stopLoss) : null,
        take_profit: formData.takeProfit ? parseFloat(formData.takeProfit) : null,
        custom_country: formData.symbolData?.isCustom ? formData.customCountry : null,
        custom_sector: formData.symbolData?.isCustom ? formData.customSector : null,
        status: 'open'
      };

      // Usar el callback del componente padre
      await onTradeAdded(tradeData);

      setSuccess('Trade registrado exitosamente!');
      
      // Limpiar formulario
      setFormData({
        symbol: '',
        symbolData: null,
        type: 'buy',
        entryPrice: '',
        entryPriceArs: '',
        portfolioPercentage: '',
        stopLoss: '',
        takeProfit: '',
        customCountry: '',
        customSector: ''
      });

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFormData({
      symbol: '',
      symbolData: null,
      type: 'buy',
      entryPrice: '',
      entryPriceArs: '',
      portfolioPercentage: '',
      stopLoss: '',
      takeProfit: '',
      customCountry: '',
      customSector: ''
    });
    setError('');
    setSuccess('');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <FormContainer>
        <FormTitle>
          <BookOpen size={24} />
          Nuevo Trade
        </FormTitle>
        
        
        {success && <SuccessMessage>{success}</SuccessMessage>}
        {error && <ErrorMessage>{error}</ErrorMessage>}

        <form onSubmit={handleSubmit}>
          <FormGrid>
            <FormGroup>
              <Label>
                <Search size={16} />
                Instrumento *
              </Label>
              <SymbolSearch
                onSymbolSelect={handleSymbolSelect}
                placeholder="Buscar Apple, Tesla, Bitcoin..."
                initialValue={formData.symbol}
              />
              {formData.symbolData && (
                <SelectedSymbolInfo>
                  <SymbolIcon>
                    {formData.symbolData.type === 'Crypto' ? '🪙' : 
                     formData.symbolData.region === 'AR' ? '🇦🇷' :
                     formData.symbolData.region === 'BR' ? '🇧🇷' :
                     formData.symbolData.region === 'CN' ? '🇨🇳' : '🇺🇸'}
                  </SymbolIcon>
                  <SymbolDetails>
                    <SymbolTitle>{formData.symbolData.symbol} - {formData.symbolData.name}</SymbolTitle>
                    <SymbolSubtitle>{formData.symbolData.sector} • {formData.symbolData.region} • {formData.symbolData.currency}</SymbolSubtitle>
                  </SymbolDetails>
                </SelectedSymbolInfo>
              )}
            </FormGroup>

            {formData.symbolData?.isCustom && (
              <>
                <FormGroup>
                  <Label htmlFor="customCountry">
                    🌎 País de Origen (Diversificación)
                  </Label>
                  <Select
                    id="customCountry"
                    name="customCountry"
                    value={formData.customCountry}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">Selecciona un país...</option>
                    {getAllCountries().map(country => (
                      <option key={country.code} value={country.code}>
                        {country.name}
                      </option>
                    ))}
                  </Select>
                </FormGroup>
                
                <FormGroup>
                  <Label htmlFor="customSector">
                    🏭 Sector (Diversificación)
                  </Label>
                  <Select
                    id="customSector"
                    name="customSector"
                    value={formData.customSector}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">Selecciona un sector...</option>
                    {getAllSectors().map(sector => (
                      <option key={sector.code} value={sector.code}>
                        {sector.name}
                      </option>
                    ))}
                  </Select>
                </FormGroup>
              </>
            )}

            <FormGroup>
              <Label htmlFor="entryPrice">
                <DollarSign size={16} />
                Precio de Entrada (USD) *
              </Label>
              <Input
                type="number"
                id="entryPrice"
                name="entryPrice"
                value={formData.entryPrice}
                onChange={handleInputChange}
                placeholder="0.00"
                step="0.01"
                required
              />
            </FormGroup>

            <FormGroup>
              <Label htmlFor="entryPriceArs">
                <DollarSign size={16} />
                Precio de Entrada (ARS)
              </Label>
              <Input
                type="number"
                id="entryPriceArs"
                name="entryPriceArs"
                value={formData.entryPriceArs}
                onChange={handleInputChange}
                placeholder="0.00"
                step="0.01"
              />
            </FormGroup>

            <FormGroup>
              <Label htmlFor="portfolioPercentage">
                <Percent size={16} />
                % de Cartera (Opcional)
              </Label>
              <Input
                type="number"
                id="portfolioPercentage"
                name="portfolioPercentage"
                value={formData.portfolioPercentage}
                onChange={handleInputChange}
                placeholder="Ej: 5"
                step="0.1"
                min="0"
                max="100"
              />
            </FormGroup>

            <FormGroup>
              <Label htmlFor="stopLoss">
                <Shield size={16} />
                Stop Loss
              </Label>
              <Input
                type="number"
                id="stopLoss"
                name="stopLoss"
                value={formData.stopLoss}
                onChange={handleInputChange}
                placeholder="0.00"
                step="0.01"
              />
            </FormGroup>

            <FormGroup>
              <Label htmlFor="takeProfit">
                <Target size={16} />
                Take Profit
              </Label>
              <Input
                type="number"
                id="takeProfit"
                name="takeProfit"
                value={formData.takeProfit}
                onChange={handleInputChange}
                placeholder="0.00"
                step="0.01"
              />
            </FormGroup>

          </FormGrid>

          <ButtonGroup>
            <Button type="button" className="secondary" onClick={handleReset}>
              Limpiar
            </Button>
            <Button type="submit" className="primary" disabled={loading}>
              {loading ? 'Guardando...' : 'Guardar Trade'}
            </Button>
          </ButtonGroup>
        </form>
      </FormContainer>
    </motion.div>
  );
};

export default TradeForm;