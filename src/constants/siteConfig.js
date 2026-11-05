export const CONTACT = {
  email: 'info@captaintraders.jp',
  phone: '+81-6-0000-0000',
  address: 'Osaka, Japan',
  hours: 'Mon–Fri 09:00–18:00 JST',
}

export const BANK_DETAILS = [
  { label: 'Bank Name', value: '' },
  { label: 'Branch Name', value: '' },
  { label: 'Bank Address', value: '' },
  { label: 'SWIFT Code', value: '' },
  { label: 'Account Name', value: '' },
  { label: 'Account Number', value: '' },
]

export const hasBankDetails = BANK_DETAILS.every((d) => d.value.trim() !== '')