# Validata Express

Type safe data validation and sanitization for [Express](https://www.npmjs.com/package/express) requests
(body, query, headers, params) using [validata](https://www.npmjs.com/package/validata).

See [validata](https://www.npmjs.com/package/validata) for more details on validation functionality.

## Getting started

```bash
npm i validata validata-koa
```

## Basic usage

### Body checking

```typescript
import * as bodyParser from 'body-parser';
import * as express from 'express';
import { Request, Response } from 'express';
import { asNumber, isObject, isString, maybeString } from 'validata';
import validator from 'validator';
import { body, params, Statuses, validate } from 'validata-express';

interface Body {
  age: number;
  email?: string;
  name: string;
}

const bodyCheck = isObject<Body>({
  age: asNumber({ min: 0, coerceMax: 120 }),
  email: maybeString({ validator: validator.isEmail }),
  name: isString(),
});

const app = express();
app.use(bodyParser.json());

const router = express.Router();
router.post('/:id', (req: Request, res: Response) => {
  // these are now strongly typed
  // if age is passed in as a string, it will be converted to a number (by the asNumber() check)
  const { age, email, name } = body(req, bodyCheck);
  console.log({ age, email, name });
  res.status(Statuses.OK).send({ age });
});
app.use(router);
// validate() middleware captures and formats validation issue responses
app.use(validate());

app.listen(8081);
```

### Params and query parameters

```typescript
import * as bodyParser from 'body-parser';
import * as express from 'express';
import { Request, Response } from 'express';
import { asNumber, isObject, isString, maybeAsNumber } from 'validata';
import { params, query, Statuses, validate } from 'validata-express';

interface Params {
  id: number;
}

const paramsCheck = isObject<Params>({
  id: asNumber({ min: 0 }),
});

interface Query {
  filter: string;
  page?: number;
}

const queryCheck = isObject<Query>({
  filter: isString(),
  page: maybeAsNumber({ min: 0 }),
});

const app = express();
app.use(bodyParser.json());

const router = express.Router();
router.post('/:id', (req: Request, res: Response) => {
  // these are now strongly typed
  const { id } = params(req, paramsCheck);
  const { filter, page } = query(req, queryCheck);

  res.status(Statuses.OK).send({ id, filter, page });
});
app.use(router);
// validate() middleware captures and formats validation issue responses
app.use(validate());

app.listen(8081);
```

Testing it out...

```bash
curl -X POST localhost:8081/foo
# status=400
# {"issues":[{"path":[":","id"],"value":"foo","reason":"no-conversion","info":{"toType":"number"}}]}

curl -X POST localhost:8081/12
# status=400
# {"issues":[{"path":["?","filter"],"reason":"not-defined"}]}

curl -X POST localhost:8081/12?filter=test
# status=200
# {"id":12,"filter":"test"}

curl -X POST localhost:8081/-2?filter=test
# status=400
# {"issues":[{"path":[":","id"],"value":-2,"reason":"min","info":{"min":0}}]}
```

### Headers

... can be done in pretty much the same way
