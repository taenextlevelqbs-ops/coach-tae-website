import { AccountError } from '../accounts/http';
export async function boundedVideo(request: Request, expected: number) {
  if (request.headers.get('content-type') !== 'video/mp4' || expected < 1 || expected>4194304) throw new AccountError(415,'MP4_REQUIRED');
  const length=request.headers.get('content-length');
  if (length && Number(length)!==expected) throw new AccountError(422,'SIZE_MISMATCH');
  const reader=request.body?.getReader();if(!reader)throw new AccountError(400,'INVALID_BODY');
  const chunks:Uint8Array[]=[];let size=0;
  try { for(;;){const next=await reader.read();if(next.done)break;size+=next.value.byteLength;if(size>expected || size>4194304){await reader.cancel();throw new AccountError(413,'VIDEO_TOO_LARGE');}chunks.push(next.value);} }
  finally { reader.releaseLock(); }
  if(size!==expected)throw new AccountError(422,'SIZE_MISMATCH');
  const bytes=new Uint8Array(size);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.byteLength;}
  if(bytes.length<12 || new TextDecoder().decode(bytes.slice(4,8))!=='ftyp')throw new AccountError(422,'INVALID_MP4');
  return bytes;
}
export function byteRange(header:string|null,size:number){
 if(!header)return{start:0,end:size-1,partial:false};
 const match=/^bytes=(\d*)-(\d*)$/.exec(header);
 if(!match || (!match[1]&&!match[2]))throw new AccountError(416,'INVALID_RANGE');
 let start=match[1]?Number(match[1]):Math.max(0,size-Number(match[2]));
 const end=match[1]&&match[2]?Math.min(Number(match[2]),size-1):size-1;
 if(!Number.isSafeInteger(start)||!Number.isSafeInteger(end)||start<0||start>=size||end<start || (!match[1]&&Number(match[2])<=0))throw new AccountError(416,'INVALID_RANGE');
 start=Math.max(0,start);return{start,end,partial:true};
}
