import { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import Button from "../../components/common/Button.jsx";
import Card from "../../components/common/Card.jsx";
import Input from "../../components/common/Input.jsx";
import Loader from "../../components/common/Loader.jsx";
import PatientAutocomplete from "../../components/common/PatientAutocomplete.jsx";
import PatientIdentifiers from "../../components/common/PatientIdentifiers.jsx";
import Select from "../../components/common/Select.jsx";
import Toast from "../../components/common/Toast.jsx";
import useAuth from "../../hooks/useAuth.js";
import useForm from "../../hooks/useForm.js";
import { getApiErrorMessage } from "../../services/api.js";
import { createImagingStudy, downloadImagingStudy, listAllImagingStudies, saveImagingResult } from "../../services/imagingService.js";
import { FORMATOS_IMAGEN, HOSPITAL_BRANCHES, PRIORIDADES, REGIONES_ANATOMICAS, TIPOS_ESTUDIO } from "../../utils/constants.js";
import { toLocalDateInputValue } from "../../utils/helpers.js";
import { ROLES } from "../../utils/roles.js";
import { required, rule } from "../../utils/validators.js";

const ESTADOS_IMAGEN = ["SOLICITADO", "REALIZADO", "INFORMADO"];

const initialValues = {
  idPacienteRegional: "",
  cedula: "",
  paciente: "",
  tipoEstudio: "",
  regionAnatomica: "",
  fecha: toLocalDateInputValue(),
  formato: "",
  prioridad: "",
  sede: "",
  medico: "",
  indicacion: "",
};

const resultInitial = {
  formato: "",
  hallazgos: "",
  conclusion: "",
  observaciones: "",
  recomendaciones: "",
  tecnicoResponsable: "",
  hora: new Date().toTimeString().slice(0, 5),
  archivo: null,
};

const rules = {
  idPacienteRegional: [rule(required, "Seleccione un paciente registrado.")],
  tipoEstudio: [rule(required, "Seleccione tipo de estudio.")],
  regionAnatomica: [rule(required, "Seleccione región anatómica.")],
  fecha: [rule(required, "Ingrese fecha.")],
  formato: [rule(required, "Seleccione el formato.")],
  prioridad: [rule(required, "Seleccione la prioridad.")],
  sede: [rule(required, "Seleccione la sede.")],
  medico: [rule(required, "El médico responsable es obligatorio.")],
};

function StatusBadge({ status }) {
  return <span className={`status-badge status-${(status || "SOLICITADO").toLowerCase()}`}>{status || "SOLICITADO"}</span>;
}

function PriorityBadge({ priority }) {
  const normalized = (priority || "NORMAL").toUpperCase();
  return <span className={`status-badge ${normalized === "URGENTE" ? "status-pendiente" : "status-en_proceso"}`}>{normalized}</span>;
}

export default function Imaging() {
  const form = useForm(initialValues, rules);
  const { user } = useAuth();
  const location = useLocation();
  const canProcess = user?.role === ROLES.admin || user?.role === ROLES.imagenologia;
  const canRequest = user?.role === ROLES.admin || user?.role === ROLES.medico;
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [studies, setStudies] = useState([]);
  const [activeStudy, setActiveStudy] = useState(null);
  const [filters, setFilters] = useState({ estado: "", sede: "", paciente: "" });
  const [result, setResult] = useState(resultInitial);
  const [fileName, setFileName] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState({ message: "", type: "success" });

  const filteredStudies = useMemo(() => studies.filter((study) => (
    (!filters.estado || study.estado === filters.estado) &&
    (!filters.sede || study.sede === filters.sede) &&
    (!filters.paciente || `${study.idPacienteRegional} ${study.cedula}`.toLowerCase().includes(filters.paciente.toLowerCase()))
  )), [studies, filters]);

  useEffect(() => {
    const patient = location.state?.patient;
    setSelectedPatient(patient || null);
    form.setValues((current) => ({
      ...current,
      idPacienteRegional: patient?.idPacienteRegional || current.idPacienteRegional,
      cedula: patient?.cedula || current.cedula,
      paciente: patient ? `${patient.idPacienteRegional} - ${patient.nombres} ${patient.apellidos}` : current.paciente,
      medico: location.state?.medico || user?.name || user?.username || current.medico,
      sede: location.state?.sede || current.sede,
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.state, user]);

  const loadStudies = async () => {
    setLoading(true);
    try {
      const data = await listAllImagingStudies();
      setStudies(Array.isArray(data) ? data : []);
    } catch (error) {
      setToast({ message: getApiErrorMessage(error, "No fue posible cargar imagenología."), type: "error" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStudies();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handlePatientSelect = (patient) => {
    setSelectedPatient(patient);
    form.setValues((current) => ({
      ...current,
      idPacienteRegional: patient?.idPacienteRegional || "",
      cedula: patient?.cedula || "",
      paciente: patient ? `${patient.idPacienteRegional} - ${patient.nombres} ${patient.apellidos}` : "",
    }));
  };

  const createRequest = async (event) => {
    event.preventDefault();
    if (!canRequest || !form.validate()) return;
    setSaving(true);
    try {
      await createImagingStudy({
        ...form.values,
        estado: "SOLICITADO",
        observaciones: `Indicación: ${form.values.indicacion || "N/A"}`,
      });
      setToast({ message: "Solicitud de imagenología registrada como SOLICITADO.", type: "success" });
      form.reset();
      setSelectedPatient(null);
      await loadStudies();
    } catch (error) {
      setToast({ message: getApiErrorMessage(error, "No fue posible registrar imagenología."), type: "error" });
    } finally {
      setSaving(false);
    }
  };

  const selectStudy = async (study) => {
    setActiveStudy(study);
    setFileName("");
    setResult({
      formato: study.formato || "DICOM",
      hallazgos: study.hallazgos || "",
      conclusion: study.resultado || "",
      observaciones: study.observacionesImagenologo || "",
      recomendaciones: study.recomendaciones || "",
      tecnicoResponsable: study.tecnicoResponsable || user?.name || user?.username || "",
      hora: study.hora || new Date().toTimeString().slice(0, 5),
      archivo: null,
    });
  };

  const handleFile = (event) => {
    const file = event.target.files?.[0];
    setFileName(file?.name || "");
    setResult((current) => ({ ...current, archivo: file || null }));
  };

  const saveResult = async (event) => {
    event.preventDefault();
    if (!activeStudy || !canProcess) return;
    setSaving(true);
    try {
      await saveImagingResult(activeStudy.id, result);
      setToast({ message: "Estudio cargado y marcado como REALIZADO.", type: "success" });
      setActiveStudy(null);
      setResult(resultInitial);
      await loadStudies();
    } catch (error) {
      setToast({ message: getApiErrorMessage(error, "No fue posible guardar el estudio."), type: "error" });
    } finally {
      setSaving(false);
    }
  };

  const downloadStudy = async (study) => {
    try {
      const blob = await downloadImagingStudy(study.id);
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `estudio-${study.id}.${(study.formato || "bin").toLowerCase()}`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      setToast({ message: getApiErrorMessage(error, "El estudio no tiene archivo disponible."), type: "error" });
    }
  };

  return (
    <>
      <div className="page-title">
        <div>
          <h1>Imagenología PACS</h1>
          <p>Solicitud, realización, archivo diagnóstico y descarga de estudios.</p>
        </div>
        <Button variant="secondary" onClick={loadStudies}>Actualizar</Button>
      </div>

      {canRequest && (
        <Card title="Nueva solicitud de estudio">
          <form onSubmit={createRequest} noValidate>
            <div className="grid grid-3 form-section">
              <PatientAutocomplete selectedPatient={selectedPatient} onSelect={handlePatientSelect} error={form.errors.idPacienteRegional} />
              <Input label="Paciente seleccionado" name="paciente" value={form.values.paciente} readOnly />
              <PatientIdentifiers patient={selectedPatient} />
              <Select label="Tipo de estudio *" name="tipoEstudio" value={form.values.tipoEstudio} onChange={form.handleChange} error={form.errors.tipoEstudio} options={TIPOS_ESTUDIO} />
              <Select label="Región anatómica *" name="regionAnatomica" value={form.values.regionAnatomica} onChange={form.handleChange} error={form.errors.regionAnatomica} options={REGIONES_ANATOMICAS} />
              <Input label="Fecha *" type="date" name="fecha" value={form.values.fecha} readOnly error={form.errors.fecha} />
              <Select label="Formato esperado *" name="formato" value={form.values.formato} onChange={form.handleChange} error={form.errors.formato} options={FORMATOS_IMAGEN} />
              <Select label="Prioridad *" name="prioridad" value={form.values.prioridad} onChange={form.handleChange} error={form.errors.prioridad} options={PRIORIDADES} />
              <Select label="Sede *" name="sede" value={form.values.sede} onChange={form.handleChange} error={form.errors.sede} options={HOSPITAL_BRANCHES} />
              <Input label="Médico solicitante" name="medico" value={form.values.medico} readOnly error={form.errors.medico} />
            </div>
            <Input label="Observaciones del médico (opcional)" type="textarea" name="indicacion" value={form.values.indicacion} onChange={form.handleChange} />
            <div className="actions">
              <Button type="submit" loading={saving}>Enviar solicitud</Button>
            </div>
          </form>
        </Card>
      )}

      <Card title="Bandeja PACS">
        <div className="grid grid-3 form-section">
          <Select label="Estado" name="estado" value={filters.estado} onChange={(event) => setFilters((current) => ({ ...current, estado: event.target.value }))} options={ESTADOS_IMAGEN} />
          <Select label="Sede" name="sede" value={filters.sede} onChange={(event) => setFilters((current) => ({ ...current, sede: event.target.value }))} options={HOSPITAL_BRANCHES} />
          <Input label="Paciente o cédula" name="paciente" value={filters.paciente} onChange={(event) => setFilters((current) => ({ ...current, paciente: event.target.value }))} />
        </div>

        {loading ? <Loader /> : (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Estado</th>
                  <th>Paciente</th>
                  <th>Estudio</th>
                  <th>Región</th>
                  <th>Sede</th>
                  <th>Fecha</th>
                  <th>Acción</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudies.map((study) => (
                  <tr key={study.id}>
                    <td><StatusBadge status={study.estado} /></td>
                    <td>{study.idPacienteRegional || study.cedula}</td>
                    <td>{study.tipoEstudio || "Estudio"}</td>
                    <td>{study.regionAnatomica || "N/A"}</td>
                    <td>{study.sede}</td>
                    <td>{study.fecha}</td>
                    <td className="inline-actions">
                      <Button variant="secondary" onClick={() => selectStudy(study)}>{canProcess && study.estado !== "INFORMADO" ? "Procesar" : "Ver estudio e informe"}</Button>
                      {study.url && <Button variant="ghost" onClick={() => downloadStudy(study)}>Descargar</Button>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!filteredStudies.length && <p className="empty-state">No hay estudios con los filtros seleccionados.</p>}
          </div>
        )}
      </Card>

      {activeStudy && (
        <Card title="Estudio de Imagenología">
          <div className="table-wrap form-section">
            <table className="data-table">
              <tbody>
                <tr><th>Paciente</th><td>{activeStudy.idPacienteRegional || activeStudy.cedula}</td></tr>
                <tr><th>Médico solicitante</th><td>{activeStudy.medico || "No registrado"}</td></tr>
                <tr><th>Especialidad</th><td>{activeStudy.especialidad || "No registrada"}</td></tr>
                <tr><th>Tipo de estudio</th><td>{activeStudy.tipoEstudio}</td></tr>
                <tr><th>Región anatómica</th><td>{activeStudy.regionAnatomica || "No registrada"}</td></tr>
                <tr><th>Prioridad</th><td><PriorityBadge priority={activeStudy.prioridad} /></td></tr>
                <tr><th>Sede</th><td>{activeStudy.sede}</td></tr>
                <tr><th>Fecha</th><td>{activeStudy.fecha}</td></tr>
                <tr><th>Hora</th><td>{activeStudy.hora || "Pendiente"}</td></tr>
                <tr><th>Estado</th><td><StatusBadge status={activeStudy.estado} /></td></tr>
                <tr><th>Observaciones del médico</th><td>{activeStudy.observaciones || "Sin observaciones"}</td></tr>
              </tbody>
            </table>
          </div>
          <form onSubmit={saveResult}>
            <div className="grid grid-3 form-section">
              <Input label="Técnico responsable" name="tecnicoResponsable" value={result.tecnicoResponsable} onChange={(event) => setResult((current) => ({ ...current, tecnicoResponsable: event.target.value }))} readOnly={!canProcess || activeStudy.estado === "INFORMADO"} />
              <Input label="Hora del estudio" type="time" name="hora" value={result.hora} onChange={(event) => setResult((current) => ({ ...current, hora: event.target.value }))} readOnly={!canProcess || activeStudy.estado === "INFORMADO"} />
              <Select label="Formato final" name="formato" value={result.formato} onChange={(event) => setResult((current) => ({ ...current, formato: event.target.value }))} options={FORMATOS_IMAGEN} disabled={!canProcess || activeStudy.estado === "INFORMADO"} />
              <Input label="Hallazgos" type="textarea" name="hallazgos" value={result.hallazgos} onChange={(event) => setResult((current) => ({ ...current, hallazgos: event.target.value }))} readOnly={!canProcess || activeStudy.estado === "INFORMADO"} />
              <Input label="Conclusión diagnóstica" type="textarea" name="conclusion" value={result.conclusion} onChange={(event) => setResult((current) => ({ ...current, conclusion: event.target.value }))} readOnly={!canProcess || activeStudy.estado === "INFORMADO"} />
              <Input label="Observaciones del imagenólogo" type="textarea" name="observaciones" value={result.observaciones} onChange={(event) => setResult((current) => ({ ...current, observaciones: event.target.value }))} readOnly={!canProcess || activeStudy.estado === "INFORMADO"} />
              <Input label="Recomendaciones" type="textarea" name="recomendaciones" value={result.recomendaciones} onChange={(event) => setResult((current) => ({ ...current, recomendaciones: event.target.value }))} readOnly={!canProcess || activeStudy.estado === "INFORMADO"} />
              {canProcess && activeStudy.estado !== "INFORMADO" && (
                <label className="field">
                  <span className="field-label">Archivo diagnóstico</span>
                  <input className="field-control" type="file" accept=".pdf,.jpg,.jpeg,.png,.dcm" onChange={handleFile} />
                  <span className="field-hint">{fileName || "PDF, imagen o DICOM."}</span>
                </label>
              )}
            </div>
            <div className="actions">
              <Button type="button" variant="ghost" onClick={() => setActiveStudy(null)}>Cerrar</Button>
              {activeStudy.url && <Button type="button" variant="secondary" onClick={() => downloadStudy(activeStudy)}>Descargar</Button>}
              {canProcess && activeStudy.estado !== "INFORMADO" && <Button type="submit" loading={saving}>Guardar estudio</Button>}
            </div>
          </form>
        </Card>
      )}

      <Toast message={toast.message} type={toast.type} onClose={() => setToast({ message: "", type: "success" })} />
    </>
  );
}
