import { useState, useEffect } from 'react';
import { Title, Card, Stack, Group, SimpleGrid, Badge, Text } from '@mantine/core';
import { IconBooks, IconDatabase } from '@tabler/icons-react';
import axios from 'axios';

interface DictionaryVersion {
  name: string;
  version: string;
  word_count: number;
}

export default function DictionaryPage() {
  const [data, setData] = useState<DictionaryVersion[]>([]);

  useEffect(() => {
    axios.get('http://127.0.0.1:8000/api/v1/dictionary_preview')
      .then(res => setData(res.data.dictionary_versions))
      .catch(err => console.error(err));
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

  return (
    <Stack gap="lg">
      <Group justify="space-between">
        <Stack gap={0}>
          <Title order={2}>Нормативные словари</Title>
          <Text c="dimmed">Источники данных для проверки соответствия ( Phase 2 )</Text>
        </Stack>
      </Group>

      <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="lg">
        {data.length > 0 ? (
          data.map((dict, i) => (
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
          ))
        ) : (
          <Text c="dimmed">Словари еще не импортированы. Используйте python scripts/import_dictionaries.py</Text>
        )}
      </SimpleGrid>
    </Stack>
  );
}
