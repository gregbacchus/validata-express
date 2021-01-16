import { describeGiven, then, when } from '@geeebe/jest-bdd';
import * as bodyParser from 'body-parser';
import * as express from 'express';
import { Request, Response } from 'express';
import { address, internet, name } from 'faker';
import { Server } from 'http';
import * as request from 'supertest';
import { asString, isNumber, isObject, maybeString } from 'validata';
import validator from 'validator';
import { body } from './getters';
import { validate, ValidateOptions, validateRequest } from './middleware';
import { Statuses } from './statuses';
import { ValidationError } from './validation-error';

describe('validate', () => {
  const startTestServer = (handler: (req: Request) => void): Server => {
    const app = express();
    app.use(bodyParser.json());
    const router = express.Router();
    router.post('/', (req: Request, res: Response) => {
      if (handler) {
        res.status(Statuses.OK).send(handler(req));
      } else {
        res.status(Statuses.OK).send({});
      }
    });
    app.use(router);
    app.use(validate());

    return app.listen();
  };

  describeGiven('express is configured with validate middleware and no checks', () => {
    const given = () => {
      const server = startTestServer(() => { });
      return { server };
    };

    when('POST is called with empty object', () => {
      const { server } = given();
      afterAll(() => server.close());

      const promise = request(server)
        .post('/')
        .send({});

      then('it will succeed', async () => {
        const response = await promise;

        expect(response.status).toBe(Statuses.OK);
        expect(response.body).toStrictEqual({});
      });
    });
  });

  describeGiven('express is configured with validate middleware and checks', () => {
    interface Body {
      age: number;
      email?: string;
      name: string;
    }

    const given = () => {
      const check = isObject<Body>({
        age: isNumber({ min: 0, coerceMax: 100 }),
        email: maybeString({ validator: validator.isEmail }),
        name: asString(),
      });
      const server = startTestServer((req) => body(req, check));
      return { server };
    };

    when('POST is called with empty object', () => {
      const { server } = given();
      afterAll(() => server.close());

      const promise = request(server)
        .post('/')
        .send({});

      then('it will fail with status 400', async () => {
        const response = await promise;

        expect(response.status).toBe(Statuses.BAD_REQUEST);
      });
    });
  });

  describeGiven('express is configured with validate middleware and throws Error', () => {
    const given = () => {
      const server = startTestServer(() => { throw new Error('testing'); });
      return { server };
    };

    when('POST is called', () => {
      const { server } = given();
      afterAll(() => server.close());

      const promise = request(server)
        .post('/')
        .send({});

      then('it will fail with status 500', async () => {
        const response = await promise;

        expect(response.status).toBe(Statuses.SERVER_ERROR);
      });
    });
  });

  describeGiven('express is configured with validate middleware and throws ValidationError', () => {
    const given = () => {
      const server = startTestServer(() => { throw new ValidationError([]); });
      return { server };
    };

    when('POST is called', () => {
      const { server } = given();
      afterAll(() => server.close());

      const promise = request(server)
        .post('/')
        .send({});

      then('it will return status 400', async () => {
        const response = await promise;

        expect(response.status).toBe(Statuses.BAD_REQUEST);
      });
    });
  });
});

describe('validateRequest', () => {
  const startTestServer = <B, H, Q>(checks: ValidateOptions<B, H, Q>): Server => {
    const app = express();
    app.use(bodyParser.json());
    const router = express.Router();
    router.post('/', validateRequest(checks), (req: Request, res: Response) => {
      res.status(Statuses.OK).send(req.body);
    });
    app.use(router);

    return app.listen();
  };

  describeGiven('express is configured with validata middleware having no checks', () => {
    const given = () => {
      const server = startTestServer({});
      return { server };
    };

    when('POST is called with empty object', () => {
      const { server } = given();
      afterAll(() => server.close());

      const promise = request(server)
        .post('/')
        .send({});

      then('it will succeed', async () => {
        const response = await promise;

        expect(response.status).toBe(Statuses.OK);
        expect(response.body).toStrictEqual({});
      });
    });
  });

  describeGiven('express is configured with validata middleware having body check', () => {
    interface Body {
      age: number;
      email?: string;
      name: string;
    }

    const given = () => {
      const check = isObject<Body>({
        age: isNumber({ min: 0, coerceMax: 100 }),
        email: maybeString({ validator: validator.isEmail }),
        name: asString(),
      });
      const server = startTestServer({ body: check });
      return { server };
    };

    when('POST is called with empty object', () => {
      const { server } = given();
      afterAll(() => server.close());

      const promise = request(server)
        .post('/')
        .send({});

      then('it will fail validation', async () => {
        const response = await promise;

        expect(response.status).toBe(Statuses.BAD_REQUEST);
        if (!Array.isArray(response.body)) fail('body must be an array');
        expect(response.body.length).toBe(2);
        expect(response.body).toContainEqual(expect.objectContaining({ path: ['age'], reason: 'not-defined' }));
        expect(response.body).toContainEqual(expect.objectContaining({ path: ['name'], reason: 'not-defined' }));
        expect(response.body).not.toContain(expect.objectContaining({ path: ['email'], reason: 'not-defined' }));
      });
    });

    when('POST is called with valid object', () => {
      const { server } = given();
      afterAll(() => server.close());

      const requestBody = {
        age: 500,
        name: name.findName(),
        email: internet.email(),
      };
      const promise = request(server)
        .post('/')
        .send(requestBody);

      then('it will succeed, and respond with coerced values', async () => {
        const response = await promise;

        expect(response.status).toBe(Statuses.OK);
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        const body: Record<string, unknown> = response.body;

        expect(body.age).toBe(100);
        expect(body.email).toBe(requestBody.email);
        expect(body.name).toBe(requestBody.name);
      });
    });

    when('POST is called with object containing extra properties', () => {
      const { server } = given();
      afterAll(() => server.close());

      const requestBody = {
        age: 500,
        name: name.findName(),
        email: internet.email(),
        address: address.streetAddress(),
      };
      const promise = request(server)
        .post('/')
        .send(requestBody);

      then('it will fail validation', async () => {
        const response = await promise;

        expect(response.status).toBe(Statuses.BAD_REQUEST);
        if (!Array.isArray(response.body)) fail('body must be an array');
        expect(response.body.length).toBe(1);
        expect(response.body).toContainEqual(expect.objectContaining({ path: ['address'], reason: 'unexpected-property' }));
      });
    });
  });
});
