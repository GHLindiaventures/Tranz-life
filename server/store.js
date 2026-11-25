// Orders kept in memory and saved to a JSON file, so they survive a restart.
// Good for a small shop on one server. Move to a database before running more than one instance.
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';

function createStore(file = null){
  const orders = new Map();
  if (file && existsSync(file)){
    try { for (const o of JSON.parse(readFileSync(file, 'utf8'))) orders.set(o.ref, o); }
    catch(err){ throw new Error(`Could not read the order file ${file}: ${err.message}`); }
  }
  function save(){
    if (!file) return;
    mkdirSync(dirname(file), { recursive:true });
    const tmp = `${file}.tmp`;
    writeFileSync(tmp, JSON.stringify([...orders.values()], null, 2));
    renameSync(tmp, file);
  }
  return {
    get:ref => orders.get(ref),
    all:() => [...orders.values()],
    find:test => { for (const o of orders.values()) if (test(o)) return o; return undefined; },
    put(order){ orders.set(order.ref, order); save(); return order; }
  };
}

export { createStore };
