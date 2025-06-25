// =====================================================
// SEED DATABASE - prisma/seed.ts
// =====================================================

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Iniciando seed de la base de datos...')

  // Limpiar datos existentes
  console.log('🧹 Limpiando datos existentes...')
  await prisma.pago.deleteMany()
  await prisma.proyecto.deleteMany()
  await prisma.cliente.deleteMany()
  await prisma.usuario.deleteMany()

  // Crear usuario superadmin (deberás crearlo primero en Cognito)
  console.log('👑 Creando usuario SUPERADMIN...')
  const superAdmin = await prisma.usuario.create({
    data: {
      cognitoId: '44fqocjcqnbugukp4tekh20qjg', // Cambiar por el ID real de Cognito
      email: 'gaston-mora@hotmail.com.com', // Cambiar por tu email
      nombre: 'Super',
      apellido: 'Administrador',
      rol: 'SUPERADMIN',
      estado: 'ACTIVO',
    }
  })

  // Crear usuarios de prueba
  console.log('👥 Creando usuarios de prueba...')
  const adminUser = await prisma.usuario.create({
    data: {
      cognitoId: 'admin-cognito-id',
      email: 'admin.demo@empresa.com',
      nombre: 'Admin',
      apellido: 'Demo',
      rol: 'ADMIN',
      estado: 'ACTIVO',
      creadoPor: superAdmin.id,
    }
  })

  const salesUser = await prisma.usuario.create({
    data: {
      cognitoId: 'sales-cognito-id',
      email: 'ventas.demo@empresa.com',
      nombre: 'Vendedor',
      apellido: 'Demo',
      rol: 'VENTAS',
      estado: 'ACTIVO',
      creadoPor: superAdmin.id,
    }
  })

  // Crear clientes de prueba
  console.log('👤 Creando clientes de prueba...')
  const clientes = await Promise.all([
    prisma.cliente.create({
      data: {
        nombre: 'Juan Pérez',
        email: 'juan.perez@empresa1.com',
        telefono: '+54 9 11 1234-5678',
        empresa: 'TechCorp SA',
        creadoPor: salesUser.id,
      }
    }),
    prisma.cliente.create({
      data: {
        nombre: 'María García',
        email: 'maria.garcia@startup.com',
        telefono: '+54 9 11 2345-6789',
        empresa: 'StartupXYZ',
        creadoPor: salesUser.id,
      }
    }),
    prisma.cliente.create({
      data: {
        nombre: 'Carlos López',
        email: 'carlos@digital.com',
        telefono: '+54 9 11 3456-7890',
        empresa: 'Digital SA',
        creadoPor: adminUser.id,
      }
    }),
    prisma.cliente.create({
      data: {
        nombre: 'Ana Rodríguez',
        email: 'ana@innovacorp.com',
        telefono: '+54 9 11 4567-8901',
        empresa: 'InnovaCorp',
        creadoPor: salesUser.id,
      }
    }),
    prisma.cliente.create({
      data: {
        nombre: 'Luis Martín',
        email: 'luis@webflow.com',
        telefono: '+54 9 11 5678-9012',
        empresa: 'WebFlow',
        creadoPor: adminUser.id,
      }
    })
  ])

  // Crear proyectos de prueba
  console.log('📁 Creando proyectos de prueba...')
  const proyectos = []

  // Proyecto 1: Sistema CRM
  const proyecto1 = await prisma.proyecto.create({
    data: {
      nombre: 'Sistema CRM Personalizado',
      tipo: 'SOFTWARE_A_MEDIDA',
      montoTotal: 25000,
      formaPago: 'TRES_CUOTAS',
      cuotas: 3,
      fechaInicio: new Date('2024-01-15'),
      fechaEntrega: new Date('2024-04-15'),
      estadoProyecto: 'EN_DESARROLLO',
      estadoPago: 'PARCIAL',
      clienteId: clientes[0].id,
      creadoPor: salesUser.id,
    }
  })
  proyectos.push(proyecto1)

  // Proyecto 2: E-commerce
  const proyecto2 = await prisma.proyecto.create({
    data: {
      nombre: 'Tienda Online con Pasarela de Pagos',
      tipo: 'ECOMMERCE',
      montoTotal: 18000,
      formaPago: 'DOS_CUOTAS',
      cuotas: 2,
      fechaInicio: new Date('2024-02-01'),
      fechaEntrega: new Date('2024-03-31'),
      estadoProyecto: 'COMPLETADO',
      estadoPago: 'COMPLETO',
      clienteId: clientes[1].id,
      creadoPor: salesUser.id,
    }
  })
  proyectos.push(proyecto2)

  // Proyecto 3: Landing Page
  const proyecto3 = await prisma.proyecto.create({
    data: {
      nombre: 'Landing Page Corporativa',
      tipo: 'LANDING_PAGE',
      montoTotal: 5000,
      formaPago: 'PAGO_UNICO',
      cuotas: 1,
      fechaInicio: new Date('2024-03-01'),
      fechaEntrega: new Date('2024-03-15'),
      estadoProyecto: 'COMPLETADO',
      estadoPago: 'PENDIENTE',
      clienteId: clientes[2].id,
      creadoPor: adminUser.id,
    }
  })
  proyectos.push(proyecto3)

  // Proyecto 4: App Móvil
  const proyecto4 = await prisma.proyecto.create({
    data: {
      nombre: 'Aplicación Móvil iOS/Android',
      tipo: 'APP_MOVIL',
      montoTotal: 35000,
      formaPago: 'MENSUAL',
      cuotas: 6,
      fechaInicio: new Date('2024-01-01'),
      fechaEntrega: new Date('2024-07-01'),
      estadoProyecto: 'EN_DESARROLLO',
      estadoPago: 'PARCIAL',
      clienteId: clientes[3].id,
      creadoPor: salesUser.id,
    }
  })
  proyectos.push(proyecto4)

  // Proyecto 5: Sistema Web
  const proyecto5 = await prisma.proyecto.create({
    data: {
      nombre: 'Portal de Gestión Empresarial',
      tipo: 'SISTEMA_WEB',
      montoTotal: 28000,
      formaPago: 'TRES_CUOTAS',
      cuotas: 3,
      fechaInicio: new Date('2024-02-15'),
      fechaEntrega: new Date('2024-05-15'),
      estadoProyecto: 'EN_PAUSA',
      estadoPago: 'PENDIENTE',
      clienteId: clientes[4].id,
      creadoPor: adminUser.id,
    }
  })
  proyectos.push(proyecto5)

  // Crear pagos de prueba
  console.log('💰 Creando pagos de prueba...')
  
  // Pagos para Proyecto 1 (3 cuotas)
  await Promise.all([
    prisma.pago.create({
      data: {
        numeroCuota: 1,
        montoCuota: 8333.33,
        fechaVencimiento: new Date('2024-02-15'),
        fechaPagoReal: new Date('2024-02-10'),
        estadoPago: 'PAGADO',
        metodoPago: 'Transferencia Bancaria',
        proyectoId: proyecto1.id,
        gestionadoPor: salesUser.id,
      }
    }),
    prisma.pago.create({
      data: {
        numeroCuota: 2,
        montoCuota: 8333.33,
        fechaVencimiento: new Date('2024-03-15'),
        fechaPagoReal: new Date('2024-03-12'),
        estadoPago: 'PAGADO',
        metodoPago: 'Transferencia Bancaria',
        proyectoId: proyecto1.id,
        gestionadoPor: salesUser.id,
      }
    }),
    prisma.pago.create({
      data: {
        numeroCuota: 3,
        montoCuota: 8333.34,
        fechaVencimiento: new Date('2024-04-15'),
        estadoPago: 'PENDIENTE',
        proyectoId: proyecto1.id,
      }
    })
  ])

  // Pagos para Proyecto 2 (2 cuotas - completado)
  await Promise.all([
    prisma.pago.create({
      data: {
        numeroCuota: 1,
        montoCuota: 9000,
        fechaVencimiento: new Date('2024-02-15'),
        fechaPagoReal: new Date('2024-02-14'),
        estadoPago: 'PAGADO',
        metodoPago: 'Efectivo',
        proyectoId: proyecto2.id,
        gestionadoPor: salesUser.id,
      }
    }),
    prisma.pago.create({
      data: {
        numeroCuota: 2,
        montoCuota: 9000,
        fechaVencimiento: new Date('2024-03-31'),
        fechaPagoReal: new Date('2024-03-30'),
        estadoPago: 'PAGADO',
        metodoPago: 'Transferencia Bancaria',
        proyectoId: proyecto2.id,
        gestionadoPor: salesUser.id,
      }
    })
  ])

  // Pago para Proyecto 3 (pago único - vencido)
  await prisma.pago.create({
    data: {
      numeroCuota: 1,
      montoCuota: 5000,
      fechaVencimiento: new Date('2024-03-20'),
      estadoPago: 'VENCIDO',
      proyectoId: proyecto3.id,
    }
  })

  // Pagos para Proyecto 4 (6 cuotas mensuales)
  const fechasProyecto4 = [
    new Date('2024-02-01'),
    new Date('2024-03-01'),
    new Date('2024-04-01'),
    new Date('2024-05-01'),
    new Date('2024-06-01'),
    new Date('2024-07-01')
  ]

  for (let i = 0; i < 6; i++) {
    const cuota = i + 1
    const fechaVenc = fechasProyecto4[i]
    const hoy = new Date()
    
    let estadoPago: 'PAGADO' | 'PENDIENTE' | 'VENCIDO' = 'PENDIENTE'
    let fechaPago: Date | undefined = undefined
    
    if (fechaVenc < hoy && cuota <= 2) {
      estadoPago = 'PAGADO'
      fechaPago = new Date(fechaVenc.getTime() - 2 * 24 * 60 * 60 * 1000) // 2 días antes
    } else if (fechaVenc < hoy) {
      estadoPago = 'VENCIDO'
    }

    await prisma.pago.create({
      data: {
        numeroCuota: cuota,
        montoCuota: 5833.33,
        fechaVencimiento: fechaVenc,
        fechaPagoReal: fechaPago,
        estadoPago,
        metodoPago: estadoPago === 'PAGADO' ? 'Transferencia Bancaria' : undefined,
        proyectoId: proyecto4.id,
        gestionadoPor: estadoPago === 'PAGADO' ? salesUser.id : undefined,
      }
    })
  }

  // Pagos para Proyecto 5 (3 cuotas - todos pendientes)
  await Promise.all([
    prisma.pago.create({
      data: {
        numeroCuota: 1,
        montoCuota: 9333.33,
        fechaVencimiento: new Date('2024-03-15'),
        estadoPago: 'PENDIENTE',
        proyectoId: proyecto5.id,
      }
    }),
    prisma.pago.create({
      data: {
        numeroCuota: 2,
        montoCuota: 9333.33,
        fechaVencimiento: new Date('2024-04-15'),
        estadoPago: 'PENDIENTE',
        proyectoId: proyecto5.id,
      }
    }),
    prisma.pago.create({
      data: {
        numeroCuota: 3,
        montoCuota: 9333.34,
        fechaVencimiento: new Date('2024-05-15'),
        estadoPago: 'PENDIENTE',
        proyectoId: proyecto5.id,
      }
    })
  ])

  console.log('✅ Seed completado exitosamente!')
  console.log(`📊 Datos creados:`)
  console.log(`   - Usuarios: ${await prisma.usuario.count()}`)
  console.log(`   - Clientes: ${await prisma.cliente.count()}`)
  console.log(`   - Proyectos: ${await prisma.proyecto.count()}`)
  console.log(`   - Pagos: ${await prisma.pago.count()}`)
}

main()
  .catch((e) => {
    console.error('❌ Error durante el seed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })