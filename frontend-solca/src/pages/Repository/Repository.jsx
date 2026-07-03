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
    return [
      ...(data.consultations || data.consultas || []).map((item) => ({ fecha: item.fecha, title: `Consulta ${item.especialidad}`, detail: `${item.motivo} · ${item.medico}` })),
      ...(data.laboratories || data.laboratorios || []).map((item) => ({ fecha: item.fecha, title: `Laboratorio ${item.tipoExamen}`, detail: item.resultado })),
      ...(data.imaging || data.imagenologia || []).map((item) => ({ fecha: item.fecha, title: `Imagenología ${item.tipoEstudio || item.tipo}`, detail: item.resultado })),
    ].sort((a, b) => b.fecha.localeCompare(a.fecha));
  }, [data]);

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
          <div className="grid grid-2 repository-main">
            <PatientSummary patient={data.patient || data.paciente} />
            <ClinicalHistoryView history={data.history || data.historiaClinica} />
          </div>

          <RepositoryTables consultations={data.consultations || data.consultas || []} laboratories={data.laboratories || data.laboratorios || []} imaging={data.imaging || data.imagenologia || []} />

          <div className="repository-timeline">
            <ClinicalTimeline events={events} />
          </div>
        </>
      )}
    </>
  );
}
