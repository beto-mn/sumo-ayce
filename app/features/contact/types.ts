// app/features/contact/types.ts

/** Client-side projection of BranchPublicRow for the contact form. */
export interface ContactBranch {
  id: string
  name: string
  phone: string
}

/** Ephemeral reactive form state — never persisted. */
export interface ContactFormState {
  name: string
  branchId: string
  message: string
}

/** Static contact config sourced from i18n locale files. */
export interface WaLinkConfig {
  email: string
  socialInstagram: string
  socialFacebook: string
  socialTiktok: string
}
