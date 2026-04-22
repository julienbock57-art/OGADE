import { Routes, Route } from "react-router-dom";
import MainLayout from "@/layouts/MainLayout";
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
import AgentsListPage from "@/pages/AgentsListPage";

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<MainLayout />}>
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
        <Route path="/agents" element={<AgentsListPage />} />
      </Route>
    </Routes>
  );
}
