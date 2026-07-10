import { useEffect, useState } from "react";
import Button from "../../components/common/Button.jsx";
import Loader from "../../components/common/Loader.jsx";
import PatientAutocomplete from "../../components/common/PatientAutocomplete.jsx";
import ClinicalHistoryView from "../../components/repository/ClinicalHistoryView.jsx";
import ExpandableRecords from "../../components/repository/ExpandableRecords.jsx";
import PatientSummary from "../../components/repository/PatientSummary.jsx";
import { getClinicalRepository } from "../../services/repositoryService.js";
import "./Repository.css";

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
  const consultations = Array.isArray(data?.consultations || data?.consultas) ? data.consultations || data.consultas : [];
  const laboratories = Array.isArray(data?.laboratories || data?.laboratorios || data?.laboratorio) ? data.laboratories || data.laboratorios || data.laboratorio : [];
  const imaging = Array.isArray(data?.imaging || data?.imagenologia || data?.imagenes) ? data.imaging || data.imagenologia || data.imagenes : [];
  const unavailable = data?.serviciosNoDisponibles || [];

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
        <Button type="submit" loading={loading}>Buscar</Button>
      </form>

      {data && (
        <>
          {unavailable.length > 0 && (
            <div className="repository-alert">
              Servicios no disponibles: {unavailable.join(", ")}
            </div>
          )}

          <div className="grid grid-2 repository-main">
            <PatientSummary patient={patient} />
            <ClinicalHistoryView history={data.history || data.historiaClinica} historiasLocales={patient?.historiasLocales || []} />
          </div>

          <ExpandableRecords consultations={consultations} laboratories={laboratories} imaging={imaging} />
        </>
      )}
    </>
  );
}
