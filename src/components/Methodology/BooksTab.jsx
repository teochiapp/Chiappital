import React, { useState } from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { psychologyOfMoneyNotes } from '../../data/psycologyOfMoney';
import { berkshireHathawayNotes } from '../../data/besrkshire-university';
import { elNuevoVivirNotes } from '../../data/el-nuevo-vivir';
import { secretsNotes } from '../../data/secrets';
import MarketStagesChart from './MarketStagesChart';
import IdealBuyChart from './IdealBuyChart';

const Container = styled.div`
  background: #1e293b;
  border-radius: 12px;
  padding: 2rem;
  border: 1px solid rgba(255, 255, 255, 0.05);
`;

const BookTabsContainer = styled.div`
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  padding-bottom: 1rem;
  overflow-x: auto;

  /* Scrollbar styles */
  &::-webkit-scrollbar {
    height: 6px;
  }
  &::-webkit-scrollbar-track {
    background: transparent;
  }
  &::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.1);
    border-radius: 3px;
  }
`;

const BookTab = styled.button`
  background: transparent;
  border: none;
  color: ${props => props.$active ? '#3b82f6' : '#94a3b8'};
  font-family: 'Unbounded', sans-serif;
  font-size: 0.95rem;
  font-weight: 500;
  cursor: pointer;
  padding: 0.5rem 1rem;
  white-space: nowrap;
  position: relative;
  transition: color 0.2s ease;

  &:hover {
    color: ${props => props.$active ? '#3b82f6' : 'white'};
  }

  ${props => props.$active && `
    &::after {
      content: '';
      position: absolute;
      bottom: -1rem;
      left: 0;
      width: 100%;
      height: 2px;
      background: #3b82f6;
      border-radius: 2px;
    }
  `}
`;

const BookContent = styled.div`
  display: flex;
  gap: 3rem;
  align-items: flex-start;

  @media (max-width: 768px) {
    flex-direction: column;
    gap: 2rem;
  }
`;

const BookImage = styled.img`
  width: 250px;
  border-radius: 8px;
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.5);
  object-fit: cover;

  @media (max-width: 768px) {
    width: 100%;
    max-width: 300px;
    margin: 0 auto;
  }
`;

const BookDetails = styled.div`
  flex: 1;
`;

const BookTitle = styled.h2`
  font-family: 'Unbounded', sans-serif;
  font-size: 1.8rem;
  color: white;
  margin: 0 0 1rem 0;
`;

const BookDescription = styled.p`
  color: #cbd5e1;
  line-height: 1.6;
  font-size: 1.05rem;
`;

const QuoteBox = styled.div`
  border-left: 4px solid #3b82f6;
  padding: 1rem 1.5rem;
  background: rgba(59, 130, 246, 0.1);
  border-radius: 0 8px 8px 0;
  margin: 1.5rem 0;
  font-style: italic;
  color: #60a5fa;
  font-size: 1.1rem;
`;

const ChaptersContainer = styled.div`
  margin-top: 2rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

const ChapterBlock = styled.div`
  background: rgba(255, 255, 255, 0.03);
  padding: 1.5rem;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.05);
`;

const ChapterTitle = styled.h3`
  font-family: 'Unbounded', sans-serif;
  color: #3b82f6;
  font-size: 1.2rem;
  margin: 0 0 1rem 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  
  &::before {
    content: '';
    display: inline-block;
    width: 8px;
    height: 8px;
    background: #3b82f6;
    border-radius: 50%;
  }
`;

const ChapterList = styled.ul`
  margin: 0;
  padding-left: 1.5rem;
  color: #cbd5e1;
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
`;

const ChapterListItem = styled.li`
  line-height: 1.6;
  font-size: 1rem;
`;

const booksData = [
  {
    id: 'secrets',
    title: 'Secrets for Profiting in Bull and Bear Markets',
    image: '/books/secrets.webp',
    description: 'Este libro es el que más tengo presente a la hora de invertir y es como mi biblia de inversiones, leído varias veces.',
    contentData: secretsNotes,
  },
  {
    id: 'berkshire',
    title: 'University of Berkshire Hathaway',
    image: '/books/berkshire.jpg',
    description: 'Este libro está mas enfocado en fundamentales y es el que más me gustó sobre el tema. Lecciones impartidas por Charlie Munger y Warren Buffett durante 30 años en las reuniones anuales de Berkshire Hathaway. ',
    contentData: berkshireHathawayNotes,
  },
  {
    id: 'psychology',
    title: 'Psychology of Money',
    image: '/books/psycology_of_money.jpg',
    description: 'De los primeros que leí del mundo financiero. Más filosófico que práctico',
    contentData: psychologyOfMoneyNotes,
  },
  {
    id: 'nuevo-vivir',
    title: 'Nuevo vivir del trading',
    image: '/books/nuevo_vivir.webp',
    description: 'Mi preferido en el tema de gestión emocional escrito por un psiquiatra',
    contentData: elNuevoVivirNotes,
  }
];

const BooksTab = () => {
  const [activeBook, setActiveBook] = useState(booksData[0].id);

  const currentBook = booksData.find(b => b.id === activeBook);

  return (
    <Container>
      <BookTabsContainer>
        {booksData.map(book => (
          <BookTab
            key={book.id}
            $active={activeBook === book.id}
            onClick={() => setActiveBook(book.id)}
          >
            {book.title}
          </BookTab>
        ))}
      </BookTabsContainer>

      <motion.div
        key={activeBook}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <BookContent>
          <BookImage src={currentBook.image} alt={currentBook.title} />
          <BookDetails>
            <BookTitle>{currentBook.title}</BookTitle>
            <BookDescription>
              {currentBook.description}
            </BookDescription>

            {currentBook.contentData && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.5 }}
              >
                {currentBook.contentData.quote && (
                  <QuoteBox>
                    {currentBook.contentData.quote}
                  </QuoteBox>
                )}

                {currentBook.contentData.chapters && (
                  <ChaptersContainer>
                    {currentBook.contentData.chapters.map((chapter, idx) => (
                      <ChapterBlock key={idx}>
                        <ChapterTitle>{chapter.title}</ChapterTitle>
                        {chapter.title === "Las 4 Fases del Mercado" && <MarketStagesChart />}
                        {chapter.title === "El Momento Ideal para Comprar" && <IdealBuyChart />}
                        <ChapterList>
                          {chapter.points.map((point, pIdx) => (
                            <ChapterListItem key={pIdx}>{point}</ChapterListItem>
                          ))}
                        </ChapterList>
                      </ChapterBlock>
                    ))}
                  </ChaptersContainer>
                )}
              </motion.div>
            )}
          </BookDetails>
        </BookContent>
      </motion.div>
    </Container>
  );
};

export default BooksTab;
