import { exec } from "child_process";
import { promisify } from "util";
import * as path from "path";
import * as fs from "fs";

const execAsync = promisify(exec);

export interface WatermarkOptions {
  inputPath: string;
  outputPath?: string;
  text?: string;
  fontSize?: number;
  opacity?: number;
  position?: "bottom-center" | "bottom-right" | "bottom-left" | "top-center";
}

/**
 * Add a watermark to a video using FFmpeg
 * @param options Watermark configuration options
 * @returns Path to the watermarked video
 */
export async function addWatermark(options: WatermarkOptions): Promise<string> {
  const {
    inputPath,
    outputPath,
    text = "MakeMyDogTalk.com",
    fontSize = 24,
    opacity = 0.3,
    position = "bottom-center",
  } = options;

  // Check if input file exists
  if (!fs.existsSync(inputPath)) {
    throw new Error(`Input video file not found: ${inputPath}`);
  }

  // Generate output path if not provided
  const finalOutputPath = outputPath || inputPath.replace('.mp4', '_watermarked.mp4');

  // Calculate text position based on option
  let xPosition: string;
  let yPosition: string;

  switch (position) {
    case "bottom-center":
      xPosition = "(w-text_w)/2";
      yPosition = "h-th-40";
      break;
    case "bottom-right":
      xPosition = "w-text_w-20";
      yPosition = "h-th-40";
      break;
    case "bottom-left":
      xPosition = "20";
      yPosition = "h-th-40";
      break;
    case "top-center":
      xPosition = "(w-text_w)/2";
      yPosition = "20";
      break;
    default:
      xPosition = "(w-text_w)/2";
      yPosition = "h-th-40";
  }

  // Build FFmpeg command
  // Using drawtext filter to add text overlay
  const ffmpegCommand = `ffmpeg -i "${inputPath}" -vf "drawtext=text='${text}':fontcolor=white@${opacity}:fontsize=${fontSize}:x=${xPosition}:y=${yPosition}" -codec:a copy "${finalOutputPath}"`;

  console.log(`Adding watermark to video: ${inputPath}`);
  console.log(`Watermark text: "${text}"`);
  console.log(`Output: ${finalOutputPath}`);

  try {
    const { stdout, stderr } = await execAsync(ffmpegCommand);

    if (stderr && !stderr.includes('frame=')) {
      // FFmpeg writes progress to stderr, only log if it's not progress info
      console.log('FFmpeg stderr:', stderr);
    }

    // Verify output file was created
    if (!fs.existsSync(finalOutputPath)) {
      throw new Error('Watermarked video file was not created');
    }

    const stats = fs.statSync(finalOutputPath);
    console.log(`Watermarked video created: ${finalOutputPath} (${stats.size} bytes)`);

    return finalOutputPath;
  } catch (error: any) {
    console.error('FFmpeg watermarking error:', error);

    // Check if FFmpeg is installed
    try {
      await execAsync('ffmpeg -version');
    } catch {
      throw new Error('FFmpeg is not installed. Please install FFmpeg: brew install ffmpeg');
    }

    throw new Error(`Failed to add watermark: ${error.message}`);
  }
}

/**
 * Check if FFmpeg is available on the system
 * @returns True if FFmpeg is installed
 */
export async function isFFmpegAvailable(): Promise<boolean> {
  try {
    await execAsync('ffmpeg -version');
    return true;
  } catch {
    return false;
  }
}
