import { Navigate, Route, Routes } from "react-router-dom";
import Login from "../pages/Login/Login.jsx";
import Dashboard from "../pages/Dashboard/Dashboard.jsx";
import PatientMaster from "../pages/Patient/PatientMaster.jsx";
import ClinicalHistory from "../pages/ClinicalHistory/ClinicalHistory.jsx";
import Consultation from "../pages/ClinicalHistory/Consultation.jsx";
import Laboratory from "../pages/Laboratory/Laboratory.jsx";
import Imaging from "../pages/Imaging/Imaging.jsx";
import Repository from "../pages/Repository/Repository.jsx";
import NotFound from "../pages/NotFound/NotFound.jsx";
import MainLayout from "../layouts/MainLayout.jsx";
import RutaProtegida from "./RutaProtegida.jsx";
import { ROUTES } from "../utils/constants.js";

export default function AppRoutes() {
  return (
    <Routes>
      <Route path={ROUTES.login} element={<Login />} />
      <Route element={<RutaProtegida />}>
        <Route element={<MainLayout />}>
          <Route path={ROUTES.dashboard} element={<Dashboard />} />
          <Route path={ROUTES.patient} element={<PatientMaster />} />
          <Route path={ROUTES.clinicalHistory} element={<ClinicalHistory />} />
          <Route path={ROUTES.consultation} element={<Consultation />} />
          <Route path={ROUTES.laboratory} element={<Laboratory />} />
          <Route path={ROUTES.imaging} element={<Imaging />} />
          <Route path={ROUTES.repository} element={<Repository />} />
        </Route>
      </Route>
      <Route path="/home" element={<Navigate to={ROUTES.dashboard} replace />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
