import { GraphQLFieldResolver } from "graphql";
import { GQLiteralAbstractType } from "./core";
import * as Types from "./types";

export function addMix(
  obj: { fields: Types.FieldDefType[] },
  typeName: string | GQLiteralAbstractType<any>,
  mixOptions?: Types.MixOpts<any>
) {
  if (typeName instanceof GQLiteralAbstractType) {
    obj.fields.push({
      item: Types.NodeType.MIX_ABSTRACT,
      type: typeName,
      mixOptions: mixOptions || {},
    });
  } else {
    obj.fields.push({
      item: Types.NodeType.MIX,
      typeName,
      mixOptions: mixOptions || {},
    });
  }
}

export function withDeprecationComment(description?: string | null) {
  return description;
}

export const enumShorthandMembers = (
  arg: string[] | Record<string, string | number | object | boolean>
): Types.EnumMemberInfo[] => {
  if (Array.isArray(arg)) {
    return arg.map((name) => ({ name, value: name }));
  }
  return Object.keys(arg).map((name) => {
    return {
      name,
      value: arg[name],
    };
  });
};

/**
 * If a resolve function is not given, then a default resolve behavior is used
 * which takes the property of the source object of the same name as the field
 * and returns it as the result, or if it's a function, returns the result
 * of calling that function while passing along args and context value.
 */
export const propertyFieldResolver = (
  key: string
): GraphQLFieldResolver<any, any> => {
  return function(source, args, contextValue, info) {
    // ensure source is a value for which property access is acceptable.
    if (typeof source === "object" || typeof source === "function") {
      // TODO: Maybe warn here if key doesn't exist on source?
      const property = source[key];
      if (typeof property === "function") {
        return source[key](args, contextValue, info);
      }
      return property;
    }
  };
};

// ----------------------------

/**
 *
 * Copied from graphql-js:
 *
 */

/**
 * Given an invalid input string and a list of valid options, returns a filtered
 * list of valid options sorted based on their similarity with the input.
 */
export function suggestionList(input: string, options: string[]): string[] {
  var optionsByDistance = Object.create(null);
  var oLength = options.length;
  var inputThreshold = input.length / 2;

  for (var i = 0; i < oLength; i++) {
    var distance = lexicalDistance(input, options[i]);
    var threshold = Math.max(inputThreshold, options[i].length / 2, 1);

    if (distance <= threshold) {
      optionsByDistance[options[i]] = distance;
    }
  }

  return Object.keys(optionsByDistance).sort(function(a, b) {
    return optionsByDistance[a] - optionsByDistance[b];
  });
}
/**
 * Computes the lexical distance between strings A and B.
 *
 * The "distance" between two strings is given by counting the minimum number
 * of edits needed to transform string A into string B. An edit can be an
 * insertion, deletion, or substitution of a single character, or a swap of two
 * adjacent characters.
 *
 * Includes a custom alteration from Damerau-Levenshtein to treat case changes
 * as a single edit which helps identify mis-cased values with an edit distance
 * of 1.
 *
 * This distance can be useful for detecting typos in input or sorting
 */
function lexicalDistance(aStr: string, bStr: string): number {
  if (aStr === bStr) {
    return 0;
  }

  var i;
  var j;
  var d = [];
  var a = aStr.toLowerCase();
  var b = bStr.toLowerCase();
  var aLength = a.length;
  var bLength = b.length; // Any case change counts as a single edit

  if (a === b) {
    return 1;
  }

  for (i = 0; i <= aLength; i++) {
    d[i] = [i];
  }

  for (j = 1; j <= bLength; j++) {
    d[0][j] = j;
  }

  for (i = 1; i <= aLength; i++) {
    for (j = 1; j <= bLength; j++) {
      var cost = a[i - 1] === b[j - 1] ? 0 : 1;
      d[i][j] = Math.min(
        d[i - 1][j] + 1,
        d[i][j - 1] + 1,
        d[i - 1][j - 1] + cost
      );

      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + cost);
      }
    }
  }

  return d[aLength][bLength];
}

// ----------------------------

// Borrowed from https://github.com/dmnd/dedent

export function dedent(
  strings: string | TemplateStringsArray,
  ...values: Array<string>
) {
  const raw = typeof strings === "string" ? [strings] : strings.raw;

  // first, perform interpolation
  let result = "";
  for (let i = 0; i < raw.length; i++) {
    result += raw[i]
      // join lines when there is a suppressed newline
      .replace(/\\\n[ \t]*/g, "")
      // handle escaped backticks
      .replace(/\\`/g, "`");

    if (i < values.length) {
      result += values[i];
    }
  }

  // now strip indentation
  const lines = result.split("\n");
  let mindent: number | null = null;
  lines.forEach((l) => {
    let m = l.match(/^(\s+)\S+/);
    if (m) {
      let indent = m[1].length;
      if (!mindent) {
        // this is the first indented line
        mindent = indent;
      } else {
        mindent = Math.min(mindent, indent);
      }
    }
  });

  if (mindent !== null) {
    const m = mindent; // appease Flow
    result = lines.map((l) => (l[0] === " " ? l.slice(m) : l)).join("\n");
  }

  return (
    result
      // dedent eats leading and trailing whitespace too
      .trim()
      // handle escaped newlines at the end to ensure they don't get stripped too
      .replace(/\\n/g, "\n")
  );
}

// ----------------------------

// Helper Fns

export function arrPush<T, O extends Record<string, T[]>>(
  obj: O,
  property: string,
  value: T
) {
  obj[property] = obj[property] || [];
  obj[property].push(value);
}

export function objValues<T>(obj: Record<string, T>): T[] {
  return Object.keys(obj).reduce((result: T[], key) => {
    result.push(obj[key]);
    return result;
  }, []);
}

export function mapObj<T, R>(
  obj: Record<string, T>,
  mapper: (val: T, key: string, index: number) => R
) {
  return Object.keys(obj).map((key, index) => mapper(obj[key], key, index));
}

export function eachObj<T>(
  obj: Record<string, T>,
  iter: (val: T, key: string, index: number) => void
) {
  Object.keys(obj).forEach((name, i) => iter(obj[name], name, i));
}

export const isObject = (obj: any): boolean =>
  obj !== null && typeof obj === "object";
