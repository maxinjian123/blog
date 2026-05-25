const sharp = require('sharp');
const path = require('path');

/**
 * NSFW 检测工具
 *
 * 当前实现为基础版：通过图像属性检测（如尺寸、颜色分布等）
 * 可扩展为接入第三方 NSFW API（如 Google Vision、AWS Rekognition 等）
 */

// 可疑的皮肤色调范围（HSV 空间）
const SKIN_TONE_RANGES = [
  { hMin: 0, hMax: 50, sMin: 20, sMax: 70 },
  { hMin: 0, hMax: 30, sMin: 15, sMax: 80 }
];

/**
 * 检测图片是否包含不合适内容
 * @param {Buffer} imageBuffer - 图片 buffer
 * @param {string} mimetype - 图片 MIME 类型
 * @returns {Promise<{safe: boolean, score: number, reason: string|null}>}
 */
async function detectNSFW(imageBuffer, mimetype) {
  try {
    // 只检测图片类型
    if (!mimetype || !mimetype.startsWith('image/')) {
      return { safe: true, score: 0, reason: null };
    }

    // 获取图片元数据和像素信息
    const metadata = await sharp(imageBuffer).metadata();
    const { width, height, format } = metadata;

    // 无效尺寸 → 不安全
    if (!width || !height || width < 10 || height < 10) {
      return { safe: false, score: 1, reason: '无效的图片尺寸' };
    }

    // 极度细长的图片可能是恶意内容 → 不安全
    const aspectRatio = width / height;
    if (aspectRatio > 20 || aspectRatio < 0.05) {
      return { safe: false, score: 0.9, reason: '异常的宽高比' };
    }

    // 基础像素分析：采样图片边缘像素做肤色检测
    let skinPixelCount = 0;
    let totalSampledPixels = 0;
    let score = 0;

    try {
      // 缩小图片用于快速采样
      const resized = await sharp(imageBuffer)
        .resize(100, 100, { fit: 'inside' })
        .raw()
        .toBuffer({ resolveWithObject: true });

      const pixels = resized.data;
      const channels = resized.info.channels || 3;
      totalSampledPixels = Math.floor(pixels.length / channels);

      for (let i = 0; i < pixels.length; i += channels) {
        const r = pixels[i];
        const g = pixels[i + 1];
        const b = pixels[i + 2];

        // RGB 转 HSV 简化的肤色检测
        if (isSkinPixel(r, g, b)) {
          skinPixelCount++;
        }
      }

      const skinRatio = skinPixelCount / totalSampledPixels;

      // 太高比例的肤色 → 可能存在 NSFW 内容
      if (skinRatio > 0.7) {
        score = Math.min(1, skinRatio);
        return {
          safe: false,
          score: Math.round(score * 100) / 100,
          reason: `肤色像素占比过高 (${Math.round(skinRatio * 100)}%)，疑似不当内容`
        };
      }
    } catch {
      // 像素分析失败，降级通过
      return { safe: true, score: 0, reason: null };
    }

    return { safe: true, score: 0, reason: null };
  } catch (err) {
    // 检测失败时放行（避免误拦截正常图片）
    console.warn('[NSFW] 检测失败，放行:', err.message);
    return { safe: true, score: 0, reason: '检测服务异常，已放行' };
  }
}

/**
 * 简化的肤色像素检测（RGB → HSV）
 */
function isSkinPixel(r, g, b) {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);

  if (max === 0) return false;

  const delta = max - min;

  // 计算 Hue（简化）
  let h = 0;
  if (delta !== 0) {
    if (max === r) {
      h = 60 * (((g - b) / delta) % 6);
    } else if (max === g) {
      h = 60 * (((b - r) / delta) + 2);
    } else {
      h = 60 * (((r - g) / delta) + 4);
    }
  }

  // 计算 Saturation
  const s = max === 0 ? 0 : delta / max;

  // 肤色检测条件
  // 1. 红色分量占主导
  if (r <= g || r <= b) return false;

  // 2. 饱和度不能太低（排除灰色/白色）
  if (s < 0.1) return false;

  // 3. 饱和度不能太高
  if (s > 0.8) return false;

  // 4. Hue 在肤色范围内
  if (h < 0 || h > 50) return false;

  // 5. RGB 值在合理范围内
  if (r < 60 || r > 255 || g < 20 || g > 220 || b < 10 || b > 200) return false;

  return true;
}

module.exports = { detectNSFW };