import { useEffect, useState } from 'react';
import { Title, Stack, Table, Badge, Paper, Text, Button } from '@mantine/core';
import { IconArrowRight } from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

interface ScanHistoryItem {
  id: string;
  target_url: string;
  status: string;
  started_at: string;
}

export default function HistoryPage() {
  const [scans, setScans] = useState<ScanHistoryItem[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await axios.get('http://127.0.0.1:8000/api/v1/scans');
        setScans(res.data);
      } catch (err) {
        console.error("Failed to load history", err);
      }
    };
    fetchHistory();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'green';
      case 'in_progress':
      case 'started': return 'blue';
      case 'failed': return 'red';
      default: return 'gray';
    }
  };

  const translateStatus = (status: string) => {
    switch (status) {
      case 'completed': return 'Завершено';
      case 'in_progress': return 'В процессе';
      case 'started': return 'Запущено';
      case 'failed': return 'Ошибка';
      default: return status;
    }
  };

  return (
    <Stack gap="xl">
      <Stack gap={0}>
        <Title order={2}>История проверок</Title>
        <Text c="dimmed">Список ранее запущенных сканирований</Text>
      </Stack>

      <Paper withBorder radius="md">
        <Table highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Дата</Table.Th>
              <Table.Th>Сайт</Table.Th>
              <Table.Th>Статус</Table.Th>
              <Table.Th>Действие</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {scans.length > 0 ? scans.map((scan) => (
              <Table.Tr key={scan.id}>
                <Table.Td>
                  {new Date(scan.started_at).toLocaleString('ru-RU')}
                </Table.Td>
                <Table.Td fw={500}>{scan.target_url}</Table.Td>
                <Table.Td>
                  <Badge color={getStatusColor(scan.status)}>
                    {translateStatus(scan.status)}
                  </Badge>
                </Table.Td>
                <Table.Td>
                  <Button
                    variant="light"
                    size="xs"
                    rightSection={<IconArrowRight size={14} />}
                    onClick={() => navigate(`/scans?id=${scan.id}`)}
                  >
                    Отчет
                  </Button>
                </Table.Td>
              </Table.Tr>
            )) : (
              <Table.Tr>
                <Table.Td colSpan={4} style={{ textAlign: 'center' }} py="xl">
                  <Text c="dimmed">История пока пуста</Text>
                </Table.Td>
              </Table.Tr>
            )}
          </Table.Tbody>
        </Table>
      </Paper>
    </Stack>
  );
}
