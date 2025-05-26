import React, { useState } from "react";
import { useStore } from "../store/useStore";

interface FileNode {
  name: string;
  type: "file" | "directory";
  path: string;
  children?: FileNode[];
}

const FileTree: React.FC = () => {
  const { setSelectedFile } = useStore();
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());

  // 模拟文件树数据
  const mockFileTree: FileNode[] = [
    {
      name: "src",
      type: "directory",
      path: "src",
      children: [
        { name: "App.tsx", type: "file", path: "src/App.tsx" },
        { name: "index.tsx", type: "file", path: "src/index.tsx" },
      ],
    },
    { name: "package.json", type: "file", path: "package.json" },
    { name: "README.md", type: "file", path: "README.md" },
  ];

  const toggleFolder = (path: string) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(path)) {
      newExpanded.delete(path);
    } else {
      newExpanded.add(path);
    }
    setExpandedFolders(newExpanded);
  };

  const handleFileClick = (filePath: string) => {
    setSelectedFile(filePath);
  };

  const renderNode = (node: FileNode, level: number = 0) => (
    <div key={node.path} style={{ marginLeft: `${level * 16}px` }}>
      <div
        style={{
          padding: "4px 8px",
          cursor: "pointer",
          fontSize: "14px",
        }}
        onClick={() => {
          if (node.type === "directory") {
            toggleFolder(node.path);
          } else {
            handleFileClick(node.path);
          }
        }}
      >
        {node.type === "directory" ? (
          <span>
            {expandedFolders.has(node.path) ? "📂" : "📁"} {node.name}
          </span>
        ) : (
          <span>📄 {node.name}</span>
        )}
      </div>
      {node.type === "directory" && expandedFolders.has(node.path) && node.children?.map((child) => renderNode(child, level + 1))}
    </div>
  );

  return (
    <div style={{ padding: "8px" }}>
      <h3 style={{ margin: "0 0 16px 0", fontSize: "16px" }}>文件资源管理器</h3>
      {mockFileTree.map((node) => renderNode(node))}
    </div>
  );
};

export default FileTree;
