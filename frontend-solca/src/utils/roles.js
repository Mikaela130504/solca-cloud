export const ROLES = {
  admin: "ADMIN",
  medico: "MEDICO",
  laboratorio: "LABORATORIO",
  imagenologia: "IMAGENOLOGIA",
};

export const ROLE_PERMISSIONS = {
  dashboard: [ROLES.admin, ROLES.medico, ROLES.laboratorio, ROLES.imagenologia],
  patient: [ROLES.admin, ROLES.medico],
  clinicalHistory: [ROLES.admin, ROLES.medico],
  consultation: [ROLES.admin, ROLES.medico],
  laboratory: [ROLES.admin, ROLES.medico, ROLES.laboratorio],
  imaging: [ROLES.admin, ROLES.medico, ROLES.imagenologia],
  repository: [ROLES.admin, ROLES.medico],
  systemStatus: [ROLES.admin],
  audit: [ROLES.admin],
};

export function canAccess(user, allowedRoles = []) {
  if (!allowedRoles.length) return true;
  return allowedRoles.includes(user?.role);
}

export function isLaboratoryRole(user) {
  return user?.role === ROLES.laboratorio;
}
