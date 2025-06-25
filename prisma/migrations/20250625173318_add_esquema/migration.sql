-- CreateEnum
CREATE TYPE "RolUsuario" AS ENUM ('SUPERADMIN', 'ADMIN', 'VENTAS');

-- CreateEnum
CREATE TYPE "EstadoUsuario" AS ENUM ('ACTIVO', 'INACTIVO', 'SUSPENDIDO');

-- CreateEnum
CREATE TYPE "EstadoCliente" AS ENUM ('ACTIVO', 'INACTIVO');

-- CreateEnum
CREATE TYPE "TipoProyecto" AS ENUM ('SOFTWARE_A_MEDIDA', 'ECOMMERCE', 'LANDING_PAGE', 'SISTEMA_WEB', 'APP_MOVIL', 'MANTENIMIENTO');

-- CreateEnum
CREATE TYPE "FormaPago" AS ENUM ('PAGO_UNICO', 'DOS_CUOTAS', 'TRES_CUOTAS', 'MENSUAL');

-- CreateEnum
CREATE TYPE "EstadoProyecto" AS ENUM ('EN_DESARROLLO', 'COMPLETADO', 'EN_PAUSA', 'CANCELADO');

-- CreateEnum
CREATE TYPE "EstadoPago" AS ENUM ('PENDIENTE', 'PAGADO', 'VENCIDO', 'PARCIAL');

-- CreateTable
CREATE TABLE "usuarios" (
    "id" TEXT NOT NULL,
    "cognitoId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "apellido" TEXT NOT NULL,
    "avatar" TEXT,
    "rol" "RolUsuario" NOT NULL DEFAULT 'VENTAS',
    "estado" "EstadoUsuario" NOT NULL DEFAULT 'ACTIVO',
    "fechaCreacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fechaLogin" TIMESTAMP(3),
    "creadoPor" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clientes" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "telefono" TEXT,
    "empresa" TEXT,
    "fechaRegistro" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "estado" "EstadoCliente" NOT NULL DEFAULT 'ACTIVO',
    "creadoPor" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "clientes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "proyectos" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "tipo" "TipoProyecto" NOT NULL,
    "montoTotal" DOUBLE PRECISION NOT NULL,
    "formaPago" "FormaPago" NOT NULL,
    "cuotas" INTEGER,
    "fechaInicio" TIMESTAMP(3) NOT NULL,
    "fechaEntrega" TIMESTAMP(3),
    "estadoProyecto" "EstadoProyecto" NOT NULL DEFAULT 'EN_DESARROLLO',
    "estadoPago" "EstadoPago" NOT NULL DEFAULT 'PENDIENTE',
    "clienteId" TEXT NOT NULL,
    "creadoPor" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "proyectos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pagos" (
    "id" TEXT NOT NULL,
    "numeroCuota" INTEGER NOT NULL,
    "montoCuota" DOUBLE PRECISION NOT NULL,
    "fechaVencimiento" TIMESTAMP(3) NOT NULL,
    "fechaPagoReal" TIMESTAMP(3),
    "estadoPago" "EstadoPago" NOT NULL DEFAULT 'PENDIENTE',
    "metodoPago" TEXT,
    "notas" TEXT,
    "proyectoId" TEXT NOT NULL,
    "gestionadoPor" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pagos_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_cognitoId_key" ON "usuarios"("cognitoId");

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_email_key" ON "usuarios"("email");

-- CreateIndex
CREATE UNIQUE INDEX "clientes_email_key" ON "clientes"("email");

-- AddForeignKey
ALTER TABLE "clientes" ADD CONSTRAINT "clientes_creadoPor_fkey" FOREIGN KEY ("creadoPor") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proyectos" ADD CONSTRAINT "proyectos_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "clientes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proyectos" ADD CONSTRAINT "proyectos_creadoPor_fkey" FOREIGN KEY ("creadoPor") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pagos" ADD CONSTRAINT "pagos_proyectoId_fkey" FOREIGN KEY ("proyectoId") REFERENCES "proyectos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pagos" ADD CONSTRAINT "pagos_gestionadoPor_fkey" FOREIGN KEY ("gestionadoPor") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;
