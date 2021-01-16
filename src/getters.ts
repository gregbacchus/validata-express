import { Request } from 'express';
import { isIssue, ValueProcessor } from 'validata';
import { ValidationError } from './validation-error';

export const body = <T>(req: Request, check: ValueProcessor<T>): T => base(check, () => req?.body as unknown);
export const headers = <T>(req: Request, check: ValueProcessor<T>): T => base(check, () => req.headers as unknown, '#');
export const params = <T>(req: Request, check: ValueProcessor<T>): T => base(check, () => req.params, ':');
export const query = <T>(req: Request, check: ValueProcessor<T>): T => base(check, () => req.query as unknown, '?');

export const base = <T>(check: ValueProcessor<T>, value: () => unknown, nest?: string | number): T => {
  const result = check.process(value());
  if (isIssue(result)) {
    throw new ValidationError(nest ? result.issues.map((issue) => issue.nest(nest)) : result.issues);
  }
  return result.value;
};
