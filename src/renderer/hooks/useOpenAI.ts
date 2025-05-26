import { useState, useCallback } from "react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export const useOpenAI = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim()) return;

    const userMessage: Message = { role: "user", content };
    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    try {
      // 这里应该调用实际的 OpenAI API
      // 目前使用模拟响应
      const response = await mockOpenAICall(content);

      const assistantMessage: Message = { role: "assistant", content: response };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error("OpenAI API 调用失败:", error);
      const errorMessage: Message = {
        role: "assistant",
        content: "抱歉，AI 服务暂时不可用。请稍后再试。",
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  return {
    messages,
    isLoading,
    sendMessage,
    clearMessages,
  };
};

// 模拟 OpenAI API 调用
const mockOpenAICall = async (message: string): Promise<string> => {
  // 模拟网络延迟
  await new Promise((resolve) => setTimeout(resolve, 1000 + Math.random() * 2000));

  // 简单的模拟响应
  const responses = [
    `针对您的问题"${message.substring(
      0,
      50
    )}..."，我建议您可以尝试以下方法：\n\n1. 检查代码语法是否正确\n2. 确保所有依赖项都已正确安装\n3. 查看控制台是否有错误信息\n\n如果问题仍然存在，请提供更多详细信息。`,
    `关于"${message.substring(0, 30)}..."的问题，这是一个很好的问题！\n\n我建议您查看相关文档或考虑以下解决方案...\n\n（注意：这是一个模拟响应，实际使用时需要配置真实的 OpenAI API）`,
    `我理解您想要了解"${message.substring(0, 40)}..."。\n\n这类问题通常可以通过以下步骤解决：\n- 分析问题的根本原因\n- 查找相关的最佳实践\n- 逐步实施解决方案\n\n需要更具体的帮助吗？`,
  ];

  return responses[Math.floor(Math.random() * responses.length)];
};

// 实际的 OpenAI API 调用函数（需要配置 API Key）
/*
const callOpenAI = async (messages: Message[]): Promise<string> => {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.REACT_APP_OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'gpt-3.5-turbo',
      messages: messages,
      max_tokens: 1000,
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    throw new Error('OpenAI API 请求失败');
  }

  const data = await response.json();
  return data.choices[0].message.content;
};
*/
