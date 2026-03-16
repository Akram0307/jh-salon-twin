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
    query: vi.fn(),
    release: vi.fn(),
    connect: vi.fn(),
    copyFrom: vi.fn(),
    copyTo: vi.fn(),
    pauseDrain: vi.fn(),
    resumeDrain: vi.fn(),
    escapeIdentifier: vi.fn(),
    escapeLiteral: vi.fn(),
    setTypeParser: vi.fn(),
    getTypeParser: vi.fn(),
    on: vi.fn(),
    off: vi.fn(),
    once: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    removeAllListeners: vi.fn(),
    emit: vi.fn(),
    eventNames: vi.fn(),
    listenerCount: vi.fn(),
    prependListener: vi.fn(),
    prependOnceListener: vi.fn(),
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
  return vi.fn().mockResolvedValue(createMockQueryResult(rows));
}

/**
 * Creates a mock that returns an empty QueryResult
 */
export function mockEmptyQueryResult() {
  return mockQueryResult([]);
}
