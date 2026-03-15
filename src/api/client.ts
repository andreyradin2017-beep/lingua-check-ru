import axios from 'axios';
import { notifications } from '@mantine/notifications';
import { API_URL, API_TIMEOUT } from '../config/api';

/**
 * Создаем экземпляр axios с базовой конфигурацией
 */
const apiClient = axios.create({
  baseURL: API_URL,
  timeout: API_TIMEOUT,
});

// ID активного уведомления о "прогреве"
let warmupNotificationId: string | null = null;
let warmupTimer: ReturnType<typeof setTimeout> | null = null;

/**
 * Показывает уведомление о том, что бэкенд просыпается
 */
const showWarmupNotification = () => {
  if (warmupNotificationId) return;

  warmupNotificationId = notifications.show({
    id: 'backend-warmup',
    title: 'Бэкенд «прогревается»',
    message: 'Render.com пробуждает сервер после сна. Это может занять до 60 секунд. Пожалуйста, не закрывайте страницу.',
    color: 'blue',
    loading: true,
    autoClose: false,
    withCloseButton: false,
  });
};

/**
 * Скрывает или обновляет уведомление о прогреве
 */
const hideWarmupNotification = (success = true) => {
  if (warmupTimer) {
    clearTimeout(warmupTimer);
    warmupTimer = null;
  }

  if (warmupNotificationId) {
    if (success) {
      notifications.update({
        id: 'backend-warmup',
        title: 'Бэкенд готов',
        message: 'Сервер успешно проснулся. Приступаем к работе!',
        color: 'green',
        loading: false,
        autoClose: 3000,
        withCloseButton: true,
      });
    } else {
      notifications.hide('backend-warmup');
    }
    warmupNotificationId = null;
  }
};

// Интерцептор запросов
apiClient.interceptors.request.use((config) => {
  // Запускаем таймер на 5 секунд. Если за это время не придет ответ, покажем уведомление.
  if (!warmupTimer && !warmupNotificationId) {
    warmupTimer = setTimeout(() => {
      showWarmupNotification();
    }, 5000);
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Интерцептор ответов
apiClient.interceptors.response.use((response) => {
  hideWarmupNotification(true);
  return response;
}, (error) => {
  hideWarmupNotification(false);
  return Promise.reject(error);
});

export default apiClient;
