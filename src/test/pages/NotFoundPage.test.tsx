/**
 * Тесты для NotFoundPage (404)
 * Покрытие: рендеринг, навигация
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { MantineProvider } from '@mantine/core';
import { theme } from '../../theme';
import NotFoundPage from '../../pages/NotFoundPage';

const Wrapper = ({ children }: { children: React.ReactNode }) => (
  <MemoryRouter>
    <MantineProvider theme={theme}>{children}</MantineProvider>
  </MemoryRouter>
);

describe('NotFoundPage', () => {
  it('должен рендерить "404"', () => {
    render(<NotFoundPage />, { wrapper: Wrapper });
    expect(screen.getByText('404')).toBeInTheDocument();
  });

  it('должен показывать заголовок "Страница не найдена"', () => {
    render(<NotFoundPage />, { wrapper: Wrapper });
    expect(screen.getByText('Страница не найдена')).toBeInTheDocument();
  });

  it('должен показывать кнопку "Вернуться на главную"', () => {
    render(<NotFoundPage />, { wrapper: Wrapper });
    expect(screen.getByText('Вернуться на главную')).toBeInTheDocument();
  });

  it('должен показывать кнопку "Назад"', () => {
    render(<NotFoundPage />, { wrapper: Wrapper });
    expect(screen.getByText('Назад')).toBeInTheDocument();
  });

  it('должен показывать описание ошибки', () => {
    render(<NotFoundPage />, { wrapper: Wrapper });
    expect(screen.getByText(/Похоже, вы забрели в неизведанную область/i)).toBeInTheDocument();
  });
});
