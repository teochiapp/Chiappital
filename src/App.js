import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { GlobalStyles } from './styles/GlobalStyles';

// Importar containers
import LoginContainer from './containers/LoginContainer';
import AccountSelectionContainer from './containers/AccountSelectionContainer';
import DashboardContainer from './containers/DashboardContainer';
import TradeLogsContainer from './containers/TradeLogsContainer';
import MethodologyContainer from './containers/MethodologyContainer';
import LabContainer from './containers/LabContainer';
import ScreenerContainer from './containers/ScreenerContainer';
import AlertsContainer from './containers/AlertsContainer';
import MacroContainer from './containers/MacroContainer';

// Personal Hub
import PersonalHub from './modules/personal/pages/PersonalHub';
import HabitsPage from './modules/personal/pages/HabitsPage';
import GoalsPage from './modules/personal/pages/GoalsPage';
import LanguagesPage from './modules/personal/pages/LanguagesPage';
import FitnessPage from './modules/personal/pages/FitnessPage';
import JournalPage from './modules/personal/pages/JournalPage';
import FocusSessionsPage from './modules/personal/pages/FocusSessionsPage';
import { PersonalHubProvider } from './context/PersonalHubContext';

// Mediterranean Hub
import { MediterraneanProvider } from './context/MediterraneanContext';
import MediterraneanPage from './modules/personal/pages/MediterraneanPage';
import MediterraneanRecipesPage from './modules/personal/pages/MediterraneanRecipesPage';
import MediterraneanRecipeDetailPage from './modules/personal/pages/MediterraneanRecipeDetailPage';
import MediterraneanAddRecipePage from './modules/personal/pages/MediterraneanAddRecipePage';
import MediterraneanShoppingPage from './modules/personal/pages/MediterraneanShoppingPage';
import MediterraneanStatsPage from './modules/personal/pages/MediterraneanStatsPage';

// Importar Contexto
import { AccountProvider } from './context/AccountContext';
import { LabProvider } from './context/LabContext';
import { AlertsProvider } from './context/AlertsContext';

// Componentes
import Header from './components/common/Header';
import DebugConsole from './components/common/DebugConsole';


// Personal Hub Layout
import PersonalLayout from './modules/personal/components/PersonalLayout';

// Global UI
import MarketAlertModal from './components/Alerts/MarketAlertModal';

// Componente para rutas protegidas
import ProtectedRoute from './components/Auth/ProtectedRoute';

function App() {
    return (
        <>
            <GlobalStyles />
            <AccountProvider>
                <LabProvider>
                    <AlertsProvider>
                        <Router>
                            <div className="App">
                                <Header />
                                <MarketAlertModal />
                            <Routes>
                            <Route path="/login" element={<LoginContainer />} />
                            <Route
                                path="/select-account"
                                element={
                                    <ProtectedRoute>
                                        <AccountSelectionContainer />
                                    </ProtectedRoute>
                                }
                            />
                            <Route
                                path="/dashboard"
                                element={
                                    <ProtectedRoute>
                                        <DashboardContainer />
                                    </ProtectedRoute>
                                }
                            />
                            <Route
                                path="/trades"
                                element={
                                    <ProtectedRoute>
                                        <TradeLogsContainer />
                                    </ProtectedRoute>
                                }
                            />
                            <Route
                                path="/metodologia"
                                element={
                                    <ProtectedRoute>
                                        <MethodologyContainer />
                                    </ProtectedRoute>
                                }
                            />
                            <Route
                                path="/lab"
                                element={
                                    <ProtectedRoute>
                                        <LabContainer />
                                    </ProtectedRoute>
                                }
                            />
                            <Route
                                path="/screener"
                                element={
                                    <ProtectedRoute>
                                        <ScreenerContainer />
                                    </ProtectedRoute>
                                }
                            />
                            <Route
                                path="/alertas"
                                element={
                                    <ProtectedRoute>
                                        <AlertsContainer />
                                    </ProtectedRoute>
                                }
                            />
                            <Route
                                path="/macro"
                                element={
                                    <ProtectedRoute>
                                        <MacroContainer />
                                    </ProtectedRoute>
                                }
                            />


                            {/* ─── Personal Hub (ruta oculta, acceso directo por URL) ─── */}
                            <Route
                                path="/personal"
                                element={
                                    <ProtectedRoute>
                                        <PersonalHubProvider>
                                            <MediterraneanProvider>
                                                <PersonalLayout />
                                            </MediterraneanProvider>
                                        </PersonalHubProvider>
                                    </ProtectedRoute>
                                }
                            >
                                <Route index element={<PersonalHub />} />
                                <Route path="habits" element={<HabitsPage />} />
                                <Route path="goals" element={<GoalsPage />} />
                                <Route path="languages" element={<LanguagesPage />} />
                                <Route path="fitness" element={<FitnessPage />} />
                                <Route path="journal" element={<JournalPage />} />
                                <Route path="focus" element={<FocusSessionsPage />} />

                                {/* ─── Subrutas de Recetario Mediterráneo ─── */}
                                <Route path="mediterranean" element={<MediterraneanPage />} />
                                <Route path="mediterranean/recipes" element={<MediterraneanRecipesPage />} />
                                <Route path="mediterranean/recipes/new" element={<MediterraneanAddRecipePage />} />
                                <Route path="mediterranean/recipes/:id" element={<MediterraneanRecipeDetailPage />} />
                                <Route path="mediterranean/shopping" element={<MediterraneanShoppingPage />} />
                                <Route path="mediterranean/stats" element={<MediterraneanStatsPage />} />
                            </Route>

                            <Route path="*" element={<Navigate to="/login" replace />} />
                        </Routes>
                        <DebugConsole />
                    </div>
                    </Router>
                    </AlertsProvider>
                </LabProvider>
            </AccountProvider>
        </>
    );
}

export default App;