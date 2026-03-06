import { describe, it, expect, vi, beforeEach } from "vitest";

// 1. Создаем общие моки через vi.hoisted
const { sharedMockRequest, sharedMockDbGet } = vi.hoisted(() => ({
  sharedMockRequest: vi
    .fn()
    .mockImplementation(() => Promise.resolve({ data: { success: true } })),
  sharedMockDbGet: vi.fn(),
}));

// 2. Мокаем axios
vi.mock("axios", async (importActual) => {
  const actual = await importActual<typeof import("axios")>();
  const mockAxiosInstance = {
    get: vi.fn((url, config) =>
      sharedMockRequest({ method: "get", url, ...config }),
    ),
    request: sharedMockRequest,
    interceptors: {
      request: { use: vi.fn(), eject: vi.fn() },
      response: { use: vi.fn(), eject: vi.fn() },
    },
    defaults: { headers: { common: {} } },
  };

  return {
    default: {
      ...actual,
      create: vi.fn(() => mockAxiosInstance),
      isAxiosError: vi.fn((err: any) => err?.isAxiosError === true),
    },
  };
});

// 3. Мокаем базу данных
vi.mock("../db/db", () => ({
  db: {
    settings: {
      get: sharedMockDbGet,
    },
  },
}));

// 4. Импортируем тестируемые клиенты
import { tmdbClient, rawgClient } from "../services/apiClient";

describe("ApiClient", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sharedMockRequest.mockReset();
    sharedMockRequest.mockImplementation(() =>
      Promise.resolve({ data: { success: true } }),
    );
    sharedMockDbGet.mockReset();
  });

  it("should perform a get request", async () => {
    // В новой архитектуре интерцепторы настраиваются при инициализации модуля.
    // Мы просто проверяем, что вызов метода get доходит до внутреннего обработчика.
    const result = await tmdbClient.get("/test");

    expect(sharedMockRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        url: "/test",
        method: "get",
      }),
    );
    expect(result.data).toEqual({ success: true });
  });

  it("should return data from RAWG request", async () => {
    const result = await rawgClient.get("/games");
    expect(result.data.success).toBe(true);
  });
});
