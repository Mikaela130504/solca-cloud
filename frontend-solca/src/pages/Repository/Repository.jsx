import { useEffect, useState } from "react";
import Button from "../../components/common/Button.jsx";
import Card from "../../components/common/Card.jsx";
import Loader from "../../components/common/Loader.jsx";
import PatientAutocomplete from "../../components/common/PatientAutocomplete.jsx";
import PatientIdentifiers from "../../components/common/PatientIdentifiers.jsx";
import Table from "../../components/common/Table.jsx";
import ClinicalHistoryView from "../../components/repository/ClinicalHistoryView.jsx";
import ExpandableRecords from "../../components/repository/ExpandableRecords.jsx";
import PatientSummary from "../../components/repository/PatientSummary.jsx";
import { getClinicalRepository } from "../../services/repositoryService.js";
import "./Repository.css";

function isClinicalHistory(record) {
  return String(record?.tipoConsulta || record?.tipo_consulta || "").toLowerCase().includes("historia");
}

function sortByRecentDate(records) {
  return [...records].sort((left, right) => new Date(right.fecha || 0) - new Date(left.fecha || 0));
}

function rowsFrom(value) {
  return Array.isArray(value) ? value : [];
}

export default function Repository() {
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [patientQuery, setPatientQuery] = useState("");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getClinicalRepository().then((payload) => {
      setData(payload);
    }).catch(() => setData(null));
  }, []);

  const handleSearch = async (event) => {
    event.preventDefault();
    const typedIdentifier = patientQuery.split("·")[0].trim();
    const identifier = selectedPatient?.idPacienteRegional || typedIdentifier;
    if (!identifier) return;
    setLoading(true);
    try {
      const payload = await getClinicalRepository(identifier);
      setData(payload);
    } finally {
      setLoading(false);
    }
  };

  const patient = data?.patient || data?.paciente;
  const allConsultations = Array.isArray(data?.consultations || data?.consultas) ? data.consultations || data.consultas : [];
  const clinicalHistories = sortByRecentDate(allConsultations.filter(isClinicalHistory));
  const consultations = sortByRecentDate(allConsultations.filter((item) => !isClinicalHistory(item)));
  const clinicalHistory = data?.history || data?.historiaClinica || clinicalHistories[0] || null;
  const laboratories = Array.isArray(data?.laboratories || data?.laboratorios || data?.laboratorio) ? data.laboratories || data.laboratorios || data.laboratorio : [];
  const imaging = Array.isArray(data?.imaging || data?.imagenologia || data?.imagenes) ? data.imaging || data.imagenologia || data.imagenes : [];
  const unavailableServices = rowsFrom(data?.serviciosNoDisponibles || data?.servicesUnavailable);
  const serviceStatus = rowsFrom(data?.estadoServicios);
  const integrationLogs = rowsFrom(data?.logsIntegracion);
  const repositoryHistory = rowsFrom(data?.historialConsultasRepositorio);
  const clinicalCache = rowsFrom(data?.cacheClinica);

  if (loading) {
    return <Loader />;
  }

  return (
    <>
      <div className="page-title">
        <div>
          <h1>Repositorio clínico</h1>
          <p>Vista única y no editable de información asistencial consolidada por paciente.</p>
        </div>
        <Button variant="secondary" disabled>Solo visualización</Button>
      </div>

      <form className="repository-toolbar" onSubmit={handleSearch}>
        <PatientAutocomplete
          selectedPatient={selectedPatient}
          onSelect={setSelectedPatient}
          onQueryChange={setPatientQuery}
          label="Buscar paciente"
        />
        <PatientIdentifiers patient={selectedPatient} />
        <Button type="submit" loading={loading}>Buscar</Button>
      </form>

      {data && (
        <>
          {unavailableServices.length > 0 && (
            <div className="repository-alert">
              Servicios no disponibles: {unavailableServices.join(", ")}
            </div>
          )}

          <div className="grid grid-2 repository-main">
            <PatientSummary patient={patient} />
            <ClinicalHistoryView history={clinicalHistory} historiasLocales={patient?.historiasLocales || []} />
          </div>

          <ExpandableRecords clinicalHistories={clinicalHistories} consultations={consultations} laboratories={laboratories} imaging={imaging} />

          <div className="repository-ops">
            <Card title="Estado de servicios">
              <Table
                columns={[
                  { key: "servicio", label: "Servicio" },
                  { key: "estado", label: "Estado" },
                  { key: "ultima_revision", label: "Última revisión" },
                  { key: "mensaje", label: "Mensaje" },
                ]}
                rows={serviceStatus}
              />
            </Card>
            <Card title="Logs de integración">
              <Table
                columns={[
                  { key: "servicio", label: "Servicio" },
                  { key: "endpoint", label: "Endpoint" },
                  { key: "resultado", label: "Resultado" },
                  { key: "tiempo_respuesta_ms", label: "Tiempo ms" },
                  { key: "mensaje", label: "Mensaje" },
                ]}
                rows={integrationLogs}
              />
            </Card>
            <Card title="Historial de consultas al repositorio">
              <Table
                columns={[
                  { key: "paciente", label: "Paciente consultado" },
                  { key: "id_paciente_regional", label: "ID regional" },
                  { key: "usuario", label: "Usuario" },
                  { key: "fecha_hora", label: "Fecha y hora" },
                  { key: "resultado", label: "Resultado" },
                  { key: "servicios_no_disponibles", label: "Servicios no disponibles" },
                ]}
                rows={repositoryHistory}
              />
            </Card>
            <Card title="Cache clínica">
              <Table
                columns={[
                  { key: "id_paciente_regional", label: "ID regional" },
                  { key: "fecha_hora", label: "Fecha y hora" },
                  { key: "resumen", label: "Resumen" },
                ]}
                rows={clinicalCache}
              />
            </Card>
          </div>
        </>
      )}
    </>
  );
}
