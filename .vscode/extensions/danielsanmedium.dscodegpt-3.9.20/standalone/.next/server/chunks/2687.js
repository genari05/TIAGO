"use strict";exports.id=2687,exports.ids=[2687],exports.modules={82687:(e,t,E)=>{E.a(e,async(e,r)=>{try{E.d(t,{EE:()=>N,JF:()=>R,Jz:()=>L,OZ:()=>O,PR:()=>l,VJ:()=>I,ZI:()=>u,uV:()=>A,vc:()=>p});var n=E(34129),T=E(61740),a=e([n]);function i(e){return n.Z.prepare("SELECT * FROM connection WHERE provider = ?").get((0,T.Xz)(e))}n=(a.then?(await a)():a)[0];let u={upsert:function(e){let t=i(e.provider)||{};return{id:n.Z.prepare(`
    INSERT INTO connection (provider, apikey, organization_id, custom_link, google_Oauth, region, access_key_id, secret_access_key, session_token)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(provider) DO UPDATE SET
      apikey = COALESCE(excluded.apikey, connection.apikey),
      organization_id = COALESCE(excluded.organization_id, connection.organization_id),
      custom_link = COALESCE(excluded.custom_link, connection.custom_link),
      google_Oauth = COALESCE(excluded.google_Oauth, connection.google_Oauth),
      region = COALESCE(excluded.region, connection.region),
      access_key_id = COALESCE(excluded.access_key_id, connection.access_key_id),
      secret_access_key = COALESCE(excluded.secret_access_key, connection.secret_access_key),
      session_token = COALESCE(excluded.session_token, connection.session_token),
      updated_at = CURRENT_TIMESTAMP
  `).run((0,T.Xz)(e.provider),e.apikey??t.apikey,e.organization_id??t.organization_id,e.custom_link??t.custom_link,e.google_Oauth??t.google_Oauth,e.region??t.region,e.access_key_id??t.access_key_id,e.secret_access_key??t.secret_access_key,e.session_token??t.session_token).lastInsertRowid,...e,created_at:t.created_at??new Date().toISOString(),updated_at:new Date().toISOString()}},getByProvider:i,getAll:function(){return n.Z.prepare("SELECT * FROM connection").all()},delete:function(e){n.Z.prepare("DELETE FROM connection WHERE provider = ?").run((0,T.Xz)(e))}};function o(){return n.Z.prepare("SELECT * FROM codegpt_session LIMIT 1").get()}let l={upsert:function(e){let t=o()||{};n.Z.prepare(`
    INSERT INTO codegpt_session (id, access_token, refresh_token, expires_at, signed_distinct_id, distinct_id) 
    VALUES (1, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      access_token = excluded.access_token,
      refresh_token = excluded.refresh_token,
      expires_at = excluded.expires_at,
      signed_distinct_id = excluded.signed_distinct_id,
      distinct_id = excluded.distinct_id,
      updated_at = CURRENT_TIMESTAMP
  `).run(e.access_token??t.access_token,e.refresh_token??t.refresh_token,e.expires_at??t.expires_at,e.signed_distinct_id??t.signed_distinct_id,e.distinct_id??t.distinct_id)},get:o,delete:function(){n.Z.prepare("DELETE FROM codegpt_session").run()}};function s(e){return n.Z.prepare("SELECT * FROM settings WHERE provider = ?").get((0,T.Xz)(e))??{provider:e,memory:10,temperature:0,max_tokens:512}}let p={upsert:function(e){let t=s((0,T.Xz)(e.provider))||{};return{id:n.Z.prepare(`
    INSERT INTO settings (provider, memory, temperature, max_tokens)
    VALUES (?, ?, ?, ?)
    ON CONFLICT(provider) DO UPDATE SET
      memory = COALESCE(excluded.memory, settings.memory),
      temperature = COALESCE(excluded.temperature, settings.temperature),
      max_tokens = COALESCE(excluded.max_tokens, settings.max_tokens),
      updated_at = CURRENT_TIMESTAMP
  `).run((0,T.Xz)(e.provider),e.memory??t.memory,e.temperature??t.temperature,e.max_tokens??t.max_tokens).lastInsertRowid,provider:e.provider,memory:e.memory??t.memory,temperature:e.temperature??t.temperature,max_tokens:e.max_tokens??t.max_tokens,created_at:t.created_at??new Date().toISOString(),updated_at:new Date().toISOString()}},getByProvider:s,getAll:function(){return n.Z.prepare("SELECT * FROM settings").all()},delete:function(e){n.Z.prepare("DELETE FROM settings WHERE provider = ?").run((0,T.Xz)(e))}};function d(){return n.Z.prepare("SELECT * FROM auto_complete LIMIT 1").get()??{enabled:!0,provider:"CodeGPT Plus",model:"Turbo",max_tokens:300,delay:200}}let R={upsert:function(e){let t=d()||{};n.Z.prepare(`
    INSERT OR REPLACE INTO auto_complete (id, enabled, provider, model, max_tokens, delay, created_at, updated_at)
    VALUES (1, ?, ?, ?, ?, ?, COALESCE(?, CURRENT_TIMESTAMP), CURRENT_TIMESTAMP)
  `).run(e.enabled??t.enabled??!0,(0,T.Xz)(e.provider||t.provider||"CodeGPT Plus"),e.model??t.model??"Turbo",e.max_tokens??t.max_tokens??300,e.delay??t.delay??200,t.created_at)},get:d,delete:function(){n.Z.prepare("DELETE FROM auto_complete").run()}};function c(){return n.Z.prepare("SELECT * FROM auto_select LIMIT 1").get()}let L={upsert:function(e){let t=c()||{};n.Z.prepare(`
    INSERT OR REPLACE INTO auto_select (id, enabled, created_at, updated_at)
    VALUES (1, ?, COALESCE(?, CURRENT_TIMESTAMP), CURRENT_TIMESTAMP)
  `).run(e.enabled??t.enabled,t.created_at)},get:c,delete:function(){n.Z.prepare("DELETE FROM auto_select").run()}};function _(e){return n.Z.prepare("SELECT * FROM history WHERE id = ?").get(e)}let A={upsert:function(e){let t=_(e.id)||{},E=n.Z.prepare(`
    INSERT INTO history (id, name)
    VALUES (?, ?)
    ON CONFLICT(id) DO UPDATE SET
      name = COALESCE(excluded.name, history.name),
      updated_at = CURRENT_TIMESTAMP
  `).run(e.id??t.id,e.name??t.name);return{id:e.id??E.lastInsertRowid.toString(),...e,created_at:t.created_at??new Date().toISOString(),updated_at:new Date().toISOString()}},getById:_,getAll:function(){return n.Z.prepare("SELECT * FROM history ORDER BY id DESC").all()},getEmpty:function(){return n.Z.prepare(`
    SELECT h.*
    FROM history h
    LEFT JOIN message m ON h.id = m.history_id
    WHERE m.id IS NULL
    ORDER BY h.id ASC
    LIMIT 1
  `).get()},delete:function(e){n.Z.prepare("DELETE FROM message WHERE history_id = ?").run(e),n.Z.prepare("DELETE FROM history WHERE id = ?").run(e)}},I={upsert:function(e){let t=n.Z.prepare(`
    INSERT OR REPLACE INTO message (id, content, display, message_index, history_id, role, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, COALESCE(?, CURRENT_TIMESTAMP), CURRENT_TIMESTAMP)
  `).run(e.id,e.content,e.display,e.message_index,e.history_id,e.role??"user",e.created_at);return{id:e.id??t.lastInsertRowid.toString(),...e,created_at:e.created_at??new Date().toISOString(),updated_at:new Date().toISOString()}},getById:function(e){return n.Z.prepare("SELECT * FROM message WHERE id = ?").get(e)},getAll:function(){return n.Z.prepare("SELECT * FROM message ORDER BY id DESC").all()},getAllByHistoryId:function(e){return n.Z.prepare('SELECT * FROM message WHERE history_id = ? ORDER BY "message_index" ASC').all(e)},delete:function(e){n.Z.prepare("DELETE FROM message WHERE id = ?").run(e)}},N={upsert:function(e){n.Z.prepare(`
    INSERT INTO kv (key, value)
    VALUES (?, ?)
    ON CONFLICT(key) DO UPDATE SET
      value = excluded.value
  `).run(e.key,JSON.stringify(e.value))},get:function(e){let t=n.Z.prepare("SELECT * FROM kv WHERE key = ?").get(e);if(t)return JSON.parse(t.value||"")},getAll:function(){return n.Z.prepare("SELECT * FROM kv").all().map(e=>({key:e.key,value:JSON.parse(e.value)}))},delete:function(e){n.Z.prepare("DELETE FROM kv WHERE key = ?").run(e)}},O={upsert:function(e){let t=Math.floor(333);for(let E=0;E<e.length;E+=t){let r=e.slice(E,E+t),T=r.map(()=>"(?, ?, ?)").join(", "),a=n.Z.prepare(`
      INSERT OR REPLACE INTO file_hashes (origin_file, workspace_id, hash)
      VALUES ${T}
    `),i=r.flatMap(e=>[e.origin_file,e.workspace_id,e.hash]);a.run(...i)}},get:function(e){return n.Z.prepare("SELECT * FROM file_hashes WHERE workspace_id = ? ").all(e)},hasHashes:function(e){return!!n.Z.prepare("SELECT * FROM file_hashes WHERE workspace_id = ? LIMIT 1").all(e).length},getByOriginFile:function(e,t){return n.Z.prepare("SELECT hash FROM file_hashes WHERE workspace_id = ? AND origin_file = ?").all(e,t)},delete:function(e,t){if(0===t.length)return;let E=t.map(()=>"?").join(",");n.Z.prepare(`DELETE FROM file_hashes WHERE workspace_id = ? AND hash IN (${E})`).run(e,...t)},deleteAll:function(e){n.Z.prepare("DELETE FROM file_hashes WHERE workspace_id = ?").run(e)}};r()}catch(e){r(e)}})},19027:(e,t,E)=>{E.d(t,{Z:()=>r});let r=function(e){try{e.exec(`
      CREATE TABLE IF NOT EXISTS "connection" (
        "id" INTEGER PRIMARY KEY AUTOINCREMENT,
        "provider" TEXT NOT NULL UNIQUE,
        "apikey" TEXT,
        "organization_id" TEXT DEFAULT NULL,
        "custom_link" TEXT DEFAULT NULL,
        "google_Oauth" TEXT DEFAULT NULL,
        "region" TEXT DEFAULT NULL,
        "access_key_id" TEXT DEFAULT NULL,
        "secret_access_key" TEXT DEFAULT NULL,
        "session_token" TEXT DEFAULT NULL,
        "created_at" DATETIME DEFAULT CURRENT_TIMESTAMP,
        "updated_at" DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `),e.exec(`
      CREATE TABLE IF NOT EXISTS "codegpt_session" (
        "id" INTEGER PRIMARY KEY AUTOINCREMENT,
        "access_token" TEXT NULL,
        "refresh_token" TEXT NULL,
        "expires_at" INTEGER NULL,
        "signed_distinct_id" TEXT DEFAULT NULL,
        "distinct_id" TEXT NULL,
        "created_at" DATETIME DEFAULT CURRENT_TIMESTAMP,
        "updated_at" DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `),e.exec(`
      CREATE TABLE IF NOT EXISTS "settings" (
        "id" INTEGER PRIMARY KEY AUTOINCREMENT,
        "provider" TEXT NOT NULL UNIQUE,
        "memory" INTEGER DEFAULT 10,
        "temperature" REAL DEFAULT 0,
        "max_tokens" INTEGER DEFAULT 512,
        "created_at" DATETIME DEFAULT CURRENT_TIMESTAMP,
        "updated_at" DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `),e.exec(`
      CREATE TABLE IF NOT EXISTS "auto_complete" (
        "id" INTEGER PRIMARY KEY AUTOINCREMENT,
        "enabled" INTEGER NOT NULL DEFAULT 1,
        "provider" TEXT DEFAULT "CodeGPT Plus Beta",
        "model" TEXT DEFAULT "Plus",
        "max_tokens" INTEGER DEFAULT 300,
        "delay" INTEGER DEFAULT 300,
        "created_at" DATETIME DEFAULT CURRENT_TIMESTAMP,
        "updated_at" DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `),e.exec(`
      CREATE TABLE IF NOT EXISTS "auto_select" (
      "id" INTEGER PRIMARY KEY AUTOINCREMENT,
      "enabled" INTEGER NOT NULL DEFAULT 1,
      "created_at" DATETIME DEFAULT CURRENT_TIMESTAMP,
      "updated_at" DATETIME DEFAULT CURRENT_TIMESTAMP    
      );
    `),e.exec(`
      CREATE TABLE IF NOT EXISTS "flags" (
     "id" INTEGER PRIMARY KEY AUTOINCREMENT,
     "name" TEXT NOT NULL UNIQUE,
     "used" INTEGER NOT NULL DEFAULT 0,
     "created_at" DATETIME DEFAULT CURRENT_TIMESTAMP,
     "updated_at" DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `),e.exec(`
      CREATE TABLE IF NOT EXISTS "kv" (
      "key" TEXT PRIMARY KEY,
      "value" TEXT NOT NULL
      );
    `),e.exec(`
      CREATE TABLE IF NOT EXISTS "history" (
        "id" TEXT PRIMARY KEY,
        "name" TEXT DEFAULT NULL,
        "created_at" DATETIME DEFAULT CURRENT_TIMESTAMP,
        "updated_at" DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `),e.exec(`
      CREATE TABLE IF NOT EXISTS "message" (
        "id" INTEGER PRIMARY KEY AUTOINCREMENT,
        "content" TEXT NOT NULL,
        "role" TEXT NOT NULL,
        "display" TEXT NOT NULL,
        "message_index" INTEGER NOT NULL,
        "history_id" TEXT DEFAULT NULL,
        "created_at" DATETIME DEFAULT CURRENT_TIMESTAMP,
        "updated_at" DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(history_id) REFERENCES history(id),
        UNIQUE(history_id, message_index)
        );
    `),e.exec(`
      CREATE TABLE IF NOT EXISTS "file_hashes" (
        "id" INTEGER PRIMARY KEY AUTOINCREMENT,
        "origin_file" TEXT NOT NULL,
        "workspace_id" TEXT NOT NULL,
        "hash" TEXT NOT NULL
        );
    `)}catch(e){throw console.error(`Error initializing schema: ${e.message}`),e}}},34129:(e,t,E)=>{E.a(e,async(e,r)=>{try{E.d(t,{Z:()=>e});var n=E(19027),T=E(65372),a=E.n(T),i=E(20629),o=E.n(i),s=E(19801),d=E.n(s),c=E(55315),_=E.n(c);async function u(e="db.sqlite",t=".codegpt",E="qb98QNQptnRmXb"){try{let r=d().homedir(),T=_().join(r,t),i=_().join(T,e);await o().mkdir(T,{recursive:!0});let s=new(a())(i);return s.pragma(`key = '${E}'`),s.pragma("journal_mode = WAL"),(0,n.Z)(s),s}catch(e){throw console.error(`Error initializing database: ${e.message}`),e}}let e=await u();r()}catch(e){r(e)}},1)},61740:(e,t,E)=>{E.d(t,{L_:()=>a,Ox:()=>o,Xz:()=>T});var r=E(21242),n=E.n(r);let T=e=>e.toLowerCase().replaceAll(" ",""),a=process.env.NEXT_PUBLIC_IDE??"vscode",i=async()=>await fetch("https://storage.codegpt.co/vscode/providers.json?no_cache="+Date.now()).catch(()=>({ok:!1,json:()=>null})),o=async({provider:e,model:t})=>{let E=await i();if(!E.ok)return null;let r=await E.json(),T=r?.find(t=>t?.link===e)?.prompts?.default;if(!t)return T||null;let a=r?.find(t=>t?.link===e)?.prompts;if(!a)return T||null;let o=Object.keys(a).find(e=>n().isMatch(t?.toLowerCase()||"",e));return o?a[o]:T||null}}};