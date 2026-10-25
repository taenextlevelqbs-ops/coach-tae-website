import { expect,it } from 'vitest';
import { boundedVideo,byteRange } from '@/server/qb-lab/mvp/http';
import { mvpGates } from '@/server/qb-lab/mvp/config';
it('keeps media and minor onboarding off unless explicit isolated staging gates are approved',()=>{
 expect(mvpGates({})).toEqual({media:false,onboarding:false});
 const gates={QB_LAB_ACCOUNTS_STAGE:'synthetic-staging',QB_LAB_MEDIA_STAGE:'approved-synthetic',QB_LAB_MINOR_ONBOARDING:'approved-synthetic'};
 expect(mvpGates(gates)).toEqual({media:true,onboarding:true});expect(mvpGates({...gates,VERCEL_ENV:'production'})).toEqual({media:false,onboarding:false});
});
it('accepts bounded MP4 intake but never treats a signature as full media validation',async()=>{
 const bytes=new Uint8Array([0,0,0,20,102,116,121,112,105,115,111,109]);
 const req=new Request('https://stage.example',{method:'POST',headers:{'Content-Type':'video/mp4'},body:bytes});
 expect(await boundedVideo(req,12)).toEqual(bytes);
 await expect(boundedVideo(new Request('https://stage.example',{method:'POST',headers:{'Content-Type':'video/mp4'},body:'not a video!'}),12)).rejects.toThrow('INVALID_MP4');
 await expect(boundedVideo(new Request('https://stage.example',{method:'POST',headers:{'Content-Type':'video/mp4'},body:bytes}),5)).rejects.toThrow('VIDEO_TOO_LARGE');
 await expect(boundedVideo(new Request('https://stage.example',{method:'POST',headers:{'Content-Type':'text/plain'},body:bytes}),12)).rejects.toThrow('MP4_REQUIRED');
});
it('implements private single-range playback without accepting unbounded or multiple ranges',()=>{
 expect(byteRange(null,100)).toEqual({start:0,end:99,partial:false});expect(byteRange('bytes=10-19',100)).toEqual({start:10,end:19,partial:true});expect(byteRange('bytes=-10',100)).toEqual({start:90,end:99,partial:true});expect(byteRange('bytes=90-',100)).toEqual({start:90,end:99,partial:true});
 for(const range of ['bytes=200-','bytes=9-2','bytes=0-1,4-5','bytes=-0','bytes=-','bytes=NaN-'])expect(()=>byteRange(range,100)).toThrow('INVALID_RANGE');
});
