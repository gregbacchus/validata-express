import { ErrorRequestHandler, NextFunction, Request, RequestHandler, Response } from 'express';
import { isIssue, Issue, isValue, ValidationError, ValueProcessor } from 'validata';
import { Statuses } from './statuses';

export interface ValidateOptions<B, H, Q> {
  body?: ValueProcessor<B>,
  header?: ValueProcessor<H>,
  query?: ValueProcessor<Q>,
}

export const validateRequest = <B, H, Q>({ body, query, header }: ValidateOptions<B, H, Q>
): RequestHandler => (req: Request, res: Response, next: NextFunction): void => {
  const bodyResult = body?.process(req.body);
  const headerResult = header?.process(req.headers, ['#']);
  const queryResult = query?.process(req.query, ['?']);

  const issues: Issue[] = [];
  if (isIssue(bodyResult)) {
    issues.push(...bodyResult.issues);
  }
  if (isIssue(headerResult)) {
    issues.push(...headerResult.issues);
  }
  if (isIssue(queryResult)) {
    issues.push(...queryResult.issues);
  }
  if (issues.length > 0) {
    res.status(Statuses.BAD_REQUEST).send(issues);
    return;
  }

  if (bodyResult && isValue(bodyResult)) {
    req.body = bodyResult.value;
  }
  if (headerResult && isValue(headerResult)) {
    req.headers = {
      ...req.headers,
      ...headerResult.value,
    };
  }
  if (queryResult && isValue(queryResult)) {
    req.query = {
      ...req.query,
      ...queryResult.value,
    };
  }
  next();
};

export const validate = (): ErrorRequestHandler => (err: Error | ValidationError, _req: Request, res: Response, _next: NextFunction): void => {
  if (!((err instanceof ValidationError || err.constructor.name === 'ValidationError') && 'issues' in err)) throw err;
  res.status(Statuses.BAD_REQUEST).send({ issues: err.issues });
};
