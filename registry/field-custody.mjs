// Absent and null are different claims.
//
// A field the governed record does not carry is ABSENT from the imported record:
// the key is not there. A field the governed record carries as null is PRESENT
// AND NULL. Creating a key and filling it with null asserts "we looked and found
// nothing" where the record supports only "the schema never carried the concept"
// (FR-2026-08-02-D1 R19, and the D1 import contract's absent-fields rule).

export function carryPresentFields(source, keys) {
  const carried = {};
  for (const key of keys) {
    if (Object.hasOwn(source, key)) carried[key] = source[key];
  }
  return carried;
}

export function isAbsent(record, key) {
  return !Object.hasOwn(record, key);
}

export function isPresentAndNull(record, key) {
  return Object.hasOwn(record, key) && record[key] === null;
}

export function presentKeys(source, keys) {
  return keys.filter((key) => Object.hasOwn(source, key));
}
