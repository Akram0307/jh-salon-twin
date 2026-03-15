import { QueryResult, QueryResultRow } from 'pg';
import { PoolClient } from 'pg';

/**
 * Creates a mock QueryResult object
 */
export function createMockQueryResult<T extends QueryResultRow = any>(rows: T[]): QueryResult<T> {
  return {
    rows,
    command: 'SELECT',
    rowCount: rows.length,
    oid: 0,
    fields: []
  };
}

/**
 * Creates a mock PoolClient object
 */
export function createMockPoolClient(): PoolClient {
  return {
    query: jest.fn(),
    release: jest.fn(),
    connect: jest.fn(),
    copyFrom: jest.fn(),
    copyTo: jest.fn(),
    pauseDrain: jest.fn(),
    resumeDrain: jest.fn(),
    escapeIdentifier: jest.fn(),
    escapeLiteral: jest.fn(),
    setTypeParser: jest.fn(),
    getTypeParser: jest.fn(),
    on: jest.fn(),
    off: jest.fn(),
    once: jest.fn(),
    addListener: jest.fn(),
    removeListener: jest.fn(),
    removeAllListeners: jest.fn(),
    emit: jest.fn(),
    eventNames: jest.fn(),
    listenerCount: jest.fn(),
    prependListener: jest.fn(),
    prependOnceListener: jest.fn(),
    raw: false,
    binary: false,
    rows: [],
    statementId: 0
  } as unknown as PoolClient;
}

/**
 * Creates a mock that returns a QueryResult
 */
export function mockQueryResult<T extends QueryResultRow = any>(rows: T[]) {
  return jest.fn().mockResolvedValue(createMockQueryResult(rows));
}

/**
 * Creates a mock that returns an empty QueryResult
 */
export function mockEmptyQueryResult() {
  return mockQueryResult([]);
}
