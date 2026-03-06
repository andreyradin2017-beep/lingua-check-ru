import { AppShell, Burger, Group, NavLink, Title, Text, Container } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { IconGlobe, IconFileText, IconBooks, IconHome, IconSearch } from '@tabler/icons-react';

// Импортируем страницы (создадим их следом)
import HomePage from './pages/HomePage';
import ScanPage from './pages/ScanPage';
import TextPage from './pages/TextPage';
import DictionaryPage from './pages/DictionaryPage';
import HistoryPage from './pages/HistoryPage';
import NotFoundPage from './pages/NotFoundPage';

export default function App() {
  const [opened, { toggle }] = useDisclosure();
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { label: 'Главная', icon: <IconHome size="1rem" />, path: '/' },
    { label: 'Сайты', icon: <IconGlobe size="1rem" />, path: '/scans' },
    { label: 'История', icon: <IconHome size="1rem" />, path: '/history' },
    { label: 'Текст и файлы', icon: <IconFileText size="1rem" />, path: '/text' },
    { label: 'Словари', icon: <IconBooks size="1rem" />, path: '/dictionaries' },
  ];

  return (
    <AppShell
      header={{ height: 60 }}
      navbar={{
        width: 300,
        breakpoint: 'sm',
        collapsed: { mobile: !opened },
      }}
      padding="md"
    >
      <AppShell.Header>
        <Group h="100%" px="md">
          <Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" />
          <IconSearch color="var(--mantine-color-blue-6)" size={28} />
          <Title order={3} className="gradient-text">LinguaCheck RU</Title>
          <Text size="xs" c="dimmed" ml="auto">ФЗ №168‑ФЗ</Text>
        </Group>
      </AppShell.Header>

      <AppShell.Navbar p="md">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            label={item.label}
            leftSection={item.icon}
            active={location.pathname === item.path}
            onClick={() => {
              navigate(item.path);
              if (opened) toggle();
            }}
            variant="light"
            styles={{
              label: { fontSize: '1rem', fontWeight: 500 }
            }}
          />
        ))}
      </AppShell.Navbar>

      <AppShell.Main bg="gray.0">
        <Container size="xl" py="lg">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/scans" element={<ScanPage />} />
            <Route path="/history" element={<HistoryPage />} />
            <Route path="/text" element={<TextPage />} />
            <Route path="/dictionaries" element={<DictionaryPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Container>
      </AppShell.Main>
    </AppShell>
  );
}
