import { useEffect, useState } from 'react';
import { Title, Stack, Table, Text, Button, Group, ActionIcon, Paper, TextInput, Card, Badge, Loader, Center } from '@mantine/core';
import { IconTrash, IconPlus, IconAlertCircle, IconCheck } from '@tabler/icons-react';
import axios from 'axios';
import { notifications } from '@mantine/notifications';
import { API_URL } from '../config/api';

interface GlobalException {
  id: string;
  word: string;
  created_at: string;
}

export default function ExceptionsPage() {
  const [exceptions, setExceptions] = useState<GlobalException[]>([]);
  const [loading, setLoading] = useState(true);
  const [newWord, setNewWord] = useState('');
  const [addLoading, setAddLoading] = useState(false);

  const fetchExceptions = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_URL}/api/v1/exceptions`);
      setExceptions(res.data);
    } catch (err) {
      console.error("Failed to load exceptions", err);
      notifications.show({ title: 'Ошибка', message: 'Не удалось загрузить исключения', color: 'red' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExceptions();
  }, []);

  const handleAdd = async () => {
    const word = newWord.trim().toLowerCase();
    if (!word) return;

    setAddLoading(true);
    try {
      const res = await axios.post(`${API_URL}/api/v1/exceptions`, { word });
      setExceptions([res.data, ...exceptions]);
      setNewWord('');
      notifications.show({ title: 'Добавлено', message: `Слово "${word}" добавлено в исключения`, color: 'green', icon: <IconCheck size={16} /> });
    } catch (err: any) {
      const msg = err.response?.data?.detail || 'Не удалось добавить исключение';
      notifications.show({ title: 'Ошибка', message: msg, color: 'red' });
    } finally {
      setAddLoading(false);
    }
  };

  const handleDelete = async (id: string, word: string) => {
    try {
      await axios.delete(`${API_URL}/api/v1/exceptions/${id}`);
      setExceptions(exceptions.filter(e => e.id !== id));
      notifications.show({ title: 'Удалено', message: `Слово "${word}" удалено из исключений`, color: 'blue' });
    } catch (err) {
      notifications.show({ title: 'Ошибка', message: 'Не удалось удалить исключение', color: 'red' });
    }
  };

  return (
    <Stack gap="xl">
      <Stack gap={0}>
        <Title order={2}>Глобальные исключения</Title>
        <Text c="dimmed">Слова из этого списка никогда не будут помечаться как нарушения (англицизмы или ошибки).</Text>
      </Stack>

      <Card withBorder padding="lg" radius="md">
        <Group align="flex-end">
          <TextInput
            label="Добавить новое слово"
            placeholder="Например: gmp"
            value={newWord}
            onChange={(e) => setNewWord(e.currentTarget.value)}
            style={{ flex: 1 }}
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          />
          <Button 
            leftSection={<IconPlus size={16} />} 
            onClick={handleAdd} 
            loading={addLoading}
            disabled={!newWord.trim()}
          >
            Добавить
          </Button>
        </Group>
      </Card>

      <Paper withBorder radius="md" p="md">
        {loading ? (
          <Center py="xl">
            <Loader variant="dots" />
          </Center>
        ) : exceptions.length > 0 ? (
          <Table highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Слово</Table.Th>
                <Table.Th>Дата добавления</Table.Th>
                <Table.Th style={{ width: 80 }}>Действие</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {exceptions.map((exc) => (
                <Table.Tr key={exc.id}>
                  <Table.Td>
                    <Badge variant="light" size="lg" color="blue">
                      {exc.word}
                    </Badge>
                  </Table.Td>
                  <Table.Td>
                    <Text size="sm">{new Date(exc.created_at).toLocaleString('ru-RU')}</Text>
                  </Table.Td>
                  <Table.Td>
                    <ActionIcon color="red" variant="subtle" onClick={() => handleDelete(exc.id, exc.word)}>
                      <IconTrash size={16} aria-hidden="true" />
                    </ActionIcon>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        ) : (
          <Center py="xl">
            <Stack align="center" gap="xs">
              <IconAlertCircle size={40} color="gray" opacity={0.5} />
              <Text c="dimmed">Список исключений пуст</Text>
            </Stack>
          </Center>
        )}
      </Paper>
    </Stack>
  );
}
