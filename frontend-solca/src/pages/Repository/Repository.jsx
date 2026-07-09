import { useEffect, useMemo, useState } from "react";
import Button from "../../components/common/Button.jsx";
import Loader from "../../components/common/Loader.jsx";
import SearchBar from "../../components/common/SearchBar.jsx";
import ClinicalHistoryView from "../../components/repository/ClinicalHistoryView.jsx";
import ClinicalTimeline from "../../components/repository/ClinicalTimeline.jsx";
import PatientSummary from "../../components/repository/PatientSummary.jsx";
import RepositoryTables from "../../components/repository/RepositoryTables.jsx";
import { getClinicalRepository } from "../../services/repositoryService.js";
import "./Repository.css";

export default function Repository() {
  const [query, setQuery] = useState("");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getClinicalRepository().then((payload) => {
      setData(payload);
    }).catch(() => setData(null));
  }, []);

  const handleSearch = async (event) => {
    event.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    try {
      const payload = await getClinicalRepository(query.trim());
      setData(payload);
    } finally {
      setLoading(false);
    }
  };

  const events = useMemo(() => {
    if (!data) return [];
    const consultations = Array.isArray(data.consultations || data.consultas) ? data.consultations || data.consultas : [];
    const laboratories = Array.isArray(data.laboratories || data.laboratorios || data.laboratorio) ? data.laboratories || data.laboratorios || data.laboratorio : [];
    const imaging = Array.isArray(data.imaging || data.imagenologia || data.imagenes) ? data.imaging || data.imagenologia || data.imagenes : [];
    return [
      ...consultations.map((item) => ({ fecha: item.fecha, title: `Consulta ${item.especialidad}`, detail: `${item.motivo} · ${item.medico}` })),
      ...laboratories.map((item) => ({ fecha: item.fecha, title: `Laboratorio ${item.tipoExamen}`, detail: item.resultado })),
      ...imaging.map((item) => ({ fecha: item.fecha, title: `Imagenología ${item.tipoEstudio || item.tipo}`, detail: item.resultado })),
    ].sort((a, b) => b.fecha.localeCompare(a.fecha));
  }, [data]);

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
        <SearchBar value={query} onChange={(event) => setQuery(event.target.value)} />
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

          <RepositoryTables consultations={consultations} laboratories={laboratories} imaging={imaging} />

          <div className="repository-timeline">
            <ClinicalTimeline events={events} />
          </div>
        </>
      )}
    </>
  );
}
