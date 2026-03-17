/**
 * Тесты для TextPage
 * Покрытие: рендеринг, ввод текста, загрузка файлов, результаты
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { MantineProvider } from '@mantine/core';
import { theme } from '../../theme';
import TextPage from '../../pages/TextPage';

// Mock axios
vi.mock('axios', () => {
  const mock = {
    get: vi.fn(() => Promise.resolve({ data: { summary: { total_tokens: 0, violations_count: 0, compliance_percent: 100 }, violations: [] } })),
    post: vi.fn(() => Promise.resolve({ data: { summary: { total_tokens: 0, violations_count: 0, compliance_percent: 100 }, violations: [] } })),
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

describe('TextPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('должен рендерить заголовок "Проверка текста и файлов"', () => {
    render(<TextPage />, { wrapper: Wrapper });
    expect(screen.getByText('Проверка текста и файлов')).toBeInTheDocument();
  });

  it('должен рендерить textarea для ввода текста', () => {
    render(<TextPage />, { wrapper: Wrapper });
    expect(screen.getByLabelText('Текст для проверки')).toBeInTheDocument();
  });

  it('должен показывать счетчик символов при вводе', async () => {
    render(<TextPage />, { wrapper: Wrapper });
    const textarea = screen.getByLabelText('Текст для проверки');
    fireEvent.change(textarea, { target: { value: 'Тест' } });
    expect(screen.getByText('4 симв.')).toBeInTheDocument();
  });

  it('должен блокировать кнопку проверки для пустого текста', () => {
    render(<TextPage />, { wrapper: Wrapper });
    const button = screen.getByRole('button', { name: /проверить/i });
    expect(button).toBeDisabled();
  });

  it('должен разблокировать кнопку проверки для непустого текста', async () => {
    render(<TextPage />, { wrapper: Wrapper });
    const textarea = screen.getByLabelText('Текст для проверки');
    fireEvent.change(textarea, { target: { value: 'Тестовый текст' } });
    const button = screen.getByRole('button', { name: /проверить/i });
    expect(button).not.toBeDisabled();
  });

  it('должен рендерить таб "Вставить текст"', () => {
    render(<TextPage />, { wrapper: Wrapper });
    expect(screen.getByText('Вставить текст')).toBeInTheDocument();
  });

  it('должен рендерить таб "Загрузить файл"', () => {
    render(<TextPage />, { wrapper: Wrapper });
    expect(screen.getByText('Загрузить файл')).toBeInTheDocument();
  });

  it('должен показывать поддерживаемые форматы файлов', () => {
    render(<TextPage />, { wrapper: Wrapper });
    expect(screen.getByText(/TXT, DOCX/i)).toBeInTheDocument();
  });

  it('должен рендерить кнопку выбора файла', () => {
    render(<TextPage />, { wrapper: Wrapper });
    expect(screen.getByText('Выбрать файл')).toBeInTheDocument();
  });
});
