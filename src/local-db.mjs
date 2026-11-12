import {DatabaseSync} from 'node:sqlite';
import {readFileSync} from 'node:fs';
export function localDB(path=':memory:'){
 const sqlite=new DatabaseSync(path);if(sqlite.prepare('PRAGMA user_version').get().user_version===0){sqlite.exec(readFileSync(new URL('../drizzle/0000_store_boards.sql',import.meta.url),'utf8'));sqlite.exec('PRAGMA user_version=1');}
 return {prepare(sql){return {bind(...values){return {async first(){return sqlite.prepare(sql).get(...values)??null;},async run(){const r=sqlite.prepare(sql).run(...values);return {meta:{changes:Number(r.changes)}};}};},async first(){return sqlite.prepare(sql).get()??null;},async run(){const r=sqlite.prepare(sql).run();return {meta:{changes:Number(r.changes)}};}};},close(){sqlite.close();}};
}
