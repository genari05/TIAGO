"use strict";(()=>{var e={};e.id=2809,e.ids=[2809],e.modules={65372:e=>{e.exports=require("better-sqlite3-multiple-ciphers")},72934:e=>{e.exports=require("next/dist/client/components/action-async-storage.external.js")},54580:e=>{e.exports=require("next/dist/client/components/request-async-storage.external.js")},45869:e=>{e.exports=require("next/dist/client/components/static-generation-async-storage.external.js")},20399:e=>{e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},30517:e=>{e.exports=require("next/dist/compiled/next-server/app-route.runtime.prod.js")},27790:e=>{e.exports=require("assert")},78893:e=>{e.exports=require("buffer")},84770:e=>{e.exports=require("crypto")},17702:e=>{e.exports=require("events")},92048:e=>{e.exports=require("fs")},20629:e=>{e.exports=require("fs/promises")},32615:e=>{e.exports=require("http")},35240:e=>{e.exports=require("https")},98216:e=>{e.exports=require("net")},19801:e=>{e.exports=require("os")},55315:e=>{e.exports=require("path")},68621:e=>{e.exports=require("punycode")},76162:e=>{e.exports=require("stream")},74026:e=>{e.exports=require("string_decoder")},82452:e=>{e.exports=require("tls")},74175:e=>{e.exports=require("tty")},17360:e=>{e.exports=require("url")},21764:e=>{e.exports=require("util")},6162:e=>{e.exports=require("worker_threads")},71568:e=>{e.exports=require("zlib")},98061:e=>{e.exports=require("node:assert")},92761:e=>{e.exports=require("node:async_hooks")},72254:e=>{e.exports=require("node:buffer")},17718:e=>{e.exports=require("node:child_process")},40027:e=>{e.exports=require("node:console")},6005:e=>{e.exports=require("node:crypto")},65714:e=>{e.exports=require("node:diagnostics_channel")},30604:e=>{e.exports=require("node:dns")},15673:e=>{e.exports=require("node:events")},87561:e=>{e.exports=require("node:fs")},88849:e=>{e.exports=require("node:http")},42725:e=>{e.exports=require("node:http2")},87503:e=>{e.exports=require("node:net")},38846:e=>{e.exports=require("node:perf_hooks")},39630:e=>{e.exports=require("node:querystring")},84492:e=>{e.exports=require("node:stream")},72477:e=>{e.exports=require("node:stream/web")},31764:e=>{e.exports=require("node:tls")},41041:e=>{e.exports=require("node:url")},47261:e=>{e.exports=require("node:util")},93746:e=>{e.exports=require("node:util/types")},24086:e=>{e.exports=require("node:worker_threads")},65628:e=>{e.exports=require("node:zlib")},25539:(e,t,r)=>{r.a(e,async(e,o)=>{try{r.r(t),r.d(t,{originalPathname:()=>x,patchFetch:()=>d,requestAsyncStorage:()=>u,routeModule:()=>l,serverHooks:()=>m,staticGenerationAsyncStorage:()=>c});var a=r(49303),s=r(88716),n=r(60670),i=r(30185),p=e([i]);i=(p.then?(await p)():p)[0];let l=new a.AppRouteRouteModule({definition:{kind:s.x.APP_ROUTE,page:"/[port]/api/(providers)/nvidia/route",pathname:"/[port]/api/nvidia",filename:"route",bundlePath:"app/[port]/api/(providers)/nvidia/route"},resolvedPagePath:"/Users/maol/WebstormProjects/Trabajo/codegpt-nextjs/app/[port]/api/(providers)/nvidia/route.ts",nextConfigOutput:"standalone",userland:i}),{requestAsyncStorage:u,staticGenerationAsyncStorage:c,serverHooks:m}=l,x="/[port]/api/(providers)/nvidia/route";function d(){return(0,n.patchFetch)({serverHooks:m,staticGenerationAsyncStorage:c})}o()}catch(e){o(e)}})},30185:(e,t,r)=>{r.a(e,async(e,o)=>{try{r.r(t),r.d(t,{HEAD:()=>q,POST:()=>v});var a=r(92810),s=r(82687),n=r(56342),i=r(61740),p=r(315),d=r(47465),l=r(76129),u=r(75421),c=r(89874),m=r(87320),x=r(94750),g=r(13269),h=e([a,s,n,p,c,x]);async function q(){return Response.json("",{status:s.ZI.getByProvider("Nvidia")?.apikey?200:401})}async function v(e){let t=s.ZI.getByProvider("Nvidia"),r=new g.ZP({apiKey:t?.apikey||"",baseURL:"https://integrate.api.nvidia.com/v1"}),{messages:o}=await e.json();o=await (0,p.Dz)({messages:o,provider:"Nvidia"});let h=e.headers.get("model")||"google/gemma-7b",q=e.headers.get("filePath"),v=e.headers.get("promptType"),w=await x.Z.getLanguage(),f=await x.Z.getIdeLanguage(),y=e.headers.get("fileName")??"",b="Chat",k=o[o.length-1],P=k?.codeSelection??"";if(v){b=v+"CodeGPT";let e=await (0,l.u)({promptType:v,cleanPromptText:k.content+P,language:f});e&&(o[o.length-1].content=e+k.content+P)}if(q){let e=JSON.stringify(await (0,a.getFileContent)(q),null,2);o[o.length-1].content+=`${q}

    ${e}`}if(!o.some(e=>"system"===e.role)){let e=await (0,i.Ox)({provider:"nvidia",model:h});o.unshift({role:"system",content:e||"I am a helpful programming expert assistant. If you ask me a question that is rooted in truth. Follow the user's instructions with precision and attention to detail. Provide the code in a single block. Minimize any additional text."})}let j=(0,m.q)(o.map(e=>e.content).join(""));try{if(!t?.apikey){let e=Error("You need to set your API key first.");throw e.status=401,e}let e=s.vc.getByProvider("Nvidia");o=(0,p.VL)(o);let a=await r.chat.completions.create({model:h||"google/gemma-7b",stream:!0,messages:o,temperature:e?.temperature??.3}),i=await (0,d.H)(a.toReadableStream(),{onFinal:async e=>{let t=(0,m.q)(e);await (0,n.sendEvent)({eventName:b,provider:"Nvidia",model:h??"google/gemma-7b",promptTokens:j,completionTokens:t,totalTokens:j+t,statusCode:200})}}),l=o.slice(0,-1).some(e=>e.content.includes(P));if(q||P&&(v||!l)){let e=await (0,c.VU)([`<p style='display: flex; align-items: center; gap: 0.5rem;'>${v?`<span class='command command-bordered command-with-icon' data-command='command'><span class='max-w-48 overflow-hidden text-ellipsis whitespace-pre break-words pr-1 font-mono text-sm text-foreground'>${v}</span></span>`:""}${y?`<span class='command command-bordered command-with-icon animate-slideIn relative h-auto items-center gap-1 overflow-hidden' data-id=${w} data-language=${w}><span class='max-w-48 overflow-hidden text-ellipsis whitespace-pre break-words pr-1 font-mono text-sm text-foreground'>${y}</span></span>`:""}${q?`<span class='command command-bordered command-with-icon animate-slideIn relative h-auto items-center gap-1 overflow-hidden' data-language=${q.split("/").pop()?.split(".").pop()}><span class='max-w-48 overflow-hidden text-ellipsis whitespace-pre break-words pr-1 font-mono text-sm text-foreground'>${q.split("/").pop()}</span></span>`:""}</p>

`],i);return new u.w(e)}return new u.w(i)}catch(e){return(0,n.sendEvent)({eventName:b,provider:"Nvidia",model:h??"google/gemma-7b",promptTokens:j,totalTokens:j,statusCode:e.status??500}),Response.json({message:e.message,status:e.status??500},{status:e.status??500})}}[a,s,n,p,c,x]=h.then?(await h)():h,o()}catch(e){o(e)}})},47465:(e,t,r)=>{r.d(t,{H:()=>o});async function o(e,t){if(!e)throw Error("No response available");let r=e.getReader();if(!r)throw Error("No reader available");let o="";return new ReadableStream({async start(e){let a=new TextDecoder,s=new TextEncoder;for(t?.onStart?.();;){let{done:n,value:i}=await r.read();if(n){e.close(),t?.onFinal?.(o),t?.onCompletion?.(o);return}for(let r of a.decode(i).split("\n").filter(Boolean))try{if(!r)continue;let a=JSON.parse(r.trim().replace("data: ","")),n=a?.choices?.[0]?.delta?.content||a?.choices?.[0]?.text;n&&(e.enqueue(s.encode(n)),t?.onToken?.(n),o+=n)}catch{}}},cancel(){t?.onFinal?.(o),r.releaseLock()}})}},75421:(e,t,r)=>{r.d(t,{w:()=>o});class o extends Response{constructor(e,t){super(e,{...t,status:200,headers:{"Content-Type":"text/plain; charset=utf-8","X-Experimental-Stream-Data":"false",...t?.headers}})}}},87320:(e,t,r)=>{r.d(t,{q:()=>a});var o=r(3375);let a=(e,t)=>(0,o.b9)(t??"gpt-4").encode(e).length??0}};var t=require("../../../../../webpack-runtime.js");t.C(e);var r=e=>t(t.s=e),o=t.X(0,[8948,1242,4599,9092,6510,9712,8811,3375,8268,5540,4274,3269,2687,7807,9836,1371,2377],()=>r(25539));module.exports=o})();