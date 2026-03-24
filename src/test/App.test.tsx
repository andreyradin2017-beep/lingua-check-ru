/**
 * Тесты для App.tsx
 * Покрытие: навигация, роутинг, layout
 */

import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { MantineProvider } from '@mantine/core';
import App from '../App';

const Wrapper = ({ children }: { children: React.ReactNode }) => (
  <MemoryRouter initialEntries={['/']}>
    <MantineProvider>{children}</MantineProvider>
  </MemoryRouter>
);

describe('App', () => {
  it('должен рендерить заголовок LinguaCheck RU', () => {
    render(<App />, { wrapper: Wrapper });
    expect(screen.getByText('LinguaCheck RU')).toBeInTheDocument();
  });

  it('должен рендерить навигационное меню', () => {
    render(<App />, { wrapper: Wrapper });
    expect(screen.getByText('Главная')).toBeInTheDocument();
    expect(screen.getByText('История')).toBeInTheDocument();
    expect(screen.getByText('Сайты')).toBeInTheDocument();
    expect(screen.getByText('Текст и файлы')).toBeInTheDocument();
    expect(screen.getByText('Словари')).toBeInTheDocument();
    expect(screen.getByText('Исключения')).toBeInTheDocument();
  });

  it('должен переключаться на страницу сканирования при клике на "Сайты"', async () => {
    render(<App />, { wrapper: Wrapper });
    const scansLink = screen.getByText('Сайты');
    fireEvent.click(scansLink);
    expect(screen.getByText('Сканирование сайтов')).toBeInTheDocument();
  });

  it('должен переключаться на страницу текста при клике на "Текст и файлы"', async () => {
    render(<App />, { wrapper: Wrapper });
    const textLink = screen.getByText('Текст и файлы');
    fireEvent.click(textLink);
    expect(screen.getByText('Проверка текста и файлов')).toBeInTheDocument();
  });

  it('должен переключаться на страницу истории при клике на "История"', async () => {
    render(<App />, { wrapper: Wrapper });
    const historyLink = screen.getByText('История');
    fireEvent.click(historyLink);
    expect(screen.getByText('История проверок')).toBeInTheDocument();
  });

  it('должен переключаться на страницу словарей при клике на "Словари"', async () => {
    render(<App />, { wrapper: Wrapper });
    const dictLink = screen.getByText('Словари');
    fireEvent.click(dictLink);
    expect(await screen.findByText('Нормативные словари')).toBeInTheDocument();
  });

  it('должен переключаться на страницу исключений при клике на "Исключения"', async () => {
    render(<App />, { wrapper: Wrapper });
    const excLink = screen.getByText('Исключения');
    fireEvent.click(excLink);
    expect(await screen.findByText('Глобальные исключения')).toBeInTheDocument();
  });

  it('должен показывать кнопку переключения темы', () => {
    render(<App />, { wrapper: Wrapper });
    const themeButton = screen.getByLabelText('Переключить тему');
    expect(themeButton).toBeInTheDocument();
  });

  it('должен показывать текст о ФЗ №168-ФЗ', () => {
    render(<App />, { wrapper: Wrapper });
    // Используем getAllByText, так как текст может дублироваться в мобильном/десктопном меню
    const elements = screen.getAllByText(/ФЗ №168/i);
    expect(elements.length).toBeGreaterThan(0);
    expect(elements[0]).toBeInTheDocument();
  });
});
