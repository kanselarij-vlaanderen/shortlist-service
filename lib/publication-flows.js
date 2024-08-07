import { query, sparqlEscapeUri, sparqlEscapeDateTime } from 'mu';
import { subDays, startOfDay } from 'date-fns';
import PREFIXES from './prefixes';
import CONSTANTS from './constants';
import { parseSparqlResponse } from './utils';

async function fetchPublicationFlowsShortlist() {
  const date = startOfDay(subDays(new Date(), process.env.WINDOW_SIZE_PUBLICATION_FLOWS ?? 7));

  const response = await query(`${PREFIXES}
SELECT DISTINCT ?uuid
WHERE {
  VALUES (?decisionResult) { (${sparqlEscapeUri(CONSTANTS.DECISION_RESULT_CODES.GOEDGEKEURD)}) }
  VALUES (?approvedAgendaStatus) { (${sparqlEscapeUri(CONSTANTS.AGENDA_STATUSSES.GOEDGEKEURD)}) }

  ?piece a dossier:Stuk ;
          mu:uuid ?uuid ;
          dct:created ?created .

  FILTER NOT EXISTS { [] pav:previousVersion ?piece }

  ?piece ^besluitvorming:geagendeerdStuk ?agendaItem .
  ?agenda dct:hasPart ?agendaItem ;
           besluitvorming:agendaStatus ?approvedAgendaStatus .
  FILTER NOT EXISTS { ?agenda ^prov:wasRevisionOf / besluitvorming:agendaStatus ?approvedAgendaStatus }

  ?agenda besluitvorming:isAgendaVoor ?meeting .
  ?meeting besluit:geplandeStart ?meetingDate .
  FILTER (?meetingDate >= ${sparqlEscapeDateTime(date)})

  ?agendaItemTreatment dct:subject ?agendaItem ;
                       besluitvorming:heeftBeslissing ?decisionActivity .
  ?decisionActivity ext:beslissingVindtPlaatsTijdens ?subcase ;
                    besluitvorming:resultaat ?decisionResult .
  ?documentContainer dossier:Collectie.bestaatUit ?piece .

  ?decisionmakingFlow dossier:doorloopt ?subcase .
  ?case dossier:Dossier.isNeerslagVan ?decisionmakingFlow .
  FILTER NOT EXISTS { ?publicationFlow dossier:behandelt ?case }

  {
    ?subcase dct:type ${sparqlEscapeUri(CONSTANTS.SUBCASE_TYPES.DEFINITIEVE_GOEDKEURING)} .
    ?documentContainer dct:type ${sparqlEscapeUri(CONSTANTS.DOCUMENT_TYPES.BVR)} .
  }
  UNION
  {
    ?subcase dct:type ${sparqlEscapeUri(CONSTANTS.SUBCASE_TYPES.BEKRACHTIGING_VR)} .
    ?documentContainer dct:type ${sparqlEscapeUri(CONSTANTS.DOCUMENT_TYPES.DECREET)} .
  }
}`);
  return parseSparqlResponse(response);
}

export {
  fetchPublicationFlowsShortlist,
}
