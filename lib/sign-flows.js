import { query, sparqlEscapeUri, sparqlEscapeDateTime } from 'mu';
import { subDays, startOfDay } from 'date-fns';
import PREFIXES from './prefixes';
import CONSTANTS from './constants';
import { parseSparqlResponse } from './utils';

async function fetchSignFlowsShortlist() {
  const date = startOfDay(subDays(new Date(), 7));

  const response = await query(`${PREFIXES}
SELECT DISTINCT ?uuid
WHERE {
  VALUES (?decisionResult) { (${sparqlEscapeUri(CONSTANTS.DECISION_RESULT_CODES.GOEDGEKEURD)}) }

  ?piece a dossier:Stuk ;
          mu:uuid ?uuid ;
          dct:created ?created .
  OPTIONAL { ?piece dct:title ?name }
  OPTIONAL { ?piece dct:modified ?modified }

  FILTER NOT EXISTS { [] pav:previousVersion ?piece }
  FILTER (?created > ${sparqlEscapeDateTime(date)})

  ?piece ^besluitvorming:geagendeerdStuk ?agendaItem .
  ?agenda dct:hasPart ?agendaItem .
  FILTER NOT EXISTS { [] prov:wasRevisionOf ?agenda }

  FILTER EXISTS {
    ?agenda besluitvorming:isAgendaVoor ?meeting .
    ?decisionPublicationActivity
      ext:internalDecisionPublicationActivityUsed ?meeting ;
      prov:startedAtTime ?decisionPublicationActivityStartDate .
  }

  ?agendaItemTreatment dct:subject ?agendaItem ;
                       besluitvorming:heeftBeslissing ?decisionActivity .
  ?decisionActivity ext:beslissingVindtPlaatsTijdens ?subcase ;
                    besluitvorming:resultaat ?decisionResult .

  ?documentContainer dossier:Collectie.bestaatUit ?piece .

  FILTER NOT EXISTS { ?signMarkingActivity sign:gemarkeerdStuk ?piece }

  ?subcase dct:type ${sparqlEscapeUri(CONSTANTS.SUBCASE_TYPES.DEFINITIEVE_GOEDKEURING)} .
  ?documentContainer dct:type ${sparqlEscapeUri(CONSTANTS.DOCUMENT_TYPES.BVR)} .
}`);
  return parseSparqlResponse(response);
}

export {
  fetchSignFlowsShortlist,
}
