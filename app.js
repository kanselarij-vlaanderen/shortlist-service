import { app, errorHandler } from 'mu';
import { publicationFlowsShortlistJsonApi, signFlowsShortlistJsonApi } from './lib/jsonapi';

app.get('/', function(_req, res ) {
  return res.status(200).send({ title: 'Hello from the shortlist service' });
});

app.get('/publication-flows', async function(_req, res) {
  try {
    const response = await publicationFlowsShortlistJsonApi();
    return res
      .status(200)
      .send(response);
  } catch (e) {
    console.error(e);
    next(e);
  }
});

app.get('/sign-flows', async function(_req, res) {
  try {
    const response = await signFlowsShortlistJsonApi();
    return res
      .status(200)
      .send(response);
  } catch (e) {
    console.error(e);
    next(e);
  }
});

app.use(errorHandler);
