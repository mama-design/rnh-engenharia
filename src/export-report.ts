import {periodRates,inPeriod,monthsInPeriod,summarizePeriod} from './payroll.ts';
type Employee={id:string,name:string,role:string,employment?:string,rate?:number};
type Data={attendance:Parameters<typeof summarizePeriod>[3],discounts:({note:string}&Parameters<typeof summarizePeriod>[4][number])[]};
const money=(n:number)=>n.toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
const fmt=(s:string)=>s.split('-').reverse().join('/');
export async function exportReportJpeg(employee:Employee,start:string,end:string,data:Data){
 const months=monthsInPeriod(start,end);if(!months.length)throw Error('Selecione um período válido.');
 const canvas=document.createElement('canvas'),ctx=canvas.getContext('2d');if(!ctx)throw Error('Não foi possível criar a imagem.');
 const width=1050,pad=55,col=(width-pad*2)/7,cellHeight=86;
 ctx.font='22px Arial';
 function wrap(text:string,max=width-pad*2){const lines:string[]=[];let line='';for(const word of text.split(/\s+/)){const next=line?line+' '+word:word;if(ctx!.measureText(next).width>max&&line){lines.push(line);line=word}else line=next}if(line)lines.push(line);return lines}
 const discounts=employee.employment==='clt'?[]:data.discounts.filter(d=>d.employee===employee.id&&inPeriod(d.date,start,end));
 const discountLines=discounts.flatMap(d=>wrap(fmt(d.date)+' · '+d.note+' · − '+money(d.value)));
 const nameLines=wrap(employee.name,650);
 const rates=periodRates(employee.id,start,end,data.attendance);
 const rateLines=employee.employment==='clt'?[]:wrap(rates.length?(rates.length>1?'Valores da diária no período: ':'Valor da diária: ')+rates.map(money).join(' · '):employee.rate!==undefined?'Diária atual do cadastro: '+money(employee.rate)+' (sem turnos registrados no período)':'Sem turnos registrados no período.');
 const height=460+rateLines.length*32+nameLines.length*32+months.reduce((s,m)=>s+120+Math.ceil((new Date(m+'-01T12:00:00Z').getUTCDay()+new Date(Date.UTC(+m.slice(0,4),+m.slice(5),0)).getUTCDate())/7)*cellHeight,0)+discountLines.length*30+100;
 // Keep within mobile canvas limits for longer periods.
 const scale=Math.min(1.5,14000/height,Math.sqrt(16000000/(width*height)));
 canvas.width=Math.round(width*scale);canvas.height=Math.round(height*scale);ctx.scale(scale,scale);ctx.fillStyle='#fff';ctx.fillRect(0,0,width,height);
 let y=pad;
 function text(value:string,x:number,top:number,size=22,color='#464646',bold=false){ctx!.font=`${bold?'bold ':''}${size}px Arial`;ctx!.fillStyle=color;ctx!.fillText(value,x,top)}
 try{const logo=new Image();logo.src=new URL('./rnh-engenharia.png',location.href).href;await logo.decode();ctx.drawImage(logo,width-210,25,155,155)}catch{/* Text branding remains available if the image cannot load. */}
 text('RNH ENGENHARIA & CONSTRUÇÃO',pad,y,20,'#940e0b',true);y+=48;
 text(employee.employment==='clt'?'ESPELHO DE PRESENÇA':'ESPELHO DE DIÁRIAS',pad,y,19);y+=42;
 for(const line of nameLines){text(line,pad,y,30,'#262626',true);y+=34}
 for(const line of wrap(employee.role)){text(line,pad,y,22);y+=28}
 text(fmt(start)+' a '+fmt(end),pad,y+10,22);y+=60;
 for(const line of rateLines){text(line,pad,y,22,'#262626',true);y+=32}if(rateLines.length)y+=12;
 const total=summarizePeriod(employee.id,start,end,data.attendance,data.discounts,employee.employment==='clt');
 if(employee.employment!=='clt'){ctx.fillStyle='#f4f4f4';ctx.fillRect(pad,y,width-pad*2,84);['Bruto: '+money(total.gross),'Descontos: '+money(total.discounts),'Saldo: '+money(total.net)].forEach((v,i)=>text(v,pad+15+i*310,y+50,21,'#262626',true));y+=108}
 for(const month of months){
 text(new Date(month+'-15T12:00:00Z').toLocaleDateString('pt-BR',{month:'long',year:'numeric',timeZone:'UTC'}),pad,y+24,25,'#262626',true);y+=65;
 ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'].forEach((d,i)=>text(d,pad+i*col+12,y,19));y+=20;
 const offset=new Date(month+'-01T12:00:00Z').getUTCDay(),count=new Date(Date.UTC(+month.slice(0,4),+month.slice(5),0)).getUTCDate();
 for(let i=1;i<=count;i++){const date=month+'-'+String(i).padStart(2,'0'),included=inPeriod(date,start,end),a=included?data.attendance[date]?.[employee.id]:null,state=a?.absent?'absent':a?.morning&&a?.afternoon?'full':a?.morning||a?.afternoon?'half':'';const index=offset+i-1,x=pad+index%7*col,top=y+Math.floor(index/7)*cellHeight;
 ctx.fillStyle=!included?'#fafafa':state==='full'?'#e8f4eb':state==='half'?'#fff5d8':state==='absent'?'#fbeaea':'#f4f4f4';ctx.fillRect(x+2,top+2,col-5,cellHeight-5);
 text(String(i),x+12,top+29,22,included?'#262626':'#aaa',true);text(!included?'Fora':state==='full'?'Integral':state==='half'?(a?.morning?'Manhã':'Tarde'):state==='absent'?'Falta':'—',x+12,top+61,18,included?'#464646':'#aaa');
 }
 y+=Math.ceil((offset+count)/7)*cellHeight+35;
 }
 text(`${total.whole} dias inteiros · ${total.half} meios turnos · ${total.absent} faltas`,pad,y+10,22);y+=48;
 for(const line of discountLines){text(line,pad,y,21);y+=30}
 for(const line of wrap(employee.employment==='clt'?'Somente presença. Cálculo por horas realizado pelo escritório.':'Os valores respeitam a diária registrada em cada presença.')){text(line,pad,y+15,19,'#777');y+=28}
 text('Dias sem lançamento: — · Verde: integral · Amarelo: meio turno · Vermelho: falta',pad,y+22,18,'#777');
 const blob=await new Promise<Blob>((resolve,reject)=>canvas.toBlob(b=>b?resolve(b):reject(Error('Não foi possível gerar o JPEG.')),'image/jpeg',.93));
 const url=URL.createObjectURL(blob),link=document.createElement('a');link.href=url;link.download=`espelho-${employee.name.normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-zA-Z0-9]+/g,'-')}-${start}-a-${end}.jpg`;document.body.appendChild(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),60000);
}
