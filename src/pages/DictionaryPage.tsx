import { useState, useEffect } from 'react';
import { Title, Card, Stack, Group, SimpleGrid, Badge, Text, Loader, Center } from '@mantine/core';
import { IconBooks, IconDatabase, IconAlertCircle } from '@tabler/icons-react';
import axios from 'axios';
import { API_URL } from '../config/api';

interface DictionaryVersion {
  name: string;
  version: string;
  word_count: number;
}

export default function DictionaryPage() {
  const [data, setData] = useState<DictionaryVersion[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get(`${API_URL}/api/v1/dictionary_preview`)
      .then(res => {
        setData(res.data.dictionary_versions);
      })
      .catch(err => {
        console.error(err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const translateDictName = (name: string) => {
    switch(name) {
      case 'Orthographic': return 'Орфографический словарь';
      case 'Orthoepic': return 'Орфоэпический словарь';
      case 'Explanatory': return 'Толковый словарь';
      case 'ForeignWords': return 'Словарь иностранных слов';
      default: return name;
    }
  };

  if (loading) {
    return (
      <Center style={{ height: '50vh' }}>
        <Stack align="center" gap="md">
          <Loader size="xl" variant="bars" />
          <Text c="dimmed">Загрузка словарей...</Text>
        </Stack>
      </Center>
    );
  }

  return (
    <Stack gap="lg">
      <Group justify="space-between">
        <Stack gap={0}>
          <Title order={2}>Нормативные словари</Title>
          <Text c="dimmed">Источники данных для проверки соответствия государственным нормам</Text>
        </Stack>
      </Group>

      {data.length > 0 ? (
        <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="lg">
          {data.map((dict, i) => (
            <Card key={i} shadow="sm" p="lg" radius="md" withBorder>
              <Group justify="space-between" mb="xs">
                <IconBooks size={40} color="var(--mantine-color-blue-6)" />
                <Badge variant="light">{dict.version}</Badge>
              </Group>
              <Text fw={700} size="lg">{translateDictName(dict.name)}</Text>
              <Text size="sm" c="dimmed" mt="xs">
                Содержит базу нормативных лемм для проверки текста.
              </Text>
              <Group mt="xl" gap="xs">
                <IconDatabase size={16} color="gray" />
                <Text size="sm" fw={500}>{dict.word_count.toLocaleString()} слов</Text>
              </Group>
            </Card>
          ))}
        </SimpleGrid>
      ) : (
        <Center style={{ height: '30vh' }}>
          <Stack align="center" gap="xs">
            <IconAlertCircle size={48} color="gray" opacity={0.5} />
            <Text c="dimmed" fw={500}>Словари не найдены</Text>
            <Text size="sm" c="dimmed">Пожалуйста, проверьте подключение к базе данных или повторите импорт.</Text>
          </Stack>
        </Center>
      )}
    </Stack>
  );
}
