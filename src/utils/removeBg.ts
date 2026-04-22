/**
 * 移除图片背景
 * 使用 @imgly/background-removal 库在浏览器本地处理，无需后端
 */
export async function removeBackground(file: File): Promise<Blob> {
  try {
    // 动态引入，避免首屏阻塞
    const { removeBackground: removeBg } = await import('@imgly/background-removal');

    const resultBlob = await removeBg(file, {
      publicPath: 'https://cdn.jsdelivr.net/npm/@imgly/background-removal@1.4.5/dist/',
      output: {
        format: 'image/png',
        quality: 0.9,
      },
    });

    return resultBlob;
  } catch (err) {
    console.warn('removeBackground 失败，回退到原始图片:', err);
    // 如果移除失败，返回原始文件
    return file;
  }
}
