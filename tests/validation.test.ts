import { describe, expect, it } from 'vitest';
import {
  chatIdSchema,
  credentialsSchema,
  sendFileByUrlSchema,
  sendMessageSchema,
} from '../src/validation.js';

describe('chatIdSchema', () => {
  it('appends @c.us to a bare phone number', () => {
    expect(chatIdSchema.parse('77771234567')).toBe('77771234567@c.us');
  });

  it('strips formatting characters', () => {
    expect(chatIdSchema.parse('+7 (777) 123-45-67')).toBe('77771234567@c.us');
  });

  it('keeps an already-formatted chat id untouched', () => {
    expect(chatIdSchema.parse('77771234567@c.us')).toBe('77771234567@c.us');
    expect(chatIdSchema.parse('120363@g.us')).toBe('120363@g.us');
  });

  it('rejects non-numeric / too-short input', () => {
    expect(() => chatIdSchema.parse('abc')).toThrow();
    expect(() => chatIdSchema.parse('123')).toThrow();
  });
});

describe('credentialsSchema', () => {
  it('accepts valid credentials', () => {
    const parsed = credentialsSchema.parse({ idInstance: '1101', apiTokenInstance: 'abcDEF123' });
    expect(parsed.idInstance).toBe('1101');
  });

  it('rejects non-digit idInstance and missing token', () => {
    expect(() => credentialsSchema.parse({ idInstance: '11x', apiTokenInstance: 'abc' })).toThrow();
    expect(() => credentialsSchema.parse({ idInstance: '1101', apiTokenInstance: '' })).toThrow();
  });
});

describe('sendMessageSchema', () => {
  it('validates and normalises a full payload', () => {
    const parsed = sendMessageSchema.parse({
      idInstance: '1101',
      apiTokenInstance: 'tok',
      chatId: '77771234567',
      message: 'Hello World!',
    });
    expect(parsed.chatId).toBe('77771234567@c.us');
    expect(parsed.message).toBe('Hello World!');
  });

  it('rejects an empty message', () => {
    expect(() =>
      sendMessageSchema.parse({ idInstance: '1101', apiTokenInstance: 'tok', chatId: '77771234567', message: '' }),
    ).toThrow();
  });
});

describe('sendFileByUrlSchema', () => {
  it('requires a valid URL', () => {
    expect(() =>
      sendFileByUrlSchema.parse({ idInstance: '1101', apiTokenInstance: 'tok', chatId: '77771234567', urlFile: 'not-a-url' }),
    ).toThrow();
  });

  it('accepts a valid URL and optional fileName', () => {
    const parsed = sendFileByUrlSchema.parse({
      idInstance: '1101',
      apiTokenInstance: 'tok',
      chatId: '77771234567',
      urlFile: 'https://my.site.com/img/horse.png',
    });
    expect(parsed.urlFile).toBe('https://my.site.com/img/horse.png');
    expect(parsed.fileName).toBeUndefined();
  });
});
