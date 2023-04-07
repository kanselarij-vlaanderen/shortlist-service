import { query, sparqlEscapeUri, sparqlEscapeDateTime } from 'mu';
import { subDays, startOfDay } from 'date-fns';
import PREFIXES from './prefixes';
import CONSTANTS from './constants';
import { parseSparqlResponse } from './utils';

async function fetchPublicationFlowsShortlist() {
  const date = startOfDay(subDays(new Date(), 120));

  const response = await query(`${PREFIXES}
SELECT DISTINCT
  ?uuid
  (?piece AS ?uri)
  ?name
  ?created
  ?modified

  ?documentContainerUuid
  (?documentContainer AS ?documentContainerUri)

  ?documentContainerTypeUuid
  (?documentContainerType AS ?documentContainerTypeUri)
  ?documentContainerTypeLabel
  ?documentContainerTypeAltLabel
  ?documentContainerTypePosition

  ?agendaItemTreatmentUuid
  (?agendaItemTreatment AS ?agendaItemTreatmentUri)

  ?agendaItemUuid
  (?agendaItem AS ?agendaItemUri)

  ?decisionActivityUuid
  (?decisionActivity AS ?decisionActivityUri)
  ?decisionActivityStartDate

  ?mandateeUuid
  (?mandatee AS ?mandateeUri)
  ?mandateePriority

  ?personUuid
  (?person AS ?personUri)
  ?personFirstName
  ?personLastName

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

  ?agendaItemTreatment dct:subject ?agendaItem ;
                       mu:uuid ?agendaItemTreatmentUuid ;
                       besluitvorming:heeftBeslissing ?decisionActivity .
  ?decisionActivity ext:beslissingVindtPlaatsTijdens ?subcase ;
                    mu:uuid ?decisionActivityUuid ;
                    besluitvorming:resultaat ?decisionResult .
  ?documentContainer dossier:Collectie.bestaatUit ?piece ;
                     mu:uuid ?documentContainerUuid .

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

  ?agendaItem mu:uuid ?agendaItemUuid .

  OPTIONAL { ?decisionActivity dossier:Activiteit.startdatum ?decisionActivityStartDate }

  ?documentContainer dct:type ?documentContainerType .
  OPTIONAL { ?documentContainerType mu:uuid ?documentContainerTypeUuid }
  OPTIONAL { ?documentContainerType skos:prefLabel ?documentContainerTypeLabel }
  OPTIONAL { ?documentContainerType skos:altLabel ?documentContainerTypeAltLabel }
  OPTIONAL { ?documentContainerType schema:position ?documentContainerTypePosition }

  OPTIONAL {
    ?agendaItem ext:heeftBevoegdeVoorAgendapunt ?mandatee .
    ?mandatee mu:uuid ?mandateeUuid .
    OPTIONAL { ?mandatee mandaat:rangorde ?mandateePriority }

    OPTIONAL {
      ?mandatee mandaat:isBestuurlijkeAliasVan ?person .
      OPTIONAL { ?person mu:uuid ?personUuid }
      OPTIONAL { ?person persoon:gebruikteVoornaam ?personFirstName }
      OPTIONAL { ?person foaf:familyName ?personLastName }
    }
  }
}
ORDER BY DESC(?created)`);
  return parseSparqlResponse(response);
}

export {
  fetchPublicationFlowsShortlist,
}
