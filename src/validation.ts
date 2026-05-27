import { z } from 'zod';

export const credentialsSchema = z.object({
  idInstance: z
    .string()
    .trim()
    .regex(/^\d+$/, 'idInstance is required and must contain digits only'),
  apiTokenInstance: z
    .string()
    .trim()
    .regex(/^[A-Za-z0-9]+$/, 'apiTokenInstance is required and must be alphanumeric'),
});

export const chatIdSchema = z
  .string()
  .trim()
  .min(1, 'phone number is required')
  .transform((value, ctx) => {
    if (/@(c|g)\.us$/.test(value)) return value;
    const digits = value.replace(/[\s\-()+]/g, '');
    if (!/^\d{7,15}$/.test(digits)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'phone number must contain 7–15 digits (international format, no leading +)',
      });
      return z.NEVER;
    }
    return `${digits}@c.us`;
  });

export const sendMessageSchema = credentialsSchema.extend({
  chatId: chatIdSchema,
  message: z.string().min(1, 'message is required').max(20000, 'message is too long'),
});

export const sendFileByUrlSchema = credentialsSchema.extend({
  chatId: chatIdSchema,
  urlFile: z.string().trim().url('urlFile must be a valid URL'),
  fileName: z.string().trim().min(1).max(255).optional(),
});

export type CredentialsInput = z.infer<typeof credentialsSchema>;
export type SendMessageInput = z.infer<typeof sendMessageSchema>;
export type SendFileByUrlInput = z.infer<typeof sendFileByUrlSchema>;
