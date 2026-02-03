import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  checkHealth,
  saveTelegramBotToken,
  probeTelegramToken,
  patchConfig,
} from "./client";

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe("OpenClaw Client", () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  describe("checkHealth", () => {
    it("returns ok when gateway is healthy", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            status: "ok",
            channels: { telegram: { connected: true } },
          }),
      });

      const result = await checkHealth();
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.result.status).toBe("ok");
      }
    });

    it("returns error when gateway is unreachable", async () => {
      mockFetch.mockRejectedValueOnce(new Error("Network error"));

      const result = await checkHealth();
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.type).toBe("unreachable");
      }
    });
  });

  describe("probeTelegramToken", () => {
    it("returns bot info when token is valid", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            ok: true,
            result: {
              id: 123456789,
              username: "my_bot",
              can_join_groups: true,
              can_read_all_group_messages: false,
            },
          }),
      });

      const result = await probeTelegramToken("123456:ABC-DEF");
      expect(result.ok).toBe(true);
      expect(result.bot?.username).toBe("my_bot");
      expect(mockFetch).toHaveBeenCalledWith(
        "https://api.telegram.org/bot123456:ABC-DEF/getMe",
      );
    });

    it("returns error when token is invalid", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            ok: false,
            description: "Unauthorized",
          }),
      });

      const result = await probeTelegramToken("invalid-token");
      expect(result.ok).toBe(false);
      expect(result.error).toBe("Unauthorized");
    });
  });

  describe("saveTelegramBotToken", () => {
    it("patches config with Telegram bot token and enabled flag", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            ok: true,
            result: { success: true, hash: "abc123" },
          }),
      });

      const result = await saveTelegramBotToken("123456:ABC-DEF");
      expect(result.ok).toBe(true);

      const fetchOptions = mockFetch.mock.calls[0]?.[1] as
        | { body?: string }
        | undefined;
      expect(fetchOptions?.body).toBeDefined();
      const callBody = JSON.parse(fetchOptions!.body!);
      expect(callBody.args.raw).toContain('"enabled":true');
      expect(callBody.args.raw).toContain('"dmPolicy":"pairing"');
    });
  });

  describe("patchConfig", () => {
    it("sends config patch request", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            ok: true,
            result: { success: true, hash: "abc123" },
          }),
      });

      const result = await patchConfig({
        models: { providers: { anthropic: { apiKey: "sk-test" } } },
      });

      expect(result.ok).toBe(true);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("/tools/invoke"),
        expect.objectContaining({
          method: "POST",
          body: expect.stringContaining("config.patch"),
        }),
      );
    });
  });
});
