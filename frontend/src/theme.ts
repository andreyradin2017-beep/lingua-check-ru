import { createTheme, type MantineColorsTuple } from '@mantine/core';

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

export const theme = createTheme({
  primaryColor: 'blue',
  colors: {
    blue: customBlue,
  },
  fontFamily: 'Inter, system-ui, sans-serif',
  headings: {
    fontFamily: 'Outfit, sans-serif',
  },
  components: {
    Button: {
      defaultProps: {
        radius: 'md',
      },
    },
    Card: {
      defaultProps: {
        radius: 'lg',
        withBorder: true,
      },
    },
  },
});
