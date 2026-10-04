import React, { createContext, useState, useContext, useEffect } from 'react';

const AccountContext = createContext();

export const AccountProvider = ({ children }) => {
  // Inicializamos con la cuenta propia por defecto, 
  // pero intentamos recuperar la última seleccionada de localStorage
  const [accountType, setAccountType] = useState(() => {
    return localStorage.getItem('st_account_type') || 'propia';
  });

  const changeAccount = (newAccount) => {
    setAccountType(newAccount);
    localStorage.setItem('st_account_type', newAccount);
  };

  return (
    <AccountContext.Provider value={{ accountType, changeAccount }}>
      {children}
    </AccountContext.Provider>
  );
};

export const useAccount = () => {
  const context = useContext(AccountContext);
  if (!context) {
    throw new Error('useAccount debe ser usado dentro de un AccountProvider');
  }
  return context;
};
