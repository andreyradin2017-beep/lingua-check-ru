import { Title, Text, Button, Paper, Group, SimpleGrid, ThemeIcon, Stack } from '@mantine/core';
import { IconShieldCheck, IconFileSearch, IconScale } from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';

export default function HomePage() {
  const navigate = useNavigate();

  const features = [
    {
      title: 'Соблюдение ФЗ №168',
      desc: 'Автоматическая проверка корректности использования русского языка как государственного.',
      icon: <IconScale />,
      color: 'blue'
    },
    {
      title: 'Сканирование сайтов',
      desc: 'Глубокий анализ URL на наличие иностранных слов без кириллического сопровождения.',
      icon: <IconShieldCheck />,
      color: 'teal'
    },
    {
      title: 'Анализ файлов',
      desc: 'Загрузка документов TXT, DOCX, PDF для проверки на соответствие нормам.',
      icon: <IconFileSearch />,
      color: 'indigo'
    }
  ];

  return (
    <>
      <Helmet>
        <title>LinguaCheck RU — Мониторинг чистоты государственного языка</title>
        <meta name="description" content="Автоматизированная проверка сайтов и документов на соответствие ФЗ №168-ФЗ о государственном языке РФ." />
      </Helmet>
      <Stack gap="xl">
      {/* FIX #5: Адаптивный padding для мобильных */}
      <Paper p={{ base: 24, sm: 50 }} radius="lg" withBorder bg="white">
        <Stack align="center" gap="md">
          <Title order={1} size={42} fw={900} ta="center">
            На страже <Text component="span" span inherit className="gradient-text">русского языка</Text> в публичном пространстве
          </Title>
          <Text c="dimmed" size="lg" ta="center" maw={600}>
            Система автоматического мониторинга соответствия контента требованиям Федерального закона о государственном языке.
          </Text>
          <Group mt="xl">
            <Button size="lg" onClick={() => navigate('/scans')} variant="filled">Проверить сайт</Button>
            <Button size="lg" onClick={() => navigate('/text')} variant="outline">Загрузить файл</Button>
          </Group>
        </Stack>
      </Paper>

      <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="lg">
        {features.map((f, i) => (
          <Paper key={i} p="xl" radius="md" withBorder>
            <ThemeIcon size={50} radius="md" variant="light" color={f.color}>
              {f.icon}
            </ThemeIcon>
            <Text fw={700} size="xl" mt="md">{f.title}</Text>
            <Text c="dimmed" size="sm" mt="sm">{f.desc}</Text>
          </Paper>
        ))}
      </SimpleGrid>
    </Stack>
    </>
  );
}
