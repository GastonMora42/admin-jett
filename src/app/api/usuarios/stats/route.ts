
// =====================================================
// API ESTADÍSTICAS USUARIO - src/app/api/usuarios/stats/route.ts
// =====================================================

export async function GET() {
    try {
      const session = await getServerSession(authOptions)
      
      if (!session?.user?.id) {
        return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
      }
  
      const userId = session.user.id
  
      // Obtener estadísticas del usuario
      const [clientesCreados, proyectosCreados, pagosGestionados] = await Promise.all([
        prisma.cliente.count({
          where: { creadoPor: userId }
        }),
        prisma.proyecto.count({
          where: { creadoPor: userId }
        }),
        prisma.pago.count({
          where: { gestionadoPor: userId }
        })
      ])
  
      // Obtener usuario para fecha de último acceso
      const usuario = await prisma.usuario.findUnique({
        where: { id: userId },
        select: { fechaLogin: true }
      })
  
      const stats = {
        clientesCreados,
        proyectosCreados,
        pagosGestionados,
        ultimoAcceso: usuario?.fechaLogin?.toISOString() || new Date().toISOString(),
        sesionesActivas: 1, // Simplificado - en producción podrías usar Redis
      }
  
      return NextResponse.json(stats)
    } catch (error) {
      console.error('Error al obtener estadísticas:', error)
      return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
    }
  }
  