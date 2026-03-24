/**
 * Тесты для HomePage
 * Покрытие: рендеринг, навигация, карточки преимуществ
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { MantineProvider } from '@mantine/core';
import HomePage from '../../pages/HomePage';

const Wrapper = ({ children }: { children: React.ReactNode }) => (
  <MemoryRouter>
    <MantineProvider>{children}</MantineProvider>
  </MemoryRouter>
);

describe('HomePage', () => {
  it('должен рендерить главный заголовок "На страже русского языка"', () => {
    render(<HomePage />, { wrapper: Wrapper });
    expect(screen.getByText(/На страже/i)).toBeInTheDocument();
    expect(screen.getByText(/русского языка/i)).toBeInTheDocument();
  });

  it('должен рендерить текст "на страже русского языка"', () => {
    render(<HomePage />, { wrapper: Wrapper });
    expect(screen.getByText(/на страже/i)).toBeInTheDocument();
  });

  it('должен рендерить кнопку "Начать проверку"', () => {
    render(<HomePage />, { wrapper: Wrapper });
    expect(screen.getByText('Начать проверку')).toBeInTheDocument();
  });

  it('должен рендерить кнопку "Анализ текста"', () => {
    render(<HomePage />, { wrapper: Wrapper });
    expect(screen.getByText('Анализ текста')).toBeInTheDocument();
  });

  it('должен показывать карточку "Соблюдение ФЗ №168"', () => {
    render(<HomePage />, { wrapper: Wrapper });
    expect(screen.getByText('Соблюдение ФЗ №168')).toBeInTheDocument();
  });

  it('должен показывать карточку "Сканирование сайтов"', () => {
    render(<HomePage />, { wrapper: Wrapper });
    expect(screen.getByText('Сканирование сайтов')).toBeInTheDocument();
  });

  it('должен показывать карточку "Анализ файлов"', () => {
    render(<HomePage />, { wrapper: Wrapper });
    expect(screen.getByText('Анализ файлов')).toBeInTheDocument();
  });

  it('должен показывать карточку "История и отчетность"', () => {
    render(<HomePage />, { wrapper: Wrapper });
    expect(screen.getByText('История и отчетность')).toBeInTheDocument();
  });

  it('должен иметь ссылку "Перейти в историю"', () => {
    render(<HomePage />, { wrapper: Wrapper });
    expect(screen.getByText('Перейти в историю')).toBeInTheDocument();
  });

  it('должен показывать бейдж "На базе ИИ и ФЗ №168"', () => {
    render(<HomePage />, { wrapper: Wrapper });
    expect(screen.getByText(/на базе ии/i)).toBeInTheDocument();
  });
});
