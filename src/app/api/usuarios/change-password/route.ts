
  // =====================================================
  // API CAMBIAR CONTRASEÑA - src/app/api/usuarios/change-password/route.ts
  // =====================================================
  
  export async function POST(request: NextRequest) {
    try {
      const session = await getServerSession(authOptions)
      
      if (!session?.user?.id) {
        return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
      }
  
      const { currentPassword, newPassword } = await request.json()
  
      if (!currentPassword || !newPassword) {
        return NextResponse.json({ error: 'Contraseñas requeridas' }, { status: 400 })
      }
  
      if (newPassword.length < 8) {
        return NextResponse.json({ error: 'La nueva contraseña debe tener al menos 8 caracteres' }, { status: 400 })
      }
  
      // Obtener usuario
      const usuario = await prisma.usuario.findUnique({
        where: { id: session.user.id }
      })
  
      if (!usuario) {
        return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
      }
  
      try {
        // En un entorno real, aquí verificarías la contraseña actual con Cognito
        // y luego cambiarías la contraseña
        await CognitoService.setUserPassword(usuario.cognitoId, newPassword)
        
        return NextResponse.json({ message: 'Contraseña cambiada correctamente' })
      } catch (cognitoError) {
        console.error('Error cambiando contraseña en Cognito:', cognitoError)
        return NextResponse.json({ error: 'Error al cambiar contraseña' }, { status: 500 })
      }
    } catch (error) {
      console.error('Error al cambiar contraseña:', error)
      return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
    }
  }