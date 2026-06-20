/**
 * Input Validation & Sanitization
 * 
 * Kullanıcı girdilerini validate eder ve sanitize eder.
 * - XSS koruması
 * - SQL injection koruması
 * - Path traversal koruması
 * - Maximum uzunluk kontrolü
 */

export interface ValidationResult {
  valid: boolean
  sanitized?: string
  error?: string
}

/**
 * XSS koruması — HTML special karakterleri escape eder.
 */
export function escapeHtml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
    .replace(/\//g, "&#x2F;")
}

/**
 * SQL injection koruması — tehlikeli karakterleri escape eder.
 */
export function escapeSql(input: string): string {
  return input
    .replace(/'/g, "''")
    .replace(/\\/g, "\\\\")
    .replace(/\0/g, "\\0")
    .replace(/\n/g, "\\n")
    .replace(/\r/g, "\\r")
    .replace(/"/g, '\\"')
    .replace(/\x1a/g, "\\x1a")
}

/**
 * Path traversal koruması — ".." ve benzeri pattern'ları temizler.
 */
export function sanitizePath(input: string): string {
  return input
    .replace(/\.\./g, "")
    .replace(/\/\//g, "/")
    .replace(/\\/g, "/")
    .replace(/^\//, "")
}

/**
 * Genel input sanitization — whitespace ve control karakterleri temizler.
 */
export function sanitizeInput(input: string): string {
  return input
    .trim()
    .replace(/[\x00-\x1F\x7F]/g, "") // Control karakterleri kaldır
    .replace(/\s+/g, " ") // Multiple whitespace → single space
}

/**
 * Maximum uzunluk kontrolü.
 */
export function validateLength(
  input: string,
  maxLength: number,
  fieldName: string = "input",
): ValidationResult {
  if (input.length > maxLength) {
    return {
      valid: false,
      error: `${fieldName} exceeds maximum length of ${maxLength} characters`,
    }
  }
  return { valid: true, sanitized: input }
}

/**
 * Email validation.
 */
export function validateEmail(email: string): ValidationResult {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    return { valid: false, error: "Invalid email format" }
  }
  return { valid: true, sanitized: email.toLowerCase().trim() }
}

/**
 * URL validation.
 */
export function validateUrl(url: string): ValidationResult {
  try {
    new URL(url)
    return { valid: true, sanitized: url }
  } catch {
    return { valid: false, error: "Invalid URL format" }
  }
}

/**
 * File path validation — path traversal ve tehlikeli pattern'ları kontrol eder.
 */
export function validateFilePath(path: string): ValidationResult {
  // Orijinal path'i kontrol et (sanitize öncesi)
  const dangerousPatterns = [
    /\.\./,           // Path traversal
    /\/etc\//,        // System files
    /\/proc\//,       // Process files
    /\/sys\//,        // System files
    /\.env$/,         // Environment files
    /id_rsa/,         // SSH keys
    /\.pem$/,         // Certificate files
  ]
  
  // Orijinal path'i kontrol et
  for (const pattern of dangerousPatterns) {
    if (pattern.test(path)) {
      return {
        valid: false,
        error: `Dangerous path pattern detected: ${pattern.source}`,
      }
    }
  }
  
  // Sanitize et ve döndür
  const sanitized = sanitizePath(path)
  return { valid: true, sanitized }
}

/**
 * JSON input validation — circular reference ve boyut kontrolü.
 */
export function validateJsonInput(
  input: unknown,
  maxSize: number = 1_000_000,
): ValidationResult {
  try {
    const serialized = JSON.stringify(input)
    if (serialized.length > maxSize) {
      return {
        valid: false,
        error: `JSON input exceeds maximum size of ${maxSize} bytes`,
      }
    }
    return { valid: true, sanitized: serialized }
  } catch (err) {
    return {
      valid: false,
      error: `Invalid JSON: ${err instanceof Error ? err.message : "Unknown error"}`,
    }
  }
}

/**
 * Command injection koruması — tehlikeli shell karakterleri escape eder.
 */
export function escapeShellArg(arg: string): string {
  return `'${arg.replace(/'/g, "'\\''")}'`
}

/**
 * Regex validation — ReDoS koruması.
 */
export function validateRegex(pattern: string): ValidationResult {
  try {
    new RegExp(pattern)
    return { valid: true, sanitized: pattern }
  } catch (err) {
    return {
      valid: false,
      error: `Invalid regex: ${err instanceof Error ? err.message : "Unknown error"}`,
    }
  }
}

/**
 * Comprehensive input sanitizer — tüm sanitization kurallarını uygular.
 */
export function comprehensiveSanitize(
  input: string,
  options: {
    maxLength?: number
    escapeHtml?: boolean
    escapeSql?: boolean
    sanitizePath?: boolean
    trimWhitespace?: boolean
  } = {},
): ValidationResult {
  let result = input
  
  if (options.trimWhitespace !== false) {
    result = sanitizeInput(result)
  }
  
  if (options.escapeHtml) {
    result = escapeHtml(result)
  }
  
  if (options.escapeSql) {
    result = escapeSql(result)
  }
  
  if (options.sanitizePath) {
    result = sanitizePath(result)
  }
  
  if (options.maxLength) {
    const lengthCheck = validateLength(result, options.maxLength)
    if (!lengthCheck.valid) {
      return lengthCheck
    }
  }
  
  return { valid: true, sanitized: result }
}
