import React, { useState } from 'react';
import { motion } from 'framer-motion';
import styled from 'styled-components';
import { BookOpen, ListChecks } from 'lucide-react';
import BooksTab from './BooksTab';
import RulesTab from './RulesTab';

const PageWrapper = styled.div`
  min-height: calc(100vh - 80px);
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

const TabContainer = styled.div`
  display: flex;
  margin-bottom: 2rem;
  background: #1e293b;
  border-radius: 8px;
  padding: 0.5rem;
  border: 1px solid rgba(255, 255, 255, 0.05);
  max-width: 600px;
  margin-left: auto;
  margin-right: auto;
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

const Methodology = () => {
  const [activeTab, setActiveTab] = useState('rules');

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
              <BookOpen size={36} />
              Metodología
            </PageTitle>
          </motion.div>
        </PageHeader>

        <TabContainer>
          <Tab
            $active={activeTab === 'rules'}
            onClick={() => setActiveTab('rules')}
          >
            <ListChecks size={20} />
            Reglas de Inversión
          </Tab>
          <Tab
            $active={activeTab === 'books'}
            onClick={() => setActiveTab('books')}
          >
            <BookOpen size={20} />
            Libros de Referencia
          </Tab>
        </TabContainer>

        <TabContent>
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
          >
            {activeTab === 'books' ? <BooksTab /> : <RulesTab />}
          </motion.div>
        </TabContent>
      </PageContainer>
    </PageWrapper>
  );
};

export default Methodology;
