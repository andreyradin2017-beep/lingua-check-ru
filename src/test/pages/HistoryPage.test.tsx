/**
 * Тесты для HistoryPage
 * Покрытие: рендеринг, таблица истории, действия со сканами
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { MantineProvider } from '@mantine/core';
import { theme } from '../../theme';
import HistoryPage from '../../pages/HistoryPage';

// Mock axios
vi.mock('axios', () => {
  const mock = {
    get: vi.fn(() => Promise.resolve({ data: [] })),
    delete: vi.fn(() => Promise.resolve({})),
    post: vi.fn(() => Promise.resolve({})),
    create: vi.fn(function(this: any) { return this; }),
    interceptors: {
      request: { use: vi.fn(), eject: vi.fn() },
      response: { use: vi.fn(), eject: vi.fn() },
    },
    isAxiosError: vi.fn((err) => !!err?.isAxiosError),
  };
  return { default: mock };
});

// Mock notifications
vi.mock('@mantine/notifications', () => ({
  notifications: {
    show: vi.fn(),
  },
}));

const Wrapper = ({ children }: { children: React.ReactNode }) => (
  <MemoryRouter>
    <MantineProvider theme={theme}>{children}</MantineProvider>
  </MemoryRouter>
);

describe('HistoryPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('должен рендерить заголовок "История проверок"', () => {
    render(<HistoryPage />, { wrapper: Wrapper });
    expect(screen.getByText('История проверок')).toBeInTheDocument();
  });

  it('должен показывать описание "Список ранее запущенных сканирований"', () => {
    render(<HistoryPage />, { wrapper: Wrapper });
    expect(screen.getByText('Список ранее запущенных сканирований')).toBeInTheDocument();
  });

  it('должен показывать сообщение если история пуста', async () => {
    render(<HistoryPage />, { wrapper: Wrapper });
    await waitFor(() => {
      expect(screen.getByText('История проверок пуста')).toBeInTheDocument();
    });
  });

  it('должен показывать кнопку "Запустить первую проверку"', async () => {
    render(<HistoryPage />, { wrapper: Wrapper });
    await waitFor(() => {
      expect(screen.getByText('Начать первую проверку')).toBeInTheDocument();
    });
  });

  it('должен показывать кнопку "Обновить"', () => {
    render(<HistoryPage />, { wrapper: Wrapper });
    expect(screen.getByText('Обновить')).toBeInTheDocument();
  });

  it('должен показывать таблицу при наличии данных', async () => {
    const axios = await import('axios');
    vi.mocked(axios.default.get).mockResolvedValueOnce({
      data: [
        {
          id: '1',
          target_url: 'https://example.com',
          status: 'completed',
          started_at: '2026-03-13T10:00:00Z',
        },
      ],
    });

    render(<HistoryPage />, { wrapper: Wrapper });
    await waitFor(() => {
      expect(screen.getByText('https://example.com')).toBeInTheDocument();
    });
  });

  it('должен показывать заголовки таблицы', async () => {
    const axios = await import('axios');
    vi.mocked(axios.default.get).mockResolvedValueOnce({
      data: [
        {
          id: '1',
          target_url: 'https://example.com',
          status: 'completed',
          started_at: '2026-03-13T10:00:00Z',
        },
      ],
    });

    render(<HistoryPage />, { wrapper: Wrapper });
    await waitFor(() => {
      expect(screen.getByText('Дата')).toBeInTheDocument();
      expect(screen.getByText('Сайт')).toBeInTheDocument();
      expect(screen.getByText('Статус')).toBeInTheDocument();
      expect(screen.getByText('Действие')).toBeInTheDocument();
    });
  });
});
