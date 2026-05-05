import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import MainLayout from "@/layouts/MainLayout";
import LoginPage from "@/pages/LoginPage";
import HomePage from "@/pages/HomePage";
import MaterielsListPage from "@/pages/MaterielsListPage";
import MaterielDetailPage from "@/pages/MaterielDetailPage";
import MaterielFormPage from "@/pages/MaterielFormPage";
import MaquettesListPage from "@/pages/MaquettesListPage";
import MaquetteDetailPage from "@/pages/MaquetteDetailPage";
import MaquetteFormPage from "@/pages/MaquetteFormPage";
import DemandesEnvoiListPage from "@/pages/DemandesEnvoiListPage";
import DemandeEnvoiDetailPage from "@/pages/DemandeEnvoiDetailPage";
import DemandeEnvoiFormPage from "@/pages/DemandeEnvoiFormPage";
import InboxValidationsPage from "@/pages/InboxValidationsPage";
import ReservationsListPage from "@/pages/ReservationsListPage";
import CalendrierPage from "@/pages/CalendrierPage";
import AgentsListPage from "@/pages/AgentsListPage";
import AdminReferentielsPage from "@/pages/AdminReferentielsPage";
import AdminReferentielTypePage from "@/pages/AdminReferentielTypePage";
import AdminSitesPage from "@/pages/AdminSitesPage";
import AdminEntreprisesPage from "@/pages/AdminEntreprisesPage";
import AdminAgentsPage from "@/pages/AdminAgentsPage";
import LocalisationPage from "@/pages/LocalisationPage";

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, loading, authConfig } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-edf-blue mx-auto" />
          <p className="text-sm text-gray-500 mt-3">Chargement...</p>
        </div>
      </div>
    );
  }

  const authRequired = authConfig?.microsoftAuth || authConfig?.localAuth;
  if (!user && authRequired) {
    return <LoginPage />;
  }

  return <>{children}</>;
}

export function AppRoutes() {
  return (
    <Routes>
      <Route
        element={
          <RequireAuth>
            <MainLayout />
          </RequireAuth>
        }
      >
        <Route path="/" element={<HomePage />} />
        <Route path="/materiels" element={<MaterielsListPage />} />
        <Route path="/materiels/nouveau" element={<MaterielFormPage />} />
        <Route path="/materiels/:id" element={<MaterielDetailPage />} />
        <Route path="/materiels/:id/edit" element={<MaterielFormPage />} />
        <Route path="/maquettes" element={<MaquettesListPage />} />
        <Route path="/maquettes/nouveau" element={<MaquetteFormPage />} />
        <Route path="/maquettes/:id" element={<MaquetteDetailPage />} />
        <Route path="/maquettes/:id/edit" element={<MaquetteFormPage />} />
        <Route path="/demandes-envoi" element={<DemandesEnvoiListPage />} />
        <Route
          path="/demandes-envoi/nouveau"
          element={<DemandeEnvoiFormPage />}
        />
        <Route
          path="/demandes-envoi/:id"
          element={<DemandeEnvoiDetailPage />}
        />
        <Route path="/validations" element={<InboxValidationsPage />} />
        <Route path="/reservations" element={<ReservationsListPage />} />
        <Route path="/calendrier" element={<CalendrierPage />} />
        <Route path="/localisation" element={<LocalisationPage />} />
        <Route path="/agents" element={<AgentsListPage />} />
        <Route path="/admin/referentiels" element={<AdminReferentielsPage />} />
        <Route path="/admin/referentiels/:type" element={<AdminReferentielTypePage />} />
        <Route path="/admin/sites" element={<AdminSitesPage />} />
        <Route path="/admin/entreprises" element={<AdminEntreprisesPage />} />
        <Route path="/admin/agents" element={<AdminAgentsPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
