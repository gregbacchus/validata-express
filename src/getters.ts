import { Request } from 'express';
import { check, ValueProcessor } from 'validata';

export const body = <T>(req: Request, checker: ValueProcessor<T>): T => check(checker, () => req?.body as unknown);
export const headers = <T>(req: Request, checker: ValueProcessor<T>): T => check(checker, () => req.headers as unknown, '#');
export const params = <T>(req: Request, checker: ValueProcessor<T>): T => check(checker, () => req.params, ':');
export const query = <T>(req: Request, checker: ValueProcessor<T>): T => check(checker, () => req.query as unknown, '?');

export { check as base };
