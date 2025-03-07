"use strict";var et=Object.create;var Y=Object.defineProperty;var tt=Object.getOwnPropertyDescriptor;var rt=Object.getOwnPropertyNames;var nt=Object.getPrototypeOf,ot=Object.prototype.hasOwnProperty;var it=(e,t)=>()=>(e&&(t=e(e=0)),t);var S=(e,t)=>()=>(t||e((t={exports:{}}).exports,t),t.exports),be=(e,t)=>{for(var r in t)Y(e,r,{get:t[r],enumerable:!0})},_e=(e,t,r,n)=>{if(t&&typeof t=="object"||typeof t=="function")for(let o of rt(t))!ot.call(e,o)&&o!==r&&Y(e,o,{get:()=>t[o],enumerable:!(n=tt(t,o))||n.enumerable});return e};var F=(e,t,r)=>(r=e!=null?et(nt(e)):{},_e(t||!e||!e.__esModule?Y(r,"default",{value:e,enumerable:!0}):r,e)),Oe=e=>_e(Y({},"__esModule",{value:!0}),e);var Pe=S((mr,xe)=>{var N=1e3,q=N*60,H=q*60,R=H*24,st=R*7,ct=R*365.25;xe.exports=function(e,t){t=t||{};var r=typeof e;if(r==="string"&&e.length>0)return at(e);if(r==="number"&&isFinite(e))return t.long?lt(e):ut(e);throw new Error("val is not a non-empty string or a valid number. val="+JSON.stringify(e))};function at(e){if(e=String(e),!(e.length>100)){var t=/^(-?(?:\d+)?\.?\d+) *(milliseconds?|msecs?|ms|seconds?|secs?|s|minutes?|mins?|m|hours?|hrs?|h|days?|d|weeks?|w|years?|yrs?|y)?$/i.exec(e);if(t){var r=parseFloat(t[1]),n=(t[2]||"ms").toLowerCase();switch(n){case"years":case"year":case"yrs":case"yr":case"y":return r*ct;case"weeks":case"week":case"w":return r*st;case"days":case"day":case"d":return r*R;case"hours":case"hour":case"hrs":case"hr":case"h":return r*H;case"minutes":case"minute":case"mins":case"min":case"m":return r*q;case"seconds":case"second":case"secs":case"sec":case"s":return r*N;case"milliseconds":case"millisecond":case"msecs":case"msec":case"ms":return r;default:return}}}}function ut(e){var t=Math.abs(e);return t>=R?Math.round(e/R)+"d":t>=H?Math.round(e/H)+"h":t>=q?Math.round(e/q)+"m":t>=N?Math.round(e/N)+"s":e+"ms"}function lt(e){var t=Math.abs(e);return t>=R?J(e,t,R,"day"):t>=H?J(e,t,H,"hour"):t>=q?J(e,t,q,"minute"):t>=N?J(e,t,N,"second"):e+" ms"}function J(e,t,r,n){var o=t>=r*1.5;return Math.round(e/r)+" "+n+(o?"s":"")}});var le=S((wr,Fe)=>{function ft(e){r.debug=r,r.default=r,r.coerce=f,r.disable=a,r.enable=o,r.enabled=l,r.humanize=Pe(),r.destroy=O,Object.keys(e).forEach(s=>{r[s]=e[s]}),r.names=[],r.skips=[],r.formatters={};function t(s){let c=0;for(let u=0;u<s.length;u++)c=(c<<5)-c+s.charCodeAt(u),c|=0;return r.colors[Math.abs(c)%r.colors.length]}r.selectColor=t;function r(s){let c,u=null,p,x;function m(...w){if(!m.enabled)return;let E=m,P=Number(new Date),k=P-(c||P);E.diff=k,E.prev=c,E.curr=P,c=P,w[0]=r.coerce(w[0]),typeof w[0]!="string"&&w.unshift("%O");let T=0;w[0]=w[0].replace(/%([a-zA-Z%])/g,(G,M)=>{if(G==="%%")return"%";T++;let ye=r.formatters[M];if(typeof ye=="function"){let Xe=w[T];G=ye.call(E,Xe),w.splice(T,1),T--}return G}),r.formatArgs.call(E,w),(E.log||r.log).apply(E,w)}return m.namespace=s,m.useColors=r.useColors(),m.color=r.selectColor(s),m.extend=n,m.destroy=r.destroy,Object.defineProperty(m,"enabled",{enumerable:!0,configurable:!1,get:()=>u!==null?u:(p!==r.namespaces&&(p=r.namespaces,x=r.enabled(s)),x),set:w=>{u=w}}),typeof r.init=="function"&&r.init(m),m}function n(s,c){let u=r(this.namespace+(typeof c>"u"?":":c)+s);return u.log=this.log,u}function o(s){r.save(s),r.namespaces=s,r.names=[],r.skips=[];let c=(typeof s=="string"?s:"").trim().replace(" ",",").split(",").filter(Boolean);for(let u of c)u[0]==="-"?r.skips.push(u.slice(1)):r.names.push(u)}function i(s,c){let u=0,p=0,x=-1,m=0;for(;u<s.length;)if(p<c.length&&(c[p]===s[u]||c[p]==="*"))c[p]==="*"?(x=p,m=u,p++):(u++,p++);else if(x!==-1)p=x+1,m++,u=m;else return!1;for(;p<c.length&&c[p]==="*";)p++;return p===c.length}function a(){let s=[...r.names,...r.skips.map(c=>"-"+c)].join(",");return r.enable(""),s}function l(s){for(let c of r.skips)if(i(s,c))return!1;for(let c of r.names)if(i(s,c))return!0;return!1}function f(s){return s instanceof Error?s.stack||s.message:s}function O(){console.warn("Instance method `debug.destroy()` is deprecated and no longer does anything. It will be removed in the next major version of `debug`.")}return r.enable(r.load()),r}Fe.exports=ft});var Ae=S((v,Q)=>{v.formatArgs=pt;v.save=ht;v.load=gt;v.useColors=dt;v.storage=mt();v.destroy=(()=>{let e=!1;return()=>{e||(e=!0,console.warn("Instance method `debug.destroy()` is deprecated and no longer does anything. It will be removed in the next major version of `debug`."))}})();v.colors=["#0000CC","#0000FF","#0033CC","#0033FF","#0066CC","#0066FF","#0099CC","#0099FF","#00CC00","#00CC33","#00CC66","#00CC99","#00CCCC","#00CCFF","#3300CC","#3300FF","#3333CC","#3333FF","#3366CC","#3366FF","#3399CC","#3399FF","#33CC00","#33CC33","#33CC66","#33CC99","#33CCCC","#33CCFF","#6600CC","#6600FF","#6633CC","#6633FF","#66CC00","#66CC33","#9900CC","#9900FF","#9933CC","#9933FF","#99CC00","#99CC33","#CC0000","#CC0033","#CC0066","#CC0099","#CC00CC","#CC00FF","#CC3300","#CC3333","#CC3366","#CC3399","#CC33CC","#CC33FF","#CC6600","#CC6633","#CC9900","#CC9933","#CCCC00","#CCCC33","#FF0000","#FF0033","#FF0066","#FF0099","#FF00CC","#FF00FF","#FF3300","#FF3333","#FF3366","#FF3399","#FF33CC","#FF33FF","#FF6600","#FF6633","#FF9900","#FF9933","#FFCC00","#FFCC33"];function dt(){if(typeof window<"u"&&window.process&&(window.process.type==="renderer"||window.process.__nwjs))return!0;if(typeof navigator<"u"&&navigator.userAgent&&navigator.userAgent.toLowerCase().match(/(edge|trident)\/(\d+)/))return!1;let e;return typeof document<"u"&&document.documentElement&&document.documentElement.style&&document.documentElement.style.WebkitAppearance||typeof window<"u"&&window.console&&(window.console.firebug||window.console.exception&&window.console.table)||typeof navigator<"u"&&navigator.userAgent&&(e=navigator.userAgent.toLowerCase().match(/firefox\/(\d+)/))&&parseInt(e[1],10)>=31||typeof navigator<"u"&&navigator.userAgent&&navigator.userAgent.toLowerCase().match(/applewebkit\/(\d+)/)}function pt(e){if(e[0]=(this.useColors?"%c":"")+this.namespace+(this.useColors?" %c":" ")+e[0]+(this.useColors?"%c ":" ")+"+"+Q.exports.humanize(this.diff),!this.useColors)return;let t="color: "+this.color;e.splice(1,0,t,"color: inherit");let r=0,n=0;e[0].replace(/%[a-zA-Z%]/g,o=>{o!=="%%"&&(r++,o==="%c"&&(n=r))}),e.splice(n,0,t)}v.log=console.debug||console.log||(()=>{});function ht(e){try{e?v.storage.setItem("debug",e):v.storage.removeItem("debug")}catch{}}function gt(){let e;try{e=v.storage.getItem("debug")}catch{}return!e&&typeof process<"u"&&"env"in process&&(e=process.env.DEBUG),e}function mt(){try{return localStorage}catch{}}Q.exports=le()(v);var{formatters:wt}=Q.exports;wt.j=function(e){try{return JSON.stringify(e)}catch(t){return"[UnexpectedJSONParseError]: "+t.message}}});var Se={};be(Se,{createSupportsColor:()=>de,default:()=>_t});function b(e,t=globalThis.Deno?globalThis.Deno.args:K.default.argv){let r=e.startsWith("-")?"":e.length===1?"-":"--",n=t.indexOf(r+e),o=t.indexOf("--");return n!==-1&&(o===-1||n<o)}function Ct(){if("FORCE_COLOR"in d)return d.FORCE_COLOR==="true"?1:d.FORCE_COLOR==="false"?0:d.FORCE_COLOR.length===0?1:Math.min(Number.parseInt(d.FORCE_COLOR,10),3)}function vt(e){return e===0?!1:{level:e,hasBasic:!0,has256:e>=2,has16m:e>=3}}function yt(e,{streamIsTTY:t,sniffFlags:r=!0}={}){let n=Ct();n!==void 0&&(Z=n);let o=r?Z:n;if(o===0)return 0;if(r){if(b("color=16m")||b("color=full")||b("color=truecolor"))return 3;if(b("color=256"))return 2}if("TF_BUILD"in d&&"AGENT_NAME"in d)return 1;if(e&&!t&&o===void 0)return 0;let i=o||0;if(d.TERM==="dumb")return i;if(K.default.platform==="win32"){let a=Ee.default.release().split(".");return Number(a[0])>=10&&Number(a[2])>=10586?Number(a[2])>=14931?3:2:1}if("CI"in d)return"GITHUB_ACTIONS"in d||"GITEA_ACTIONS"in d?3:["TRAVIS","CIRCLECI","APPVEYOR","GITLAB_CI","BUILDKITE","DRONE"].some(a=>a in d)||d.CI_NAME==="codeship"?1:i;if("TEAMCITY_VERSION"in d)return/^(9\.(0*[1-9]\d*)\.|\d{2,}\.)/.test(d.TEAMCITY_VERSION)?1:0;if(d.COLORTERM==="truecolor"||d.TERM==="xterm-kitty")return 3;if("TERM_PROGRAM"in d){let a=Number.parseInt((d.TERM_PROGRAM_VERSION||"").split(".")[0],10);switch(d.TERM_PROGRAM){case"iTerm.app":return a>=3?3:2;case"Apple_Terminal":return 2}}return/-256(color)?$/i.test(d.TERM)?2:/^screen|^xterm|^vt100|^vt220|^rxvt|color|ansi|cygwin|linux/i.test(d.TERM)||"COLORTERM"in d?1:i}function de(e,t={}){let r=yt(e,{streamIsTTY:e&&e.isTTY,...t});return vt(r)}var K,Ee,fe,d,Z,bt,_t,Te=it(()=>{K=F(require("node:process"),1),Ee=F(require("node:os"),1),fe=F(require("node:tty"),1);({env:d}=K.default);b("no-color")||b("no-colors")||b("color=false")||b("color=never")?Z=0:(b("color")||b("colors")||b("color=true")||b("color=always"))&&(Z=1);bt={stdout:de({isTTY:fe.default.isatty(1)}),stderr:de({isTTY:fe.default.isatty(2)})},_t=bt});var ke=S((h,ee)=>{var Ot=require("tty"),X=require("util");h.init=Tt;h.log=At;h.formatArgs=Pt;h.save=Et;h.load=St;h.useColors=xt;h.destroy=X.deprecate(()=>{},"Instance method `debug.destroy()` is deprecated and no longer does anything. It will be removed in the next major version of `debug`.");h.colors=[6,2,3,4,5,1];try{let e=(Te(),Oe(Se));e&&(e.stderr||e).level>=2&&(h.colors=[20,21,26,27,32,33,38,39,40,41,42,43,44,45,56,57,62,63,68,69,74,75,76,77,78,79,80,81,92,93,98,99,112,113,128,129,134,135,148,149,160,161,162,163,164,165,166,167,168,169,170,171,172,173,178,179,184,185,196,197,198,199,200,201,202,203,204,205,206,207,208,209,214,215,220,221])}catch{}h.inspectOpts=Object.keys(process.env).filter(e=>/^debug_/i.test(e)).reduce((e,t)=>{let r=t.substring(6).toLowerCase().replace(/_([a-z])/g,(o,i)=>i.toUpperCase()),n=process.env[t];return/^(yes|on|true|enabled)$/i.test(n)?n=!0:/^(no|off|false|disabled)$/i.test(n)?n=!1:n==="null"?n=null:n=Number(n),e[r]=n,e},{});function xt(){return"colors"in h.inspectOpts?!!h.inspectOpts.colors:Ot.isatty(process.stderr.fd)}function Pt(e){let{namespace:t,useColors:r}=this;if(r){let n=this.color,o="\x1B[3"+(n<8?n:"8;5;"+n),i=`  ${o};1m${t} \x1B[0m`;e[0]=i+e[0].split(`
`).join(`
`+i),e.push(o+"m+"+ee.exports.humanize(this.diff)+"\x1B[0m")}else e[0]=Ft()+t+" "+e[0]}function Ft(){return h.inspectOpts.hideDate?"":new Date().toISOString()+" "}function At(...e){return process.stderr.write(X.formatWithOptions(h.inspectOpts,...e)+`
`)}function Et(e){e?process.env.DEBUG=e:delete process.env.DEBUG}function St(){return process.env.DEBUG}function Tt(e){e.inspectOpts={};let t=Object.keys(h.inspectOpts);for(let r=0;r<t.length;r++)e.inspectOpts[t[r]]=h.inspectOpts[t[r]]}ee.exports=le()(h);var{formatters:Ie}=ee.exports;Ie.o=function(e){return this.inspectOpts.colors=this.useColors,X.inspect(e,this.inspectOpts).split(`
`).map(t=>t.trim()).join(" ")};Ie.O=function(e){return this.inspectOpts.colors=this.useColors,X.inspect(e,this.inspectOpts)}});var he=S((Cr,pe)=>{typeof process>"u"||process.type==="renderer"||process.browser===!0||process.__nwjs?pe.exports=Ae():pe.exports=ke()});var Me=S(C=>{"use strict";var It=C&&C.__createBinding||(Object.create?function(e,t,r,n){n===void 0&&(n=r);var o=Object.getOwnPropertyDescriptor(t,r);(!o||("get"in o?!t.__esModule:o.writable||o.configurable))&&(o={enumerable:!0,get:function(){return t[r]}}),Object.defineProperty(e,n,o)}:function(e,t,r,n){n===void 0&&(n=r),e[n]=t[r]}),kt=C&&C.__setModuleDefault||(Object.create?function(e,t){Object.defineProperty(e,"default",{enumerable:!0,value:t})}:function(e,t){e.default=t}),Ge=C&&C.__importStar||function(e){if(e&&e.__esModule)return e;var t={};if(e!=null)for(var r in e)r!=="default"&&Object.prototype.hasOwnProperty.call(e,r)&&It(t,e,r);return kt(t,e),t};Object.defineProperty(C,"__esModule",{value:!0});C.req=C.json=C.toBuffer=void 0;var Gt=Ge(require("http")),Rt=Ge(require("https"));async function Re(e){let t=0,r=[];for await(let n of e)t+=n.length,r.push(n);return Buffer.concat(r,t)}C.toBuffer=Re;async function Mt(e){let r=(await Re(e)).toString("utf8");try{return JSON.parse(r)}catch(n){let o=n;throw o.message+=` (input: ${r})`,o}}C.json=Mt;function Nt(e,t={}){let n=((typeof e=="string"?e:e.href).startsWith("https:")?Rt:Gt).request(e,t),o=new Promise((i,a)=>{n.once("response",i).once("error",a).end()});return n.then=o.then.bind(o),n}C.req=Nt});var Le=S(y=>{"use strict";var qe=y&&y.__createBinding||(Object.create?function(e,t,r,n){n===void 0&&(n=r);var o=Object.getOwnPropertyDescriptor(t,r);(!o||("get"in o?!t.__esModule:o.writable||o.configurable))&&(o={enumerable:!0,get:function(){return t[r]}}),Object.defineProperty(e,n,o)}:function(e,t,r,n){n===void 0&&(n=r),e[n]=t[r]}),qt=y&&y.__setModuleDefault||(Object.create?function(e,t){Object.defineProperty(e,"default",{enumerable:!0,value:t})}:function(e,t){e.default=t}),He=y&&y.__importStar||function(e){if(e&&e.__esModule)return e;var t={};if(e!=null)for(var r in e)r!=="default"&&Object.prototype.hasOwnProperty.call(e,r)&&qe(t,e,r);return qt(t,e),t},Ht=y&&y.__exportStar||function(e,t){for(var r in e)r!=="default"&&!Object.prototype.hasOwnProperty.call(t,r)&&qe(t,e,r)};Object.defineProperty(y,"__esModule",{value:!0});y.Agent=void 0;var Lt=He(require("net")),Ne=He(require("http")),Dt=require("https");Ht(Me(),y);var A=Symbol("AgentBaseInternalState"),ge=class extends Ne.Agent{constructor(t){super(t),this[A]={}}isSecureEndpoint(t){if(t){if(typeof t.secureEndpoint=="boolean")return t.secureEndpoint;if(typeof t.protocol=="string")return t.protocol==="https:"}let{stack:r}=new Error;return typeof r!="string"?!1:r.split(`
`).some(n=>n.indexOf("(https.js:")!==-1||n.indexOf("node:https:")!==-1)}incrementSockets(t){if(this.maxSockets===1/0&&this.maxTotalSockets===1/0)return null;this.sockets[t]||(this.sockets[t]=[]);let r=new Lt.Socket({writable:!1});return this.sockets[t].push(r),this.totalSocketCount++,r}decrementSockets(t,r){if(!this.sockets[t]||r===null)return;let n=this.sockets[t],o=n.indexOf(r);o!==-1&&(n.splice(o,1),this.totalSocketCount--,n.length===0&&delete this.sockets[t])}getName(t){return(typeof t.secureEndpoint=="boolean"?t.secureEndpoint:this.isSecureEndpoint(t))?Dt.Agent.prototype.getName.call(this,t):super.getName(t)}createSocket(t,r,n){let o={...r,secureEndpoint:this.isSecureEndpoint(r)},i=this.getName(o),a=this.incrementSockets(i);Promise.resolve().then(()=>this.connect(t,o)).then(l=>{if(this.decrementSockets(i,a),l instanceof Ne.Agent)try{return l.addRequest(t,o)}catch(f){return n(f)}this[A].currentSocket=l,super.createSocket(t,r,n)},l=>{this.decrementSockets(i,a),n(l)})}createConnection(){let t=this[A].currentSocket;if(this[A].currentSocket=void 0,!t)throw new Error("No socket was returned in the `connect()` function");return t}get defaultPort(){return this[A].defaultPort??(this.protocol==="https:"?443:80)}set defaultPort(t){this[A]&&(this[A].defaultPort=t)}get protocol(){return this[A].protocol??(this.isSecureEndpoint()?"https:":"http:")}set protocol(t){this[A]&&(this[A].protocol=t)}};y.Agent=ge});var De=S(L=>{"use strict";var jt=L&&L.__importDefault||function(e){return e&&e.__esModule?e:{default:e}};Object.defineProperty(L,"__esModule",{value:!0});L.parseProxyResponse=void 0;var Bt=jt(he()),te=(0,Bt.default)("https-proxy-agent:parse-proxy-response");function Ut(e){return new Promise((t,r)=>{let n=0,o=[];function i(){let s=e.read();s?O(s):e.once("readable",i)}function a(){e.removeListener("end",l),e.removeListener("error",f),e.removeListener("readable",i)}function l(){a(),te("onend"),r(new Error("Proxy connection ended before receiving CONNECT response"))}function f(s){a(),te("onerror %o",s),r(s)}function O(s){o.push(s),n+=s.length;let c=Buffer.concat(o,n),u=c.indexOf(`\r
\r
`);if(u===-1){te("have not received end of HTTP headers yet..."),i();return}let p=c.slice(0,u).toString("ascii").split(`\r
`),x=p.shift();if(!x)return e.destroy(),r(new Error("No header received from proxy CONNECT response"));let m=x.split(" "),w=+m[1],E=m.slice(2).join(" "),P={};for(let k of p){if(!k)continue;let T=k.indexOf(":");if(T===-1)return e.destroy(),r(new Error(`Invalid header from proxy CONNECT response: "${k}"`));let z=k.slice(0,T).toLowerCase(),G=k.slice(T+1).trimStart(),M=P[z];typeof M=="string"?P[z]=[M,G]:Array.isArray(M)?M.push(G):P[z]=G}te("got proxy server response: %o %o",x,P),a(),t({connect:{statusCode:w,statusText:E,headers:P},buffered:c})}e.on("error",f),e.on("end",l),i()})}L.parseProxyResponse=Ut});var ze=S(_=>{"use strict";var $t=_&&_.__createBinding||(Object.create?function(e,t,r,n){n===void 0&&(n=r);var o=Object.getOwnPropertyDescriptor(t,r);(!o||("get"in o?!t.__esModule:o.writable||o.configurable))&&(o={enumerable:!0,get:function(){return t[r]}}),Object.defineProperty(e,n,o)}:function(e,t,r,n){n===void 0&&(n=r),e[n]=t[r]}),Wt=_&&_.__setModuleDefault||(Object.create?function(e,t){Object.defineProperty(e,"default",{enumerable:!0,value:t})}:function(e,t){e.default=t}),$e=_&&_.__importStar||function(e){if(e&&e.__esModule)return e;var t={};if(e!=null)for(var r in e)r!=="default"&&Object.prototype.hasOwnProperty.call(e,r)&&$t(t,e,r);return Wt(t,e),t},We=_&&_.__importDefault||function(e){return e&&e.__esModule?e:{default:e}};Object.defineProperty(_,"__esModule",{value:!0});_.HttpsProxyAgent=void 0;var re=$e(require("net")),je=$e(require("tls")),zt=We(require("assert")),Yt=We(he()),Vt=Le(),Jt=require("url"),Qt=De(),U=(0,Yt.default)("https-proxy-agent"),Be=e=>e.servername===void 0&&e.host&&!re.isIP(e.host)?{...e,servername:e.host}:e,ne=class extends Vt.Agent{constructor(t,r){super(r),this.options={path:void 0},this.proxy=typeof t=="string"?new Jt.URL(t):t,this.proxyHeaders=(r==null?void 0:r.headers)??{},U("Creating new HttpsProxyAgent instance: %o",this.proxy.href);let n=(this.proxy.hostname||this.proxy.host).replace(/^\[|\]$/g,""),o=this.proxy.port?parseInt(this.proxy.port,10):this.proxy.protocol==="https:"?443:80;this.connectOpts={ALPNProtocols:["http/1.1"],...r?Ue(r,"headers"):null,host:n,port:o}}async connect(t,r){let{proxy:n}=this;if(!r.host)throw new TypeError('No "host" provided');let o;n.protocol==="https:"?(U("Creating `tls.Socket`: %o",this.connectOpts),o=je.connect(Be(this.connectOpts))):(U("Creating `net.Socket`: %o",this.connectOpts),o=re.connect(this.connectOpts));let i=typeof this.proxyHeaders=="function"?this.proxyHeaders():{...this.proxyHeaders},a=re.isIPv6(r.host)?`[${r.host}]`:r.host,l=`CONNECT ${a}:${r.port} HTTP/1.1\r
`;if(n.username||n.password){let u=`${decodeURIComponent(n.username)}:${decodeURIComponent(n.password)}`;i["Proxy-Authorization"]=`Basic ${Buffer.from(u).toString("base64")}`}i.Host=`${a}:${r.port}`,i["Proxy-Connection"]||(i["Proxy-Connection"]=this.keepAlive?"Keep-Alive":"close");for(let u of Object.keys(i))l+=`${u}: ${i[u]}\r
`;let f=(0,Qt.parseProxyResponse)(o);o.write(`${l}\r
`);let{connect:O,buffered:s}=await f;if(t.emit("proxyConnect",O),this.emit("proxyConnect",O,t),O.statusCode===200)return t.once("socket",Zt),r.secureEndpoint?(U("Upgrading socket connection to TLS"),je.connect({...Ue(Be(r),"host","path","port"),socket:o})):o;o.destroy();let c=new re.Socket({writable:!1});return c.readable=!0,t.once("socket",u=>{U("Replaying proxy buffer for failed request"),(0,zt.default)(u.listenerCount("data")>0),u.push(s),u.push(null)}),c}};ne.protocols=["http","https"];_.HttpsProxyAgent=ne;function Zt(e){e.resume()}function Ue(e,...t){let r={},n;for(n in e)t.includes(n)||(r[n]=e[n]);return r}});var dr={};be(dr,{activate:()=>lr,deactivate:()=>fr,downloadGitignoreFile:()=>Ke});module.exports=Oe(dr);var g=F(require("vscode")),j=F(require("fs")),Ze=require("path");var V=class{_key;_value;storeDate;get key(){return this._key}get value(){return this._value}constructor(t,r){this._key=t,this._value=r,this.storeDate=new Date}isExpired(t){return this.storeDate.getTime()+t*1e3<Date.now()}},B=class{_store;_cacheExpirationInterval;constructor(t){this._store={},this._cacheExpirationInterval=t}add(t){this._store[t.key]=t}get(t){let r=this._store[t];if(!(typeof r>"u"||r.isExpired(this._cacheExpirationInterval)))return r.value}getCacheItem(t){let r=this._store[t];if(!(typeof r>"u"||r.isExpired(this._cacheExpirationInterval)))return r}};var ue=(r=>(r[r.Append=0]="Append",r[r.Overwrite=1]="Overwrite",r))(ue||{});var ve=F(require("url"));var Ye=F(require("vscode")),Ve=F(ze()),Kt="vscode-gitignore-extension (https://github.com/CodeZombieCH/vscode-gitignore)";function Xt(){let t=Ye.workspace.getConfiguration("http").get("proxy",void 0)||process.env.HTTPS_PROXY||process.env.HTTP_PROXY;return t&&console.log(`vscode-gitignore: using proxy ${t}`),t}var oe;function me(){if(oe)return oe;let e=Xt();return e&&(oe=new Ve.HttpsProxyAgent(e)),oe}function Je(){return{"User-Agent":Kt}}var we=F(require("https"));var er="x-ratelimit-remaining",Ce=class extends Error{statusCode;responseBody;constructor(t,r){super(),this.statusCode=t,this.responseBody=r}},$=class extends Error{constructor(t){super(t)}},ie=class{constructor(t){this.githubSession=t}async getHeaders(){let t=Je();return t={...t,...await this.githubSession.getHeaders()},t}requestString(t,r){return new Promise((n,o)=>{we.request(t,r,a=>{try{this.checkRateLimit(a)}catch(f){return f instanceof Error?o(f):o(new Error("Shit hit the fan, we are not using proper errors"))}let l=[];a.on("data",f=>{l.push(f)}),a.on("end",()=>{let f=Buffer.concat(l).toString();if(a.statusCode!==200)return o(new Ce(a.statusCode,f));n(f)})}).on("error",a=>o(a)).end()})}requestWriteStream(t,r,n){return new Promise((o,i)=>{we.request(t,r,l=>{try{this.checkRateLimit(l)}catch(f){return f instanceof Error?i(f):i(new Error("Shit hit the fan, we are not using proper errors"))}if(l.statusCode!==200)return i(new Error(`Download failed with status code ${l.statusCode}`));l.pipe(n),n.on("finish",()=>{n.close(),o()})}).on("error",l=>i(l)).end()})}checkRateLimit(t){let r=t.headers[er];if(r===void 0)return;let n=Number.parseInt(r);if(console.info(`vscode-gitignore: GitHub API rate limit remaining: ${n}`),t.statusCode&&t.statusCode>=400&&n<1)throw new $("GitHub API rate limit reached");return n}};var se=class{constructor(t,r){this.cache=t;this.client=new ie(r)}client;async getTemplates(){let t=await Promise.all([this.getFiles(),this.getFiles("Global")]);return Array.prototype.concat.apply([],t).sort((n,o)=>n.name.localeCompare(o.name))}async getFiles(t=""){let r=this.cache.get("gitignore/"+t);if(typeof r<"u")return r;let n=new ve.URL(t,"https://api.github.com/repos/github/gitignore/contents/"),o={agent:me(),method:"GET",headers:{...await this.client.getHeaders(),Accept:"application/vnd.github.v3+json"}},i=await this.client.requestString(n,o),l=JSON.parse(i).filter(f=>f.type==="file"&&f.name.endsWith(".gitignore")).map(f=>({name:f.name.replace(/\.gitignore/,""),path:f.path}));return this.cache.add(new V("gitignore/"+t,l)),l}async downloadToStream(t,r){let n=new ve.URL(t,"https://api.github.com/repos/github/gitignore/contents/"),o={agent:me(),method:"GET",headers:{...await this.client.getHeaders(),Accept:"application/vnd.github.v3.raw"}};await this.client.requestWriteStream(n,o,r)}};var W=F(require("vscode")),Qe="Yes",tr="No",D=class extends Error{},ce=class{useAuthenticationProvider=!1;hasUserAgreed=!1},ae=class{context;_sessionPromise=null;constructor(t){this.context=t}async tryGetGithubToken(){if(this.context.useAuthenticationProvider=!0,!this.context.hasUserAgreed){if(await W.window.showInformationMessage("GitHub API rate limit reached. Do you want to authenticate with GitHub?",Qe,tr)!==Qe)throw this.context.hasUserAgreed=!1,console.log("vscode-gitignore: user disagreed to use GitHub authentication provider"),new D;this.context.hasUserAgreed=!0,console.log("vscode-gitignore: user agreed to use GitHub authentication provider")}try{this._sessionPromise=W.authentication.getSession("github",[],{createIfNone:!0}),console.info("vscode-gitignore: acquiring session from authentication provider");let t=await this._sessionPromise;return t?t.accessToken:null}catch(t){throw t instanceof Error&&t.message==="Cancelled"?new D:t}}async isAuthenticated(){return this.context.hasUserAgreed&&!!await this.getAccessToken()}async getAccessToken(){if(this.context.useAuthenticationProvider&&this.context.hasUserAgreed){this._sessionPromise===null&&(this._sessionPromise=W.authentication.getSession("github",[],{createIfNone:!1}),console.info("vscode-gitignore: acquiring session from authentication provider"));let t=await this._sessionPromise;if(t)return console.info("vscode-gitignore: session acquired from authentication provider"),t.accessToken}return null}async getAuthorizationHeaderValue(){let t=await this.getAccessToken();return t?"Token "+t:process.env.GITHUB_AUTHORIZATION?process.env.GITHUB_AUTHORIZATION:null}async getHeaders(){let t={},r=await this.getAuthorizationHeaderValue();return r&&(console.log("vscode-gitignore: setting authorization header"),t={...t,Authorization:r}),t}};var I=class extends Error{},rr=nr();or();function nr(){let t=g.workspace.getConfiguration("gitignore").get("cacheExpirationInterval",3600);return console.log(`vscode-gitignore: creating cache with cacheExpirationInterval: ${t}`),new B(t)}function or(){return console.log("vscode-gitignore: creating cache with cacheExpirationInterval: 0"),new B(0)}async function ir(e){let t=g.workspace.workspaceFolders;if(t){if(t.length===1)return{template:e,path:t[0].uri.fsPath};{let r=await g.window.showWorkspaceFolderPick();if(!r)throw new I;return{template:e,path:r.uri.fsPath}}}else throw new I}function sr(e){return new Promise(t=>{j.stat(e,r=>t(!r))})}async function cr(e,t){if(e=(0,Ze.join)(e,".gitignore"),!await sr(e))return{path:e,template:t,type:1};let n=await ar();if(!n)throw new I;let o=n.label,i=ue[o];return{path:e,template:t,type:i}}async function Ke(e,t){let r=t.type===1?"w":"a",n=j.createWriteStream(t.path,{flags:r});r==="a"&&n.write(`
`);try{await e.downloadToStream(t.template.path,n)}catch(o){throw r==="w"&&j.unlink(t.path,i=>{i&&console.error(`vscode-gitignore: ${i.message}`)}),o}}function ar(){return g.window.showQuickPick([{label:"Append",description:"Append to existing .gitignore file"},{label:"Overwrite",description:"Overwrite existing .gitignore file"}])}function ur(e){switch(e.type){case 0:return g.window.showInformationMessage(`Appended ${e.template.path} to the existing .gitignore in the project root`);case 1:return g.window.showInformationMessage(`Created .gitignore file in the project root based on ${e.template.path}`);default:throw new Error("Unsupported operation")}}function lr(e){console.log("vscode-gitignore: extension activated");let t=new ce,r=g.commands.registerCommand("gitignore.addgitignore",async()=>{let n=new ae(t);try{if(!g.workspace.workspaceFolders){await g.window.showErrorMessage("No workspace/directory open");return}let o=new se(rr,n),a=(await o.getTemplates()).map(c=>({label:c.name,description:c.path,url:c.download_url,template:c})),l=await g.window.showQuickPick(a);if(!l)throw new I;let{template:f,path:O}=await ir(l.template);console.log(`vscode-gitignore: add/append gitignore for directory: ${O}`);let s=await cr(O,f);await Ke(o,s),await ur(s)}catch(o){if(o instanceof I){console.info("vscode-gitignore: command cancelled");return}else if(o instanceof $){if(console.error("vscode-gitignore: GitHub API rate limit reached"),await n.isAuthenticated()){await g.window.showErrorMessage("GitHub API rate limit reached");return}try{await n.tryGetGithubToken()?(console.info("vscode-gitignore: acquiring GitHub access token succeeded"),await g.window.showInformationMessage("Acquired GitHub access token. Please try again.")):(console.error("vscode-gitignore: acquiring GitHub access token failed"),await g.window.showErrorMessage("Acquiring GitHub access token failed"))}catch(i){i instanceof I?console.info("vscode-gitignore: command cancelled"):i instanceof D?console.info("vscode-gitignore: acquiring GitHub access token cancelled"):(console.error("vscode-gitignore: ",i),await g.window.showErrorMessage(String(i)))}}else console.error("vscode-gitignore: ",o),await g.window.showErrorMessage(String(o))}});e.subscriptions.push(r)}function fr(){console.log("vscode-gitignore: extension is now deactivated!")}0&&(module.exports={activate,deactivate,downloadGitignoreFile});
