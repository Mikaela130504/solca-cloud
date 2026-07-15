import { useEffect, useMemo, useRef, useState } from "react";
import Button from "../../components/common/Button.jsx";
import Card from "../../components/common/Card.jsx";
import Input from "../../components/common/Input.jsx";
import Loader from "../../components/common/Loader.jsx";
import Select from "../../components/common/Select.jsx";
import Toast from "../../components/common/Toast.jsx";
import useAuth from "../../hooks/useAuth.js";
import { getApiErrorMessage } from "../../services/api.js";
import { downloadImagingStudy, listAllImagingStudies, saveImagingResult } from "../../services/imagingService.js";
import { listConsultations } from "../../services/consultationService.js";
import { FORMATOS_IMAGEN, HOSPITAL_BRANCHES } from "../../utils/constants.js";
import { ROLES } from "../../utils/roles.js";

const ESTADOS_IMAGEN = ["SOLICITADO", "REALIZADO", "INFORMADO"];
const DEFAULT_IMAGE_FORMAT = "DICOM";
const DICOM_SIGNATURE_OFFSET = 128;
const PNG_SIGNATURE = [137, 80, 78, 71, 13, 10, 26, 10];
const JPEG_SIGNATURE = [255, 216, 255];
const PDF_SIGNATURE = [37, 80, 68, 70];
const IMAGE_FORMAT_RULES = {
  PNG: {
    accept: ".png,image/png",
    extension: ".png",
    label: "Solo archivo PNG .png.",
    error: "Solo se permiten archivos PNG reales con extensión .png.",
  },
  DICOM: {
    accept: ".dcm,.dicom,application/dicom",
    extension: ".dcm",
    extensions: [".dcm", ".dicom"],
    label: "Solo archivo DICOM .dcm o .dicom.",
    error: "Solo se permiten archivos DICOM con extensión .dcm o .dicom.",
  },
};

const resultInitial = {
  formato: DEFAULT_IMAGE_FORMAT,
  hallazgos: "",
  conclusion: "",
  observaciones: "",
  recomendaciones: "",
  tecnicoResponsable: "",
  hora: new Date().toTimeString().slice(0, 5),
  archivo: null,
};

function StatusBadge({ status }) {
  return <span className={`status-badge status-${(status || "SOLICITADO").toLowerCase()}`}>{status || "SOLICITADO"}</span>;
}

function PriorityBadge({ priority }) {
  const normalized = (priority || "NORMAL").toUpperCase();
  return <span className={`status-badge ${normalized === "URGENTE" ? "status-pendiente" : "status-en_proceso"}`}>{normalized}</span>;
}

function enrichWithConsultation(record, consultations = []) {
  if (!record?.consultaId) return record;
  const source = consultations.find((item) => Number(item.id) === Number(record.consultaId));
  if (!source) return record;
  return {
    ...record,
    sede: source.sede || record.sede,
    medico: source.medico || record.medico,
    especialidad: source.especialidad || record.especialidad,
    tipoConsulta: source.tipoConsulta || record.tipoConsulta,
    fecha: source.fecha || record.fecha,
    diagnostico: source.diagnostico || record.diagnostico,
  };
}

export default function Imaging() {
  const { user } = useAuth();
  const canProcess = user?.role === ROLES.admin || user?.role === ROLES.imagenologia;
  const [studies, setStudies] = useState([]);
  const [activeStudy, setActiveStudy] = useState(null);
  const [filters, setFilters] = useState({ estado: "", sede: "", paciente: "" });
  const [result, setResult] = useState(resultInitial);
  const [fileName, setFileName] = useState("");
  const [fileInputKey, setFileInputKey] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState({ message: "", type: "success" });
  const selectedFormatRef = useRef(DEFAULT_IMAGE_FORMAT);
  const selectedFormat = IMAGE_FORMAT_RULES[result.formato] ? result.formato : DEFAULT_IMAGE_FORMAT;
  const selectedRule = IMAGE_FORMAT_RULES[selectedFormat];

  const filteredStudies = useMemo(() => studies.filter((study) => (
    (!filters.estado || study.estado === filters.estado) &&
    (!filters.sede || study.sede === filters.sede) &&
    (!filters.paciente || `${study.idPacienteRegional} ${study.cedula}`.toLowerCase().includes(filters.paciente.toLowerCase()))
  )), [studies, filters]);

  const loadStudies = async () => {
    setLoading(true);
    try {
      const [data, consultations] = await Promise.all([
        listAllImagingStudies(),
        listConsultations().catch(() => []),
      ]);
      const rows = Array.isArray(data) ? data : [];
      setStudies(rows.map((item) => enrichWithConsultation(item, consultations)));
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

  const selectStudy = async (study) => {
    let hydratedStudy = study;
    if (study.consultaId) {
      try {
        const consultations = await listConsultations();
        hydratedStudy = enrichWithConsultation(study, consultations);
      } catch {
        hydratedStudy = study;
      }
    }
    setActiveStudy(hydratedStudy);
    setFileName("");
    setFileInputKey((current) => current + 1);
    const existingFormat = IMAGE_FORMAT_RULES[hydratedStudy.formato] ? hydratedStudy.formato : DEFAULT_IMAGE_FORMAT;
    selectedFormatRef.current = existingFormat;
    setResult({
      formato: existingFormat,
      hallazgos: hydratedStudy.hallazgos || "",
      conclusion: hydratedStudy.resultado || "",
      observaciones: hydratedStudy.observacionesImagenologo || "",
      recomendaciones: hydratedStudy.recomendaciones || "",
      tecnicoResponsable: hydratedStudy.tecnicoResponsable || user?.name || user?.username || "",
      hora: hydratedStudy.hora || new Date().toTimeString().slice(0, 5),
      archivo: null,
    });
  };

  const handleFile = async (event) => {
    const file = event.target.files?.[0];
    const format = IMAGE_FORMAT_RULES[selectedFormatRef.current] ? selectedFormatRef.current : selectedFormat;
    const rule = IMAGE_FORMAT_RULES[format];
    if (!file) {
      setFileName("");
      setResult((current) => ({ ...current, archivo: null }));
      return;
    }

    const lowerName = file.name.toLowerCase();
    const extensions = rule.extensions || [rule.extension];
    const hasExpectedExtension = extensions.some((extension) => lowerName.endsWith(extension));
    const header = new Uint8Array(await file.slice(0, Math.max(DICOM_SIGNATURE_OFFSET + 4, PNG_SIGNATURE.length)).arrayBuffer());
    const isValidPng = format === "PNG" && PNG_SIGNATURE.every((byte, index) => header[index] === byte);
    const hasDicomPreamble = header.length >= DICOM_SIGNATURE_OFFSET + 4 && header[DICOM_SIGNATURE_OFFSET] === 68 && header[DICOM_SIGNATURE_OFFSET + 1] === 73 && header[DICOM_SIGNATURE_OFFSET + 2] === 67 && header[DICOM_SIGNATURE_OFFSET + 3] === 77;
    const isClearlyNotDicom = PNG_SIGNATURE.every((byte, index) => header[index] === byte) || JPEG_SIGNATURE.every((byte, index) => header[index] === byte) || PDF_SIGNATURE.every((byte, index) => header[index] === byte);
    const isValidDicom = format === "DICOM" && hasExpectedExtension && (hasDicomPreamble || !isClearlyNotDicom);

    if (!hasExpectedExtension || (!isValidPng && !isValidDicom)) {
      event.target.value = "";
      setFileName("");
      setResult((current) => ({ ...current, archivo: null, formato }));
      setToast({ message: rule.error, type: "error" });
      return;
    }

    setFileName(file.name);
    setResult((current) => ({ ...current, archivo: file, formato }));
  };

  const handleFormatChange = (event) => {
    const formato = event.target.value;
    selectedFormatRef.current = IMAGE_FORMAT_RULES[formato] ? formato : DEFAULT_IMAGE_FORMAT;
    setFileName("");
    setFileInputKey((current) => current + 1);
    setResult((current) => ({ ...current, formato: selectedFormatRef.current, archivo: null }));
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
      const extension = IMAGE_FORMAT_RULES[study.formato]?.extension || ".dcm";
      link.download = `estudio-${study.id}${extension}`;
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
              <Select label="Formato final" name="formato" value={selectedFormat} onChange={handleFormatChange} options={FORMATOS_IMAGEN} includePlaceholder={false} disabled={!canProcess || activeStudy.estado === "INFORMADO"} />
              <Input label="Hallazgos" type="textarea" name="hallazgos" value={result.hallazgos} onChange={(event) => setResult((current) => ({ ...current, hallazgos: event.target.value }))} readOnly={!canProcess || activeStudy.estado === "INFORMADO"} />
              <Input label="Conclusión diagnóstica" type="textarea" name="conclusion" value={result.conclusion} onChange={(event) => setResult((current) => ({ ...current, conclusion: event.target.value }))} readOnly={!canProcess || activeStudy.estado === "INFORMADO"} />
              <Input label="Observaciones del imagenólogo" type="textarea" name="observaciones" value={result.observaciones} onChange={(event) => setResult((current) => ({ ...current, observaciones: event.target.value }))} readOnly={!canProcess || activeStudy.estado === "INFORMADO"} />
              <Input label="Recomendaciones" type="textarea" name="recomendaciones" value={result.recomendaciones} onChange={(event) => setResult((current) => ({ ...current, recomendaciones: event.target.value }))} readOnly={!canProcess || activeStudy.estado === "INFORMADO"} />
              {canProcess && activeStudy.estado !== "INFORMADO" && (
                <label className="field">
                  <span className="field-label">Archivo diagnóstico</span>
                  <input key={fileInputKey} className="field-control" type="file" accept={selectedRule.accept} onChange={handleFile} />
                  <span className="field-hint">{fileName || selectedRule.label}</span>
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
