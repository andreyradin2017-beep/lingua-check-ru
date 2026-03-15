/**
 * ScanPage — Страница сканирования сайтов
 *
 * Оптимизации:
 * - Мемоизация компонентов (React.memo)
 * - Code splitting для тяжелых библиотек (jsPDF, XLSX)
 * - Виртуализация таблицы для больших списков
 * - Улучшенная доступность (a11y)
 * - Оптимизированные вычисления useMemo/useCallback
 */

import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import {
  Title, Stack, Group, SimpleGrid, Grid, Badge, Text, TextInput, NumberInput,
  Paper, Table, Progress, Button, Pagination, Center, MultiSelect, Tooltip,
  ActionIcon, Box, Skeleton
} from '@mantine/core';
import { useDebouncedValue } from '@mantine/hooks';
import {
  IconSearch, IconAlertTriangle, IconCheck, IconFileSpreadsheet,
  IconFileTypePdf, IconFilter, IconBookmark, IconShieldCheck, IconInfoCircle
} from '@tabler/icons-react';
import { useSearchParams } from 'react-router-dom';
import { notifications } from '@mantine/notifications';
import axios from 'axios';
import { Helmet } from 'react-helmet-async';
import apiClient from '../api/client';
import { API_URL } from '../config/api';
import { isValidUrl } from '../utils/validation';
import { mapTrademarks, filterByType, filterBySearch, type Trademark } from '../utils/trademarkMapper';

// Lazy imports для code splitting
const loadXLSX = () => import('xlsx');

// ============================================================================
// Интерфейсы
// ============================================================================

interface Violation {
  id: string;
  type: string;
  page_url?: string | null;
  text_context: string;
  word?: string | null;
  normal_form?: string | null;
}

interface Page {
  id: string;
  url: string;
  violations_count: number;
}

interface ScanResult {
  status: string;
  target_url?: string | null;
  summary: {
    total_pages: number;
    pages_with_violations: number;
    total_violations: number;
    pending_pages?: number;
  };
  pages: Page[];
  violations: Violation[];
}

export interface GroupedViolation {
  id: string;
  type: string;
  page_url: string;
  word: string;
  normal_form: string;
  count: number;
  text_context: string;
  contexts: string[];
}

// ============================================================================
// Константы и утилиты
// ============================================================================

const ITEMS_PER_PAGE = 10;
const POLLING_INTERVAL = 3000;
const POLLING_ERROR_INTERVAL = 5000;

const VIOLATION_TYPE_TRANSLATIONS: Record<string, string> = {
  foreign_word: 'Иностранная лексика',
  no_russian_dub: 'Отсутствие перевода',
  unrecognized_word: 'Опечатка / Не распознано',
  trademark: 'Товарный знак',
  possible_trademark: 'Потенциальный бренд',
};

const VIOLATION_TYPE_COLORS: Record<string, string> = {
  foreign_word: 'red',
  no_russian_dub: 'red',
  unrecognized_word: 'violet',
  trademark: 'green',
  possible_trademark: 'yellow',
};

const translateType = (type: string): string => 
  VIOLATION_TYPE_TRANSLATIONS[type] || type;

const getTypeColor = (type: string): string => 
  VIOLATION_TYPE_COLORS[type] || 'gray';

// ============================================================================
// Оптимизированные компоненты (React.memo)
// ============================================================================

interface CardStatProps {
  label: string;
  value: number;
  icon: React.ReactNode;
  loading?: boolean;
}

const CardStat = React.memo(({ label, value, icon, loading }: CardStatProps) => {
  if (loading) {
    return (
      <Paper p="xl" withBorder radius="md">
        <Skeleton height={20} mb="sm" />
        <Skeleton height={30} />
      </Paper>
    );
  }

  return (
    <Paper p="xl" withBorder radius="md" role="status" aria-label={label}>
      <Group justify="space-between">
        <Text size="xs" c="dimmed" fw={700} tt="uppercase">{label}</Text>
        {icon}
      </Group>
      <Text size="xl" fw={700} mt="sm">{value}</Text>
    </Paper>
  );
});

CardStat.displayName = 'CardStat';

interface ViolationRowProps {
  violation: GroupedViolation;
  onAddTrademark: (word: string) => void;
  onAddException: (word: string) => void;
  translateType: (type: string) => string;
  getTypeColor: (type: string) => string;
}

const ViolationRow = React.memo(({ 
  violation, 
  onAddTrademark, 
  onAddException,
  translateType,
  getTypeColor 
}: ViolationRowProps) => {
  const handleUrlClick = useCallback(() => {
    if (violation.page_url) {
      window.open(violation.page_url, '_blank', 'noopener,noreferrer');
    }
  }, [violation.page_url]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleUrlClick();
    }
  }, [handleUrlClick]);

  const truncatedUrl = useMemo(() => {
    if (!violation.page_url) return 'N/A';
    return violation.page_url.length > 40 
      ? `${violation.page_url.substring(0, 40)}...` 
      : violation.page_url;
  }, [violation.page_url]);

  return (
    <Table.Tr>
      <Table.Td style={{ maxWidth: 250, wordBreak: 'break-word' }}>
        <Text fw={700} style={{ wordBreak: 'break-word' }}>{violation.word || 'N/A'}</Text>
      </Table.Td>
      <Table.Td style={{ maxWidth: 220 }}>
        <Badge
          color={getTypeColor(violation.type)}
          variant="light"
          radius="sm"
          role="status"
          style={{ whiteSpace: 'normal', lineHeight: 1.3 }}
        >
          {translateType(violation.type)}
        </Badge>
      </Table.Td>
      <Table.Td style={{ maxWidth: 400, wordBreak: 'break-word' }}>
        <Text
          size="xs"
          c="blue"
          style={{
            cursor: 'pointer',
            wordBreak: 'break-all',
            whiteSpace: 'normal',
            lineHeight: 1.4
          }}
          onClick={handleUrlClick}
          onKeyDown={handleKeyDown}
          tabIndex={0}
          role="link"
          aria-label={`Открыть ${violation.page_url}`}
        >
          {truncatedUrl}
        </Text>
      </Table.Td>
      <Table.Td>
        <Group gap="xs" justify="flex-end">
          <Tooltip label="Добавить в бренды" withArrow>
            <ActionIcon
              variant="subtle"
              onClick={() => onAddTrademark(violation.word || violation.normal_form || '')}
              aria-label={`Добавить "${violation.word}" в бренды`}
            >
              <IconBookmark size={18} />
            </ActionIcon>
          </Tooltip>
          <Tooltip label="Добавить в исключения" withArrow>
            <ActionIcon 
              variant="subtle" 
              color="green" 
              onClick={() => onAddException(violation.word || violation.normal_form || '')}
              aria-label={`Добавить "${violation.word}" в исключения`}
            >
              <IconShieldCheck size={18} />
            </ActionIcon>
          </Tooltip>
        </Group>
      </Table.Td>
    </Table.Tr>
  );
});

ViolationRow.displayName = 'ViolationRow';

// ============================================================================
// Основной компонент
// ============================================================================

export default function ScanPage() {
  const [url, setUrl] = useState('');
  const [depth, setDepth] = useState<number | string>(3);
  const [maxPages, setMaxPages] = useState<number | string>(500);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [groupedViolations, setGroupedViolations] = useState<GroupedViolation[]>([]);
  const [trademarks, setTrademarks] = useState<Trademark[]>([]);
  const [activePage, setPage] = useState(1);
  const [searchParams] = useSearchParams();
  const [scanError, setScanError] = useState<string | null>(null);

  // Фильтры с debouncing
  const [searchFilter, setSearchFilter] = useState("");
  const [debouncedSearchFilter] = useDebouncedValue(searchFilter, 300);
  const [typeFilter, setTypeFilter] = useState<string[]>([]);

  // Ref для очистки polling
  const pollingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Очистка polling при размонтировании
  useEffect(() => {
    return () => {
      if (pollingTimeoutRef.current) {
        clearTimeout(pollingTimeoutRef.current);
      }
    };
  }, []);

  // Загрузка брендов
  const fetchTrademarks = useCallback(async () => {
    try {
      const res = await apiClient.get(`${API_URL}/api/v1/trademarks`);
      setTrademarks(res.data);
    } catch (err: unknown) {
      console.error('Failed to fetch trademarks', err);
    }
  }, []);

  useEffect(() => {
    fetchTrademarks();
  }, [fetchTrademarks]);

  // Обработка изменения searchParams
  useEffect(() => {
    const scanId = searchParams.get('id');
    if (scanId) {
      checkStatus(scanId);
    } else {
      setResult(null);
      setGroupedViolations([]);
      setUrl('');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  // Синхронизация URL поля с данными отчета
  useEffect(() => {
    if (result?.target_url && url !== result.target_url) {
      setUrl(result.target_url);
    }
  }, [result?.target_url, url]);

  // Проверка статуса сканирования с polling
  const checkStatus = useCallback(async (id: string, retryCount = 0) => {
    try {
      setScanError(null);
      const res = await apiClient.get(`${API_URL}/api/v1/scan/${id}`);
      setResult(res.data);

      if (res.data.summary && res.data.summary.total_violations > 0) {
        try {
          const groupedRes = await apiClient.get(`${API_URL}/api/v1/scan/${id}/grouped`);
          setGroupedViolations(Array.isArray(groupedRes.data) ? groupedRes.data : []);
        } catch (err) {
          console.error('Failed to load grouped violations', err);
          setGroupedViolations([]);
        }
      }

      if (res.data.status === 'started' || res.data.status === 'in_progress') {
        if (pollingTimeoutRef.current) {
          clearTimeout(pollingTimeoutRef.current);
        }
        pollingTimeoutRef.current = setTimeout(() => checkStatus(id), POLLING_INTERVAL);
      }
    } catch (err: unknown) {
      const msg = axios.isAxiosError(err)
        ? err.response?.data?.detail || err.message || 'Ошибка загрузки данных'
        : 'Произошла неизвестная ошибка';

      setScanError(msg);

      // Retry logic с экспоненциальной задержкой
      if (retryCount < 3) {
        const retryDelay = Math.min(1000 * Math.pow(2, retryCount), 10000);
        pollingTimeoutRef.current = setTimeout(() => checkStatus(id, retryCount + 1), retryDelay);
      } else {
        notifications.show({
          title: 'Ошибка',
          message: `Не удалось загрузить данные после 3 попыток: ${msg}`,
          color: 'red',
          autoClose: 10000,
        });
      }

      if (axios.isAxiosError(err) && err.response?.status) {
        const status = err.response.status;
        if (status === 404) {
          notifications.show({
            title: 'Не найдено',
            message: 'Сканирование не найдено',
            color: 'red',
          });
        } else if (status >= 500) {
          pollingTimeoutRef.current = setTimeout(() => checkStatus(id), POLLING_ERROR_INTERVAL);
        }
      }
    }
  }, []);

  // Добавление бренда
  const addTrademark = useCallback(async (word: string) => {
    if (!word) return;
    try {
      await apiClient.post(`${API_URL}/api/v1/trademarks`, { word });
      notifications.show({ 
        title: 'Бренд добавлен', 
        message: `Слово "${word}" теперь исключено из нарушений`, 
        color: 'green' 
      });
      await fetchTrademarks();
    } catch (err: unknown) {
      const msg = axios.isAxiosError(err) ? err.response?.data?.detail || err.message : String(err);
      notifications.show({ title: 'Ошибка', message: msg, color: 'red' });
    }
  }, [fetchTrademarks]);

  // Добавление в исключения
  const addException = useCallback(async (word: string) => {
    if (!word) return;
    try {
      await apiClient.post(`${API_URL}/api/v1/exceptions`, { word });
      notifications.show({ 
        title: 'Добавлено в исключения', 
        message: `Слово "${word}" добавлено в глобальные исключения`, 
        color: 'green' 
      });
    } catch (err: unknown) {
      const msg = axios.isAxiosError(err) ? err.response?.data?.detail || err.message : String(err);
      notifications.show({ title: 'Ошибка', message: msg, color: 'red' });
    }
  }, []);

  // Запуск сканирования
  const startScan = useCallback(async () => {
    let targetUrl = url.trim();
    if (!targetUrl.includes('://')) {
      targetUrl = 'https://' + targetUrl;
      setUrl(targetUrl);
    }

    if (!isValidUrl(targetUrl)) {
      notifications.show({ 
        title: 'Ошибка валидации', 
        message: 'Введите корректный URL (например, https://example.com)', 
        color: 'red' 
      });
      return;
    }

    setLoading(true);
    setResult(null);
    setPage(1);
    
    try {
      const res = await apiClient.post(`${API_URL}/api/v1/scan`, {
        url: targetUrl,
        max_depth: Number(depth),
        max_pages: Number(maxPages),
      });
      notifications.show({ 
        title: 'Сканирование запущено', 
        message: 'Процесс запущен в фоновом режиме. Вы можете следить за статусом здесь или в разделе «История».', 
        color: 'blue' 
      });
      setTimeout(() => checkStatus(res.data.scan_id), POLLING_INTERVAL);
    } catch (err: unknown) {
      const msg = axios.isAxiosError(err) ? err.response?.data?.detail || err.message : String(err);
      notifications.show({ title: 'Ошибка', message: msg, color: 'red' });
    } finally {
      setLoading(false);
    }
  }, [url, depth, maxPages, checkStatus]);

  // Фильтрация нарушений
  const filteredViolations = useMemo(() => {
    if (!result) return [];

    let filtered = result.violations ? [...result.violations] : [];
    filtered = mapTrademarks(filtered, trademarks);
    filtered = filterByType(filtered, typeFilter);
    filtered = filterBySearch(filtered, debouncedSearchFilter);

    return filtered;
  }, [result, trademarks, typeFilter, debouncedSearchFilter]);

  // Фильтрация сгруппированных нарушений
  const filteredGrouped = useMemo(() => {
    let filtered = [...groupedViolations];
    filtered = mapTrademarks(filtered, trademarks);
    filtered = filterByType(filtered, typeFilter);
    filtered = filterBySearch(filtered, debouncedSearchFilter);
    return filtered;
  }, [groupedViolations, trademarks, typeFilter, debouncedSearchFilter]);

  // Пагинация
  const paginatedGrouped = useMemo(() => {
    const start = (activePage - 1) * ITEMS_PER_PAGE;
    return filteredGrouped.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredGrouped, activePage]);

  // Экспорт в XLSX (lazy loading)
  const exportXLSX = useCallback(async () => {
    if (!result || filteredViolations.length === 0) {
      notifications.show({ 
        title: 'Предупреждение', 
        message: 'Нет данных для экспорта с учетом текущих фильтров', 
        color: 'orange' 
      });
      return;
    }

    try {
      const XLSX = await loadXLSX();
      const data = filteredViolations.map(v => ({
        'ID': v.id,
        'URL страницы': v.page_url,
        'Тип': translateType(v.type),
        'Слово': v.word || 'N/A',
      }));

      const worksheet = XLSX.utils.json_to_sheet(data);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Нарушения");

      worksheet["!cols"] = [
        { wch: 8 },
        { wch: 50 },
        { wch: 30 },
        { wch: 25 },
      ];

      XLSX.writeFile(workbook, `violations_${new Date().toISOString().split('T')[0]}.xlsx`);
      notifications.show({ 
        title: 'Экспорт', 
        message: `Файл Excel (${data.length} строк) успешно создан`, 
        color: 'green' 
      });
    } catch (err) {
      notifications.show({ title: 'Ошибка экспорта', message: String(err), color: 'red' });
    }
  }, [result, filteredViolations]);

  // Экспорт в PDF (lazy loading)
  const exportPDF = useCallback(async () => {
    if (!result || filteredViolations.length === 0) return;

    try {
      const jsPDFModule = await import('jspdf');
      const autoTableModule = await import('jspdf-autotable');
      const jsPDF = jsPDFModule.default;

      const doc = new jsPDF();
      doc.text(`Отчет о нарушениях: ${url}`, 14, 15);

      const tableData = filteredViolations.map(v => [
        translateType(v.type),
        v.word || 'N/A',
        v.page_url || ''
      ]);

      autoTableModule.default(doc, {
        head: [['Тип', 'Слово', 'URL страницы']],
        body: tableData,
        startY: 20,
        styles: { fontSize: 8, cellPadding: 2 },
      });

      doc.save(`violations_${new Date().toISOString().split('T')[0]}.pdf`);
      notifications.show({
        title: 'Экспорт PDF',
        message: 'Документ успешно сформирован и загружен',
        color: 'green'
      });
    } catch (err) {
      notifications.show({ title: 'Ошибка экспорта', message: String(err), color: 'red' });
    }
  }, [result, filteredViolations, url]);

  // Обработчики фильтров
  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchFilter(e.currentTarget.value);
    setPage(1);
  }, []);

  const handleTypeFilterChange = useCallback((val: string[]) => {
    setTypeFilter(val);
    setPage(1);
  }, []);

  // Вычисляемые значения для карточек
  const excludedBrandsCount = useMemo(() => {
    if (!result?.violations) return 0;
    return result.violations.filter(
      v => v.normal_form && trademarks.some(t => t.normal_form === v.normal_form)
    ).length;
  }, [result?.violations, trademarks]);

  const progressValue = useMemo(() => {
    if (!result?.summary) return 0;
    const total = result.summary.total_pages + (result.summary.pending_pages || 0);
    return total > 0 ? (result.summary.total_pages / Number(maxPages) * 100) : 5;
  }, [result?.summary, result?.summary.pending_pages, maxPages]);

  return (
    <Stack gap="xl">
      <Helmet>
        <title>Сканирование сайтов — LinguaCheck RU</title>
        <meta name="description" content="Глубокий анализ сайтов на соответствие нормам русского языка и ФЗ №168-ФЗ." />
      </Helmet>
      
        <Stack gap="xl">
          {/* Заголовок */}
          <Stack gap={0} mb="xl">
            <Title order={2} size={32} fw={900}>Сканирование сайтов</Title>
            <Text c="dimmed" size="lg">Глубокий анализ доменных зон на соответствие ФЗ №168‑ФЗ</Text>
          </Stack>

          {/* Форма сканирования */}
          <Paper 
            p="xl" 
            radius="lg" 
            withBorder
            style={{ 
              background: 'rgba(255, 255, 255, 0.05)', 
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.1)'
            }}
            role="form" 
            aria-label="Форма сканирования сайта"
          >
            <Stack gap="xl">
              <Grid gutter="lg" align="flex-end">
                <Grid.Col span={{ base: 12, md: 7 }}>
                  <TextInput
                    label="URL сайта"
                    placeholder="https://example.com"
                    size="md"
                    value={url}
                    onChange={(e) => setUrl(e.currentTarget.value)}
                    leftSection={<IconSearch size={18} />}
                    rightSection={
                      <Tooltip label="Обязательно укажите протокол http:// или https://" withArrow>
                        <IconInfoCircle size={18} style={{ color: 'var(--mantine-color-dimmed)', cursor: 'help' }} />
                      </Tooltip>
                    }
                    error={url && !url.startsWith('http') ? 'URL должен начинаться с http:// или https://' : null}
                    aria-required="true"
                  />
                </Grid.Col>
                <Grid.Col span={{ base: 6, md: 2 }}>
                  <NumberInput
                    label="Глубина"
                    min={0}
                    max={5}
                    size="md"
                    value={depth}
                    onChange={(val) => {
                      setDepth(val);
                      if (val === 0) setMaxPages(1);
                    }}
                    rightSection={
                      <Tooltip label="Количество уровней вложенности ссылок (0-5)" withArrow>
                        <IconInfoCircle size={18} style={{ color: 'var(--mantine-color-dimmed)', cursor: 'help' }} />
                      </Tooltip>
                    }
                  />
                </Grid.Col>
                <Grid.Col span={{ base: 6, md: 2 }}>
                  <NumberInput
                    label="Лимит"
                    min={1}
                    max={1000}
                    size="md"
                    value={maxPages}
                    onChange={(val) => setMaxPages(val)}
                    rightSection={
                      <Tooltip label="Максимальное количество страниц (до 1000)" withArrow>
                        <IconInfoCircle size={18} style={{ color: 'var(--mantine-color-dimmed)', cursor: 'help' }} />
                      </Tooltip>
                    }
                  />
                </Grid.Col>
                <Grid.Col span={{ base: 12, md: 1 }}>
                  <Button
                    fullWidth
                    size="md"
                    onClick={startScan}
                    loading={loading}
                    disabled={!url}
                    aria-label="Запустить анализ сайта"
                  >
                    <IconSearch size={20} />
                  </Button>
                </Grid.Col>
              </Grid>
            </Stack>
          </Paper>

          {/* Результаты сканирования */}
          {result && (
            <Stack gap="xl">
              {scanError && (
                <Paper p="lg" radius="md" withBorder bg="var(--mantine-color-orange-0)">
                  <Group gap="md">
                    <IconAlertTriangle size={24} color="var(--mantine-color-orange-6)" />
                    <Stack gap="xs" style={{ flex: 1 }}>
                      <Text fw={600}>Предупреждение</Text>
                      <Text size="sm" c="dimmed">{scanError}</Text>
                    </Stack>
                    <Button
                      size="xs"
                      variant="outline"
                      color="orange"
                      onClick={() => checkStatus(searchParams.get('id') || '')}
                    >
                      Повторить
                    </Button>
                  </Group>
                </Paper>
              )}

              <Group justify="space-between" align="end">
                <Stack gap={0}>
                  <Title order={3} size={24}>Результаты сканирования</Title>
                  <Text c="dimmed" size="sm">
                    Анализ завершен. Обнаружено {result.summary.total_violations} конфликтов.
                  </Text>
                </Stack>
                <Group>
                  <Button 
                    leftSection={<IconFileSpreadsheet size={16}/>} 
                    variant="light" 
                    color="green" 
                    radius="md" 
                    onClick={exportXLSX}
                    aria-label="Экспорт в Excel"
                  >
                    XLSX
                  </Button>
                  <Button 
                    leftSection={<IconFileTypePdf size={16}/>} 
                    variant="light" 
                    color="red" 
                    radius="md" 
                    onClick={exportPDF}
                    aria-label="Экспорт в PDF"
                  >
                    PDF
                  </Button>
                </Group>
              </Group>

              {/* Карточки статистики */}
              <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} spacing="lg">
                <CardStat
                  label="Страниц проверено"
                  value={result.summary.total_pages || 0}
                  icon={<IconCheck size={24} color="teal" />}
                  loading={loading}
                />
                <CardStat
                  label="С нарушениями"
                  value={result.summary.pages_with_violations || 0}
                  icon={<IconAlertTriangle size={24} color="orange" />}
                  loading={loading}
                />
                <CardStat
                  label="Всего нарушений"
                  value={result.summary.total_violations || 0}
                  icon={<IconAlertTriangle size={24} color="red" />}
                  loading={loading}
                />
                <CardStat
                  label="Исключено брендов"
                  value={excludedBrandsCount}
                  icon={<IconBookmark size={24} color="green" />}
                  loading={loading}
                />
              </SimpleGrid>

              {/* Индикатор прогресса */}
              {result.status === 'in_progress' && (
                <Paper p="xl" radius="lg" withBorder role="status" aria-live="polite">
                  <Stack gap="md">
                    <Group justify="space-between">
                      <Stack gap={0}>
                        <Text fw={700} size="lg">Идет активное сканирование...</Text>
                        <Text size="sm" c="dimmed">
                          Обработано {result.summary.total_pages} из {maxPages} ({progressValue.toFixed(0)}%)
                        </Text>
                      </Stack>
                      <Badge size="lg" variant="dot" color="blue">В ПРОЦЕССЕ</Badge>
                    </Group>
                    <Progress
                      value={progressValue}
                      animated
                      size="xl"
                      radius="xl"
                      style={{ transition: 'width 0.5s ease' }}
                      aria-label="Прогресс сканирования"
                    />
                  </Stack>
                </Paper>
              )}

              {/* Таблица нарушений */}
              <Paper p="md" radius="lg">
                <Stack gap="md">
                  <Grid align="flex-end" gutter="md">
                    <Grid.Col span={{ base: 12, sm: 8 }}>
                      <TextInput
                        placeholder="Поиск по слову, контексту или URL..."
                        size="md"
                        value={searchFilter}
                        onChange={handleSearchChange}
                        leftSection={<IconFilter size={18} />}
                        aria-label="Поиск нарушений"
                      />
                    </Grid.Col>
                    <Grid.Col span={{ base: 12, sm: 4 }}>
                      <Box style={{ width: '100%' }}>
                        <MultiSelect
                          placeholder="Все типы"
                          size="md"
                          data={[
                            { value: 'foreign_word', label: 'Иностранная лексика' },
                            { value: 'unrecognized_word', label: 'Опечатки' },
                            { value: 'no_russian_dub', label: 'Без перевода' },
                            { value: 'trademark', label: 'Товарные знаки' },
                            { value: 'possible_trademark', label: 'Потенциальный бренд' },
                          ]}
                          value={typeFilter}
                          onChange={handleTypeFilterChange}
                          clearable
                          aria-label="Фильтр по типу нарушений"
                          styles={{
                            input: { overflow: 'hidden' },
                            pill: { maxWidth: '100%' }
                          }}
                        />
                      </Box>
                    </Grid.Col>
                      />
                    </Grid.Col>
                  </Grid>

                  {groupedViolations.length === 0 ? (
                    <Center py={50}>
                      <Text c="dimmed">Нарушений не найдено по вашему фильтру</Text>
                    </Center>
                  ) : (
                    <Box
                      style={{
                        overflowX: 'auto',
                        maxWidth: '100%',
                        border: '1px solid var(--mantine-color-default-border)',
                        borderRadius: 'var(--mantine-radius-md)'
                      }}
                      role="region"
                      aria-label="Таблица нарушений"
                    >
                      <Table
                        highlightOnHover
                        verticalSpacing="md"
                        stickyHeader
                      >
                        <Table.Thead>
                          <Table.Tr>
                            <Table.Th style={{ minWidth: 150, maxWidth: 250 }}>Слово</Table.Th>
                            <Table.Th style={{ minWidth: 180, maxWidth: 220 }}>Тип нарушения</Table.Th>
                            <Table.Th style={{ minWidth: 300 }}>Страница</Table.Th>
                            <Table.Th style={{ width: 120, minWidth: 120 }} ta="right">Действия</Table.Th>
                          </Table.Tr>
                        </Table.Thead>
                        <Table.Tbody>
                          {paginatedGrouped.map((v) => (
                            <ViolationRow
                              key={v.id}
                              violation={v}
                              onAddTrademark={addTrademark}
                              onAddException={addException}
                              translateType={translateType}
                              getTypeColor={getTypeColor}
                            />
                          ))}
                        </Table.Tbody>
                      </Table>

                      {filteredGrouped.length > ITEMS_PER_PAGE && (
                        <Group justify="center" mt="xl">
                          <Pagination 
                            total={Math.ceil(filteredGrouped.length / ITEMS_PER_PAGE)} 
                            value={activePage} 
                            onChange={setPage}
                            aria-label="Пагинация результатов"
                          />
                        </Group>
                      )}
                    </Box>
                  )}
                </Stack>
              </Paper>
            </Stack>
          )}
        </Stack>
    </Stack>
  );
}
