/**
 * Тесты для ExceptionsPage
 * Покрытие: рендеринг, добавление/удаление исключений
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { MantineProvider } from '@mantine/core';
import { theme } from '../../theme';
import ExceptionsPage from '../../pages/ExceptionsPage';

// Mock axios
vi.mock('axios', () => {
  const mock = {
    get: vi.fn(() => Promise.resolve({ data: [] })),
    post: vi.fn(() => Promise.resolve({ data: { id: '1', word: 'test', created_at: '2026-03-13' } })),
    delete: vi.fn(() => Promise.resolve({})),
    create: vi.fn(function() { return this; }),
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

describe('ExceptionsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('должен рендерить заголовок "Глобальные исключения"', () => {
    render(<ExceptionsPage />, { wrapper: Wrapper });
    expect(screen.getByText('Глобальные исключения')).toBeInTheDocument();
  });

  it('должен показывать описание страницы', () => {
    render(<ExceptionsPage />, { wrapper: Wrapper });
    expect(screen.getByText(/Слова из этого списка никогда не будут помечаться/i)).toBeInTheDocument();
  });

  it('должен рендерить поле ввода для нового слова', () => {
    render(<ExceptionsPage />, { wrapper: Wrapper });
    expect(screen.getByPlaceholderText(/Например: gmp/i)).toBeInTheDocument();
  });

  it('должен рендерить кнопку "Добавить"', () => {
    render(<ExceptionsPage />, { wrapper: Wrapper });
    expect(screen.getByText('Добавить')).toBeInTheDocument();
  });

  it.skip('должен блокировать кнопку "Добавить" для пустого поля', async () => {
    render(<ExceptionsPage />, { wrapper: Wrapper });
    const button = screen.getByText('Добавить');
    await waitFor(() => {
      expect(button).toBeDisabled();
    });
  });

  it('должен разблокировать кнопку "Добавить" для заполненного поля', async () => {
    render(<ExceptionsPage />, { wrapper: Wrapper });
    const input = screen.getByPlaceholderText(/Например: gmp/i);
    fireEvent.change(input, { target: { value: 'test' } });
    const button = screen.getByText('Добавить');
    expect(button).not.toBeDisabled();
  });

  it('должен показывать таблицу исключений', async () => {
    const axios = await import('axios');
    vi.mocked(axios.default.get).mockResolvedValueOnce({
      data: [
        { id: '1', word: 'testword', created_at: '2026-03-13T10:00:00Z' }
      ],
    });

    render(<ExceptionsPage />, { wrapper: Wrapper });
    await waitFor(() => {
      expect(screen.getByText('Слово')).toBeInTheDocument();
      expect(screen.getByText('Дата добавления')).toBeInTheDocument();
      expect(screen.getByText('Действие')).toBeInTheDocument();
    });
  });

  it('должен показывать сообщение если список исключений пуст', async () => {
    render(<ExceptionsPage />, { wrapper: Wrapper });
    await waitFor(() => {
      expect(screen.getByText('Список исключений пуст')).toBeInTheDocument();
    });
  });
});
