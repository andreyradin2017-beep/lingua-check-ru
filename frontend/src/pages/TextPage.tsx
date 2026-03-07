import { useState, useMemo } from 'react';
import { Title, Stack, Group, Button, Textarea, Paper, Badge, Text, Tabs, FileButton, List, ThemeIcon, Pagination } from '@mantine/core';
import { useLocalStorage } from '@mantine/hooks';
import { IconFileText, IconTypography, IconAlertCircle, IconCheck, IconFileCheck, IconFileSpreadsheet, IconFileTypePdf } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import axios from 'axios';
import Papa from 'papaparse';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

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

export default function TextPage() {
  const [text, setText] = useLocalStorage({ key: 'linguacheck-last-text', defaultValue: '' });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<TextResult | null>(null);
  const [activePage, setPage] = useState(1);
  const itemsPerPage = 10;

  const checkText = async () => {
    setLoading(true);
    setResult(null);
    setPage(1);
    try {
      const res = await axios.post('http://127.0.0.1:8000/api/v1/check_text', {
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
  };

  const onFileUpload = async (file: File | null) => {
    if (!file) return;
    setLoading(true);
    setResult(null);
    setPage(1);
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await axios.post('http://127.0.0.1:8000/api/v1/check_text/upload', formData);
      setResult(res.data);
      notifications.show({ title: 'Файл загружен', message: `Проверено: ${file.name}`, color: 'teal' });
    } catch (err: unknown) {
      const msg = axios.isAxiosError(err) ? err.response?.data?.detail || err.message : String(err);
      notifications.show({ title: 'Ошибка загрузки', message: msg, color: 'red' });
    } finally {
      setLoading(false);
    }
  };

  const paginatedViolations = useMemo(() => {
    if (!result) return [];
    const start = (activePage - 1) * itemsPerPage;
    return result.violations.slice(start, start + itemsPerPage);
  }, [result, activePage]);

  const exportCSV = () => {
    if (!result) return;
    const data = result.violations.map((v: TextViolation) => ({
      ID: v.id,
      Тип: v.type,
      Слово: v.word || 'N/A',
      Контекст: v.text_context,
    }));
    const csv = Papa.unparse(data);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', 'text_check_results.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportPDF = () => {
    if (!result) return;
    const doc = new jsPDF();
    doc.text(`Отчет о проверке текста`, 14, 15);
    const tableData = result.violations.map((v: TextViolation) => [
      v.type,
      v.word || 'N/A',
      v.text_context.substring(0, 50) + (v.text_context.length > 50 ? '...' : '')
    ]);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (doc as any).autoTable({
      head: [['Тип', 'Слово', 'Контекст']],
      body: tableData,
      startY: 20,
    });
    doc.save('text_check_results.pdf');
  };

  return (
    <Stack gap="xl">
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
              onChange={(e) => setText(e.currentTarget.value)}
            />
            <Button mt="md" onClick={checkText} loading={loading} disabled={!text.trim()}>Проверить сейчас</Button>
          </Paper>
        </Tabs.Panel>

        <Tabs.Panel value="upload" pt="xl">
          <Paper p={50} withBorder radius="md" bg="gray.0" style={{ border: '2px dashed var(--mantine-color-gray-4)' }}>
            <Stack align="center">
              <IconFileCheck size={50} color="var(--mantine-color-blue-4)" />
              <Text fw={500}>Поддерживаются форматы TXT, DOCX, PDF</Text>
              <FileButton onChange={onFileUpload} accept=".txt,.docx,.pdf">
                {(props) => <Button {...props} loading={loading}>Выбрать файл</Button>}
              </FileButton>
            </Stack>
          </Paper>
        </Tabs.Panel>
      </Tabs>

      {result && (
        <Paper p="xl" withBorder radius="md">
          <Stack gap="md">
            <Group justify="space-between">
              <Title order={3}>Результаты анализа</Title>
              <Group>
                <Button leftSection={<IconFileSpreadsheet size={16}/>} variant="light" color="green" onClick={exportCSV}>Экспорт CSV</Button>
                <Button leftSection={<IconFileTypePdf size={16}/>} variant="light" color="red" onClick={exportPDF}>Экспорт PDF</Button>
                <Badge size="xl" color={result.summary.compliance_percent > 90 ? 'teal' : 'orange'}>
                  Соответствие: {result.summary.compliance_percent}%
                </Badge>
              </Group>
            </Group>

            <Group gap="xl">
              <Text size="sm">Слов обработано: <b>{result.summary.total_tokens}</b></Text>
              <Text size="sm">Нарушений: <b style={{ color: 'var(--mantine-color-red-6)' }}>{result.summary.violations_count}</b></Text>
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
                    <List.Item key={i} icon={
                      v.type === 'trademark' ? (
                        <ThemeIcon color="blue" size={24} radius="xl">
                          <IconCheck size={16} />
                        </ThemeIcon>
                      ) : undefined
                    }>
                      <Badge color={v.type === 'trademark' ? 'blue' : 'red'} size="xs" mr="sm">
                        {v.type === 'trademark' ? 'ТЗ' : v.type}
                      </Badge>
                      <Text span fw={700}>{v.word}</Text>
                      <Text span fs="italic" ml="xs">"...{v.text_context}..."</Text>
                    </List.Item>
                  ))}
                </List>
                {result.violations.length > itemsPerPage && (
                  <Group justify="center" p="md">
                    <Pagination 
                      total={Math.ceil(result.violations.length / itemsPerPage)} 
                      value={activePage} 
                      onChange={setPage} 
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
