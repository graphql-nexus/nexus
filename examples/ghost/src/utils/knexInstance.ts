import Knex from "knex";
import _ from "lodash";
const config = require("../../config.development.json");

export const knex = Knex({
  ...config.database,
  wrapIdentifier,
});

const wrappedIdentCache = Object.create(null);
const camelizedFieldNameCache = Object.create(null);

function typeCast(field: any, next: Function) {
  field.packet.name =
    camelizedFieldNameCache[field.name] ||
    (camelizedFieldNameCache[field.name] = _.camelCase(field.name));
  return next();
}

function wrapIdentifier(value: string, origImpl: any) {
  return (
    wrappedIdentCache[value] ||
    (wrappedIdentCache[value] =
      value === "*" ? value : origImpl(_.snakeCase(value)))
  );
}

// Turns out knex doesn't have a good story around tranforming rows.
// Let's tap into some core mysql apis here and fix it later :)
knex.client.connectionSettings.typeCast = typeCast;
