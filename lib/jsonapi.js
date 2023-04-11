import { fetchPublicationFlowsShortlist } from "./publication-flows";

/**
 * Constructs JSON:API representation of the piece shortlist for
 * publication-flows. The response data will only contain the IDs.
 *
 * @returns {Object} a JSON:API compliant representation of a list of
 *   pieces, only containing their IDs
 */
async function publicationFlowsShortlistJsonApi() {
  const shortlist = await fetchPublicationFlowsShortlist();

  const data = shortlist.map((row) => ({
    type: 'pieces',
    id: row.uuid,
  }));

  const response = {
    data,
  };

  return response;
}

export {
  publicationFlowsShortlistJsonApi,
}
