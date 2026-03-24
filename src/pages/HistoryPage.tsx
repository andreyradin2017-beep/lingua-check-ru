import { useEffect, useState, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import { Title, Stack, Table, Badge, Paper, Text, Button, Group, ActionIcon, Modal, Tooltip, Pagination, Skeleton, Box } from '@mantine/core';
import { IconTrash, IconHistory, IconFileAnalytics, IconPlayerStop, IconSearch, IconAdjustmentsHorizontal, IconAlertTriangle, IconPlayerPlay } from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import apiClient from '../api/client';
import { notifications } from '@mantine/notifications';
import { useDisclosure } from '@mantine/hooks';
import { translateScanStatus, getScanStatusColor } from '../utils/translations';
import { EmptyState } from '../components/EmptyState';

interface ScanHistoryItem {
  id: string;
  target_url: string | null;
  status: string;
  started_at: string;
}

export default function HistoryPage() {
  const [scans, setScans] = useState<ScanHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activePage, setPage] = useState(1);
  const ITEMS_PER_PAGE = 8;
  const [deleteConfirmOpened, { open: openDeleteConfirm, close: closeDeleteConfirm }] = useDisclosure(false);
  const [clearConfirmOpened, { open: openClearConfirm, close: closeClearConfirm }] = useDisclosure(false);
  const [selectedScanId, setSelectedScanId] = useState<string | null>(null);

  const navigate = useNavigate();

  const fetchHistory = useCallback(async (showLoader = true) => {
    try {
      if (showLoader) setLoading(true);
      setError(null);
      const res = await apiClient.get('/api/v1/scans');
      setScans(res.data || []);
    } catch (err) {
      console.error("Failed to load history", err);
      setError(
        axios.isAxiosError(err)
          ? err.response?.data?.detail || 'Не удалось загрузить историю'
          : 'Ошибка подключения к серверу'
      );
      notifications.show({
        title: 'Ошибка',
        message: 'Не удалось загрузить историю сканирований',
        color: 'red'
      });
    } finally {
      if (showLoader) setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHistory();
    const interval = setInterval(() => {
      fetchHistory(false);
    }, 15000);
    return () => clearInterval(interval);
  }, [fetchHistory]);

  useEffect(() => {
    const maxPage = Math.ceil(scans.length / ITEMS_PER_PAGE);
    if (activePage > maxPage && maxPage > 0) {
      setPage(maxPage);
    }
  }, [scans.length, activePage]);

  const paginatedScans = scans.slice(
    (activePage - 1) * ITEMS_PER_PAGE,
    activePage * ITEMS_PER_PAGE
  );

  const handleDeleteClick = (id: string) => {
    setSelectedScanId(id);
    openDeleteConfirm();
  };

  const confirmDelete = async () => {
    if (!selectedScanId) return;
    try {
      setLoading(true);
      await apiClient.delete(`/api/v1/scan/${selectedScanId}`);
      setScans(prev => prev.filter(s => s.id !== selectedScanId));
      notifications.show({ title: 'Удалено', message: 'Отчет успешно удален', color: 'green' });
      closeDeleteConfirm();
    } catch (err) {
      console.error("Failed to delete scan", err);
      notifications.show({ title: 'Ошибка', message: 'Не удалось удалить отчет', color: 'red' });
    } finally {
      setLoading(false);
      setSelectedScanId(null);
    }
  };

  const confirmClearHistory = async () => {
    try {
      setLoading(true);
      await apiClient.delete('/api/v1/scans');
      setScans([]);
      notifications.show({ title: 'Очищено', message: 'Вся история успешно удалена', color: 'green' });
      closeClearConfirm();
    } catch (err) {
      console.error("Failed to clear history", err);
      notifications.show({ title: 'Ошибка', message: 'Ошибка при очистке истории', color: 'red' });
    } finally {
      setLoading(false);
    }
  };

  const stopScan = async (id: string, url: string) => {
    try {
      await apiClient.post(`/api/v1/scan/${id}/stop`);
      notifications.show({ title: 'Остановлено', message: `Сигнал остановки отправлен для ${url}`, color: 'orange' });
      fetchHistory(false);
    } catch {
      notifications.show({ title: 'Ошибка', message: 'Не удалось остановить', color: 'red' });
    }
  };

  const resumeScan = async (id: string, url: string) => {
    try {
      const response = await apiClient.post(`/api/v1/scan/${id}/resume`);
      
      if (response.data.status === 'ignored') {
        notifications.show({ 
          title: 'Возобновление невозможно', 
          message: response.data.message, 
          color: 'yellow' 
        });
        return;
      }

      notifications.show({ 
        title: 'Возобновлено', 
        message: `Процесс возобновлен для ${url}`, 
        color: 'green' 
      });
      fetchHistory(false);
    } catch (err: unknown) {
      const msg = axios.isAxiosError(err) ? err.response?.data?.detail || err.message : String(err);
      notifications.show({ title: 'Ошибка возобновления', message: msg, color: 'red' });
    }
  };

  return (
    <>
      <Helmet>
        <title>История проверок — LinguaCheck RU</title>
      </Helmet>

      <Stack gap="xl" className="page-transition">
        <Group justify="space-between" align="flex-end">
          <Stack gap={0}>
            <Title order={2} size={32} fw={900}>История проверок</Title>
            <Text c="dimmed" size="lg">Список ранее запущенных сканирований</Text>
          </Stack>
          <Group>
            <Button
              leftSection={<IconAdjustmentsHorizontal size={18}/>}
              variant="light"
              onClick={() => fetchHistory()}
              loading={loading}
            >
              Обновить
            </Button>
            {scans.length > 0 && (
              <Button
                leftSection={<IconTrash size={18} />}
                variant="subtle"
                color="red"
                onClick={openClearConfirm}
                loading={loading}
              >
                Очистить историю
              </Button>
            )}
          </Group>
        </Group>

        {error && (
          <Paper p="xl" withBorder radius="md" variant="light" color="red">
            <Group gap="md">
              <IconAlertTriangle size={24} />
              <Stack gap="xs" style={{ flex: 1 }}>
                <Text fw={600}>Ошибка загрузки данных</Text>
                <Text size="sm" c="dimmed">{error}</Text>
                <Button size="xs" variant="outline" color="red" onClick={() => fetchHistory()} mt="xs">
                  Попробовать снова
                </Button>
              </Stack>
            </Group>
          </Paper>
        )}

        <Paper radius="lg" withBorder p="lg">
          {loading && scans.length === 0 ? (
            <Stack gap={0}>
              {/* Заголовок таблицы - скелетон */}
              <Group px="xl" py="md" style={{ borderBottom: '1px solid var(--mantine-color-default-border)' }}>
                <Skeleton height={14} width="15%" />
                <Skeleton height={14} width="40%" />
                <Skeleton height={14} width="15%" />
                <Skeleton height={14} width="10%" ml="auto" />
              </Group>
              {/* Строки таблицы - скелетон */}
              {[...Array(5)].map((_, i) => (
                <Group key={i} px="xl" py="lg" style={{ borderBottom: '1px solid var(--mantine-color-default-border)' }}>
                  <Skeleton height={16} width="12%" />
                  <Group gap="sm" style={{ width: '40%' }}>
                    <Skeleton height={20} width={20} circle />
                    <Skeleton height={16} width="70%" />
                  </Group>
                  <Skeleton height={24} width="12%" radius="xl" />
                  <Group gap="sm" ml="auto">
                    <Skeleton height={28} width={28} radius="xl" />
                    <Skeleton height={28} width={28} radius="xl" />
                  </Group>
                </Group>
              ))}
            </Stack>
          ) : scans.length === 0 ? (
            <EmptyState 
              icon={<IconHistory size={60} stroke={1.5} />}
              title="История проверок пуста"
              description="Вы еще не запускали анализ сайтов. Как только вы проверите первый ресурс, отчет появится на этой странице."
              action={
                <Button variant="outline" size="md" onClick={() => navigate('/scans')}>
                  Начать первую проверку
                </Button>
              }
            />
          ) : (
            <>
              <Box 
                className="table-wrapper"
                style={{ 
                  overflowX: 'auto', 
                  WebkitOverflowScrolling: 'touch',
                  marginBottom: 0
                }}
              >
                <Table 
                  verticalSpacing="md" 
                  highlightOnHover 
                  style={{ minWidth: '100%' }}
                  className="violations-table-desktop"
                >
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>Дата</Table.Th>
                      <Table.Th>Сайт</Table.Th>
                      <Table.Th>Статус</Table.Th>
                      <Table.Th ta="right">Действие</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {paginatedScans.map((scan) => (
                      <Table.Tr key={scan.id}>
                        <Table.Td>
                          <Text size="sm" fw={500}>{new Date(scan.started_at).toLocaleString('ru-RU')}</Text>
                        </Table.Td>
                        <Table.Td>
                          <Group gap="xs">
                            <IconSearch size={14} color="var(--mantine-color-dimmed)" />
                            <Text size="sm" style={{ maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis' }}>{scan.target_url || 'Не указан'}</Text>
                          </Group>
                        </Table.Td>
                        <Table.Td>
                          <Tooltip
                            label={
                              scan.status === 'started' ? 'Сканирование создано и ожидает обработки' :
                              scan.status === 'in_progress' ? 'Идет активное сканирование страниц' :
                              scan.status === 'completed' ? 'Сканирование завершено успешно' :
                              scan.status === 'failed' ? 'Произошла ошибка при сканировании' :
                              'Сканирование было остановлено пользователем'
                            }
                            withArrow
                          >
                            <Badge
                              color={getScanStatusColor(scan.status)}
                              variant="light"
                              style={{ cursor: 'help' }}
                            >
                              {translateScanStatus(scan.status)}
                            </Badge>
                          </Tooltip>
                        </Table.Td>
                        <Table.Td>
                          <Group gap="xs" justify="flex-end">
                            <Tooltip label="Открыть отчет">
                              <ActionIcon variant="light" color="blue" onClick={() => navigate(`/scans?id=${scan.id}`)}>
                                <IconFileAnalytics size={18} />
                              </ActionIcon>
                            </Tooltip>

                            {(scan.status === 'started' || scan.status === 'in_progress') && (
                              <Tooltip label="Остановить">
                                <ActionIcon color="yellow" variant="light" onClick={() => stopScan(scan.id, scan.target_url || '')}>
                                  <IconPlayerStop size={18} />
                                </ActionIcon>
                              </Tooltip>
                            )}

                            {(scan.status === 'paused' || scan.status === 'stopped' || scan.status === 'failed') && (
                              <Tooltip label="Продолжить">
                                <ActionIcon color="green" variant="light" onClick={() => resumeScan(scan.id, scan.target_url || '')}>
                                  <IconPlayerPlay size={18} />
                                </ActionIcon>
                              </Tooltip>
                            )}

                            <Tooltip label="Удалить">
                              <ActionIcon color="red" variant="subtle" onClick={() => handleDeleteClick(scan.id)}>
                                <IconTrash size={18} />
                              </ActionIcon>
                            </Tooltip>
                          </Group>
                        </Table.Td>
                      </Table.Tr>
                    ))}
                  </Table.Tbody>
                </Table>
              </Box>

              {scans.length > ITEMS_PER_PAGE && (
                <Group justify="center" p="xl">
                  <Pagination total={Math.ceil(scans.length / ITEMS_PER_PAGE)} value={activePage} onChange={setPage} />
                </Group>
              )}
            </>
          )}
        </Paper>
      </Stack>

      {/* Modals moved to Footer or within Stack if needed, keeping simple here */}
      <Modal opened={deleteConfirmOpened} onClose={closeDeleteConfirm} title="Удаление отчета" centered>
        <Stack>
          <Text>Вы уверены, что хотите удалить этот отчет?</Text>
          <Group justify="flex-end">
            <Button variant="subtle" onClick={closeDeleteConfirm}>Отмена</Button>
            <Button color="red" onClick={confirmDelete} loading={loading}>Удалить</Button>
          </Group>
        </Stack>
      </Modal>

      <Modal opened={clearConfirmOpened} onClose={closeClearConfirm} title="Очистка истории" centered>
        <Stack>
          <Text>Вы уверены, что хотите полностью очистить историю?</Text>
          <Group justify="flex-end">
            <Button variant="subtle" onClick={closeClearConfirm}>Отмена</Button>
            <Button color="red" onClick={confirmClearHistory} loading={loading}>Очистить всё</Button>
          </Group>
        </Stack>
      </Modal>
    </>
  );
}
