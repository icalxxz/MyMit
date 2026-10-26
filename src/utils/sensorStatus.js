const normalized = (status) => String(status || '').toUpperCase();
export function getStatusTone(status) {
  const value = normalized(status);
  if (value.includes('BAHAYA') || value.includes('DANGER') || value.includes('GEMPA') || value.includes('KRITIS')) return 'danger';
  if (value.includes('WARNING') || value.includes('SIAGA') || value.includes('WASPADA') || value.includes('PERINGATAN')) return 'watch';
  return 'safe';
}
export function getMasterStatus(status) {
  const tone = getStatusTone(status);
  const details = { safe: ['Sistem normal', 'Semua parameter sensor berada dalam rentang aman.'], watch: ['Perlu perhatian', 'Terjadi perubahan parameter. Tetap pantau kondisi sekitar.'], danger: ['Peringatan bahaya', 'Parameter kritis terdeteksi. Ikuti prosedur mitigasi yang berlaku.'] };
  const [label, description] = details[tone]; return { tone, label, description };
}
