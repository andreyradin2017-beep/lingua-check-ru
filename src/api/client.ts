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

const STORAGE_KEY = 'linguacheck_last_response';

// Инициализируем из localStorage, чтобы состояние сохранялось между вкладкаи и перезагрузками
const getInitialLastResponse = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? parseInt(stored, 10) : 0;
  } catch {
    return 0;
  }
};

let warmupNotificationId: string | null = null;
let warmupTimer: ReturnType<typeof setTimeout> | null = null;
let lastResponseTime = getInitialLastResponse();

/**
 * Обновляет время последнего успешного ответа и сохраняет в localStorage
 */
const updateLastResponseTime = () => {
  lastResponseTime = Date.now();
  try {
    localStorage.setItem(STORAGE_KEY, lastResponseTime.toString());
  } catch {
    // Игнорируем ошибки квоты или приватного режима
  }
};

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
  const now = Date.now();
  // Render.com засыпает через 15 минут бездействия.
  // Показываем уведомление только если с последнего ответа прошло более 14 минут
  // или если это вообще первый запрос в сессии.
  const isLikelySleeping = lastResponseTime === 0 || (now - lastResponseTime > 14 * 60 * 1000);

  if (isLikelySleeping && !warmupTimer && !warmupNotificationId) {
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
  updateLastResponseTime();
  hideWarmupNotification(true);
  return response;
}, (error) => {
  // Даже при ошибке, если бэкенд ответил (например, 404 или 500), он НЕ спит.
  if (error.response) {
    updateLastResponseTime();
  }
  hideWarmupNotification(false);
  return Promise.reject(error);
});

export default apiClient;
