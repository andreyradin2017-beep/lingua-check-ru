# UI Design Specification: LinguaCheck-RU

**Версия:** 1.15.0
**Библиотека:** Mantine UI v8.3.18
**Дата обновления:** 24 марта 2026

---

## 1. Дизайн-система

### 1.1. Цветовая палитра

**Primary (Синий — государственный стиль):**
```typescript
const customBlue = [
  '#eef3ff', // blue.0
  '#dce4f5', // blue.1
  '#b9c7e2', // blue.2
  '#94a8cf', // blue.3
  '#748dbf', // blue.4
  '#5f7cb7', // blue.5
  '#5474b4', // blue.6
  '#44639f', // blue.7
  '#39588f', // blue.8
  '#2d4b81'  // blue.9
];
```

**Функциональные цвета:**
| Назначение | Цвет Mantine | Hex |
|------------|--------------|-----|
| Success | `green` | `#40c057` |
| Warning | `orange` | `#fd7e14` |
| Danger | `red` | `#fa5252` |
| Info | `blue` | `#228be6` |

**Контрастность (WCAG 2.1 AA):**
| Элемент | Контраст | Статус |
|---------|----------|--------|
| Основной текст (#343a40) на #f8f9fa | 7.2:1 | ✅ PASS |
| Dimmed текст (#5c5f66) на #f8f9fa | 4.5:1 | ✅ PASS |
| Ссылки (#1971c2) на #fff | 4.8:1 | ✅ PASS |
| Темная тема (improvedDark) | 8.2:1 | ✅ PASS |

---

### 1.2. Типографика

**Шрифты:**
```typescript
{
  fontFamily: 'Inter, system-ui, sans-serif',
  headings: {
    fontFamily: 'Outfit, sans-serif',
  }
}
```

**Размеры:**
| Элемент | Размер | Line Height | Weight |
|---------|--------|-------------|--------|
| H1 | 42px | 1.2 | 900 |
| H2 | 32px | 1.3 | 700 |
| H3 | 24px | 1.4 | 600 |
| Body | 16px | 1.5 | 400 |
| Small | 14px | 1.4 | 400 |
| Caption | 12px | 1.3 | 400 |

---

### 1.3. Компоненты (Default Props)

```typescript
{
  Button: {
    defaultProps: {
      radius: 'md',
    },
  },
  Card: {
    defaultProps: {
      radius: 'lg',
      withBorder: true,
    },
  },
  ActionIcon: {
    defaultProps: {
      size: 'lg', // 44px для доступности
    },
  },
  Table: {
    defaultProps: {
      highlightOnHover: true,
      withColumnBorders: true,
      withRowBorders: true,
    },
  },
}
```

---

## 2. Страницы

### 2.1. Главная (`/`)

**Компоненты:**
- `AppShell` — основная оболочка
- `Container` (size="xl") — контент
- `Paper` (p={{ base: 24, sm: 50 }}) — Hero-секция
- `SimpleGrid` (cols={{ base: 1, sm: 3 }}) — карточки

**Элементы:**
```tsx
<Title order={1} size={42} fw={900}>
  На страже <Text span className="gradient-text">русского языка</Text>
</Title>

<Button size="lg" onClick={() => navigate('/scans')}>
  Проверить сайт
</Button>

<Button size="lg" variant="outline" onClick={() => navigate('/text')}>
  Загрузить файл
</Button>
```

**Градиентный текст:**
```css
.gradient-text {
  background: linear-gradient(45deg, #1864ab, #228be6);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}
```

---

### 2.2. Сканирование (`/scans`)

**Форма ввода:**
```tsx
<Tooltip label="Введите адрес сайта для проверки" withArrow position="top">
  <TextInput
    label="URL сайта"
    placeholder="https://example.com"
    leftSection={<IconSearch size={16} />}
  />
</Tooltip>

<Tooltip label="Количество уровней ссылок (1-5)" withArrow position="top">
  <NumberInput label="Глубина" min={1} max={5} w={80} />
</Tooltip>

<Tooltip label="Максимум страниц (1-1000)" withArrow position="top">
  <NumberInput label="Лимит страниц" min={1} max={1000} defaultValue={500} />
</Tooltip>
```

**Таблица результатов (группировка):**
```tsx
<div style={{ overflowX: 'auto' }}>
  <Table highlightOnHover withColumnBorders withRowBorders>
    <Table.Thead bg="gray.1">
      <Table.Tr>
        <Table.Th>Слово</Table.Th>
        <Table.Th>Повторений</Table.Th>
        <Table.Th>Тип</Table.Th>
        <Table.Th>Страницы</Table.Th>
        <Table.Th>Действия</Table.Th>
      </Table.Tr>
    </Table.Thead>
    <Table.Tbody>
      {filteredGrouped.map((item) => (
        <Table.Tr key={item.word}>
          <Table.Td><Text fw={700}>{item.word}</Text></Table.Td>
          <Table.Td>
            <Badge
              color={item.count > 50 ? 'red' : item.count > 10 ? 'orange' : 'blue'}
              size="lg"
            >
              x{item.count}
            </Badge>
          </Table.Td>
          <Table.Td><Badge>{translateType(item.type)}</Badge></Table.Td>
          <Table.Td>{item.page_urls.length} стр.</Table.Td>
          <Table.Td>
            <ActionIcon aria-label="Добавить в бренды">
              <IconBookmark size={18} />
            </ActionIcon>
            <ActionIcon aria-label="Добавить в исключения">
              <IconShieldCheck size={18} />
            </ActionIcon>
          </Table.Td>
        </Table.Tr>
      ))}
    </Table.Tbody>
  </Table>
</div>
```

**Фильтры:**
- `TextInput` — поиск по слову
- `Select` — фильтр по типу нарушений
- Кнопки: «Сбросить», «Развернуть все», «Свернуть все»

---

### 2.3. История (`/history`)

**Таблица:**
```tsx
<Table highlightOnHover style={{ minWidth: 600 }}>
  <Table.Thead>
    <Table.Tr>
      <Table.Th>Дата</Table.Th>
      <Table.Th>Сайт</Table.Th>
      <Table.Th>Статус</Table.Th>
      <Table.Th>Действие</Table.Th>
    </Table.Tr>
  </Table.Thead>
  <Table.Tbody>
    {paginatedScans.map((scan) => (
      <Table.Tr key={scan.id}>
        {/* Дата, URL, Badge статуса, ActionIcons */}
      </Table.Tr>
    ))}
  </Table.Tbody>
</Table>

{scans.length > ITEMS_PER_PAGE && (
  <Pagination total={totalPages} value={page} onChange={setPage} />
)}
```

**Empty State:**
```tsx
<Center style={{ height: '30vh' }}>
  <Stack align="center">
    <IconHistory size={48} color="gray" opacity={0.5} />
    <Text fw={500}>История пока пуста</Text>
  </Stack>
</Center>
```

---

### 2.4. Текст и файлы (`/text`)

**Вкладки:**
```tsx
<Tabs defaultValue="manual">
  <Tabs.List>
    <Tabs.Tab value="manual" leftSection={<IconTypography />}>
      Вставить текст
    </Tabs.Tab>
    <Tabs.Tab value="upload" leftSection={<IconFileText />}>
      Загрузить файл
    </Tabs.Tab>
  </Tabs.List>
</Tabs>
```

**Textarea с счетчиком:**
```tsx
<Textarea
  label="Текст для проверки"
  minRows={8}
  rightSection={
    <Text size="xs" c="dimmed">{text.length} симв.</Text>
  }
/>
```

**Список нарушений:**
```tsx
<List
  icon={
    <ThemeIcon color="red">
      <IconAlertCircle size={16} />
    </ThemeIcon>
  }
>
  {violations.map((v) => (
    <List.Item>
      <Badge color={v.type === 'trademark' ? 'blue' : 'red'}>
        {translateViolationType(v.type)}
      </Badge>
      <Text fw={700}>{v.word}</Text>
      <Text fs="italic">"{v.text_context}"</Text>
    </List.Item>
  ))}
</List>
```

---

### 2.5. Словари (`/dictionaries`)

**Карточки:**
```tsx
<SimpleGrid cols={{ base: 1, sm: 2, md: 3 }}>
  {dictionaries.map((dict) => (
    <Card shadow="sm" p="lg" radius="md" withBorder>
      <Group justify="space-between">
        <IconBooks size={40} color="blue" />
        <Badge variant="light">{dict.version}</Badge>
      </Group>
      <Text fw={700}>{translateDictName(dict.name)}</Text>
      <Group mt="xl">
        <IconDatabase size={16} />
        <Text>{dict.word_count.toLocaleString()} слов</Text>
      </Group>
    </Card>
  ))}
</SimpleGrid>
```

---

### 2.6. Исключения (`/exceptions`)

**Форма добавления:**
```tsx
<Card withBorder>
  <Group>
    <TextInput
      label="Добавить новое слово"
      placeholder="Например: gmp"
      onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
    />
    <Button leftSection={<IconPlus />} onClick={handleAdd}>
      Добавить
    </Button>
  </Group>
</Card>
```

**Таблица:**
```tsx
<Table highlightOnHover>
  <Table.Thead>
    <Table.Tr>
      <Table.Th>Слово</Table.Th>
      <Table.Th>Дата добавления</Table.Th>
      <Table.Th>Действие</Table.Th>
    </Table.Tr>
  </Table.Thead>
  <Table.Tbody>
    {exceptions.map((exc) => (
      <Table.Tr>
        <Table.Td>
          <Badge variant="light" size="lg">{exc.word}</Badge>
        </Table.Td>
        <Table.Td>{formatDate(exc.created_at)}</Table.Td>
        <Table.Td>
          <ActionIcon color="red" variant="subtle">
            <IconTrash size={16} aria-hidden="true" />
          </ActionIcon>
        </Table.Td>
      </Table.Tr>
    ))}
  </Table.Tbody>
</Table>
```

---

### 2.7. 404 (`/404`)

**Компоненты:**
```tsx
<Container size="md" py={{ base: 60, md: 120 }}>
  <Stack align="center">
    <Text style={{ fontSize: 'min(25vw, 180px)', opacity: 0.1 }}>
      404
    </Text>
    <Title className="gradient-text" size={120}>
      404
    </Title>
    <Text c="dimmed">
      Страница не найдена
    </Text>
    <Group>
      <Button variant="gradient" onClick={() => navigate('/')}>
        Вернуться на главную
      </Button>
      <Button variant="outline" onClick={() => navigate(-1)}>
        Назад
      </Button>
    </Group>
  </Stack>
</Container>
```

---

## 3. Доступность (WCAG 2.1 AA)

### 3.1. ARIA

**Все интерактивные иконки:**
```tsx
<ActionIcon aria-label="Удалить запись" size="lg">
  <IconTrash size={16} aria-hidden="true" />
</ActionIcon>
```

**Навигация:**
```tsx
<NavLink
  aria-label={`Перейти на страницу ${item.label}`}
  label={item.label}
/>
```

### 3.2. Touch-цели

**Минимальный размер:** 44×44px
```tsx
<ActionIcon size="lg" variant="light">
  {/* 44px автоматически */}
</ActionIcon>
```

### 3.3. Reduced Motion

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## 4. Responsive

**Breakpoints (Mantine):**
```typescript
{
  xs: '0',
  sm: '576px',
  md: '768px',
  lg: '992px',
  xl: '1200px'
}
```

**Адаптивность:**
| Компонент | Mobile (<576px) | Tablet (576-992px) | Desktop (>992px) |
|-----------|-----------------|-------------------|------------------|
| Padding Hero | 24px | 50px | 50px |
| Карточки | 1 колонка | 2 колонки | 3 колонки |
| Таблица | Гориз. скролл | Гориз. скролл | Полная ширина |
| ActionIcon | 44px | 44px | 44px |

---

## 5. Уведомления (Mantine Notifications)

**Типы:**
```tsx
notifications.show({
  title: 'Успех',
  message: 'Операция выполнена',
  color: 'green',
});

notifications.show({
  title: 'Ошибка',
  message: 'Что-то пошло не так',
  color: 'red',
});

notifications.show({
  title: 'Информация',
  message: 'Полезное сообщение',
  color: 'blue',
});
```

---

## 6. Темы оформления

### Светлая тема (default)

```typescript
{
  colors: {
    // Стандартная палитра Mantine
  }
}
```

### Темная тема (improvedDark v1.12.0+)

```typescript
{
  dark: [
    '#d9d9d9', // 0
    '#b8b8b8', // 1
    '#9b9b9b', // 2
    '#7a7a7a', // 3
    '#5c5c5c', // 4
    '#4a4a4a', // 5
    '#3a3a3a', // 6
    '#2a2a2a', // 7
    '#1f1f1f', // 8
    '#141414', // 9
  ]
}
```

**Контрастность:** 8.2:1 (улучшена на 26%)

---

## 7. Изменения в версии 1.14.0

### Обновления

- ✅ Mantine UI 8.3.16
- ✅ Vite 8 (Rolldown)
- ✅ React 19.2.0
- ✅ Улучшенная группировка нарушений

### Удалено

- ❌ Модальное окно «Бренды»
- ❌ Кнопка «Все в бренды»
- ❌ Колонка «Вес (%)» в таблице нарушений
- ❌ Тип нарушения `visual_dominance` из UI
- ❌ Функционал скриншотов (v1.7.0)

### Добавлено

- ✅ Tooltip для всех кнопок действий
- ✅ Tooltip для полей URL и Глубина
- ✅ Кнопка «Пометить как исключение» (IconShieldCheck)
- ✅ Счетчик символов в Textarea
- ✅ Пагинация в HistoryPage
- ✅ Группировка нарушений (слово xN)
- ✅ Консистентные отступы (8px grid)
- ✅ Retry logic с экспоненциальной задержкой

---

*Документ синхронизирован с кодом 23 марта 2026 (версия 1.14.0)*
