/**
 * 使用 Anthropic Claude API 分析图片，返回建议的背景色、图标色和标签
 */

interface AIAnalyzeResult {
  backgroundColor: string;
  iconColor: string;
  label: string;
}

export async function analyzeImageWithAI(dataURL: string): Promise<AIAnalyzeResult | null> {
  try {
    // 从 dataURL 中提取 base64 数据和媒体类型
    const matches = dataURL.match(/^data:([^;]+);base64,(.+)$/);
    if (!matches) {
      console.warn('Invalid dataURL format');
      return null;
    }

    const mediaType = matches[1] as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp';
    const base64Data = matches[2];

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image',
                source: {
                  type: 'base64',
                  media_type: mediaType,
                  data: base64Data,
                },
              },
              {
                type: 'text',
                text: `分析这张图片，然后返回一个 JSON 对象（不要有任何其他文字，只返回 JSON），包含以下字段：
- backgroundColor: 一个适合作为 iOS 控制中心模块背景的颜色，使用 rgba() 格式，透明度约 0.85，应该与图片主色调协调
- iconColor: 图标文字颜色，根据背景色选择 "#FFFFFF" 或 "#000000" 或其他合适颜色以确保对比度
- label: 图片内容的简短中文描述，不超过4个字，适合作为模块标签（如果是常见应用图标就写应用名称）

示例返回格式：
{"backgroundColor":"rgba(74, 144, 226, 0.85)","iconColor":"#FFFFFF","label":"天气"}

只返回 JSON，不要其他内容。`,
              },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      console.warn('Anthropic API error:', response.status);
      return null;
    }

    const data = await response.json();
    const text = data.content?.[0]?.text || '';

    // 尝试解析 JSON
    try {
      // 移除可能的 markdown 代码块包裹
      const cleaned = text.replace(/```json\n?|\n?```/g, '').trim();
      const result = JSON.parse(cleaned);

      return {
        backgroundColor: result.backgroundColor || 'rgba(102, 126, 234, 0.85)',
        iconColor: result.iconColor || '#FFFFFF',
        label: result.label || '',
      };
    } catch (parseErr) {
      console.warn('Failed to parse AI response:', text);
      return null;
    }
  } catch (err) {
    console.warn('analyzeImageWithAI error:', err);
    return null;
  }
}
