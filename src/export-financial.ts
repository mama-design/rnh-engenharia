import {financialMonth,type FinanceRow} from './finance.ts';
const money=(n:number)=>n.toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
const fmt=(s:string)=>s.split('-').reverse().join('/');
const monthLabel=(s:string)=>new Date(s+'-15T12:00:00Z').toLocaleDateString('pt-BR',{month:'long',year:'numeric',timeZone:'UTC'});
export async function exportFinancialJpeg(month:string,rows:FinanceRow[],employee='',employeeName=''){
 if(!/^\d{4}-(0[1-9]|1[0-2])$/.test(month))throw Error('Selecione um mês válido.');
 const result=financialMonth(rows,month,employee),canvas=document.createElement('canvas'),ctx=canvas.getContext('2d');if(!ctx)throw Error('Não foi possível criar a imagem.');
 const width=1050,pad=55;ctx.font='22px Arial';
 function wrap(value:string,max=width-2*pad){const lines:string[]=[];let line='';for(const word of value.split(/\s+/)){if(ctx!.measureText((line?line+' ':'')+word).width>max&&line){lines.push(line);line=word}else line+=(line?' ':'')+word}if(line)lines.push(line);return lines}
 const filterLines=wrap(employee?'Funcionário: '+employeeName:'Todos os funcionários');
 const entries=result.rows.map(r=>({row:r,names:wrap(r.name,650),notes:r.note?wrap('Observação: '+r.note):[]}));
 const height=470+filterLines.length*30+Math.max(90,entries.reduce((sum,e)=>sum+150+e.names.length*30+e.notes.length*28,0));
 const scale=Math.min(1.5,14000/height,Math.sqrt(16000000/(width*height)));canvas.width=Math.round(width*scale);canvas.height=Math.round(height*scale);ctx.scale(scale,scale);ctx.fillStyle='#fff';ctx.fillRect(0,0,width,height);
 function text(value:string,x:number,y:number,size=22,color='#464646',bold=false){ctx!.font=`${bold?'bold ':''}${size}px Arial`;ctx!.fillStyle=color;ctx!.fillText(value,x,y)}
 try{const logo=new Image();logo.src=new URL('./rnh-engenharia.png',location.href).href;await logo.decode();ctx.drawImage(logo,width-200,20,145,145)}catch{}
 let y=65;text('RNH ENGENHARIA & CONSTRUÇÃO',pad,y,20,'#940e0b',true);y+=52;text('ESPELHO FINANCEIRO',pad,y,30,'#262626',true);y+=45;text(monthLabel(month),pad,y,25);y+=38;
 for(const line of filterLines){text(line,pad,y,22);y+=30}y+=20;
 const totals=[['Diaristas',result.daily],['Carteira assinada',result.clt],['Total pago no mês',result.total]] as const;
 totals.forEach(([label,value],i)=>{const x=pad+i*318;ctx.fillStyle=i===2?'#464646':'#f4f4f4';ctx.fillRect(x,y,304,96);text(label,x+15,y+30,19,i===2?'#fff':'#666');text(money(value),x+15,y+70,27,i===2?'#fff':'#262626',true)});y+=133;
 text(`${result.rows.length} pagamento(s) realizado(s) · Mês pela data do pagamento`,pad,y,20);y+=45;
 if(!entries.length){text('Nenhum pagamento registrado neste mês.',pad,y+15,23);y+=70}
 for(const {row,names,notes} of entries){
 ctx.strokeStyle='#ddd';ctx.beginPath();ctx.moveTo(pad,y-12);ctx.lineTo(width-pad,y-12);ctx.stroke();
 names.forEach(line=>{text(line,pad,y+20,25,'#262626',true);y+=30});text(money(row.value),width-290,y-10,25,'#940e0b',true);
 text(row.kind==='clt'?'Carteira assinada · Lançamento manual':'Diarista',pad,y+22,20);y+=36;
 text('Pago em '+fmt(row.date),pad,y+15,21);y+=32;
 text(row.kind==='daily'?`Período: ${fmt(row.start!)} a ${fmt(row.end!)}`:'Referência: '+monthLabel(row.reference!),pad,y+15,20);y+=32;
 notes.forEach(line=>{text(line,pad,y+15,20,'#777');y+=28});y+=50;
 }
 text('Valores efetivamente registrados como pagos. Adiantamentos e descontos',pad,y+10,18,'#777');text('não são somados novamente. Este espelho não substitui um comprovante bancário.',pad,y+36,18,'#777');
 const blob=await new Promise<Blob>((resolve,reject)=>canvas.toBlob(b=>b?resolve(b):reject(Error('Não foi possível gerar o JPEG.')),'image/jpeg',.93));
 const url=URL.createObjectURL(blob),link=document.createElement('a');link.href=url;link.download=`financeiro-${month}${employee?'-'+employeeName.normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-zA-Z0-9]+/g,'-'):''}.jpg`;document.body.appendChild(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),60000);
}
