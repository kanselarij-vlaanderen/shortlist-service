import { fetchPublicationFlowsShortlist } from "./publication-flows";

/**
 * Constructs JSON:API representation of the piece shortlist
 * for publication-flows. The response data will contain the following
 * included records:
 * - the pieces' document containers
 * - the document containers' types
 * - the final agendaitem version linked the pieces
 * - the agendaitem treatment linked to the agendaitem
 * - the mandatees linked to the agendaitems
 * - the persons linked to the mandatees
 *
 * @returns {Object} a JSON:API compliant representation of a list of
 *   pieces, including the necessary relations to render the frontend
 */
async function publicationFlowsShortlistJsonApi() {
  const {
    pieces,
    documentContainers,
    documentTypes,
    agendaitems,
    agendaItemTreatments,
    mandatees,
    persons,
    decisionActivities,
  } = coalesceResults(await fetchPublicationFlowsShortlist());

  const data = Array.from(pieces.values());
  const included = [
    ...Array.from(documentContainers.values()),
    ...Array.from(documentTypes.values()),
    ...Array.from(agendaitems.values()),
    ...Array.from(agendaItemTreatments.values()),
    ...Array.from(mandatees.values()),
    ...Array.from(persons.values()),
    ...Array.from(decisionActivities.values()),
  ];

  const response = {
    data,
    included,
  };

  return response;
}

/**
 * Takes an array of objects containing key-value pairs of a SPARQL
 * SELECT query publication-flow shortlist and turns it into separate
 * per-type Maps.
 *
 * @param {[Object]} results the array of results, as output by the
 *   parseSparqlResponse function
 * @returns {Object} Object containing Maps for each type of object
 */
function coalesceResults(results) {
  // Note: ideally we'd use a Set, but JS sets use deep equality (===)
  // to determine if two objects are the same. For objects {} that won't
  // work. We will use a Map instead and use the row's ID as the key.
  // Map.values() returns the values in insertion order so we have to
  // ensure that we insert the *pieces* in the same order we receive
  // them (assuming that the results input is sorted).
  const pieces = new Map();
  const documentContainers = new Map();
  const documentTypes = new Map();
  const agendaitems = new Map();
  const agendaItemTreatments = new Map();
  const mandatees = new Map();
  const persons = new Map();
  const decisionActivities = new Map();

  for (let row of results) {
    let piece;
    let documentContainer;
    let agendaitem;
    let agendaItemTreatment;
    let decisionActivity;
    let mandatee;
    let person;

    if (pieces.has(row.uuid)) {
      piece = pieces.get(row.uuid);
    } else {
      piece = {
        type: 'pieces',
        id: row.uuid,
        attributes: {
          name: row.name,
          created: row.created,
          modified: row.modified,
          uri: row.uri,
        },
        relationships: {
          'document-container': {
            data: {
              type: 'document-containers',
              id: row.documentContainerUuid,
            }
          },
          agendaitems: {
            data: new Map(),
          },
        },
      };
      pieces.set(piece.id, piece);
    }

    if (!documentContainers.has(row.documentContainerUuid)) {
      documentContainer = {
        type: 'document-containers',
        id: row.documentContainerUuid,
        attributes: {
          uri: row.documentContainerUri,
        },
        relationships: {
          type: {
            data: {
              type: 'document-types',
              id: row.documentContainerTypeUuid,
            },
          },
        },
      };
      documentContainers.set(documentContainer.id, documentContainer);
    }

    if (!documentTypes.has(row.documentContainerTypeUuid)) {
      documentTypes.set(row.documentContainerTypeUuid, {
        type: 'document-types',
        id: row.documentContainerTypeUuid,
        attributes: {
          uri: row.documentContainerTypeUri,
          label: row.documentContainerTypeLabel,
          'alt-label': row.documentContainerTypeAltLabel,
          position: row.documentContainerTypePosition,
        },
      });
    }

    if (agendaitems.has(row.agendaItemUuid)) {
      agendaitem = agendaitems.get(row.agendaItemUuid);
    } else {
      agendaitem = {
        type: 'agendaitems',
        id: row.agendaItemUuid,
        relationships: {
          pieces: {
            data: new Map(),
          },
          mandatees: {
            data: new Map(),
          },
          'agenda-item-treatment': {
            data: {
              type: 'agenda-item-treatments',
              id: row.agendaItemTreatmentUuid,
            }
          }
        }
      };
      agendaitems.set(row.agendaItemUuid, agendaitem);
    }

    if (agendaItemTreatments.has(row.agendaItemTreatmentUuid)) {
      agendaItemTreatment = agendaItemTreatments
        .get(row.agendaItemTreatmentUuid);
    } else {
      agendaItemTreatment = {
        type: 'agenda-item-treatments',
        id: row.agendaItemTreatmentUuid,
        relationships: {
          agendaitems: {
            data: new Map(),
          },
          'decision-activity': {
            data: {
              type: 'decision-activities',
              id: row.decisionActivityUuid,
            },
          },
        },
      };
      agendaItemTreatments
        .set(row.agendaItemTreatmentUuid, agendaItemTreatment);
    }

    if (decisionActivities.has(row.decisionActivityUuid)) {
      decisionActivity = decisionActivities
        .get(row.decisionActivityUuid);
    } else {
      decisionActivity = {
        type: 'decision-activities',
        id: row.decisionActivityUuid,
        attributes: {
          'start-date': row.decisionActivityStartDate,
        },
        relationships: {
          subcase: {
            links: {
              related: `/decision-activities/${row.decisionActivityUuid}/subcase`,
            },
          },
          treatment: {
            data: {
              type: 'agenda-item-treatments',
              id: row.agendaItemTreatmentUuid,
            },
          },
        },
      };
      decisionActivities.set(row.decisionActivityUuid, decisionActivity);
    }

    if (mandatees.has(row.mandateeUuid)) {
      mandatee = mandatees.get(row.mandateeUuid);
    } else {
      mandatee = {
        type: 'mandatees',
        id: row.mandateeUuid,
        attributes: {
          priority: row.mandateePriority,
        },
        relationships: {
          agendaitems: {
            data: new Map(),
          },
          person: {
            data: {
              type: 'persons',
              id: row.personUuid,
            }
          }
        }
      }
      mandatees.set(row.mandateeUuid, mandatee);
    }

    if (persons.has(row.personUuid)) {
      person = persons.get(row.personUuid);
    } else {
      person = {
        type: 'persons',
        id: row.personUuid,
        attributes: {
          'first-name': row.personFirstName,
          'last-name': row.personLastName,
        },
        relationships: {
          mandatees: {
            data: new Map(),
          },
        }
      };
      persons.set(row.personUuid, person);
    }

    piece.relationships.agendaitems.data.set(agendaitem.id, {
      type: 'agendaitems',
      id: agendaitem.id,
    });
    agendaitem.relationships.pieces.data.set(piece.id, {
      type: 'pieces',
      id: piece.id,
    });
    agendaitem.relationships.mandatees.data.set(mandatee.id, {
      type: 'mandatees',
      id: mandatee.id,
    });
    agendaItemTreatment.relationships.agendaitems.data
                       .set(agendaitem.id, {
                        type: 'agendaitems',
                        id: agendaitem.id,
                      });
    mandatee.relationships.agendaitems.data.set(agendaitem.id, {
      type: 'agendaitems',
      id: agendaitem.id,
    });
    person.relationships.mandatees.data.set(mandatee.id, {
      type: 'mandatees',
      id: mandatee.id,
    });
  }

  pieces.forEach((piece) => {
    piece.relationships.agendaitems.data =
      Array.from(piece.relationships.agendaitems.data.values());
  });
  agendaitems.forEach((agendaitem) => {
    agendaitem.relationships.pieces.data =
      Array.from(agendaitem.relationships.pieces.data.values());
    agendaitem.relationships.mandatees.data =
      Array.from(agendaitem.relationships.mandatees.data.values());
  });
  agendaItemTreatments.forEach((treatment) => {
    treatment.relationships.agendaitems.data =
      Array.from(treatment.relationships.agendaitems.data.values());
  });
  mandatees.forEach((mandatee) => {
    mandatee.relationships.agendaitems.data =
      Array.from(mandatee.relationships.agendaitems.data.values());
  });
  persons.forEach((person) => {
    person.relationships.mandatees.data =
      Array.from(person.relationships.mandatees.data.values());
  });

  return {
    pieces,
    documentContainers,
    documentTypes,
    agendaitems,
    agendaItemTreatments,
    mandatees,
    persons,
    decisionActivities,
  }
}

export {
  publicationFlowsShortlistJsonApi,
}
