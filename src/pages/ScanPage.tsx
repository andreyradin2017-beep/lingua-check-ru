import React, { useState, useMemo, useEffect } from 'react';
import { Title, Stack, Group, SimpleGrid, Badge, Text, TextInput, NumberInput, Paper, Table, Progress, Alert, Button, Pagination, UnstyledButton, Center, MultiSelect, Tooltip } from '@mantine/core';
import { IconSearch, IconAlertTriangle, IconCheck, IconFileSpreadsheet, IconFileTypePdf, IconFilter, IconX, IconBookmark, IconShieldCheck } from '@tabler/icons-react';
import { useSearchParams } from 'react-router-dom';
import { notifications } from '@mantine/notifications';
import axios from 'axios';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { Helmet } from 'react-helmet-async';
import { API_URL } from '../config/api';


interface Violation {
  id: string;
  type: string;
  page_url?: string;
  text_context: string;
  word?: string;
  normal_form?: string;
  count?: number;  // Для группировки
  contexts?: string[];  // Для группировки
}

interface Page {
  id: string;
  url: string;
  violations_count: number;
}

interface ScanResult {
  status: string;
  summary: {
    total_pages: number;
    pages_with_violations: number;
    total_violations: number;
    pending_pages?: number;
  };
  pages: Page[];
  violations: Violation[];
}

interface GroupedViolation {
  id: string;
  type: string;
  page_url: string;
  word: string;
  normal_form: string;
  count: number;
  text_context: string;
  contexts: string[];
}

interface Trademark {
  id: string;
  word: string;
  normal_form: string;
}

export default function ScanPage() {
  const [url, setUrl] = useState('');
  const [depth, setDepth] = useState<number | string>(3);
  const [maxPages, setMaxPages] = useState<number | string>(500);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ScanResult | null>(null);
  
  // Бренды
  const [trademarks, setTrademarks] = useState<Trademark[]>([]);
  
  const [activePage, setPage] = useState(1);
  const [searchParams] = useSearchParams();

  // Фильтры
  const [searchFilter, setSearchFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState<string[]>([]);

  const itemsPerPage = 10;

  useEffect(() => {
    fetchTrademarks();
    const scanId = searchParams.get('id');
    if (scanId) {
      checkStatus(scanId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const fetchTrademarks = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/v1/trademarks`);
      setTrademarks(res.data);
    } catch (err: unknown) {
      console.error('Failed to fetch trademarks', err);
    }
  };

  const addTrademark = async (word: string) => {
    if (!word) return;
    try {
      await axios.post(`${API_URL}/api/v1/trademarks`, { word });
      notifications.show({ title: 'Бренд добавлен', message: `Слово "${word}" теперь исключено из нарушений`, color: 'green' });
      await fetchTrademarks();
    } catch (err: unknown) {
      const msg = axios.isAxiosError(err) ? err.response?.data?.detail || err.message : String(err);
      notifications.show({ title: 'Ошибка', message: msg, color: 'red' });
    }
  };

  // Добавление в глобальные исключения
  const addException = async (word: string) => {
    if (!word) return;
    try {
      await axios.post(`${API_URL}/api/v1/exceptions`, { word });
      notifications.show({ title: 'Добавлено в исключения', message: `Слово "${word}" добавлено в глобальные исключения`, color: 'green' });
    } catch (err: unknown) {
      const msg = axios.isAxiosError(err) ? err.response?.data?.detail || err.message : String(err);
      notifications.show({ title: 'Ошибка', message: msg, color: 'red' });
    }
  };

  const startScan = async () => {
    let targetUrl = url.trim();
    if (!targetUrl.startsWith('http')) {
      targetUrl = 'https://' + targetUrl;
      setUrl(targetUrl);
    }
    
    setLoading(true);
    setResult(null);
    setPage(1);
    try {
      const res = await axios.post(`${API_URL}/api/v1/scan`, {
        url: targetUrl,
        max_depth: Number(depth),
        max_pages: Number(maxPages),
      });
      notifications.show({ title: 'Сканирование запущено', message: 'Процесс запущен в фоновом режиме. Вы можете следить за статусом здесь или в разделе «История».', color: 'blue' });
      setTimeout(() => checkStatus(res.data.scan_id), 3000);
    } catch (err: unknown) {
      const msg = axios.isAxiosError(err) ? err.response?.data?.detail || err.message : String(err);
      notifications.show({ title: 'Ошибка', message: msg, color: 'red' });
    } finally {
      setLoading(false);
    }
  };

  const [groupedViolations, setGroupedViolations] = useState<GroupedViolation[]>([]);

  const checkStatus = async (id: string) => {
    try {
      const res = await axios.get(`${API_URL}/api/v1/scan/${id}`);
      setResult(res.data);

      // Загружаем сгруппированные нарушения если есть данные
      if (res.data.summary && res.data.summary.total_violations > 0) {
        try {
          const groupedRes = await axios.get(`${API_URL}/api/v1/scan/${id}/grouped`);
          setGroupedViolations(groupedRes.data);
        } catch (err) {
          console.error('Failed to load grouped violations', err);
        }
      }

      if (res.data.status === 'started' || res.data.status === 'in_progress') {
        setTimeout(() => checkStatus(id), 2000);
      }
    } catch (err: unknown) {
      console.error(err);
    }
  };

  const filteredViolations = useMemo(() => {
    if (!result) return [];
    
    let filtered = [...result.violations];

    // Динамическая фильтрация по списком брендов
    const trademarkNormalForms = new Set(trademarks.map(t => t.normal_form));

    filtered = filtered.map(v => {
      // Если это "ошибка", но нормальная форма в списке брендов — меняем тип
      if ((v.type === 'foreign_word' || v.type === 'unrecognized_word' || v.type === 'possible_trademark') && v.normal_form) {
        if (trademarkNormalForms.has(v.normal_form)) {
          return { ...v, type: 'trademark' };
        }
      }
      return v;
    });

    // Фильтр по типу (после динамического маппинга!)
    if (typeFilter.length > 0) {
      filtered = filtered.filter(v => typeFilter.includes(v.type));
    }

    // Фильтр по слову
    if (searchFilter) {
      const q = searchFilter.toLowerCase();
      // Strict URL match if query starts with http
      if (q.startsWith('http')) {
        filtered = filtered.filter(v => v.page_url?.toLowerCase() === q);
      } else {
        filtered = filtered.filter(v => 
          (v.word && v.word.toLowerCase().includes(q)) ||
          (v.text_context && v.text_context.toLowerCase().includes(q)) ||
          (v.page_url && v.page_url.toLowerCase().includes(q))
        );
      }
    }

    return filtered;
  }, [result, trademarks, searchFilter, typeFilter]);

  // Фильтрация сгруппированных данных
  const filteredGrouped = useMemo(() => {
    let filtered = [...groupedViolations];

    // Динамическая фильтрация по списком брендов
    const trademarkNormalForms = new Set(trademarks.map(t => t.normal_form));

    filtered = filtered.map(v => {
      if ((v.type === 'foreign_word' || v.type === 'unrecognized_word' || v.type === 'possible_trademark') && v.normal_form) {
        if (trademarkNormalForms.has(v.normal_form)) {
          return { ...v, type: 'trademark' };
        }
      }
      return v;
    });

    // Фильтр по типу
    if (typeFilter.length > 0) {
      filtered = filtered.filter(v => typeFilter.includes(v.type));
    }

    // Фильтр по поиску (уже применен к основной таблице, но для группировки дублируем если нужно)
    if (searchFilter) {
      const q = searchFilter.toLowerCase();
      filtered = filtered.filter(v => 
        (v.word && v.word.toLowerCase().includes(q)) ||
        (v.text_context && v.text_context.toLowerCase().includes(q)) ||
        (v.page_url && v.page_url.toLowerCase().includes(q))
      );
    }

    return filtered;
  }, [groupedViolations, typeFilter, searchFilter, trademarks]);

  // Пагинация для отфильтрованных сгруппированных данных
  const paginatedGrouped = useMemo(() => {
    const start = (activePage - 1) * itemsPerPage;
    return filteredGrouped.slice(start, start + itemsPerPage);
  }, [filteredGrouped, activePage, itemsPerPage]);

  const translateType = (type: string) => {
    switch(type) {
      case 'foreign_word': return 'Иностранная лексика';
      case 'no_russian_dub': return 'Отсутствие перевода';
      case 'unrecognized_word': return 'Опечатка / Не распознано';
      case 'trademark': return 'Товарный знак';
      case 'possible_trademark': return 'Потенциальный бренд';
      default: return type;
    }
  };

  const getTypeColor = (type: string) => {
    switch(type) {
      case 'foreign_word': return 'red';
      case 'no_russian_dub': return 'red';
      case 'unrecognized_word': return 'violet';
      case 'trademark': return 'green';
      case 'possible_trademark': return 'yellow';
      default: return 'gray';
    }
  };

  const exportXLSX = () => {
    if (!result || filteredViolations.length === 0) {
      notifications.show({ title: 'Предупреждение', message: 'Нет данных для экспорта с учетом текущих фильтров', color: 'orange' });
      return;
    }
    
    const data = filteredViolations.map(v => ({
      'ID': v.id,
      'URL страницы': v.page_url,
      'Тип': translateType(v.type),
      'Слово': v.word || 'N/A',
      'Контекст': v.text_context,
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Нарушения");

    worksheet["!cols"] = [
      { wch: 8 },  // ID
      { wch: 50 }, // URL
      { wch: 30 }, // Тип
      { wch: 25 }, // Слово
      { wch: 80 }, // Контекст
      { wch: 50 }  // Скриншот
    ];

    XLSX.writeFile(workbook, `violations_${new Date().toISOString().split('T')[0]}.xlsx`);
    notifications.show({ title: 'Экспорт', message: `Файл Excel (${data.length} строк) успешно создан`, color: 'green' });
  };

  const exportPDF = () => {
    if (!result || filteredViolations.length === 0) return;
    const doc = new jsPDF();
    doc.text(`Отчет о нарушениях: ${url}`, 14, 15);
    const tableData = filteredViolations.map(v => [
      translateType(v.type),
      v.word || 'N/A',
      v.text_context.substring(0, 100) + (v.text_context.length > 100 ? '...' : '')
    ]);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (doc as any).autoTable({
      head: [['Тип', 'Слово', 'Контекст']],
      body: tableData,
      startY: 20,
      styles: { fontSize: 8, cellPadding: 2 },
      columnStyles: { 2: { cellWidth: 100 } }
    });
    doc.save(`violations_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  return (
    <Stack gap="xl">
      <Helmet>
        <title>Сканирование сайтов — LinguaCheck RU</title>
        <meta name="description" content="Глубокий анализ сайтов на соответствие нормам русского языка и ФЗ №168-ФЗ." />
      </Helmet>
      <Stack gap={0}>
        <Title order={2}>Сканирование сайтов</Title>
        <Text c="dimmed">Глубокий анализ доменных зон на соответствие ФЗ №168‑ФЗ</Text>
      </Stack>

      <Paper p="xl" withBorder radius="md">
        <Group align="flex-end">
          <Tooltip label="Введите адрес сайта для проверки на соответствие ФЗ №168-ФЗ" withArrow position="top">
            <TextInput
              label="URL сайта"
              placeholder="https://example.com"
              value={url}
              onChange={(e) => setUrl(e.currentTarget.value)}
              style={{ flex: 1 }}
              leftSection={<IconSearch size={16} />}
            />
          </Tooltip>
          <Tooltip label="Количество уровней ссылок для проверки (1-5)" withArrow position="top">
            <NumberInput
              label="Глубина"
              min={1}
              max={5}
              value={depth}
              onChange={setDepth}
              w={80}
            />
          </Tooltip>
          <Tooltip label="Лимит страниц для проверки (1-1000)" withArrow position="top">
            <NumberInput
              label="Лимит страниц"
              min={1}
              max={1000}
              value={maxPages}
              onChange={setMaxPages}
              w={120}
            />
          </Tooltip>
        </Group>
        <Group mt="md" justify="flex-end">
          <Button 
            size="lg" 
            onClick={startScan} 
            loading={loading} 
            disabled={!url}
            leftSection={<IconSearch size={20} />}
          >
            Запустить проверку
          </Button>
        </Group>
      </Paper>

      {result && (
        <Stack gap="lg">
          <Group justify="space-between">
            <Title order={3}>Результаты</Title>
            <Group>
               <Button leftSection={<IconFileSpreadsheet size={16}/>} variant="light" color="green" onClick={exportXLSX}>Экспорт Excel</Button>
               <Button leftSection={<IconFileTypePdf size={16}/>} variant="light" color="red" onClick={exportPDF}>Экспорт PDF</Button>
            </Group>
          </Group>

          <SimpleGrid cols={{ base: 1, sm: 4 }} spacing="md">
            <CardStat label="Страниц проверено" value={result.summary.total_pages} icon={<IconCheck color="teal" />} />
            <CardStat label="С нарушениями" value={result.summary.pages_with_violations} icon={<IconAlertTriangle color="orange" />} />
            <CardStat label="Всего нарушений" value={result.summary.total_violations} icon={<IconAlertTriangle color="red" />} />
            <CardStat label="Исключено брендов" value={result.violations.filter(v => v.normal_form && trademarks.some(t => t.normal_form === v.normal_form)).length} icon={<IconBookmark color="green" />} />
          </SimpleGrid>

          {result.status === 'in_progress' && (
            <Alert icon={<IconSearch size={16} />} title={`Идет сканирование...`} color="blue">
              <Stack gap="xs">
                <Text size="sm">
                  Обработано: {result.summary.total_pages} {result.summary.total_pages === 1 ? 'страница' : result.summary.total_pages < 5 ? 'страницы' : 'страниц'}
                  {result.summary.pending_pages ? ` (+ ${result.summary.pending_pages} в очереди)` : ''}
                </Text>
                <Progress 
                  value={result.summary.total_pages + (result.summary.pending_pages || 0) > 0 
                    ? (result.summary.total_pages / (result.summary.total_pages + (result.summary.pending_pages || 0)) * 100) 
                    : 10} 
                  animated 
                  mt="sm" 
                />
              </Stack>
            </Alert>
          )}

          <Title order={3}>Нарушения и товарные знаки</Title>

          {groupedViolations.length > 0 && (
            <Alert icon={<IconCheck size={16} />} color="green" title="Оптимизированный режим">
              Показано {groupedViolations.length} сгруппированных нарушений вместо {result?.summary.total_violations || 0} (экономия {Math.round((1 - groupedViolations.length / (result?.summary.total_violations || 1)) * 100)}%)
            </Alert>
          )}

          <Paper p="md" withBorder radius="md">
            <Group align="flex-end">
              <TextInput
                placeholder="Поиск по слову, контексту или URL..."
                label="Поиск"
                value={searchFilter}
                onChange={(e) => { setSearchFilter(e.currentTarget.value); setPage(1); }}
                style={{ flex: 1 }}
                leftSection={<IconFilter size={16} />}
                rightSection={searchFilter ? <IconX size={14} style={{ cursor: 'pointer' }} onClick={() => setSearchFilter('')} /> : null}
              />
                <MultiSelect
                  label="Типы нарушений"
                  placeholder="Все типы"
                  data={[
                    { value: 'foreign_word', label: 'Иностранная лексика' },
                    { value: 'unrecognized_word', label: 'Опечатки' },
                    { value: 'no_russian_dub', label: 'Без перевода' },
                    { value: 'trademark', label: 'Товарные знаки' },
                    { value: 'possible_trademark', label: 'Потенциальный бренд' },
                  ]}
                  value={typeFilter}
                  onChange={(val) => { setTypeFilter(val); setPage(1); }}
                  style={{ width: 250 }}
                  clearable
                />
                <Group gap="sm">
                  <Button variant="default" onClick={() => { setTypeFilter([]); setSearchFilter(''); setPage(1); }}>Сбросить фильтры</Button>
                </Group>
              </Group>
          </Paper>

          {groupedViolations.length === 0 ? (
            <Paper p="xl" withBorder radius="md">
              <Center><Text c="dimmed">Нарушений не найдено по вашему фильтру</Text></Center>
            </Paper>
          ) : (
            <>
              <div style={{ overflowX: 'auto' }}>
                <Table highlightOnHover withTableBorder striped>
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>Слово</Table.Th>
                      <Table.Th w={150}>Повторений</Table.Th>
                      <Table.Th w={200}>Тип нарушения</Table.Th>
                      <Table.Th>Страница</Table.Th>
                      <Table.Th>Контекст</Table.Th>
                      <Table.Th w={150} align="right">Действия</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {paginatedGrouped.map((v) => (
                      <Table.Tr key={v.id}>
                        <Table.Td>
                          <Text fw={700} size="sm">{v.word || 'N/A'}</Text>
                        </Table.Td>
                        <Table.Td>
                          <Badge color={v.count > 50 ? 'red' : v.count > 10 ? 'orange' : 'blue'} size="lg">
                            x{v.count}
                          </Badge>
                        </Table.Td>
                        <Table.Td>
                          <Badge color={getTypeColor(v.type)} variant="dot" size="sm">
                            {translateType(v.type)}
                          </Badge>
                        </Table.Td>
                        <Table.Td>
                          <Tooltip label={v.page_url}>
                            <Text size="xs" c="blue" style={{ textDecoration: 'underline', cursor: 'pointer' }}
                                  onClick={() => window.open(v.page_url, '_blank')}>
                              {v.page_url.length > 50 ? v.page_url.substring(0, 50) + '...' : v.page_url}
                            </Text>
                          </Tooltip>
                        </Table.Td>
                        <Table.Td>
                          <Text size="xs" c="dimmed" lineClamp={2} title={v.text_context}>
                            {v.text_context}
                          </Text>
                        </Table.Td>
                        <Table.Td>
                          <Group gap="xs" justify="flex-end">
                            <Tooltip label="В бренды">
                              <UnstyledButton onClick={() => addTrademark(v.word || v.normal_form || '')}>
                                <IconBookmark size={18} color="blue" />
                              </UnstyledButton>
                            </Tooltip>
                            <Tooltip label="В исключения">
                              <UnstyledButton onClick={() => addException(v.word || v.normal_form || '')}>
                                <IconShieldCheck size={18} color="green" />
                              </UnstyledButton>
                            </Tooltip>
                          </Group>
                        </Table.Td>
                      </Table.Tr>
                    ))}
                  </Table.Tbody>
                </Table>
              </div>

              {filteredGrouped.length > itemsPerPage && (
                <Group justify="center" p="md" mt="md">
                  <Pagination 
                    total={Math.ceil(filteredGrouped.length / itemsPerPage)} 
                    value={activePage} 
                    onChange={setPage} 
                  />
                </Group>
              )}
            </>
          )}
        </Stack>
      )}

    </Stack>
  );
}

function CardStat({ label, value, icon }: { label: string; value: number; icon: React.ReactNode }) {
  return (
    <Paper p="xl" withBorder radius="md">
      <Group justify="space-between">
        <Text size="xs" c="dimmed" fw={700} tt="uppercase">{label}</Text>
        {icon}
      </Group>
      <Text size="xl" fw={700} mt="sm">{value}</Text>
    </Paper>
  );
}
