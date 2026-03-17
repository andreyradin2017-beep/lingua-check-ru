/**
 * TextPage — Страница проверки текста и файлов
 * 
 * Оптимизации:
 * - Code splitting для тяжелых библиотек (jsPDF, Papa)
 * - Мемоизация вычислений
 * - Улучшенная доступность (a11y)
 * - Оптимизированные обработчики
 */

import { useState, useMemo, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import { 
  Title, Stack, Group, Button, Textarea, Paper, Badge, Text, 
  Tabs, FileButton, List, ThemeIcon, Pagination, Tooltip, Box 
} from '@mantine/core';
import { useLocalStorage } from '@mantine/hooks';
import { IconFileText, IconTypography, IconAlertCircle, IconCheck, IconFileCheck, IconFileSpreadsheet, IconFileTypePdf } from '@tabler/icons-react';
import axios from 'axios';
import { notifications } from '@mantine/notifications';
import apiClient from '../api/client';
import { API_URL } from '../config/api';
import { sanitizeText } from '../utils/sanitize';
import { translateViolationType } from '../utils/translations';

// Lazy imports
const loadPapa = () => import('papaparse');
const loadPapa = () => import('papaparse');
const loadXLSX = () => import('xlsx'); // Добавим XLSX вместо PDF если нужно, или просто уберем лишнее


interface TextViolation {
  id: string;
  type: string;
  word?: string;
  text_context: string;
}

interface TextResult {
  summary: {
    total_tokens: number;
    violations_count: number;
    compliance_percent: number;
  };
  violations: TextViolation[];
}

// Константы
const ITEMS_PER_PAGE = 10;

export default function TextPage() {
  const [text, setText] = useLocalStorage({ key: 'linguacheck-last-text', defaultValue: '' });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<TextResult | null>(null);
  const [activePage, setPage] = useState(1);

  // Проверка текста
  const checkText = useCallback(async () => {
    setLoading(true);
    setResult(null);
    setPage(1);
    try {
      const res = await apiClient.post(`${API_URL}/api/v1/check_text`, {
        text,
        format: 'plain'
      });
      setResult(res.data);
    } catch (err: unknown) {
      const msg = axios.isAxiosError(err) ? err.response?.data?.detail || err.message : String(err);
      notifications.show({ title: 'Ошибка', message: msg, color: 'red' });
    } finally {
      setLoading(false);
    }
  }, [text]);

  // Загрузка файла
  const onFileUpload = useCallback(async (file: File | null) => {
    if (!file) return;
    setLoading(true);
    setResult(null);
    setPage(1);
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await apiClient.post(`${API_URL}/api/v1/check_text/upload`, formData);
      setResult(res.data);
      notifications.show({ 
        title: 'Файл загружен', 
        message: `Проверено: ${file.name}`, 
        color: 'teal' 
      });
    } catch (err: unknown) {
      const msg = axios.isAxiosError(err) ? err.response?.data?.detail || err.message : String(err);
      notifications.show({ title: 'Ошибка загрузки', message: msg, color: 'red' });
    } finally {
      setLoading(false);
    }
  }, []);

  // Пагинация
  const paginatedViolations = useMemo(() => {
    if (!result) return [];
    const start = (activePage - 1) * ITEMS_PER_PAGE;
    return result.violations.slice(start, start + ITEMS_PER_PAGE);
  }, [result, activePage]);

  // Экспорт CSV (lazy loading)
  const exportCSV = useCallback(async () => {
    if (!result) return;
    try {
      const Papa = await loadPapa();
      const data = result.violations.map((v: TextViolation) => ({
        ID: v.id,
        Тип: translateViolationType(v.type),
        Слово: v.word || 'N/A',
        Контекст: v.text_context,
      }));
      const csv = Papa.default.unparse(data);
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.setAttribute('download', 'text_check_results.csv');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      notifications.show({
        title: 'Экспорт CSV',
        message: 'Файл успешно сформирован и загружен',
        color: 'green',
        icon: <IconCheck size={16} />
      });
    } catch (err) {
      notifications.show({ title: 'Ошибка экспорта', message: String(err), color: 'red' });
    }
  }, [result]);

  const textLength = text.length;

  return (
    <Stack gap="xl" className="page-transition">
      <Helmet>
        <title>Проверка текста и файлов — LinguaCheck RU</title>
        <meta name="description" content="Анализ текстов, документов DOCX и PDF на соблюдение норм государственного языка." />
      </Helmet>
      
      <Stack gap={0}>
        <Title order={2}>Проверка текста и файлов</Title>
        <Text c="dimmed">Мгновенный анализ и экспорт отчетов на соответствие нормам</Text>
      </Stack>

      <Tabs defaultValue="manual">
        <Tabs.List>
          <Tabs.Tab value="manual" leftSection={<IconTypography size={16} />}>Вставить текст</Tabs.Tab>
          <Tabs.Tab value="upload" leftSection={<IconFileText size={16} />}>Загрузить файл</Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="manual" pt="xl">
          <Paper p="md" withBorder>
            <Textarea
              label="Текст для проверки"
              placeholder="Введите или вставьте текст..."
              minRows={8}
              value={text}
              rightSection={
                <Box pr="xs" style={{ height: '100%', display: 'flex', alignItems: 'flex-end', paddingBottom: '8px' }}>
                  <Text size="xs" c="dimmed" style={{ whiteSpace: 'nowrap' }}>
                    {textLength} симв.
                  </Text>
                </Box>
              }
              onChange={(e) => setText(e.currentTarget.value)}
              aria-label="Текст для проверки"
            />
            <Button 
              mt="md" 
              onClick={checkText} 
              loading={loading} 
              disabled={!text.trim()}
              aria-label="Проверить текст"
            >
              Проверить сейчас
            </Button>
          </Paper>
        </Tabs.Panel>

        <Tabs.Panel value="upload" pt="xl">
          <Paper 
            p={50} 
            withBorder 
            radius="md" 
            className="file-dropzone"
            role="region"
            aria-label="Загрузка файла"
          >
            <Stack align="center">
              <IconFileCheck size={50} color="var(--mantine-color-blue-4)" />
              <Text fw={500}>Поддерживаются форматы TXT, DOCX</Text>
              <FileButton onChange={onFileUpload} accept=".txt,.docx">
                {(props) => (
                  <Button 
                    {...props} 
                    loading={loading}
                    aria-label="Выбрать файл для загрузки"
                  >
                    Выбрать файл
                  </Button>
                )}
              </FileButton>
            </Stack>
          </Paper>
        </Tabs.Panel>
      </Tabs>

      {result && (
        <Paper p="xl" withBorder radius="md" role="region" aria-label="Результаты анализа">
          <Stack gap="md">
            <Group justify="space-between" align="center">
              <Title order={3}>Результаты анализа</Title>
              <Group gap="xs">
                <Tooltip label="Скачать отчет в формате CSV" withArrow>
                  <Button
                    leftSection={<IconFileSpreadsheet size={16}/>}
                    variant="light"
                    color="green"
                    onClick={exportCSV}
                    size="xs"
                    aria-label="Экспорт в CSV"
                  >
                    CSV
                  </Button>
                </Tooltip>
                <Tooltip label="Процент соответствия нормам русского языка" withArrow>
                  <Badge 
                    size="lg" 
                    color={result.summary.compliance_percent > 90 ? 'teal' : 'orange'}
                    role="status"
                  >
                    {result.summary.compliance_percent}%
                  </Badge>
                </Tooltip>
              </Group>
            </Group>

            <Group gap="xl">
              <Text size="sm">
                Слов обработано: <b>{result.summary.total_tokens}</b>
              </Text>
              <Text size="sm">
                Нарушений: <b style={{ color: 'var(--mantine-color-red-6)' }}>
                  {result.summary.violations_count}
                </b>
              </Text>
            </Group>

            {result.violations.length > 0 ? (
              <Stack>
                <List
                  spacing="xs"
                  size="sm"
                  center
                  icon={
                    <ThemeIcon color="red" size={24} radius="xl">
                      <IconAlertCircle size={16} />
                    </ThemeIcon>
                  }
                >
                  {paginatedViolations.map((v: TextViolation, i: number) => (
                    <List.Item 
                      key={i} 
                      icon={
                        v.type === 'trademark' ? (
                          <ThemeIcon color="blue" size={24} radius="xl">
                            <IconCheck size={16} />
                          </ThemeIcon>
                        ) : undefined
                      }
                    >
                      <Badge color={v.type === 'trademark' ? 'blue' : 'red'} size="sm" mr="sm">
                        {translateViolationType(v.type)}
                      </Badge>
                      <Text span fw={700}>{v.word}</Text>
                      <Text span fs="italic" ml="xs">
                        "...{sanitizeText(v.text_context)}..."
                      </Text>
                    </List.Item>
                  ))}
                </List>
                
                {result.violations.length > ITEMS_PER_PAGE && (
                  <Group justify="center" p="md">
                    <Pagination
                      total={Math.ceil(result.violations.length / ITEMS_PER_PAGE)}
                      value={activePage}
                      onChange={setPage}
                      aria-label="Пагинация результатов"
                    />
                  </Group>
                )}
              </Stack>
            ) : (
              <Group>
                <ThemeIcon color="teal" size={24} radius="xl">
                  <IconCheck size={16} />
                </ThemeIcon>
                <Text fw={500} c="teal">Нарушений не обнаружено!</Text>
              </Group>
            )}
          </Stack>
        </Paper>
      )}
    </Stack>
  );
}
