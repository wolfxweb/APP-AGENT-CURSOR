import { Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./auth/AuthProvider";
import AuthenticatedLayout from "./layouts/AuthenticatedLayout";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import OnboardingPage from "./pages/OnboardingPage";
import ProfilePage from "./pages/ProfilePage";
import BasicDataFormPage from "./pages/BasicDataFormPage";
import BasicDataListPage from "./pages/BasicDataListPage";
import BasicDataLogsPage from "./pages/BasicDataLogsPage";
import CalculatorPage from "./pages/CalculatorPage";
import DiagnosticoPage from "./pages/DiagnosticoPage";
import AdminUsersPage from "./pages/AdminUsersPage";
import AdminLicensesPage from "./pages/AdminLicensesPage";
import ImportanciaMesesCadastroPage from "./pages/ImportanciaMesesCadastroPage";
import ImportanciaMesesPage from "./pages/ImportanciaMesesPage";
import PrioridadesPage from "./pages/PrioridadesPage";
import ProdutosPage from "./pages/ProdutosPage";
import SimuladorPage from "./pages/SimuladorPage";
import RegisterPage from "./pages/RegisterPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import TermsPage from "./pages/TermsPage";

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route element={<AuthenticatedLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/basic-data" element={<BasicDataListPage />} />
          <Route path="/basic-data/new" element={<BasicDataFormPage />} />
          <Route path="/basic-data/:id/edit" element={<BasicDataFormPage />} />
          <Route path="/basic-data/:id/logs" element={<BasicDataLogsPage />} />
          <Route path="/calculadora" element={<CalculatorPage />} />
          <Route path="/diagnostico" element={<DiagnosticoPage />} />
          <Route path="/importancia-meses" element={<ImportanciaMesesPage />} />
          <Route path="/importancia-meses/cadastrar" element={<ImportanciaMesesCadastroPage />} />
          <Route path="/produtos" element={<ProdutosPage />} />
          <Route path="/gestao-prioridades" element={<PrioridadesPage />} />
          <Route path="/simulador" element={<SimuladorPage />} />
          <Route path="/admin/users" element={<AdminUsersPage />} />
          <Route path="/admin/licenses" element={<AdminLicensesPage />} />
          <Route path="/auth/onboarding" element={<OnboardingPage />} />
        </Route>
        <Route path="/auth/login" element={<LoginPage />} />
        <Route path="/auth/register" element={<RegisterPage />} />
        <Route path="/termos" element={<TermsPage />} />
        <Route path="/auth/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/auth/reset-password" element={<ResetPasswordPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
}
