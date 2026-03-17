import { Title, Text, Button, Paper, Group, Grid, ThemeIcon, Stack, Box, Container, useMantineColorScheme } from '@mantine/core';
import { IconShieldCheck, IconFileSearch, IconScale, IconExternalLink, IconSparkles } from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';

export default function HomePage() {
  const navigate = useNavigate();
  const { colorScheme } = useMantineColorScheme();

  return (
    <>
      <Helmet>
        <title>LinguaCheck RU — Мониторинг чистоты государственного языка</title>
        <meta name="description" content="Автоматизированная проверка сайтов и документов на соответствие ФЗ №168-ФЗ о государственном языке РФ." />
      </Helmet>

      <Container size="xl" className="page-transition">
        <Stack gap={40}>
          {/* Enhanced Hero Section */}
          <Box
            py={80}
            style={{
              textAlign: 'center',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <Stack align="center" gap="md">
              <Group gap="xs" style={{ border: `1px solid ${colorScheme === 'dark' ? 'var(--mantine-color-dark-4)' : 'var(--mantine-color-gray-3)'}`, padding: '4px 12px', borderRadius: '100px', backgroundColor: colorScheme === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)' }}>
                <IconSparkles size={14} color="var(--mantine-color-blue-filled)" />
                <Text size="xs" fw={700} tt="uppercase" lts={1}>На базе ИИ и ФЗ №168</Text>
              </Group>

              <Title order={1} size="56px" fw={900} ta="center" style={{ lineHeight: 1.1, maxWidth: 900 }}>
                На страже <Text component="span" span inherit variant="gradient" gradient={{ from: 'blue.5', to: 'blue.8' }}>русского языка</Text> в цифровом пространстве
              </Title>
              
              <Text c="dimmed" size="xl" ta="center" maw={700} mt="sm">
                Автоматизированная система мониторинга чистоты государственного языка. Точный анализ, мгновенные отчеты и полное соответствие законодательству.
              </Text>
              
              <Group mt="xl" gap="lg">
                <Button size="xl" onClick={() => navigate('/scans')} rightSection={<IconExternalLink size={20} />}>
                  Начать проверку
                </Button>
                <Button size="xl" onClick={() => navigate('/text')} variant="outline">
                  Анализ текста
                </Button>
              </Group>
            </Stack>
          </Box>

          {/* Bento Grid Features */}
          <Grid gutter="xl">
            <Grid.Col span={{ base: 12, md: 8 }}>
              <Paper p="xl" h="100%">
                <Group align="flex-start" wrap="nowrap">
                  <ThemeIcon size={60} radius="md" variant="light" color="blue">
                    <IconScale size={32} />
                  </ThemeIcon>
                  <Stack gap="xs">
                    <Text fw={800} size="24px">Соблюдение ФЗ №168</Text>
                    <Text c="dimmed" size="md">
                      Наша система полностью опирается на требования Федерального закона «О государственном языке Российской Федерации», 
                      выявляя необоснованное использование иностранных слов и нарушение норм современного русского литературного языка.
                    </Text>
                  </Stack>
                </Group>
              </Paper>
            </Grid.Col>

            <Grid.Col span={{ base: 12, sm: 6, md: 4 }}>
              <Paper p="xl" h="100%">
                <Stack gap="md">
                  <ThemeIcon size={50} radius="md" variant="light" color="teal">
                    <IconShieldCheck size={28} />
                  </ThemeIcon>
                  <Text fw={700} size="xl">Сканирование сайтов</Text>
                  <Text c="dimmed" size="sm">
                    Глубокий технический аудит веб-ресурсов на наличие заимствований без перевода.
                  </Text>
                </Stack>
              </Paper>
            </Grid.Col>

            <Grid.Col span={{ base: 12, sm: 6, md: 4 }}>
              <Paper p="xl" h="100%">
                <Stack gap="md">
                  <ThemeIcon size={50} radius="md" variant="light" color="indigo">
                    <IconFileSearch size={28} />
                  </ThemeIcon>
                  <Text fw={700} size="xl">Анализ файлов</Text>
                  <Text c="dimmed" size="sm">
                    Поддержка DOCX и TXT для быстрой корпоративной проверки документации.
                  </Text>
                </Stack>
              </Paper>
            </Grid.Col>

            <Grid.Col span={{ base: 12, md: 8 }}>
              <Paper p="xl" h="100%">
                 <Group justify="space-between" wrap="wrap" gap="md">
                    <Stack gap="xs">
                      <Text fw={700} size="xl">История и отчетность</Text>
                      <Text c="dimmed" size="sm">Отслеживайте динамику изменений и сохраняйте отчеты в один клик.</Text>
                    </Stack>
                    <Button variant="subtle" onClick={() => navigate('/history')}>Перейти в историю</Button>
                 </Group>
              </Paper>
            </Grid.Col>
          </Grid>
        </Stack>
      </Container>
    </>
  );
}
