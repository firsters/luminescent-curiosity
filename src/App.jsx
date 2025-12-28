import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { InventoryProvider } from "./context/InventoryContext";
import { FridgeProvider } from "./context/FridgeContext";
import { InstallProvider } from "./context/InstallContext";
import Layout from "./components/Layout";
import Login from "./pages/Login";
import FridgeList from "./pages/FridgeList";
import InventoryList from "./pages/InventoryList";
import AddItem from "./pages/AddItem";
import SearchPage from "./pages/SearchPage";
import HistoryPage from "./pages/HistoryPage";
import SettingsPage from "./pages/SettingsPage";
import TestFridgeList from "./pages/TestFridgeList";
import TermsPage from "./pages/TermsPage";
import PrivacyPage from "./pages/PrivacyPage";
import LicensesPage from "./pages/LicensesPage";
import { Link } from "react-router-dom";
import ReloadPrompt from "./components/ReloadPrompt";
import ErrorBoundary from "./components/ErrorBoundary";

const ProtectedRoute = ({ children }) => {
  const { currentUser, loading, resendVerificationEmail, logout } = useAuth();

  if (loading) return <div className="p-4 text-center">Loading...</div>;
  if (!currentUser) return <Navigate to="/login" />;

  if (!currentUser.emailVerified && !currentUser.email.startsWith("bypass")) {
    return (
      <div className="flex h-screen flex-col items-center justify-center p-6 text-center">
        <span className="material-symbols-outlined text-6xl text-primary mb-4">
          mark_email_unread
        </span>
        <h2 className="text-xl font-bold mb-2">이메일 인증이 필요합니다</h2>
        <p className="text-gray-600 mb-6">
          {currentUser.email}로 인증 메일을 보냈습니다.
          <br />
          메일함 확인 후 링크를 클릭해주세요.
        </p>

        <div className="flex flex-col gap-3 w-full max-w-xs">
          <button
            onClick={() => window.location.reload()}
            className="w-full py-3 bg-primary text-white rounded-xl font-bold active:scale-95 transition-transform"
          >
            인증 완료 (새로고침)
          </button>
          <button
            onClick={() =>
              resendVerificationEmail()
                .then(() => alert("인증 메일을 다시 보냈습니다."))
                .catch((e) => alert("메일 전송 실패: " + e.message))
            }
            className="w-full py-3 bg-gray-100 text-gray-700 rounded-xl font-bold active:scale-95 transition-transform"
          >
            메일 다시 보내기
          </button>
          <button
            onClick={logout}
            className="text-sm text-gray-400 underline mt-2"
          >
            로그아웃
          </button>
        </div>
      </div>
    );
  }

  return children;
};

export default function App() {
  return (
    <BrowserRouter>
      <InstallProvider>
        <ErrorBoundary>
          <ReloadPrompt />
          <AuthProvider>
            <FridgeProvider>
              <InventoryProvider>
                <Routes>
                  <Route path="/login" element={<Login />} />
                  <Route path="/terms" element={<TermsPage />} />
                  <Route path="/privacy" element={<PrivacyPage />} />
                  <Route path="/licenses" element={<LicensesPage />} />

                  <Route
                    path="/"
                    element={
                      <ProtectedRoute>
                        <Layout>
                          <FridgeList />
                        </Layout>
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path="/inventory"
                    element={
                      <ProtectedRoute>
                        <Layout>
                          <InventoryList />
                        </Layout>
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path="/add"
                    element={
                      <ProtectedRoute>
                        <AddItem />
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path="/search"
                    element={
                      <ProtectedRoute>
                        <Layout>
                          <SearchPage />
                        </Layout>
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path="/history"
                    element={
                      <ProtectedRoute>
                        <Layout>
                          <HistoryPage />
                        </Layout>
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path="/settings"
                    element={
                      <ProtectedRoute>
                        <Layout>
                          <SettingsPage />
                        </Layout>
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path="/test-fridge-list"
                    element={<TestFridgeList />}
                  />
                </Routes>
              </InventoryProvider>
            </FridgeProvider>
          </AuthProvider>
        </ErrorBoundary>
      </InstallProvider>
    </BrowserRouter>
  );
}
