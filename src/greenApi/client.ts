export interface GreenApiCredentials {
  idInstance: string;
  apiTokenInstance: string;
}

export interface GreenApiResult {
  status: number;
  data: unknown;
}

function hintForStatus(status: number): string | undefined {
  if (status === 403) return 'Похоже, неверный idInstance.';
  if (status === 401) return 'Похоже, неверный apiTokenInstance.';
  if (status === 404) return 'Метод или инстанс не найден — проверьте idInstance.';
  if (status === 429 || status === 466) return 'Превышен лимит запросов аккаунта.';
  return undefined;
}

function nonJsonEnvelope(status: number, raw: string): Record<string, unknown> {
  const envelope: Record<string, unknown> = {
    error: `GREEN-API вернул не-JSON ответ (HTTP ${status})`,
    httpStatus: status,
    raw: raw.trim().slice(0, 2000),
  };
  const hint = hintForStatus(status);
  if (hint) envelope.hint = hint;
  return envelope;
}

export class GreenApiTransportError extends Error {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options);
    this.name = 'GreenApiTransportError';
  }
}

export class GreenApiClient {
  constructor(
    private readonly baseUrl: string,
    private readonly timeoutMs: number,
  ) {}

  private buildUrl(creds: GreenApiCredentials, method: string): string {
    const id = encodeURIComponent(creds.idInstance);
    const token = encodeURIComponent(creds.apiTokenInstance);
    return `${this.baseUrl}/waInstance${id}/${method}/${token}`;
  }

  private async request(
    creds: GreenApiCredentials,
    method: string,
    body?: unknown,
  ): Promise<GreenApiResult> {
    const url = this.buildUrl(creds, method);
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await fetch(url, {
        method: body === undefined ? 'GET' : 'POST',
        headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
        body: body === undefined ? undefined : JSON.stringify(body),
        signal: controller.signal,
      });

      const text = await response.text();
      let data: unknown;
      try {
        data = text ? JSON.parse(text) : null;
      } catch {
        data = nonJsonEnvelope(response.status, text);
      }

      return { status: response.status, data };
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        throw new GreenApiTransportError(`GREEN-API request timed out after ${this.timeoutMs}ms`, { cause: err });
      }
      throw new GreenApiTransportError('Failed to reach GREEN-API', { cause: err });
    } finally {
      clearTimeout(timer);
    }
  }

  getSettings(creds: GreenApiCredentials): Promise<GreenApiResult> {
    return this.request(creds, 'getSettings');
  }

  getStateInstance(creds: GreenApiCredentials): Promise<GreenApiResult> {
    return this.request(creds, 'getStateInstance');
  }

  sendMessage(creds: GreenApiCredentials, payload: { chatId: string; message: string }): Promise<GreenApiResult> {
    return this.request(creds, 'sendMessage', payload);
  }

  sendFileByUrl(
    creds: GreenApiCredentials,
    payload: { chatId: string; urlFile: string; fileName: string },
  ): Promise<GreenApiResult> {
    return this.request(creds, 'sendFileByUrl', payload);
  }
}
