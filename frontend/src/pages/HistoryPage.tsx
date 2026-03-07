import { useEffect, useState } from 'react';
import { Title, Stack, Table, Badge, Paper, Text, Button, Group, ActionIcon, Modal, Loader, Center, Tooltip } from '@mantine/core';
import { IconArrowRight, IconTrash, IconAlertTriangle, IconHistory } from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { notifications } from '@mantine/notifications';
import { useDisclosure } from '@mantine/hooks';

interface ScanHistoryItem {
  id: string;
  target_url: string;
  status: string;
  started_at: string;
}

export default function HistoryPage() {
  const [scans, setScans] = useState<ScanHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteConfirmOpened, { open: openDeleteConfirm, close: closeDeleteConfirm }] = useDisclosure(false);
  const [clearConfirmOpened, { open: openClearConfirm, close: closeClearConfirm }] = useDisclosure(false);
  const [selectedScanId, setSelectedScanId] = useState<string | null>(null);
  
  const navigate = useNavigate();

  const fetchHistory = async (showLoader = true) => {
    try {
      if (showLoader) setLoading(true);
      const res = await axios.get('http://127.0.0.1:8000/api/v1/scans');
      setScans(res.data);
    } catch (err) {
      console.error("Failed to load history", err);
    } finally {
      if (showLoader) setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
    const interval = setInterval(() => {
      fetchHistory(false);
    }, 10000);
    return () => clearInterval(interval);
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

  const handleDeleteClick = (id: string) => {
    setSelectedScanId(id);
    openDeleteConfirm();
  };

  const confirmDelete = async () => {
    if (!selectedScanId) return;
    try {
      setLoading(true);
      await axios.delete(`http://127.0.0.1:8000/api/v1/scan/${selectedScanId}`);
      setScans(prev => prev.filter(s => s.id !== selectedScanId));
      notifications.show({ title: 'Удалено', message: 'Отчет успешно удален', color: 'green' });
      closeDeleteConfirm();
    } catch (err) {
      console.error("Failed to delete scan", err);
      notifications.show({ title: 'Ошибка', message: 'Не удалось удалить отчет. Возможно, сканирование еще активно.', color: 'red' });
    } finally {
      setLoading(false);
      setSelectedScanId(null);
    }
  };

  const confirmClearHistory = async () => {
    try {
      setLoading(true);
      await axios.delete(`http://127.0.0.1:8000/api/v1/scans`);
      setScans([]);
      notifications.show({ title: 'Очищено', message: 'Вся история успешно удалена', color: 'green' });
      closeClearConfirm();
    } catch (err) {
      console.error("Failed to clear history", err);
      notifications.show({ title: 'Ошибка', message: 'Произошла ошибка при очистке истории', color: 'red' });
    } finally {
      setLoading(false);
    }
  };

  if (loading && scans.length === 0) {
    return (
      <Center style={{ height: '50vh' }}>
        <Stack align="center" gap="md">
          <Loader size="xl" variant="bars" />
          <Text c="dimmed">Загрузка истории...</Text>
        </Stack>
      </Center>
    );
  }

  return (
    <Stack gap="xl">
      <Group justify="space-between" align="flex-end">
        <Stack gap={0}>
          <Title order={2}>История проверок</Title>
          <Text c="dimmed">Список ранее запущенных сканирований</Text>
        </Stack>
        {scans.length > 0 && (
          <Button 
            variant="subtle" 
            color="red" 
            leftSection={<IconTrash size={16} />}
            onClick={openClearConfirm}
            loading={loading}
          >
            Очистить историю
          </Button>
        )}
      </Group>

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
                  <Group gap="xs">
                    <Tooltip label="Посмотреть отчет">
                      <ActionIcon
                        variant="light"
                        color="blue"
                        onClick={() => navigate(`/scans?id=${scan.id}`)}
                        title="Отчет"
                      >
                        <IconArrowRight size={16} />
                      </ActionIcon>
                    </Tooltip>
                    <Tooltip label="Удалить запись">
                      <ActionIcon 
                        variant="light" 
                        color="red" 
                        onClick={() => handleDeleteClick(scan.id)}
                        loading={loading && selectedScanId === scan.id}
                      >
                        <IconTrash size={16} />
                      </ActionIcon>
                    </Tooltip>
                  </Group>
                </Table.Td>
              </Table.Tr>
            )) : (
              <Table.Tr>
                <Table.Td colSpan={4} py="xl">
                  <Center style={{ height: '30vh' }}>
                    <Stack align="center" gap="xs">
                      <IconHistory size={48} color="gray" opacity={0.5} />
                      <Text c="dimmed" fw={500}>История пока пуста</Text>
                      <Text size="sm" c="dimmed">Вы еще не запускали ни одного сканирования.</Text>
                    </Stack>
                  </Center>
                </Table.Td>
              </Table.Tr>
            )}
          </Table.Tbody>
        </Table>
      </Paper>

      {/* Модалка удаления одного элемента */}
      <Modal 
        opened={deleteConfirmOpened} 
        onClose={closeDeleteConfirm} 
        title="Удаление отчета" 
        centered
      >
        <Stack>
          <Group gap="sm" wrap="nowrap">
            <IconAlertTriangle color="var(--mantine-color-orange-6)" size={32} />
            <Text>Вы уверены, что хотите удалить этот отчет? Это действие нельзя отменить.</Text>
          </Group>
          <Group justify="flex-end">
            <Button variant="subtle" onClick={closeDeleteConfirm}>Отмена</Button>
            <Button color="red" onClick={confirmDelete} loading={loading}>Удалить</Button>
          </Group>
        </Stack>
      </Modal>

      {/* Модалка очистки всей истории */}
      <Modal 
        opened={clearConfirmOpened} 
        onClose={closeClearConfirm} 
        title="Очистка истории" 
        centered
      >
        <Stack>
          <Group gap="sm" wrap="nowrap">
            <IconAlertTriangle color="var(--mantine-color-red-6)" size={32} />
            <Text>Вы уверены, что хотите полностью очистить историю? Все сохраненные отчеты будут безвозвратно удалены.</Text>
          </Group>
          <Group justify="flex-end">
            <Button variant="subtle" onClick={closeClearConfirm}>Отмена</Button>
            <Button color="red" onClick={confirmClearHistory} loading={loading}>Очистить всё</Button>
          </Group>
        </Stack>
      </Modal>
    </Stack>
  );
}
