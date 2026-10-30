import {paymentPeriods,type Payment} from './payroll.ts';
export type ManualPayment={id:string,employee:string,date:string,value:number,reference:string,note:string};
export type FinanceRow={id:string,employee:string,name:string,date:string,value:number,kind:'daily'|'clt',start?:string,end?:string,reference?:string,note?:string};
export function financialHistory(employees:{id:string,name:string}[],payments:Record<string,Payment>,manual:ManualPayment[]=[]):FinanceRow[]{
 const ids=new Set([...employees.map(e=>e.id),...Object.keys(payments).map(k=>k.split('|')[1]).filter(Boolean)]);
 const name=(id:string)=>employees.find(e=>e.id===id)?.name??'Funcionário não encontrado';
 return [...[...ids].flatMap(employee=>paymentPeriods(employee,payments).map(p=>({id:p.key,employee,name:name(employee),date:p.date,value:p.value,kind:'daily' as const,start:p.start,end:p.end}))),...manual.map(p=>({...p,name:name(p.employee),kind:'clt' as const}))].sort((a,b)=>b.date.localeCompare(a.date)||a.name.localeCompare(b.name,'pt-BR')||a.id.localeCompare(b.id));
}
export function financialMonth(rows:FinanceRow[],month:string,employee=''){
 const filtered=rows.filter(r=>r.date.slice(0,7)===month&&(!employee||r.employee===employee));
 const cents=(kind?:string)=>filtered.filter(r=>!kind||r.kind===kind).reduce((s,r)=>s+Math.round(r.value*100),0)/100;
 return {rows:filtered,daily:cents('daily'),clt:cents('clt'),total:cents()};
}
