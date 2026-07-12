import { Navigate, Route, Routes } from "react-router-dom";
import Login from "../pages/Login/Login.jsx";
import Dashboard from "../pages/Dashboard/Dashboard.jsx";
import PatientMaster from "../pages/Patient/PatientMaster.jsx";
import ClinicalHistory from "../pages/ClinicalHistory/ClinicalHistory.jsx";
import Consultation from "../pages/ClinicalHistory/Consultation.jsx";
import Laboratory from "../pages/Laboratory/Laboratory.jsx";
import Imaging from "../pages/Imaging/Imaging.jsx";
import Repository from "../pages/Repository/Repository.jsx";
import SystemStatus from "../pages/SystemStatus/SystemStatus.jsx";
import NotFound from "../pages/NotFound/NotFound.jsx";
import MainLayout from "../layouts/MainLayout.jsx";
import RutaProtegida from "./RutaProtegida.jsx";
import { ROUTES } from "../utils/constants.js";
import { ROLE_PERMISSIONS } from "../utils/roles.js";

export default function AppRoutes() {
  return (
    <Routes>
      <Route path={ROUTES.login} element={<Login />} />
      <Route element={<RutaProtegida />}>
        <Route element={<MainLayout />}>
          <Route element={<RutaProtegida roles={ROLE_PERMISSIONS.dashboard} />}>
            <Route path={ROUTES.dashboard} element={<Dashboard />} />
          </Route>
          <Route element={<RutaProtegida roles={ROLE_PERMISSIONS.patient} serviceKey="patient" />}>
            <Route path={ROUTES.patient} element={<PatientMaster />} />
          </Route>
          <Route element={<RutaProtegida roles={ROLE_PERMISSIONS.clinicalHistory} serviceKey="consultation" />}>
            <Route path={ROUTES.clinicalHistory} element={<ClinicalHistory />} />
          </Route>
          <Route element={<RutaProtegida roles={ROLE_PERMISSIONS.consultation} serviceKey="consultation" />}>
            <Route path={ROUTES.consultation} element={<Consultation />} />
          </Route>
          <Route element={<RutaProtegida roles={ROLE_PERMISSIONS.laboratory} serviceKey="laboratory" />}>
            <Route path={ROUTES.laboratory} element={<Laboratory />} />
          </Route>
          <Route element={<RutaProtegida roles={ROLE_PERMISSIONS.imaging} serviceKey="imaging" />}>
            <Route path={ROUTES.imaging} element={<Imaging />} />
          </Route>
          <Route element={<RutaProtegida roles={ROLE_PERMISSIONS.repository} serviceKey="repository" />}>
            <Route path={ROUTES.repository} element={<Repository />} />
          </Route>
          <Route element={<RutaProtegida roles={ROLE_PERMISSIONS.systemStatus} />}>
            <Route path={ROUTES.systemStatus} element={<SystemStatus />} />
          </Route>
        </Route>
      </Route>
      <Route path="/home" element={<Navigate to={ROUTES.dashboard} replace />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
