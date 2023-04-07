/**
 * Takes a response from a SELECT SPARQL query and turns it into an
 * array where each item contains an object with each variable
 * projection as a key-value pair.
 * Note: the values are not cast, they're all strings.
 *
 * @param {Object} response
 * @returns {Array}
 */
function parseSparqlResponse(response) {
  const bindingKeys = response.head.vars;
  return response.results.bindings.map((row) => {
    const obj = {};
    bindingKeys.forEach((key) => {
      if (row[key]) {
        obj[key] = row[key].value;
      } else {
        obj[key] = null;
      }
    });
    return obj;
  });
}

export {
  parseSparqlResponse,
}
