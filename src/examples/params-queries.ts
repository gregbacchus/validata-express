import * as bodyParser from 'body-parser';
import * as express from 'express';
import { Request, Response } from 'express';
import { asNumber, isObject, isString, maybeAsNumber } from 'validata';
import { params, query, Statuses, validate } from '..';

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
