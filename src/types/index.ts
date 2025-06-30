// =====================================================
// TIPOS CENTRALIZADOS - src/types/index.ts
// =====================================================

// Tipos de enums que coinciden con Prisma
export type TipoProyecto = 'SOFTWARE_A_MEDIDA' | 'ECOMMERCE' | 'LANDING_PAGE' | 'SISTEMA_WEB' | 'APP_MOVIL' | 'MANTENIMIENTO'
export type FormaPago = 'PAGO_UNICO' | 'DOS_CUOTAS' | 'TRES_CUOTAS' | 'MENSUAL'
export type EstadoProyecto = 'EN_DESARROLLO' | 'COMPLETADO' | 'EN_PAUSA' | 'CANCELADO'
export type EstadoPago = 'PENDIENTE' | 'PAGADO' | 'VENCIDO' | 'PARCIAL'
export type EstadoCliente = 'ACTIVO' | 'INACTIVO'
export type RolUsuario = 'SUPERADMIN' | 'ADMIN' | 'VENTAS'
export type EstadoUsuario = 'ACTIVO' | 'INACTIVO' | 'SUSPENDIDO'

// Interfaces principales
export interface Cliente {
  id: string
  nombre: string
  email: string
  telefono?: string
  empresa?: string
  fechaRegistro: string
  estado: EstadoCliente
  creadoPor?: string
  createdAt: string
  updatedAt: string
  proyectos?: Proyecto[]
}

export interface Proyecto {
  id: string
  nombre: string
  tipo: TipoProyecto
  montoTotal: number
  formaPago: FormaPago
  cuotas?: number
  fechaInicio: string
  fechaEntrega?: string
  estadoProyecto: EstadoProyecto
  estadoPago: EstadoPago
  clienteId: string
  cliente?: Cliente
  pagos?: Pago[]
  creadoPor?: string
  createdAt: string
  updatedAt: string
}

export interface Pago {
  id: string
  numeroCuota: number
  montoCuota: number
  fechaVencimiento: string
  fechaPagoReal?: string
  estadoPago: EstadoPago
  metodoPago?: string
  notas?: string
  proyectoId: string
  proyecto?: Proyecto
  gestionadoPor?: string
  createdAt: string
  updatedAt: string
}

export interface Usuario {
  id: string
  cognitoId: string
  email: string
  nombre: string
  apellido: string
  avatar?: string
  rol: RolUsuario
  estado: EstadoUsuario
  fechaCreacion: string
  fechaLogin?: string
  creadoPor?: string
  createdAt: string
  updatedAt: string
  _count?: {
    clientesCreados: number
    proyectosCreados: number
    pagosGestionados: number
  }
}

// Tipos para formularios (Partial para campos opcionales)
export interface CreateClienteData {
  nombre: string
  email: string
  telefono?: string
  empresa?: string
  estado?: EstadoCliente
}

export interface CreateProyectoData {
  nombre: string
  tipo: TipoProyecto
  montoTotal: number
  formaPago: FormaPago
  cuotas?: number
  fechaInicio: string
  fechaEntrega?: string
  clienteId: string
}

export interface CreateUsuarioData {
  email: string
  nombre: string
  apellido: string
  rol: RolUsuario
  password: string
  estado?: EstadoUsuario
}

export interface CreatePagoData {
  numeroCuota: number
  montoCuota: number
  fechaVencimiento: string
  proyectoId: string
  metodoPago?: string
  notas?: string
}

// Tipos para respuestas de API
export interface ApiResponse<T> {
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

// Tipos para filtros
export interface ClienteFilters {
  search?: string
  estado?: EstadoCliente
  page?: number
  limit?: number
}

export interface ProyectoFilters {
  search?: string
  tipo?: TipoProyecto
  estado?: EstadoProyecto
  clienteId?: string
  page?: number
  limit?: number
}

export interface PagoFilters {
  search?: string
  estado?: EstadoPago
  fechaDesde?: string
  fechaHasta?: string
  proyectoId?: string
  page?: number
  limit?: number
}

// Tipos para estadísticas
export interface DashboardStats {
  totalFacturado: number
  pendienteCobro: number
  proyectosActivos: number
  clientesActivos: number
  facturacionMes: number
  pagosVencidos: number
  tendenciaFacturacion: number
  proyectosCompletados: number
}

// Tipos para notificaciones
export interface Notification {
  id: string
  tipo: 'pago_vencido' | 'pago_proximo' | 'proyecto_completado' | 'nuevo_cliente' | 'sistema'
  titulo: string
  mensaje: string
  fecha: string
  leida: boolean
  urgente: boolean
  metadata?: {
    clienteId?: string
    proyectoId?: string
    pagoId?: string
    monto?: number
  }
}

// Tipos para autenticación (mantener compatibilidad)
export interface AuthUser {
  email: string
  name: string
  given_name: string
  family_name: string
  sub: string
  'custom:role'?: RolUsuario
}

export interface AuthTokens {
  accessToken: string
  idToken: string
  refreshToken: string
}

// Constantes útiles
export const TIPOS_PROYECTO_LABELS: Record<TipoProyecto, string> = {
  SOFTWARE_A_MEDIDA: 'Software a Medida',
  ECOMMERCE: 'E-commerce',
  LANDING_PAGE: 'Landing Page',
  SISTEMA_WEB: 'Sistema Web',
  APP_MOVIL: 'App Móvil',
  MANTENIMIENTO: 'Mantenimiento'
}

export const FORMAS_PAGO_LABELS: Record<FormaPago, string> = {
  PAGO_UNICO: 'Pago Único',
  DOS_CUOTAS: '2 Cuotas',
  TRES_CUOTAS: '3 Cuotas',
  MENSUAL: 'Mensual'
}

export const ESTADOS_PROYECTO_LABELS: Record<EstadoProyecto, string> = {
  EN_DESARROLLO: 'En Desarrollo',
  COMPLETADO: 'Completado',
  EN_PAUSA: 'En Pausa',
  CANCELADO: 'Cancelado'
}

export const ESTADOS_PAGO_LABELS: Record<EstadoPago, string> = {
  PENDIENTE: 'Pendiente',
  PAGADO: 'Pagado',
  VENCIDO: 'Vencido',
  PARCIAL: 'Parcial'
}

export const ROLES_LABELS: Record<RolUsuario, string> = {
  SUPERADMIN: 'Super Administrador',
  ADMIN: 'Administrador',
  VENTAS: 'Ventas'
}