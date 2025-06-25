// =====================================================
// SISTEMA DE VALIDACIONES - src/lib/validations.ts
// =====================================================

export interface ValidationResult {
    isValid: boolean
    errors: Record<string, string>
    warnings?: Record<string, string>
  }
  
  export interface ValidationRule {
    required?: boolean
    minLength?: number
    maxLength?: number
    pattern?: RegExp
    custom?: (value: any) => string | null
    email?: boolean
    phone?: boolean
    url?: boolean
    min?: number
    max?: number
    integer?: boolean
    positive?: boolean
  }
  
  export class Validator {
    private rules: Record<string, ValidationRule> = {}
    private data: Record<string, any> = {}
  
    constructor(data: Record<string, any>) {
      this.data = data
    }
  
    field(name: string, rules: ValidationRule): Validator {
      this.rules[name] = rules
      return this
    }
  
    validate(): ValidationResult {
      const errors: Record<string, string> = {}
      const warnings: Record<string, string> = {}
  
      for (const [fieldName, rules] of Object.entries(this.rules)) {
        const value = this.data[fieldName]
        const error = this.validateField(value, rules, fieldName)
        
        if (error) {
          errors[fieldName] = error
        }
      }
  
      return {
        isValid: Object.keys(errors).length === 0,
        errors,
        warnings
      }
    }
  
    private validateField(value: any, rules: ValidationRule, fieldName: string): string | null {
      // Required validation
      if (rules.required && (value === undefined || value === null || value === '')) {
        return `${this.getFieldLabel(fieldName)} es requerido`
      }
  
      // Si el campo está vacío y no es requerido, no validar otras reglas
      if (!value && !rules.required) {
        return null
      }
  
      // String validations
      if (typeof value === 'string') {
        if (rules.minLength && value.length < rules.minLength) {
          return `${this.getFieldLabel(fieldName)} debe tener al menos ${rules.minLength} caracteres`
        }
  
        if (rules.maxLength && value.length > rules.maxLength) {
          return `${this.getFieldLabel(fieldName)} no puede tener más de ${rules.maxLength} caracteres`
        }
  
        if (rules.pattern && !rules.pattern.test(value)) {
          return `${this.getFieldLabel(fieldName)} tiene un formato inválido`
        }
  
        if (rules.email && !this.isValidEmail(value)) {
          return `${this.getFieldLabel(fieldName)} debe ser un email válido`
        }
  
        if (rules.phone && !this.isValidPhone(value)) {
          return `${this.getFieldLabel(fieldName)} debe ser un teléfono válido`
        }
  
        if (rules.url && !this.isValidUrl(value)) {
          return `${this.getFieldLabel(fieldName)} debe ser una URL válida`
        }
      }
  
      // Number validations
      if (typeof value === 'number' || (typeof value === 'string' && !isNaN(Number(value)))) {
        const numValue = typeof value === 'number' ? value : Number(value)
  
        if (rules.min !== undefined && numValue < rules.min) {
          return `${this.getFieldLabel(fieldName)} debe ser mayor o igual a ${rules.min}`
        }
  
        if (rules.max !== undefined && numValue > rules.max) {
          return `${this.getFieldLabel(fieldName)} debe ser menor o igual a ${rules.max}`
        }
  
        if (rules.integer && !Number.isInteger(numValue)) {
          return `${this.getFieldLabel(fieldName)} debe ser un número entero`
        }
  
        if (rules.positive && numValue <= 0) {
          return `${this.getFieldLabel(fieldName)} debe ser un número positivo`
        }
      }
  
      // Custom validation
      if (rules.custom) {
        const customError = rules.custom(value)
        if (customError) {
          return customError
        }
      }
  
      return null
    }
  
    private getFieldLabel(fieldName: string): string {
      const labels: Record<string, string> = {
        nombre: 'Nombre',
        apellido: 'Apellido',
        email: 'Email',
        telefono: 'Teléfono',
        password: 'Contraseña',
        confirmPassword: 'Confirmación de contraseña',
        empresa: 'Empresa',
        montoTotal: 'Monto total',
        fechaInicio: 'Fecha de inicio',
        fechaEntrega: 'Fecha de entrega',
        cuotas: 'Número de cuotas'
      }
      return labels[fieldName] || fieldName
    }
  
    private isValidEmail(email: string): boolean {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      return emailRegex.test(email)
    }
  
    private isValidPhone(phone: string): boolean {
      const phoneRegex = /^[\+]?[\d\s\-\(\)]{8,}$/
      return phoneRegex.test(phone)
    }
  
    private isValidUrl(url: string): boolean {
      try {
        new URL(url)
        return true
      } catch {
        return false
      }
    }
  }
  
  // Validaciones específicas para el sistema
  export const validateClientData = (data: any): ValidationResult => {
    return new Validator(data)
      .field('nombre', { required: true, minLength: 2, maxLength: 100 })
      .field('apellido', { required: true, minLength: 2, maxLength: 100 })
      .field('email', { required: true, email: true })
      .field('telefono', { phone: true })
      .field('empresa', { maxLength: 200 })
      .validate()
  }
  
  export const validateProjectData = (data: any): ValidationResult => {
    return new Validator(data)
      .field('nombre', { required: true, minLength: 3, maxLength: 200 })
      .field('montoTotal', { required: true, positive: true, min: 1 })
      .field('clienteId', { required: true })
      .field('fechaInicio', { required: true })
      .field('cuotas', { 
        integer: true, 
        min: 1, 
        max: 60,
        custom: (value) => {
          if (data.formaPago === 'MENSUAL' && (!value || value < 1)) {
            return 'El número de cuotas es requerido para pago mensual'
          }
          return null
        }
      })
      .validate()
  }
  
  export const validateUserData = (data: any, isEdit: boolean = false): ValidationResult => {
    const validator = new Validator(data)
      .field('nombre', { required: true, minLength: 2, maxLength: 50 })
      .field('apellido', { required: true, minLength: 2, maxLength: 50 })
      .field('email', { required: true, email: true })
      .field('rol', { 
        required: true,
        custom: (value) => {
          if (!['SUPERADMIN', 'ADMIN', 'VENTAS'].includes(value)) {
            return 'Rol inválido'
          }
          return null
        }
      })
  
    if (!isEdit) {
      validator.field('password', { 
        required: true, 
        minLength: 8,
        custom: (value) => {
          if (!/(?=.*[a-z])/.test(value)) {
            return 'La contraseña debe contener al menos una letra minúscula'
          }
          if (!/(?=.*[A-Z])/.test(value)) {
            return 'La contraseña debe contener al menos una letra mayúscula'
          }
          if (!/(?=.*\d)/.test(value)) {
            return 'La contraseña debe contener al menos un número'
          }
          return null
        }
      })
    }
  
    return validator.validate()
  }
  
  export const validatePaymentData = (data: any): ValidationResult => {
    return new Validator(data)
      .field('montoCuota', { required: true, positive: true })
      .field('fechaVencimiento', { required: true })
      .field('numeroCuota', { required: true, integer: true, min: 1 })
      .field('metodoPago', { maxLength: 100 })
      .validate()
  }
  
  export const validatePasswordChange = (data: any): ValidationResult => {
    const validator = new Validator(data)
      .field('currentPassword', { required: true })
      .field('newPassword', { 
        required: true, 
        minLength: 8,
        custom: (value) => {
          if (!/(?=.*[a-z])/.test(value)) {
            return 'La nueva contraseña debe contener al menos una letra minúscula'
          }
          if (!/(?=.*[A-Z])/.test(value)) {
            return 'La nueva contraseña debe contener al menos una letra mayúscula'
          }
          if (!/(?=.*\d)/.test(value)) {
            return 'La nueva contraseña debe contener al menos un número'
          }
          if (value === data.currentPassword) {
            return 'La nueva contraseña debe ser diferente a la actual'
          }
          return null
        }
      })
      .field('confirmPassword', {
        required: true,
        custom: (value) => {
          if (value !== data.newPassword) {
            return 'Las contraseñas no coinciden'
          }
          return null
        }
      })
  
    return validator.validate()
  }
  
  export const validateSettingsData = (data: any): ValidationResult => {
    return new Validator(data)
      .field('general.siteName', { required: true, minLength: 1, maxLength: 100 })
      .field('general.siteDescription', { maxLength: 500 })
      .field('email.smtpHost', { maxLength: 255 })
      .field('email.smtpPort', { integer: true, min: 1, max: 65535 })
      .field('email.fromEmail', { email: true })
      .field('security.sessionTimeout', { integer: true, min: 1, max: 168 })
      .field('security.passwordMinLength', { integer: true, min: 6, max: 128 })
      .field('security.maxLoginAttempts', { integer: true, min: 1, max: 10 })
      .validate()
  }
  
  // Utilidades adicionales
  export const sanitizeInput = (input: string): string => {
    return input
      .trim()
      .replace(/[<>\"'&]/g, '') // Remover caracteres peligrosos
      .slice(0, 1000) // Limitar longitud
  }
  
  export const formatCurrency = (amount: number, currency: string = 'ARS'): string => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: currency
    }).format(amount)
  }
  
  export const formatDate = (date: string | Date, format: string = 'DD/MM/YYYY'): string => {
    const d = new Date(date)
    
    if (format === 'DD/MM/YYYY') {
      return d.toLocaleDateString('es-AR')
    }
    
    if (format === 'YYYY-MM-DD') {
      return d.toISOString().split('T')[0]
    }
    
    return d.toLocaleDateString()
  }
  
  export const generatePassword = (length: number = 12): string => {
    const lowercase = 'abcdefghijklmnopqrstuvwxyz'
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
    const numbers = '0123456789'
    const symbols = '@#$%&*'
    
    const allChars = lowercase + uppercase + numbers + symbols
    let password = ''
    
    // Asegurar que tenga al menos un carácter de cada tipo
    password += lowercase[Math.floor(Math.random() * lowercase.length)]
    password += uppercase[Math.floor(Math.random() * uppercase.length)]
    password += numbers[Math.floor(Math.random() * numbers.length)]
    password += symbols[Math.floor(Math.random() * symbols.length)]
    
    // Completar el resto
    for (let i = password.length; i < length; i++) {
      password += allChars[Math.floor(Math.random() * allChars.length)]
    }
    
    // Mezclar caracteres
    return password.split('').sort(() => Math.random() - 0.5).join('')
  }
  
  export const validateFileUpload = (file: File, options: {
    maxSize?: number // en MB
    allowedTypes?: string[]
  } = {}): ValidationResult => {
    const errors: Record<string, string> = {}
    
    const maxSize = options.maxSize || 10 // 10MB por defecto
    const allowedTypes = options.allowedTypes || ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
    
    if (file.size > maxSize * 1024 * 1024) {
      errors.size = `El archivo no puede ser mayor a ${maxSize}MB`
    }
    
    if (!allowedTypes.includes(file.type)) {
      errors.type = `Tipo de archivo no permitido. Tipos permitidos: ${allowedTypes.join(', ')}`
    }
    
    return {
      isValid: Object.keys(errors).length === 0,
      errors
    }
  }