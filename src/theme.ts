import { createTheme, type MantineColorsTuple, type MantineThemeOverride } from '@mantine/core';

// Акцентный синий цвет, строгий и "государственный"
const customBlue: MantineColorsTuple = [
  '#eef3ff',
  '#dce4f5',
  '#b9c7e2',
  '#94a8cf',
  '#748dbf',
  '#5f7cb7',
  '#5474b4',
  '#44639f',
  '#39588f',
  '#2d4b81'
];

export const theme: MantineThemeOverride = createTheme({
  primaryColor: 'blue',
  colors: {
    blue: customBlue,
    // Кастомная глубокая темная палитра для премиального вида
    dark: [
      '#C1C2C5', // 0: silver
      '#A6A7AB', // 1: stone
      '#909296', // 2: gray
      '#5C5F66', // 3: charcoal
      '#373A40', // 4: soot
      '#2C2E33', // 5: lead
      '#25262B', // 6: obsidian
      '#1A1B1E', // 7: midnight
      '#141517', // 8: deep black
      '#101113', // 9: void
    ],
  },
  // Улучшенная настройка теней и оттенков
  primaryShade: { light: 7, dark: 4 },
  defaultRadius: 'lg', // Более мягкие углы для премиальности
  fontFamily: 'Inter, system-ui, sans-serif',
  headings: {
    fontFamily: 'Outfit, sans-serif',
    fontWeight: '700',
  },
  shadows: {
    md: '0 4px 12px rgba(0, 0, 0, 0.05)',
    lg: '0 8px 24px rgba(0, 0, 0, 0.08)',
    xl: '0 16px 48px rgba(0, 0, 0, 0.12)',
  },
  components: {
    Button: {
      defaultProps: {
        radius: 'md',
        fw: 600,
      },
    },
    Card: {
      defaultProps: {
        radius: 'lg',
        withBorder: true,
        shadow: 'sm',
      },
      styles: {
        root: {
          backgroundColor: 'var(--mantine-color-body)',
          transition: 'transform 0.2s ease, box-shadow 0.2s ease',
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: 'var(--mantine-shadow-md)',
          },
        },
      },
    },
    Paper: {
      defaultProps: {
        radius: 'lg',
        withBorder: true,
      },
      styles: {
        root: {
          backgroundColor: 'var(--mantine-color-body)',
        },
      },
    },
    AppShell: {
      styles: {
        main: {
          backgroundColor: 'var(--mantine-color-body)',
        },
        navbar: {
          backgroundColor: 'var(--mantine-color-body)',
          borderRight: '1px solid var(--mantine-color-default-border)',
        },
        header: {
          backgroundColor: 'var(--mantine-color-body)',
          backdropFilter: 'blur(10px)',
          borderBottom: '1px solid var(--mantine-color-default-border)',
        },
      },
    },
  },
});
