import {initialProducts} from '../data';
const url=(import.meta.env.VITE_MOCKAPI_URL||'').trim().replace(/\/$/,'');
export const demoMode=!url;
const copy=v=>JSON.parse(JSON.stringify(v));
function stored(resource){const key='flora_v2_'+resource; const saved=localStorage.getItem(key); if(saved){try{return JSON.parse(saved)}catch{}}return resource==='products'?copy(initialProducts):[]}
function persist(resource,items){localStorage.setItem('flora_v2_'+resource,JSON.stringify(items))}
async function request(resource,method='GET',id=null,data=null){
 if(demoMode){let items=stored(resource); if(method==='GET') {if(id){const item=items.find(p=>String(p.id)===String(id));if(!item)throw new Error('Registro no encontrado');return item}return items}
 if(method==='POST'){const item={...data,id:String(Math.max(0,...items.map(x=>Number(x.id)||0))+1)};items.push(item);persist(resource,items);return item}
 const index=items.findIndex(x=>String(x.id)===String(id)); if(index<0)throw new Error('Registro no encontrado');
 if(method==='PUT'){items[index]={...items[index],...data,id:String(id)};persist(resource,items);return items[index]}
 if(method==='DELETE'){const old=items.splice(index,1)[0];persist(resource,items);return old}
 }
 let response;try{response=await fetch(`${url}/${resource}${id?'/'+encodeURIComponent(id):''}`,{method,headers:{'Content-Type':'application/json'},...(data?{body:JSON.stringify(data)}:{})})}catch{throw new Error('No se pudo conectar a MockAPI. Revisá la URL y tu conexión.')}
 if(!response.ok)throw new Error(`MockAPI respondió ${response.status}. Verificá el recurso ${resource}.`);
 return response.status===204?null:response.json();
}
export const productsApi={list:()=>request('products'),get:id=>request('products','GET',id),create:data=>request('products','POST',null,data),update:(id,data)=>request('products','PUT',id,data),remove:id=>request('products','DELETE',id)};
export const usersApi={list:()=>request('users'),create:data=>request('users','POST',null,data),update:(id,data)=>request('users','PUT',id,data),remove:id=>request('users','DELETE',id)};
