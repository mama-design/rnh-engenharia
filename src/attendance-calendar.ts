export type DayRecord={morning?:boolean,afternoon?:boolean,absent?:boolean};
export function attendanceDayStatus(date:string,today:string,records?:Record<string,DayRecord>):'recorded'|'pending'|'neutral'{
 if(date>today)return 'neutral';
 if(Object.values(records??{}).some(r=>r.morning||r.afternoon||r.absent))return 'recorded';
 const weekday=new Date(date+'T12:00:00Z').getUTCDay();
 return date<today&&weekday>=1&&weekday<=5?'pending':'neutral';
}
