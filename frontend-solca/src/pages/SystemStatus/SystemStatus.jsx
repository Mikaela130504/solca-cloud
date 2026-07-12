import { useEffect, useState } from "react";
import Button from "../../components/common/Button.jsx";
import Card from "../../components/common/Card.jsx";
import Loader from "../../components/common/Loader.jsx";
import { checkAllMicroservices } from "../../services/systemStatusService.js";

export default function SystemStatus() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadStatus = async () => {
    setLoading(true);
    const data = await checkAllMicroservices();
    setServices(data);
    setLoading(false);
  };

  useEffect(() => {
    loadStatus();
    const timer = setInterval(loadStatus, 15000);
    return () => clearInterval(timer);
  }, []);

  const unavailable = services.filter((service) => service.status !== "DISPONIBLE");

  return (
    <>
      <div className="page-title">
        <div>
          <h1>Estado de Microservicios</h1>
          <p>Monitoreo operativo independiente para evidenciar disponibilidad y resiliencia del sistema.</p>
        </div>
        <Button variant="secondary" onClick={loadStatus} loading={loading}>Actualizar</Button>
      </div>

      {unavailable.length > 0 && (
        <section className="system-alert">
          <strong>Alerta de disponibilidad</strong>
          <span>{unavailable.map((service) => service.name).join(", ")} no responde actualmente.</span>
        </section>
      )}

      <Card title="Servicios desplegados">
        {loading && !services.length ? <Loader /> : (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Microservicio</th>
                  <th>Estado</th>
                  <th>Última respuesta</th>
                  <th>Tiempo respuesta</th>
                  <th>Detalle</th>
                </tr>
              </thead>
              <tbody>
                {services.map((service) => (
                  <tr key={service.key}>
                    <td><strong>{service.name}</strong></td>
                    <td><span className={`status-badge ${service.status === "DISPONIBLE" ? "status-finalizado" : "status-pendiente"}`}>{service.status}</span></td>
                    <td>{service.lastResponse}</td>
                    <td>{service.responseTime === null ? "-" : `${service.responseTime} ms`}</td>
                    <td>{service.message}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </>
  );
}
