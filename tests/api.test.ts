import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import type { AppConfig } from '../src/config.js';

const config: AppConfig = {
  port: 0,
  greenApiBaseUrl: 'https://api.green-api.com',
  greenApiTimeoutMs: 5000,
};

const app = createApp(config);

function mockFetchOnce(status: number, body: unknown) {
  vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
    new Response(JSON.stringify(body), { status }) as unknown as Response,
  );
}

beforeEach(() => vi.restoreAllMocks());
afterEach(() => vi.restoreAllMocks());

describe('POST /api/getSettings', () => {
  it('forwards credentials and returns upstream body', async () => {
    mockFetchOnce(200, { wid: '77771234567@c.us', countryInstance: 'kz' });

    const res = await request(app)
      .post('/api/getSettings')
      .send({ idInstance: '1101', apiTokenInstance: 'tok123' });

    expect(res.status).toBe(200);
    expect(res.body.countryInstance).toBe('kz');

    const calledUrl = (globalThis.fetch as unknown as { mock: { calls: unknown[][] } }).mock.calls[0]![0];
    expect(calledUrl).toBe('https://api.green-api.com/waInstance1101/getSettings/tok123');
  });

  it('returns 400 on invalid credentials without calling upstream', async () => {
    const spy = vi.spyOn(globalThis, 'fetch');
    const res = await request(app).post('/api/getSettings').send({ idInstance: 'bad!', apiTokenInstance: '' });

    expect(res.status).toBe(400);
    expect(res.body.error.message).toBe('Validation failed');
    expect(spy).not.toHaveBeenCalled();
  });
});

describe('POST /api/sendMessage', () => {
  it('normalises phone to chatId and posts JSON body', async () => {
    mockFetchOnce(200, { idMessage: 'BAE5' });

    const res = await request(app).post('/api/sendMessage').send({
      idInstance: '1101',
      apiTokenInstance: 'tok',
      chatId: '+7 777 123 45 67',
      message: 'Hello World!',
    });

    expect(res.status).toBe(200);
    expect(res.body.idMessage).toBe('BAE5');

    const call = (globalThis.fetch as unknown as { mock: { calls: unknown[][] } }).mock.calls[0]!;
    const init = call[1] as RequestInit;
    expect(JSON.parse(init.body as string)).toEqual({ chatId: '77771234567@c.us', message: 'Hello World!' });
  });
});

describe('POST /api/sendFileByUrl', () => {
  it('derives fileName from the URL when omitted', async () => {
    mockFetchOnce(200, { idMessage: 'FILE1' });

    await request(app).post('/api/sendFileByUrl').send({
      idInstance: '1101',
      apiTokenInstance: 'tok',
      chatId: '77771234567',
      urlFile: 'https://my.site.com/img/horse.png',
    });

    const call = (globalThis.fetch as unknown as { mock: { calls: unknown[][] } }).mock.calls[0]!;
    const body = JSON.parse((call[1] as RequestInit).body as string);
    expect(body.fileName).toBe('horse.png');
    expect(body.urlFile).toBe('https://my.site.com/img/horse.png');
  });
});

describe('upstream failure handling', () => {
  it('maps transport errors to HTTP 502', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValueOnce(new Error('ECONNREFUSED'));

    const res = await request(app)
      .post('/api/getStateInstance')
      .send({ idInstance: '1101', apiTokenInstance: 'tok' });

    expect(res.status).toBe(502);
    expect(res.body.error.message).toContain('GREEN-API');
  });
});

describe('non-JSON upstream response', () => {
  it('wraps an HTML 403 page into a JSON envelope with a hint', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response('<html><body>403 Forbidden nginx</body></html>', {
        status: 403,
        headers: { 'Content-Type': 'text/html' },
      }) as unknown as Response,
    );

    const res = await request(app)
      .post('/api/getSettings')
      .send({ idInstance: '1101', apiTokenInstance: 'tok' });

    expect(res.status).toBe(403);
    expect(res.body.httpStatus).toBe(403);
    expect(res.body.error).toContain('не-JSON');
    expect(res.body.hint).toContain('idInstance');
    expect(res.body.raw).toContain('403 Forbidden');
  });
});

describe('GET /health', () => {
  it('reports ok', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });
});
