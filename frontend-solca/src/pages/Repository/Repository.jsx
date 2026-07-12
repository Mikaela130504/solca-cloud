import { useEffect, useState } from "react";
import Button from "../../components/common/Button.jsx";
import Loader from "../../components/common/Loader.jsx";
import PatientAutocomplete from "../../components/common/PatientAutocomplete.jsx";
import PatientIdentifiers from "../../components/common/PatientIdentifiers.jsx";
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

export default function Repository() {
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getClinicalRepository().then((payload) => {
      setData(payload);
    }).catch(() => setData(null));
  }, []);

  const handleSearch = async (event) => {
    event.preventDefault();
    if (!selectedPatient?.idPacienteRegional) return;
    setLoading(true);
    try {
      const payload = await getClinicalRepository(selectedPatient.idPacienteRegional);
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
        <PatientAutocomplete selectedPatient={selectedPatient} onSelect={setSelectedPatient} label="Buscar paciente" />
        <PatientIdentifiers patient={selectedPatient} />
        <Button type="submit" loading={loading}>Buscar</Button>
      </form>

      {data && (
        <>
          <div className="grid grid-2 repository-main">
            <PatientSummary patient={patient} />
            <ClinicalHistoryView history={clinicalHistory} historiasLocales={patient?.historiasLocales || []} />
          </div>

          <ExpandableRecords clinicalHistories={clinicalHistories} consultations={consultations} laboratories={laboratories} imaging={imaging} />
        </>
      )}
    </>
  );
}
