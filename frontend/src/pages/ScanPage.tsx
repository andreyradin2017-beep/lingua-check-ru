import React, { useState, useMemo, useEffect } from 'react';
import { Title, Stack, Group, SimpleGrid, Badge, Text, TextInput, NumberInput, Paper, Table, Progress, Alert, Button, Modal, Image, Pagination, Checkbox, UnstyledButton, Center, MultiSelect, Box, Code, Collapse } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconSearch, IconAlertTriangle, IconCheck, IconExternalLink, IconPhoto, IconFileSpreadsheet, IconFileTypePdf, IconFilter, IconX, IconBookmark, IconTrash, IconChevronDown, IconChevronRight } from '@tabler/icons-react';
import { useSearchParams } from 'react-router-dom';
import { notifications } from '@mantine/notifications';
import axios from 'axios';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';


interface Violation {
  id: string;
  type: string;
  page_url?: string;
  text_context: string;
  word?: string;
  normal_form?: string;
  visual_weight_foreign: number;
  visual_weight_rus: number;
  screenshot_path?: string;
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
  };
  pages: Page[];
  violations: Violation[];
}

interface Trademark {
  id: string;
  word: string;
  normal_form: string;
}

export default function ScanPage() {
  const [url, setUrl] = useState('');
  const [depth, setDepth] = useState<number | string>(2);
  const [captureScreenshots, setCaptureScreenshots] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [opened, { open, close }] = useDisclosure(false);
  const [selectedScreenshot, setSelectedScreenshot] = useState<string | null>(null);
  
  // Бренды
  const [trademarks, setTrademarks] = useState<Trademark[]>([]);
  const [brandsModalOpened, { open: openBrands, close: closeBrands }] = useDisclosure(false);
  const [newBrand, setNewBrand] = useState('');
  const [addingBrand, setAddingBrand] = useState(false);
  const [bulkLoading, setBulkLoading] = useState(false);
  
  const [activePage, setPage] = useState(1);
  const [searchParams] = useSearchParams();

  // Фильтры
  const [searchFilter, setSearchFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState<string[]>([]);
  
  // Expandable Table
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});

  const toggleExpand = (url: string) => {
    setExpandedGroups((prev) => ({
      ...prev,
      [url]: !prev[url],
    }));
  };

  const expandAll = () => {
    const allExp: Record<string, boolean> = {};
    if (typeof paginatedGroups !== 'undefined') {
      paginatedGroups.forEach((g) => {
        allExp[g.url] = true;
      });
    }
    setExpandedGroups(allExp);
  };

  const collapseAll = () => {
    setExpandedGroups({});
  };

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
      const res = await axios.get('http://127.0.0.1:8000/api/v1/trademarks');
      setTrademarks(res.data);
    } catch (err: unknown) {
      console.error('Failed to fetch trademarks', err);
    }
  };

  const addTrademark = async (word: string) => {
    if (!word) return;
    setAddingBrand(true);
    try {
      await axios.post('http://127.0.0.1:8000/api/v1/trademarks', { word });
      notifications.show({ title: 'Бренд добавлен', message: `Слово "${word}" теперь исключено из нарушений`, color: 'green' });
      setNewBrand('');
      await fetchTrademarks();
    } catch (err: unknown) {
      const msg = axios.isAxiosError(err) ? err.response?.data?.detail || err.message : String(err);
      notifications.show({ title: 'Ошибка', message: msg, color: 'red' });
    } finally {
      setAddingBrand(false);
    }
  };

  const deleteTrademark = async (id: string) => {
    try {
      await axios.delete(`http://127.0.0.1:8000/api/v1/trademarks/${id}`);
      await fetchTrademarks();
    } catch (err: unknown) {
      const msg = axios.isAxiosError(err) ? err.message : String(err);
      notifications.show({ title: 'Ошибка', message: msg, color: 'red' });
    }
  };

  const addBulkTrademarks = async () => {
    setBulkLoading(true);
    try {
      const toAdd = new Set<string>();
      filteredViolations.forEach(v => {
        if (v.type !== 'trademark' && (v.normal_form || v.word)) {
           toAdd.add(v.normal_form || v.word || '');
        }
      });
      
      const wordsArray = Array.from(toAdd).filter(Boolean);
      if (wordsArray.length === 0) {
        notifications.show({ title: 'Информация', message: 'Не найдено новых слов для добавления', color: 'blue' });
        return;
      }
      
      // Use Promise.allSettled for bulk addition
      await Promise.allSettled(wordsArray.map(word => axios.post('http://127.0.0.1:8000/api/v1/trademarks', { word })));
      
      notifications.show({ title: 'Успех', message: `Массовое добавление завершено (${wordsArray.length} уникальных слов)`, color: 'green' });
      await fetchTrademarks();
    } catch (err: unknown) {
       console.error(err);
    } finally {
      setBulkLoading(false);
    }
  };

  const startScan = async () => {
    let targetUrl = url.trim();
    if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
      notifications.show({ title: 'Ошибка', message: 'Укажите полный URL (с http:// или https://)', color: 'orange' });
      return;
    }
    
    setLoading(true);
    setResult(null);
    setPage(1);
    try {
      const res = await axios.post('http://127.0.0.1:8000/api/v1/scan', {
        url: targetUrl,
        max_depth: Number(depth),
        capture_screenshots: captureScreenshots,
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

  const checkStatus = async (id: string) => {
    try {
      const res = await axios.get(`http://127.0.0.1:8000/api/v1/scan/${id}`);
      setResult(res.data);
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

    // Сортировка нарушений внутри групп будет фиксированной (по типу)
    return filtered;
  }, [result, typeFilter, searchFilter, trademarks]);

  const groupedViolations = useMemo(() => {
    if (!result) return [];
    
    // Группировка
    const groupsMap: { [key: string]: Violation[] } = {};
    filteredViolations.forEach(v => {
      const gUrl = v.page_url || 'Unknown URL';
      if (!groupsMap[gUrl]) groupsMap[gUrl] = [];
      groupsMap[gUrl].push(v);
    });

    const groups = Object.entries(groupsMap).map(([url, violations]) => {
      // Предсказуемая сортировка ВНУТРИ группы (по типу)
      violations.sort((a, b) => a.type.localeCompare(b.type));
      return { url, violations };
    });

    // Оставляем простую алфавитную сортировку по умолчанию для порядка
    groups.sort((a, b) => a.url.localeCompare(b.url));

    return groups;
  }, [filteredViolations, result]);

  const paginatedGroups = useMemo(() => {
    const start = (activePage - 1) * itemsPerPage;
    return groupedViolations.slice(start, start + itemsPerPage);
  }, [groupedViolations, activePage]);


  const translateType = (type: string) => {
    switch(type) {
      case 'foreign_word': return 'Иностранная лексика';
      case 'no_russian_dub': return 'Отсутствие перевода';
      case 'unrecognized_word': return 'Опечатка / Не распознано';
      case 'visual_dominance': return 'Доминирование иностранного';
      case 'trademark': return 'Товарный знак';
      case 'possible_trademark': return 'Потенциальный бренд / ТМ';
      default: return type;
    }
  };

  const getTypeColor = (type: string) => {
    switch(type) {
      case 'foreign_word': return 'red';
      case 'no_russian_dub': return 'red';
      case 'unrecognized_word': return 'violet';
      case 'visual_dominance': return 'orange';
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
      'Вес (ино)': (v.visual_weight_foreign !== undefined && v.visual_weight_foreign !== null) ? v.visual_weight_foreign : 0,
      'Вес (рус)': (v.visual_weight_rus !== undefined && v.visual_weight_rus !== null) ? v.visual_weight_rus : 0,
      'Скриншот': v.screenshot_path ? `http://127.0.0.1:8000${v.screenshot_path}` : 'N/A'
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Нарушения");
    
    // Improved width adjustment
    worksheet["!cols"] = [ 
      { wch: 8 },  // ID
      { wch: 50 }, // URL
      { wch: 30 }, // Тип
      { wch: 25 }, // Слово
      { wch: 80 }, // Контекст
      { wch: 12 }, // Вес ино
      { wch: 12 }, // Вес рус
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
      <Stack gap={0}>
        <Title order={2}>Сканирование сайтов</Title>
        <Text c="dimmed">Глубокий анализ доменных зон на соответствие ФЗ №168‑ФЗ</Text>
      </Stack>

      <Paper p="xl" withBorder radius="md">
        <Group align="flex-end">
          <TextInput
            label="URL сайта"
            placeholder="https://example.com"
            value={url}
            onChange={(e) => setUrl(e.currentTarget.value)}
            style={{ flex: 1 }}
            leftSection={<IconSearch size={16} />}
          />
          <NumberInput
            label="Глубина"
            min={1}
            max={5}
            value={depth}
            onChange={setDepth}
            w={80}
          />
        </Group>
        <Group mt="md" justify="space-between">
          <Checkbox 
            label="Делать скриншоты нарушений (может замедлить сканирование)" 
            checked={captureScreenshots} 
            onChange={(e) => setCaptureScreenshots(e.currentTarget.checked)}
          />
          <Button onClick={startScan} loading={loading} disabled={!url}>Запустить</Button>
        </Group>
      </Paper>

      {result && (
        <Stack gap="lg">
          <Group justify="space-between">
            <Title order={3}>Результаты</Title>
            <Group>
               <Button leftSection={<IconBookmark size={16}/>} variant="outline" color="blue" onClick={openBrands}>Бренды ({trademarks.length})</Button>
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
            <Alert icon={<IconSearch size={16} />} title={`Идет сканирование... (проверено ${result.pages?.length || 0} стр.)`} color="blue">
              <Progress value={result.pages?.length ? Math.min(100, (result.pages.length / 100) * 100) : 10} animated mt="sm" />
            </Alert>
          )}

          <Title order={3}>Нарушения и товарные знаки</Title>
          
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
                    { value: 'visual_dominance', label: 'Доминирование' },
                    { value: 'possible_trademark', label: 'Потенциальный бренд' },
                  ]}
                  value={typeFilter}
                  onChange={(val) => { setTypeFilter(val); setPage(1); }}
                  style={{ width: 250 }}
                  clearable
                />
                <Group gap="sm">
                  <Button variant="default" onClick={() => { setTypeFilter([]); setSearchFilter(''); setPage(1); }}>Сбросить фильтры</Button>
                  <Button variant="outline" color="gray" onClick={expandAll}>Развернуть все</Button>
                  <Button variant="outline" color="gray" onClick={collapseAll}>Свернуть все</Button>
                  {filteredViolations.length > 0 && filteredViolations.some(v => v.type !== 'trademark') && (
                    <Button variant="light" color="blue" leftSection={<IconBookmark size={16}/>} onClick={addBulkTrademarks} loading={bulkLoading}>
                      Все в бренды
                    </Button>
                  )}
                </Group>
              </Group>
          </Paper>

          {groupedViolations.length === 0 ? (
            <Paper p="xl" withBorder radius="md">
              <Center><Text c="dimmed">Нарушений не найдено по вашему фильтру</Text></Center>
            </Paper>
          ) : (
            <>
              <Table 
                highlightOnHover 
                withTableBorder 
                withColumnBorders 
                withRowBorders 
                striped 
                verticalSpacing="xs"
              >
                <Table.Thead bg="gray.1">
                  <Table.Tr>
                    <Table.Th w={40} style={{ paddingLeft: '12px' }}></Table.Th>
                    <Table.Th style={{ fontSize: '13px', textTransform: 'uppercase' }}>URL страницы</Table.Th>
                    <Table.Th w={200} align="center" style={{ textAlign: 'center', fontSize: '13px', textTransform: 'uppercase' }}>Нарушений</Table.Th>
                    <Table.Th w={100} align="right" style={{ textAlign: 'right', fontSize: '13px', textTransform: 'uppercase', paddingRight: '12px' }}>Действие</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                {paginatedGroups.map((group) => {
                  const isExpanded = !!expandedGroups[group.url];
                  return (
                    <React.Fragment key={group.url}>
                      {/* Master Row */}
                      <Table.Tr 
                        onClick={() => toggleExpand(group.url)}
                        style={{ 
                          cursor: "pointer", 
                          backgroundColor: isExpanded ? "var(--mantine-color-blue-0)" : undefined,
                          transition: "background-color 0.2s ease"
                        }}
                      >
                        <Table.Td style={{ paddingLeft: '12px', borderBottom: isExpanded ? '0' : undefined }}>
                          {isExpanded ? <IconChevronDown size={18} color="blue" /> : <IconChevronRight size={18} color="dimmed" />}
                        </Table.Td>
                        <Table.Td style={{ borderBottom: isExpanded ? '0' : undefined }}>
                          <Text fw={600} size="sm" style={{ wordBreak: "break-all" }}>
                            {group.url}
                          </Text>
                        </Table.Td>
                        <Table.Td align="center" style={{ textAlign: 'center', borderBottom: isExpanded ? '0' : undefined }}>
                          <Badge variant="filled" color={group.violations.length > 0 ? "red" : "gray"} size="sm">
                            {group.violations.length}
                          </Badge>
                        </Table.Td>
                        <Table.Td align="right" style={{ textAlign: 'right', paddingRight: '12px', borderBottom: isExpanded ? '0' : undefined }}>
                          <UnstyledButton
                            component="a"
                            href={group.url}
                            target="_blank"
                            title="Перейти на страницу"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <IconExternalLink size={18} color="var(--mantine-color-blue-6)" />
                          </UnstyledButton>
                        </Table.Td>
                      </Table.Tr>
                      
                      {/* Detail Row */}
                      <Table.Tr style={{ display: isExpanded ? "table-row" : "none" }}>
                        <Table.Td colSpan={4} p={0} bg="blue.0" style={{ borderTop: 0 }}>
                          <Collapse in={isExpanded}>
                      {/* Desktop Table (inner) */}
                      <Box visibleFrom="sm" p="sm" pl={40} pr="md" pb="md">
                        <Paper withBorder radius="md" p={0} style={{ overflow: 'hidden' }}>
                        <Table 
                          highlightOnHover 
                          withColumnBorders 
                          verticalSpacing="xs"
                          style={{ border: 0 }}
                        >
                          <Table.Thead bg="gray.0">
                            <Table.Tr>
                              <Table.Th style={{ fontSize: '11px', textTransform: 'uppercase' }}>Тип нарушения</Table.Th>
                              <Table.Th style={{ fontSize: '11px', textTransform: 'uppercase' }}>Проблемное слово</Table.Th>
                              <Table.Th style={{ fontSize: '11px', textTransform: 'uppercase' }}>Контекст</Table.Th>
                              <Table.Th style={{ fontSize: '11px', textTransform: 'uppercase' }}>Вес (%)</Table.Th>
                              <Table.Th align="right" style={{ textAlign: 'right', fontSize: '11px', textTransform: 'uppercase' }}>Действия</Table.Th>
                            </Table.Tr>
                          </Table.Thead>
                          <Table.Tbody>
                            {group.violations.map((v) => (
                              <Table.Tr key={v.id}>
                                <Table.Td>
                                  <Badge color={getTypeColor(v.type)} variant="light" size="sm" fullWidth style={{ whiteSpace: 'normal', height: 'auto', padding: '4px 8px' }}>
                                    {translateType(v.type)}
                                  </Badge>
                                </Table.Td>
                                <Table.Td>
                                  <Text fw={500} size="sm">{v.word || 'N/A'}</Text>
                                </Table.Td>
                                <Table.Td>
                                  <Text size="xs" c="dimmed" lineClamp={2} title={v.text_context}>
                                    {v.text_context}
                                  </Text>
                                </Table.Td>
                                <Table.Td>
                                  <Group gap={5}>
                                    {v.visual_weight_foreign > 0 ? (
                                      <Badge size="xs" variant="outline" color="red">EN: {v.visual_weight_foreign}%</Badge>
                                    ) : null}
                                    {v.visual_weight_rus > 0 ? (
                                      <Badge size="xs" variant="outline" color="teal">RU: {v.visual_weight_rus}%</Badge>
                                    ) : null}
                                    {v.visual_weight_foreign === 0 && v.visual_weight_rus === 0 && <Text size="xs" c="dimmed">—</Text>}
                                  </Group>
                                </Table.Td>
                                <Table.Td align="right">
                                  <Group gap="xs" justify="flex-end">
                                    {v.screenshot_path && (
                                      <UnstyledButton onClick={() => { setSelectedScreenshot(v.screenshot_path || null); open(); }} title="Посмотреть скриншот">
                                        <IconPhoto size={18} color="var(--mantine-color-blue-filled)" />
                                      </UnstyledButton>
                                    )}
                                    {v.type !== 'trademark' && (
                                      <UnstyledButton onClick={() => addTrademark(v.word || v.normal_form || '')} title="Пометить как бренд">
                                        <IconBookmark size={18} color="var(--mantine-color-blue-6)" />
                                      </UnstyledButton>
                                    )}
                                    <UnstyledButton component="a" href={v.page_url} target="_blank" title="Перейти на страницу">
                                      <IconExternalLink size={18} color="var(--mantine-color-gray-6)" />
                                    </UnstyledButton>
                                  </Group>
                                </Table.Td>
                              </Table.Tr>
                            ))}
                          </Table.Tbody>
                        </Table>
                        </Paper>
                      </Box>

                      {/* Mobile Cards */}
                      <Stack gap="sm" hiddenFrom="sm">
                        {group.violations.map((v) => (
                          <Paper key={v.id} p="sm" withBorder radius="md" bg="var(--mantine-color-gray-0)">
                            <Group justify="space-between" mb="xs">
                              <Badge color={getTypeColor(v.type)} variant="light" size="xs">
                                {translateType(v.type)}
                              </Badge>
                              <Group gap="xs">
                                {v.screenshot_path && (
                                  <UnstyledButton onClick={() => { setSelectedScreenshot(v.screenshot_path || null); open(); }}>
                                    <IconPhoto size={16} color="blue" />
                                  </UnstyledButton>
                                )}
                                <UnstyledButton component="a" href={v.page_url} target="_blank">
                                  <IconExternalLink size={16} color="gray" />
                                </UnstyledButton>
                              </Group>
                            </Group>
                            <Text fw={600} size="sm" mb={4}>{v.word || 'N/A'}</Text>
                            <Text size="xs" c="dimmed" lineClamp={3} mb="xs">{v.text_context}</Text>
                            <Group gap={5}>
                               {v.visual_weight_foreign > 0 && <Badge size="xs" variant="outline" color="red">EN: {v.visual_weight_foreign}%</Badge>}
                               {v.visual_weight_rus > 0 && <Badge size="xs" variant="outline" color="teal">RU: {v.visual_weight_rus}%</Badge>}
                               {v.type !== 'trademark' && (
                                 <Button variant="subtle" size="compact-xs" leftSection={<IconBookmark size={12}/>} onClick={() => addTrademark(v.word || v.normal_form || '')}>В бренды</Button>
                               )}
                            </Group>
                          </Paper>
                        ))}
                      </Stack>
                            </Collapse>
                        </Table.Td>
                      </Table.Tr>
                    </React.Fragment>
                  );
                })}
              </Table.Tbody>
            </Table>

              {groupedViolations.length > itemsPerPage && (
                <Group justify="center" p="md" mt="md">
                  <Pagination 
                    total={Math.ceil(groupedViolations.length / itemsPerPage)} 
                    value={activePage} 
                    onChange={setPage} 
                  />
                </Group>
              )}
            </>
          )}
        </Stack>
      )}

      <Modal opened={opened} onClose={close} title="Визуальное подтверждение нарушения" size="xl">
        {selectedScreenshot ? (
          <Image
            src={`http://127.0.0.1:8000${selectedScreenshot}`}
            alt="Violation Screenshot"
            fallbackSrc="https://placehold.co/600x400?text=Screenshot+Not+Found"
          />
        ) : (
          <Text>Скриншот не найден</Text>
        )}
      </Modal>

      <Modal opened={brandsModalOpened} onClose={closeBrands} title="Управление брендами и исключениями" size="lg">
        <Stack>
          <Group align="flex-end">
            <TextInput 
              label="Добавить новый бренд" 
              placeholder="Введите название бренда" 
              value={newBrand} 
              onChange={(e) => setNewBrand(e.currentTarget.value)}
              style={{ flex: 1 }}
            />
            <Button onClick={() => addTrademark(newBrand)} loading={addingBrand}>Добавить</Button>
          </Group>

          <Table highlightOnHover mt="md">
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Бренд (оригинал)</Table.Th>
                <Table.Th>Нормальная форма</Table.Th>
                <Table.Th w={50}></Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {trademarks.length === 0 ? (
                <Table.Tr><Table.Td colSpan={3} align="center"><Text c="dimmed" size="sm">Список пуст</Text></Table.Td></Table.Tr>
              ) : (
                trademarks.map(tm => (
                  <Table.Tr key={tm.id}>
                    <Table.Td>{tm.word}</Table.Td>
                    <Table.Td><Code>{tm.normal_form}</Code></Table.Td>
                    <Table.Td>
                      <UnstyledButton onClick={() => deleteTrademark(tm.id)}>
                        <IconTrash size={16} color="red" />
                      </UnstyledButton>
                    </Table.Td>
                  </Table.Tr>
                ))
              )}
            </Table.Tbody>
          </Table>
        </Stack>
      </Modal>
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
