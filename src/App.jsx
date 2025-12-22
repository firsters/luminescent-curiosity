import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { InventoryProvider } from './context/InventoryContext';
import { FridgeProvider } from './context/FridgeContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import FridgeList from './pages/FridgeList';
import InventoryList from './pages/InventoryList';
import AddItem from './pages/AddItem';
import SearchPage from './pages/SearchPage';
import HistoryPage from './pages/HistoryPage';
import SettingsPage from './pages/SettingsPage';
import TestFridgeList from './pages/TestFridgeList';
import { Link } from 'react-router-dom';

const ProtectedRoute = ({ children }) => {
  const { currentUser, loading } = useAuth();
  
  if (loading) return <div className="p-4 text-center">Loading...</div>;
  if (!currentUser) return <Navigate to="/login" />;
  
  return children;
};

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <FridgeProvider>
          <InventoryProvider>
            <Routes>
              <Route path="/login" element={<Login />} />
              
              <Route path="/" element={
                <ProtectedRoute>
                  <Layout>
                    <FridgeList />
                  </Layout>
                </ProtectedRoute>
              } />
              
              <Route path="/inventory" element={
                <ProtectedRoute>
                  <Layout>
                    <InventoryList />
                  </Layout>
                </ProtectedRoute>
              } />
              
              <Route path="/add" element={
                <ProtectedRoute>
                  <AddItem />
                </ProtectedRoute>
              } />

             <Route path="/search" element={
                <ProtectedRoute>
                  <Layout>
                    <SearchPage />
                  </Layout>
                </ProtectedRoute>
              } />

             <Route path="/history" element={
                <ProtectedRoute>
                  <Layout>
                    <HistoryPage />
                  </Layout>
                </ProtectedRoute>
              } />

              <Route path="/settings" element={
                <ProtectedRoute>
                  <Layout>
                    <SettingsPage />
                  </Layout>
                </ProtectedRoute>
              } />

              <Route path="/test-fridge-list" element={<TestFridgeList />} />

            </Routes>
          </InventoryProvider>
        </FridgeProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
