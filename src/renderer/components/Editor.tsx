import React, { useEffect, useRef } from "react";
import * as monaco from "monaco-editor";
import { useStore } from "../store/useStore";

const Editor: React.FC = () => {
  const editorRef = useRef<HTMLDivElement>(null);
  const monacoRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
  const { selectedFile, fileContent, setFileContent } = useStore();

  useEffect(() => {
    if (editorRef.current && !monacoRef.current) {
      monacoRef.current = monaco.editor.create(editorRef.current, {
        value: "",
        language: "typescript",
        theme: "vs-dark",
        fontSize: 14,
        wordWrap: "on",
        automaticLayout: true,
      });

      monacoRef.current.onDidChangeModelContent(() => {
        if (monacoRef.current && selectedFile) {
          const content = monacoRef.current.getValue();
          setFileContent(selectedFile, content);
        }
      });
    }

    return () => {
      if (monacoRef.current) {
        monacoRef.current.dispose();
        monacoRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (monacoRef.current && selectedFile) {
      const content = fileContent[selectedFile] || "";
      monacoRef.current.setValue(content);

      // 根据文件扩展名设置语言
      const extension = selectedFile.split(".").pop();
      let language = "typescript";
      switch (extension) {
        case "js":
          language = "javascript";
          break;
        case "tsx":
        case "ts":
          language = "typescript";
          break;
        case "json":
          language = "json";
          break;
        case "md":
          language = "markdown";
          break;
        case "css":
          language = "css";
          break;
        case "html":
          language = "html";
          break;
      }
      monaco.editor.setModelLanguage(monacoRef.current.getModel()!, language);
    }
  }, [selectedFile, fileContent]);

  if (!selectedFile) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: "100%",
          color: "#666",
          fontSize: "18px",
        }}
      >
        请选择一个文件来编辑
      </div>
    );
  }

  return (
    <div style={{ height: "100%" }}>
      <div
        style={{
          padding: "8px 16px",
          borderBottom: "1px solid #ccc",
          backgroundColor: "#f5f5f5",
          fontSize: "14px",
        }}
      >
        {selectedFile}
      </div>
      <div ref={editorRef} style={{ height: "calc(100% - 40px)" }} />
    </div>
  );
};

export default Editor;
