"use strict";(()=>{var e={};e.id=6153,e.ids=[6153],e.modules={65372:e=>{e.exports=require("better-sqlite3-multiple-ciphers")},72934:e=>{e.exports=require("next/dist/client/components/action-async-storage.external.js")},54580:e=>{e.exports=require("next/dist/client/components/request-async-storage.external.js")},45869:e=>{e.exports=require("next/dist/client/components/static-generation-async-storage.external.js")},20399:e=>{e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},30517:e=>{e.exports=require("next/dist/compiled/next-server/app-route.runtime.prod.js")},27790:e=>{e.exports=require("assert")},17702:e=>{e.exports=require("events")},92048:e=>{e.exports=require("fs")},20629:e=>{e.exports=require("fs/promises")},32615:e=>{e.exports=require("http")},35240:e=>{e.exports=require("https")},19801:e=>{e.exports=require("os")},55315:e=>{e.exports=require("path")},76162:e=>{e.exports=require("stream")},74175:e=>{e.exports=require("tty")},17360:e=>{e.exports=require("url")},21764:e=>{e.exports=require("util")},71568:e=>{e.exports=require("zlib")},17718:e=>{e.exports=require("node:child_process")},49505:(e,t,r)=>{r.a(e,async(e,s)=>{try{r.r(t),r.d(t,{originalPathname:()=>q,patchFetch:()=>u,requestAsyncStorage:()=>d,routeModule:()=>c,serverHooks:()=>l,staticGenerationAsyncStorage:()=>x});var i=r(49303),o=r(88716),n=r(60670),a=r(60961),p=e([a]);a=(p.then?(await p)():p)[0];let c=new i.AppRouteRouteModule({definition:{kind:o.x.APP_ROUTE,page:"/api/distinct_id/route",pathname:"/api/distinct_id",filename:"route",bundlePath:"app/api/distinct_id/route"},resolvedPagePath:"/Users/maol/WebstormProjects/Trabajo/codegpt-nextjs/app/api/distinct_id/route.ts",nextConfigOutput:"standalone",userland:a}),{requestAsyncStorage:d,staticGenerationAsyncStorage:x,serverHooks:l}=c,q="/api/distinct_id/route";function u(){return(0,n.patchFetch)({serverHooks:l,staticGenerationAsyncStorage:x})}s()}catch(e){s(e)}})},60961:(e,t,r)=>{r.a(e,async(e,s)=>{try{r.r(t),r.d(t,{GET:()=>a,dynamic:()=>p});var i=r(92810),o=r(82687),n=e([i,o]);[i,o]=n.then?(await n)():n;let p="force-dynamic";async function a(){let e=o.PR.get()?.distinct_id,t=await (0,i.getKeyValue)("anonymousDistinctId");return Response.json({distinct_id:e||t})}s()}catch(e){s(e)}})},49303:(e,t,r)=>{e.exports=r(30517)}};var t=require("../../../webpack-runtime.js");t.C(e);var r=e=>t(t.s=e),s=t.X(0,[8948,1242,4599,9092,9712,8811,2687,9836],()=>r(49505));module.exports=s})();