const fs=require('fs'); const vm=require('vm'); const assert=require('assert/strict');
let sql, params, fail=false;
const context={URL,console,NextResponse:{json:(body,init={})=>({body,...init})},db:{query:async(s,p)=>{sql=s;params=p;if(fail)throw {code:'TEST'};return [Array.from({length:21},(_,i)=>({an:String(i)}))]}}};
vm.createContext(context);
const source=fs.readFileSync('app/api/hosxp/search/route.js','utf8').replace(/^import .*;\r?\n/gm,'').replace('export async function','async function');
vm.runInContext(source,context);
(async()=>{
 let r=await context.GET({url:'http://test/?q=x'}); assert.equal(r.status,400);
 r=await context.GET({url:'http://test/?q=6800'}); assert.equal(params[0],'6800%'); assert.equal(r.body.admissions.length,20); assert.equal(r.body.hasMore,true); assert.equal(r.headers['Cache-Control'],'no-store');
 r=await context.GET({url:'http://test/?q='+encodeURIComponent("สมชาย %_!' OR 1=1")}); assert.equal(params[0],"%สมชาย !%!_!!' OR 1=1%"); assert.ok(!sql.includes('OR 1=1'));
 fail=true;r=await context.GET({url:'http://test/?q=ทดสอบ'});assert.equal(r.status,500);
 console.log('PASS: search validation, AN/name bound queries, literal wildcard escaping, result cap, no-store, database error handling.');
})().catch(e=>{console.error(e);process.exit(1)});
