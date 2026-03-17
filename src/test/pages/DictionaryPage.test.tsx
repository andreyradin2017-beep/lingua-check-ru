/**
 * Тесты для DictionaryPage
 * Покрытие: рендеринг, карточки словарей
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { MantineProvider } from '@mantine/core';
import { theme } from '../../theme';
import DictionaryPage from '../../pages/DictionaryPage';

// Mock axios
vi.mock('axios', () => {
  const mock = {
    get: vi.fn(() => Promise.resolve({ 
      data: {
        dictionary_versions: [
          { name: 'Orthographic', version: '1.0', word_count: 100000 },
          { name: 'Explanatory', version: '2.0', word_count: 150000 },
        ],
      }
    })),
    create: vi.fn(function(this: any) { return this; }),
    interceptors: {
      request: { use: vi.fn(), eject: vi.fn() },
      response: { use: vi.fn(), eject: vi.fn() },
    },
    isAxiosError: vi.fn((err) => !!err?.isAxiosError),
  };
  return { default: mock };
});

const Wrapper = ({ children }: { children: React.ReactNode }) => (
  <MemoryRouter>
    <MantineProvider theme={theme}>{children}</MantineProvider>
  </MemoryRouter>
);

describe('DictionaryPage', () => {
  it('должен рендерить заголовок "Нормативные словари"', async () => {
    render(<DictionaryPage />, { wrapper: Wrapper });
    await waitFor(() => {
      expect(screen.getByText('Нормативные словари')).toBeInTheDocument();
    });
  });

  it('должен показывать описание "Источники данных для проверки"', async () => {
    render(<DictionaryPage />, { wrapper: Wrapper });
    await waitFor(() => {
      expect(screen.getByText(/Источники данных/i)).toBeInTheDocument();
    });
  });

  it('должен показывать карточки словарей', async () => {
    render(<DictionaryPage />, { wrapper: Wrapper });
    await waitFor(() => {
      expect(screen.getByText('Орфографический словарь')).toBeInTheDocument();
      expect(screen.getByText('Толковый словарь')).toBeInTheDocument();
    });
  });

  it('должен показывать версию словаря', async () => {
    render(<DictionaryPage />, { wrapper: Wrapper });
    await waitFor(() => {
      expect(screen.getByText('1.0')).toBeInTheDocument();
      expect(screen.getByText('2.0')).toBeInTheDocument();
    });
  });

  it('должен показывать количество слов', async () => {
    render(<DictionaryPage />, { wrapper: Wrapper });
    await waitFor(() => {
      expect(screen.getByText(/100 000/i)).toBeInTheDocument();
      expect(screen.getByText(/150 000/i)).toBeInTheDocument();
    });
  });

  it('должен показывать иконку книги', async () => {
    render(<DictionaryPage />, { wrapper: Wrapper });
    await waitFor(() => {
      const icons = document.querySelectorAll('svg');
      expect(icons.length).toBeGreaterThan(0);
    });
  });
});
