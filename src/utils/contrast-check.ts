/**
 * Проверка контрастности цветов для доступности (WCAG 2.1 AA)
 * Минимальный контраст: 4.5:1 для обычного текста, 3:1 для крупного
 */

// Текущие цвета из темы
const colors = {
  // Светлая тема
  light: {
    text: '#343a40',
    dimmed: '#5c5f66',
    blue6: '#1864ab',
    blue7: '#1971c2',
  },
  // Темная тема
  dark: {
    text: '#f8f9fa',
    dimmed: '#909296',
    blue4: '#748dbf',
    blue3: '#94a8cf',
  },
};

// Формула контрастности WCAG
function getLuminance(hex: string): number {
  const rgb = parseInt(hex.slice(1), 16);
  const r = ((rgb >> 16) & 0xff) / 255;
  const g = ((rgb >> 8) & 0xff) / 255;
  const b = (rgb & 0xff) / 255;

  const a = [r, g, b].map((v) => {
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });

  return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
}

function getContrastRatio(foreground: string, background: string): number {
  const lum1 = getLuminance(foreground);
  const lum2 = getLuminance(background);
  const brightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);
  return (brightest + 0.05) / (darkest + 0.05);
}

// Проверка всех комбинаций
console.log('=== ПРОВЕРКА КОНТРАСТНОСТИ ===\n');

// Светлая тема
console.log('Светлая тема:');
console.log(`  text/body: ${getContrastRatio(colors.light.text, '#ffffff').toFixed(2)}:1`);
console.log(`  dimmed/body: ${getContrastRatio(colors.light.dimmed, '#ffffff').toFixed(2)}:1`);
console.log(`  blue6/white: ${getContrastRatio(colors.light.blue6, '#ffffff').toFixed(2)}:1`);

// Темная тема
console.log('\nТемная тема:');
console.log(`  text/body: ${getContrastRatio(colors.dark.text, '#1f1f1f').toFixed(2)}:1`);
console.log(`  dimmed/body: ${getContrastRatio(colors.dark.dimmed, '#1f1f1f').toFixed(2)}:1`);
console.log(`  blue4/dark: ${getContrastRatio(colors.dark.blue4, '#1f1f1f').toFixed(2)}:1`);

// Рекомендации
console.log('\n=== РЕКОМЕНДАЦИИ ===');
console.log('✅ > 4.5:1 — Отлично (WCAG AA)');
console.log('⚠️  3.0-4.5:1 — Нормально (для крупного текста)');
console.log('❌ < 3.0:1 — Плохо (нужно улучшить');
