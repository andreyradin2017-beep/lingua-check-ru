import { AppShell, Burger, Group, NavLink, Title, Text, Container, Stack } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { IconGlobe, IconFileText, IconBooks, IconHome, IconSearch, IconHistory, IconX } from '@tabler/icons-react';
import { HelmetProvider } from 'react-helmet-async';

// Импортируем страницы (создадим их следом)
import HomePage from './pages/HomePage';
import ScanPage from './pages/ScanPage';
import TextPage from './pages/TextPage';
import DictionaryPage from './pages/DictionaryPage';
import ExceptionsPage from './pages/ExceptionsPage';
import HistoryPage from './pages/HistoryPage';
import NotFoundPage from './pages/NotFoundPage';

export default function App() {
  const [opened, { toggle }] = useDisclosure();
  const [desktopOpened, { toggle: toggleDesktop }] = useDisclosure(true);
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { label: 'Главная', icon: <IconHome size="1rem" />, path: '/' },
    { label: 'История', icon: <IconHistory size="1rem" />, path: '/history' },
    { label: 'Сайты', icon: <IconGlobe size="1rem" />, path: '/scans' },
    { label: 'Текст и файлы', icon: <IconFileText size="1rem" />, path: '/text' },
    { label: 'Словари', icon: <IconBooks size="1rem" />, path: '/dictionaries' },
    { label: 'Исключения', icon: <IconX size="1rem" />, path: '/exceptions' },
  ];

  return (
    <HelmetProvider>
      <AppShell
        header={{ height: 60 }}
        navbar={{
          width: desktopOpened ? 300 : 80,
          breakpoint: 'sm',
          collapsed: { mobile: !opened },
        }}
        padding="md"
      >
      <AppShell.Header>
        <Group h="100%" px="md" justify="space-between">
          <Group>
            <Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" />
            <Burger opened={desktopOpened} onClick={toggleDesktop} visibleFrom="sm" size="sm" />
            <IconSearch color="var(--mantine-color-blue-6)" size={28} />
            <Title order={3} className="gradient-text">LinguaCheck RU</Title>
          </Group>
          <Text size="xs" c="dimmed" visibleFrom="xs">ФЗ №168‑ФЗ: Государственный язык РФ</Text>
        </Group>
      </AppShell.Header>

      <AppShell.Navbar p="md">
        <Stack gap="xs">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              aria-label={`Перейти на страницу ${item.label}`}
              label={desktopOpened ? item.label : null}
              leftSection={item.icon}
              active={location.pathname === item.path}
              onClick={() => {
                navigate(item.path);
                if (opened) toggle();
              }}
              variant="light"
              styles={{
                label: { fontSize: '1rem', fontWeight: 500 },
                root: { borderRadius: 'var(--mantine-radius-md)' }
              }}
            />
          ))}
        </Stack>
      </AppShell.Navbar>

      <AppShell.Main bg="gray.0">
        <Container size="xl" py="lg">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/scans" element={<ScanPage />} />
            <Route path="/history" element={<HistoryPage />} />
            <Route path="/text" element={<TextPage />} />
            <Route path="/dictionaries" element={<DictionaryPage />} />
            <Route path="/exceptions" element={<ExceptionsPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Container>
      </AppShell.Main>
      </AppShell>
    </HelmetProvider>
  );
}
