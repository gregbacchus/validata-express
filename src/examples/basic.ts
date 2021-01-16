import * as bodyParser from 'body-parser';
import * as express from 'express';
import { Request, Response } from 'express';
import { asNumber, isObject, isString, maybeString } from 'validata';
import validator from 'validator';
import { body, Statuses, validate } from '../';

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
