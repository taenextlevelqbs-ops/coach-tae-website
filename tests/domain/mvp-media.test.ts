// @vitest-environment node
import { expect,it } from 'vitest';
import { execFileSync } from 'node:child_process';
import { mkdtemp,readFile,writeFile,rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { inspect,processFilm } from '../../scripts/qb-lab/media-process.mjs';
it('decodes a synthetic clip, strips source metadata/audio and produces bounded playable H.264',async()=>{
 const folder=await mkdtemp(join(tmpdir(),'qb-codec-test-'));
 try{
  const input=join(folder,'source.mp4'),output=join(folder,'processed.mp4');
  execFileSync('ffmpeg',['-nostdin','-v','error','-f','lavfi','-i','color=c=black:s=64x64:r=10','-f','lavfi','-i','sine=frequency=220:sample_rate=8000','-t','1','-c:v','libx264','-threads','1','-pix_fmt','yuv420p','-c:a','aac','-metadata','title=SYNTHETIC_SOURCE_METADATA','-y',input]);
  const result=await processFilm(input,output);expect(result.duration).toBeGreaterThan(0);expect(result.duration).toBeLessThanOrEqual(1.1);
  const metadata=JSON.parse(execFileSync('ffprobe',['-v','error','-show_streams','-show_format','-of','json',output],{encoding:'utf8'}));
  expect(metadata.streams.filter((s:{codec_type:string})=>s.codec_type==='audio')).toHaveLength(0);expect(metadata.streams[0].codec_name).toBe('h264');expect(metadata.format.tags?.title).toBeUndefined();
  const bytes=await readFile(input);await writeFile(join(folder,'oversized.mp4'),Buffer.concat([bytes,Buffer.alloc(4194304)]));await expect(inspect(join(folder,'oversized.mp4'))).rejects.toThrow('MEDIA_REJECTED');
 }finally{await rm(folder,{recursive:true,force:true});}
},20000);
it('rejects non-video data and leaves the worker disabled without isolated staging approval',async()=>{
 const folder=await mkdtemp(join(tmpdir(),'qb-codec-invalid-'));
 try{const file=join(folder,'invalid.mp4');await writeFile(file,'synthetic text, not a video');await expect(inspect(file)).rejects.toThrow();}finally{await rm(folder,{recursive:true,force:true});}
 expect(()=>execFileSync(process.execPath,['scripts/qb-lab/media-worker.mjs'],{cwd:process.cwd(),env:{...process.env,QB_LAB_MEDIA_WORKER_STAGE:'disabled'},stdio:'pipe'})).toThrow();
});
