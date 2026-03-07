import re

path = 'frontend/src/pages/ScanPage.tsx'
with open(path, 'r', encoding='utf-8') as f:
    text = f.read()

# 1. Imports
text = text.replace(
    "import { Accordion } from '@mantine/core';",
    "import { Collapse } from '@mantine/core';"
)

text = text.replace(
    "IconInfoCircle,\n} from '@tabler/icons-react';",
    "IconInfoCircle,\n  IconChevronDown,\n  IconChevronRight,\n} from '@tabler/icons-react';"
)

# 2. State definition under typeFilter
state_find = """  const [typeFilter, setTypeFilter] = useState<string[]>([]);

  const itemsPerPage = 10;"""
state_replace = """  const [typeFilter, setTypeFilter] = useState<string[]>([]);

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

  const itemsPerPage = 10;"""
text = text.replace(state_find, state_replace)


# 3. Add expandAll / collapseAll buttons 
btn_find = """                <Button variant="default" onClick={() => { setTypeFilter([]); setSearchFilter(''); setPage(1); }}>Сбросить фильтры</Button>
                {filteredViolations.length > 0"""
btn_replace = """                <Button variant="default" onClick={() => { setTypeFilter([]); setSearchFilter(''); setPage(1); }}>Сбросить фильтры</Button>
                <Button variant="outline" color="gray" onClick={expandAll}>Развернуть все</Button>
                <Button variant="outline" color="gray" onClick={collapseAll}>Свернуть все</Button>
                {filteredViolations.length > 0"""
text = text.replace(btn_find, btn_replace)

# 4. Replace Accordion with Table
accordion_find = """            <>
              <Accordion variant="separated" radius="md">
                {paginatedGroups.map((group) => (
                  <Accordion.Item key={group.url} value={group.url}>
                    <Accordion.Control>
                      <Group justify="space-between" pr="md">
                        <Box style={{ flex: 1, overflow: 'hidden' }}>
                          <Text size="sm" fw={500} style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                            {group.url}
                          </Text>
                        </Box>
                        <Badge variant="light" color="orange">
                          {group.violations.length} {group.violations.length === 1 ? 'нарушение' : (group.violations.length < 5 ? 'нарушения' : 'нарушений')}
                        </Badge>
                      </Group>
                    </Accordion.Control>
                    <Accordion.Panel>
                      {/* Desktop Table */}
                      <Box visibleFrom="sm">
                        <Table highlightOnHover withTableBorder>
                          <Table.Thead>
                            <Table.Tr>
                              <Table.Th w={200}>Тип</Table.Th>
                              <Table.Th w={180}>Слово</Table.Th>
                              <Table.Th>Контекст</Table.Th>
                              <Table.Th w={120}>Вес</Table.Th>
                              <Table.Th w={110} align="right">Действие</Table.Th>
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
                                  <Text size="xs" c="dimmed" lineClamp={2} title={v.text_context}>{v.text_context}</Text>
                                </Table.Td>
                                <Table.Td>
                                  <Group gap={5}>
                                    {v.visual_weight_foreign > 0 ? <Badge size="xs" variant="outline" color="red">EN: {v.visual_weight_foreign}%</Badge> : null}
                                    {v.visual_weight_rus > 0 ? <Badge size="xs" variant="outline" color="teal">RU: {v.visual_weight_rus}%</Badge> : null}
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
                    </Accordion.Panel>
                  </Accordion.Item>
                ))}
              </Accordion>"""


import sys
accordion_replace = """            <>
              <Table highlightOnHover withTableBorder>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th w={40}></Table.Th>
                    <Table.Th>URL страницы</Table.Th>
                    <Table.Th w={200} align="center">Нарушений</Table.Th>
                    <Table.Th w={100} align="right">Действие</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {paginatedGroups.map((group) => {
                    const isExpanded = !!expandedGroups[group.url];
                    return (
                      <import_react_fragment key={group.url}>
                        <Table.Tr 
                          onClick={() => toggleExpand(group.url)}
                          style={{ cursor: "pointer", backgroundColor: isExpanded ? "var(--mantine-color-blue-0)" : undefined }}
                        >
                          <Table.Td>
                            {isExpanded ? <IconChevronDown size={18} color="dimmed" /> : <IconChevronRight size={18} color="dimmed" />}
                          </Table.Td>
                          <Table.Td>
                            <Text fw={500} style={{ wordBreak: "break-all" }}>
                              {group.url}
                            </Text>
                          </Table.Td>
                          <Table.Td align="center">
                            <Badge variant="light" color="orange">
                              {group.violations.length} {group.violations.length === 1 ? 'нарушение' : (group.violations.length < 5 ? 'нарушения' : 'нарушений')}
                            </Badge>
                          </Table.Td>
                          <Table.Td align="right">
                            <UnstyledButton
                              component="a"
                              href={group.url}
                              target="_blank"
                              title="Перейти на страницу"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <IconExternalLink size={18} color="var(--mantine-color-gray-6)" />
                            </UnstyledButton>
                          </Table.Td>
                        </Table.Tr>

                        <Table.Tr style={{ display: isExpanded ? "table-row" : "none" }}>
                          <Table.Td colSpan={4} p={0}>
                            <Collapse in={isExpanded}>
                              <Box p="md" bg="var(--mantine-color-gray-0)">
                                <Table highlightOnHover withTableBorder bg="white">
                                  <Table.Thead>
                                    <Table.Tr>
                                      <Table.Th w={200}>Тип</Table.Th>
                                      <Table.Th w={180}>Слово</Table.Th>
                                      <Table.Th>Контекст</Table.Th>
                                      <Table.Th w={120}>Вес</Table.Th>
                                      <Table.Th w={110} align="right">Действие</Table.Th>
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
                                          <Text size="xs" c="dimmed" lineClamp={2} title={v.text_context}>{v.text_context}</Text>
                                        </Table.Td>
                                        <Table.Td>
                                          <Group gap={5}>
                                            {v.visual_weight_foreign > 0 ? <Badge size="xs" variant="outline" color="red">EN: {v.visual_weight_foreign}%</Badge> : null}
                                            {v.visual_weight_rus > 0 ? <Badge size="xs" variant="outline" color="teal">RU: {v.visual_weight_rus}%</Badge> : null}
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
                                          </Group>
                                        </Table.Td>
                                      </Table.Tr>
                                    ))}
                                  </Table.Tbody>
                                </Table>
                              </Box>
                            </Collapse>
                          </Table.Td>
                        </Table.Tr>
                      </import_react_fragment>
                    );
                  })}
                </Table.Tbody>
              </Table>"""
accordion_replace = accordion_replace.replace("import_react_fragment", "React.Fragment")

if accordion_find in text:
    text = text.replace(accordion_find, accordion_replace)
    with open(path, 'w', encoding='utf-8') as f:
        f.write(text)
    print("Success")
else:
    print("Could not find accordion block")
    sys.exit(1)
