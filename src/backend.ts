let client:any;
export function setClient(value:any){client=value}
export async function loadState(){const {data,error}=await client.rpc('get_rnh_state');if(error)throw new Error(error.code==='42501'?'Seu acesso ainda não foi liberado para a RNH.':error.message);return data}
export async function saveState(data:any,revision:number){const result=await client.rpc('save_rnh_state',{new_payload:data,expected_revision:revision});if(result.error)throw new Error(result.error.message.includes('RNH_CONFLICT')?'Os dados mudaram em outro aparelho. Recarregue a tela antes de salvar.':result.error.message);return result.data}
