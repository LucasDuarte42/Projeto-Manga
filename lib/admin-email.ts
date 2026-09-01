export function isAdminEmail(email?: string | null) {
  const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase()
  const normalizedEmail = email?.trim().toLowerCase()
  return Boolean(adminEmail && normalizedEmail && normalizedEmail === adminEmail)
}
