import React, { useState } from "react";
import { useOpenAI } from "../hooks/useOpenAI";
import { useStore } from "../store/useStore";

const GPTSidebar: React.FC = () => {
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { sendMessage, messages, clearMessages } = useOpenAI();
  const { selectedFile, fileContent } = useStore();

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    setIsLoading(true);
    try {
      let contextMessage = input;

      // 如果有选中的文件，添加文件内容作为上下文
      if (selectedFile && fileContent[selectedFile]) {
        contextMessage = `当前正在编辑文件: ${selectedFile}\n\n文件内容:\n${fileContent[selectedFile]}\n\n用户问题: ${input}`;
      }

      await sendMessage(contextMessage);
      setInput("");
    } catch (error) {
      console.error("发送消息失败:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <div
        style={{
          padding: "16px",
          borderBottom: "1px solid #ccc",
          backgroundColor: "#f5f5f5",
        }}
      >
        <h3 style={{ margin: 0, fontSize: "16px" }}>AI 助手</h3>
        <button
          onClick={clearMessages}
          style={{
            marginTop: "8px",
            padding: "4px 8px",
            fontSize: "12px",
            border: "1px solid #ccc",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          清空对话
        </button>
      </div>

      <div
        style={{
          flex: 1,
          padding: "16px",
          overflowY: "auto",
          fontSize: "14px",
        }}
      >
        {messages.length === 0 ? (
          <div style={{ color: "#666", textAlign: "center", marginTop: "50px" }}>向 AI 助手提问任何关于代码的问题</div>
        ) : (
          messages.map((message, index) => (
            <div
              key={index}
              style={{
                marginBottom: "16px",
                padding: "8px",
                borderRadius: "8px",
                backgroundColor: message.role === "user" ? "#e3f2fd" : "#f5f5f5",
              }}
            >
              <div
                style={{
                  fontWeight: "bold",
                  marginBottom: "4px",
                  color: message.role === "user" ? "#1976d2" : "#666",
                }}
              >
                {message.role === "user" ? "你" : "AI"}
              </div>
              <div style={{ whiteSpace: "pre-wrap" }}>{message.content}</div>
            </div>
          ))
        )}
        {isLoading && <div style={{ textAlign: "center", color: "#666" }}>AI 正在思考中...</div>}
      </div>

      <div style={{ padding: "16px", borderTop: "1px solid #ccc" }}>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="输入问题... (Enter 发送, Shift+Enter 换行)"
          style={{
            width: "100%",
            height: "80px",
            padding: "8px",
            border: "1px solid #ccc",
            borderRadius: "4px",
            resize: "none",
            fontSize: "14px",
          }}
        />
        <button
          onClick={handleSend}
          disabled={!input.trim() || isLoading}
          style={{
            marginTop: "8px",
            width: "100%",
            padding: "8px",
            backgroundColor: isLoading ? "#ccc" : "#1976d2",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: isLoading ? "not-allowed" : "pointer",
            fontSize: "14px",
          }}
        >
          {isLoading ? "发送中..." : "发送"}
        </button>
      </div>
    </div>
  );
};

export default GPTSidebar;
