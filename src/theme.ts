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

// Улучшенная темная палитра для лучшей читаемости
const improvedDark: MantineColorsTuple = [
  '#d9d9d9', // 0: light gray
  '#b8b8b8', // 1: gray
  '#9b9b9b', // 2: medium gray
  '#7a7a7a', // 3: charcoal gray
  '#5c5c5c', // 4: dark charcoal
  '#4a4a4a', // 5: dark gray
  '#3a3a3a', // 6: darker gray
  '#2a2a2a', // 7: near black
  '#1f1f1f', // 8: deep black
  '#141414', // 9: pure black
];

export const theme: MantineThemeOverride = createTheme({
  primaryColor: 'blue',
  colors: {
    blue: customBlue,
    dark: improvedDark,
  },
  // Оптимальные тени для обеих тем
  primaryShade: { light: 7, dark: 4 },
  defaultRadius: 'lg',
  fontFamily: 'Inter, system-ui, sans-serif',
  headings: {
    fontFamily: 'Outfit, sans-serif',
    fontWeight: '700',
  },
  shadows: {
    md: '0 4px 12px rgba(0, 0, 0, 0.08)',
    lg: '0 8px 24px rgba(0, 0, 0, 0.12)',
    xl: '0 16px 48px rgba(0, 0, 0, 0.16)',
  },
  components: {
    Button: {
      defaultProps: {
        radius: 'md',
        fw: 600,
      },
      styles: {
        root: {
          transition: 'all 0.15s ease',
        },
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
          transition: 'transform 0.15s ease, box-shadow 0.15s ease',
          '&:hover': {
            transform: 'translateY(-2px)',
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
    Table: {
      defaultProps: {
        highlightOnHover: true,
        verticalSpacing: 'md',
      },
      styles: {
        thead: {
          backgroundColor: 'var(--mantine-color-default-hover)',
          fontWeight: 700,
        },
        row: {
          transition: 'background-color 0.1s ease',
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
