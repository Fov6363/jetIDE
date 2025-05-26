import React from "react";
import FileTree from "./components/FileTree";
import Editor from "./components/Editor";
import GPTSidebar from "./components/GPTSidebar";
import { useStore } from "./store/useStore";

const App: React.FC = () => {
  const { selectedFile } = useStore();

  return (
    <div className="app" style={{ display: "flex", height: "100vh" }}>
      <div className="file-tree" style={{ width: "250px", borderRight: "1px solid #ccc" }}>
        <FileTree />
      </div>
      <div className="editor" style={{ flex: 1 }}>
        <Editor />
      </div>
      <div className="gpt-sidebar" style={{ width: "300px", borderLeft: "1px solid #ccc" }}>
        <GPTSidebar />
      </div>
    </div>
  );
};

export default App;
