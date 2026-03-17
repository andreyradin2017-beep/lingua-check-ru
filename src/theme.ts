import { createTheme, type MantineColorsTuple, type MantineThemeOverride } from '@mantine/core';

// Акцентный синий цвет (более сочный и яркий)
const customBlue: MantineColorsTuple = [
  '#e6f2ff',
  '#cce3ff',
  '#99c7ff',
  '#66abff',
  '#3d93ff',
  '#1f7eff',
  '#0066ff',
  '#0057e6',
  '#0048cc',
  '#0038b3'
];

// Dark palette в стиле современного SaaS — очень глубокий сине-черный фон, белый текст
const premiumDark: MantineColorsTuple = [
  '#f8f9fa', // 0: текст (самый светлый — высокий контраст)
  '#e9ecef', // 1: текст dimmed lite
  '#ced4da', // 2: placeholder, подписи
  '#868e96', // 3: border subtle
  '#4a5056', // 4: border / divider
  '#2a2f36', // 5: surface elevated (tooltip, menu)
  '#21252b', // 6: card / paper surface
  '#181b21', // 7: section background
  '#121418', // 8: main body background
  '#0b0c0f', // 9: deepest background
];

export const theme: MantineThemeOverride = createTheme({
  primaryColor: 'blue',
  colors: {
    blue: customBlue,
    dark: premiumDark,
  },
  primaryShade: { light: 6, dark: 5 },
  defaultRadius: 'lg',
  fontFamily: 'Inter, system-ui, sans-serif',
  headings: {
    fontFamily: 'Outfit, sans-serif',
    fontWeight: '700',
  },
  shadows: {
    sm: '0 1px 3px rgba(0, 0, 0, 0.12)',
    md: '0 4px 12px rgba(0, 0, 0, 0.15)',
    lg: '0 8px 24px rgba(0, 0, 0, 0.2)',
    xl: '0 16px 48px rgba(0, 0, 0, 0.25)',
  },
  components: {
    Button: {
      defaultProps: {
        radius: 'md',
        fw: 600,
      },
      styles: {
        root: {
          transition: 'transform 0.15s ease, box-shadow 0.15s ease, background-color 0.15s ease',
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
        shadow: 'sm',
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
    Badge: {
      styles: {
        root: {
          fontWeight: 600,
        },
      },
    },
    Tooltip: {
      defaultProps: {
        withArrow: true,
        openDelay: 400,
        transitionProps: { transition: 'pop', duration: 150 },
      },
      styles: {
        tooltip: {
          fontSize: '13px',
        },
      },
    },
  },
});
