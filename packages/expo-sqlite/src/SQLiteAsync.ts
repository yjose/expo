import type { ResultSet, SQLTransactionAsync, WebSQLDatabase } from './SQLite.types';

export class ExpoSQLTransactionAsync implements SQLTransactionAsync {
  _db: WebSQLDatabase;
  _readOnly: boolean;

  constructor(db: WebSQLDatabase, readOnly: boolean) {
    this._db = db;
    this._readOnly = readOnly;
  }

  async executeSqlAsync(sqlStatement: string, args?: (number | string)[]): Promise<ResultSet> {
    const resultSets = await this._db.execAsync(
      [{ sql: sqlStatement, args: args ?? [] }],
      this._readOnly
    );
    return resultSets[0];
  }
}
