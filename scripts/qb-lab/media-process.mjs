import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { stat } from 'node:fs/promises';
const exec = promisify(execFile);
export async function inspect(file) {
  const { stdout } = await exec('ffprobe', ['-v','error','-protocol_whitelist','file,pipe','-show_streams','-show_format','-of','json',file], { timeout: 10000, maxBuffer: 262144 });
  const metadata = JSON.parse(stdout); const video = metadata.streams?.find(s => s.codec_type === 'video');
  const duration = Number(metadata.format?.duration); const rate = video?.avg_frame_rate?.split('/').map(Number); const fps = rate ? rate[0]/rate[1] : NaN;
  if (!video || !['h264','hevc','mpeg4'].includes(video.codec_name) || !Number.isFinite(duration) || duration<=0 || duration>60 || !(video.width>0 && video.width<=1920) || !(video.height>0 && video.height<=1080) || !Number.isFinite(fps) || fps<=0 || fps>60 || (await stat(file)).size>4194304) throw new Error('MEDIA_REJECTED');
  return { duration, width: video.width, height: video.height };
}
export async function processFilm(source, destination) {
  await inspect(source);
  await exec('ffmpeg', ['-nostdin','-v','error','-protocol_whitelist','file,pipe','-threads','1','-i',source,'-map','0:v:0','-map_metadata','-1','-an','-sn','-dn','-filter_threads','1','-vf',"scale='min(1280,iw)':'min(720,ih)':force_original_aspect_ratio=decrease:force_divisible_by=2",'-c:v','libx264','-threads','1','-preset','fast','-crf','28','-pix_fmt','yuv420p','-movflags','+faststart','-t','60','-y',destination], { timeout: 60000, maxBuffer: 262144 });
  return inspect(destination);
}
