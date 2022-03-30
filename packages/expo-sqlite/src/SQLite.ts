import './polyfillNextTick';

import customOpenDatabase from '@expo/websql/custom';
import { NativeModulesProxy } from 'expo-modules-core';
import { Platform } from 'react-native';

import type {
  Query,
  ResultSet,
  ResultSetError,
  SQLiteCallback,
  SQLTransactionAsyncCallback,
  WebSQLDatabase,
} from './SQLite.types';
import { ExpoSQLTransactionAsync } from './SQLiteAsync';

const { ExponentSQLite } = NativeModulesProxy;

function zipObject(keys: string[], values: any[]) {
  const result = {};
  for (let i = 0; i < keys.length; i++) {
    result[keys[i]] = values[i];
  }
  return result;
}

class SQLiteDatabase {
  _name: string;
  _closed: boolean = false;

  constructor(name: string) {
    this._name = name;
  }

  exec(queries: Query[], readOnly: boolean, callback: SQLiteCallback): void {
    if (this._closed) {
      throw new Error(`The SQLite database is closed`);
    }

    ExponentSQLite.exec(this._name, queries.map(_serializeQuery), readOnly).then(
      (nativeResultSets) => {
        callback(null, nativeResultSets.map(_deserializeResultSet));
      },
      (error) => {
        // TODO: make the native API consistently reject with an error, not a string or other type
        callback(error instanceof Error ? error : new Error(error));
      }
    );
  }

  async execAsync(queries: Query[], readOnly: boolean): Promise<ResultSet[]> {
    if (this._closed) {
      throw new Error(`The SQLite database is closed`);
    }

    const nativeResultSets = await ExponentSQLite.exec(
      this._name,
      queries.map(_serializeQuery),
      readOnly
    );
    return nativeResultSets.map(_deserializeResultSet);
  }

  close() {
    this._closed = true;
    ExponentSQLite.close(this._name);
  }

  deleteAsync(): Promise<void> {
    if (!this._closed) {
      throw new Error('Unable to delete an opening database');
    }

    return ExponentSQLite.delete(this._name);
  }

  async transactionAsync(asyncCallback: SQLTransactionAsyncCallback): Promise<void> {
    await this.execAsync([{ sql: 'BEGIN;', args: [] }], false);
    try {
      const transaction = new ExpoSQLTransactionAsync(this as any as WebSQLDatabase, false);
      await asyncCallback(transaction);
      await this.execAsync([{ sql: 'END;', args: [] }], false);
    } catch {
      await this.execAsync([{ sql: 'ROLLBACK;', args: [] }], false);
    }
  }
}

function _serializeQuery(query: Query): [string, unknown[]] {
  return [query.sql, Platform.OS === 'android' ? query.args.map(_escapeBlob) : query.args];
}

function _deserializeResultSet(nativeResult): ResultSet | ResultSetError {
  const [errorMessage, insertId, rowsAffected, columns, rows] = nativeResult;
  // TODO: send more structured error information from the native module so we can better construct
  // a SQLException object
  if (errorMessage !== null) {
    return { error: new Error(errorMessage) } as ResultSetError;
  }

  return {
    insertId,
    rowsAffected,
    rows: rows.map((row) => zipObject(columns, row)),
  };
}

function _escapeBlob<T>(data: T): T {
  if (typeof data === 'string') {
    /* eslint-disable no-control-regex */
    return data
      .replace(/\u0002/g, '\u0002\u0002')
      .replace(/\u0001/g, '\u0001\u0002')
      .replace(/\u0000/g, '\u0001\u0001') as any;
    /* eslint-enable no-control-regex */
  } else {
    return data;
  }
}

const _openExpoSQLiteDatabase = customOpenDatabase(SQLiteDatabase);

// @needsAudit @docsMissing
/**
 * Open a database, creating it if it doesn't exist, and return a `Database` object. On disk,
 * the database will be created under the app's [documents directory](./filesystem), i.e.
 * `${FileSystem.documentDirectory}/SQLite/${name}`.
 * > The `version`, `description` and `size` arguments are ignored, but are accepted by the function
 * for compatibility with the WebSQL specification.
 * @param name Name of the database file to open.
 * @param version
 * @param description
 * @param size
 * @param callback
 * @return
 */
export function openDatabase(
  name: string,
  version: string = '1.0',
  description: string = name,
  size: number = 1,
  callback?: (db: WebSQLDatabase) => void
): WebSQLDatabase {
  if (name === undefined) {
    throw new TypeError(`The database name must not be undefined`);
  }
  const db = _openExpoSQLiteDatabase(name, version, description, size, callback);
  const extendedMethods = ['exec', 'close', 'deleteAsync', 'transactionAsync'];
  const dbWithExtendedMethods = extendedMethods.reduce((curr, methodName) => {
    curr[methodName] = curr._db[methodName].bind(curr._db);
    return curr;
  }, db);
  return dbWithExtendedMethods;
}
