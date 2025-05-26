import { create } from "zustand";
import { devtools } from "zustand/middleware";

interface FileState {
  selectedFile: string | null;
  fileContent: Record<string, string>;
  openFiles: string[];
  isFileTreeExpanded: boolean;
}

interface FileActions {
  setSelectedFile: (filePath: string) => void;
  setFileContent: (filePath: string, content: string) => void;
  addOpenFile: (filePath: string) => void;
  removeOpenFile: (filePath: string) => void;
  toggleFileTree: () => void;
  clearAllFiles: () => void;
}

type Store = FileState & FileActions;

export const useStore = create<Store>()(
  devtools(
    (set, get) => ({
      // 初始状态
      selectedFile: null,
      fileContent: {},
      openFiles: [],
      isFileTreeExpanded: true,

      // Actions
      setSelectedFile: (filePath: string) => {
        set(
          (state) => {
            // 如果文件不在打开列表中，添加它
            if (!state.openFiles.includes(filePath)) {
              return {
                selectedFile: filePath,
                openFiles: [...state.openFiles, filePath],
              };
            }
            return { selectedFile: filePath };
          },
          false,
          "setSelectedFile"
        );
      },

      setFileContent: (filePath: string, content: string) => {
        set(
          (state) => ({
            fileContent: {
              ...state.fileContent,
              [filePath]: content,
            },
          }),
          false,
          "setFileContent"
        );
      },

      addOpenFile: (filePath: string) => {
        set(
          (state) => {
            if (!state.openFiles.includes(filePath)) {
              return {
                openFiles: [...state.openFiles, filePath],
              };
            }
            return state;
          },
          false,
          "addOpenFile"
        );
      },

      removeOpenFile: (filePath: string) => {
        set(
          (state) => {
            const newOpenFiles = state.openFiles.filter((file) => file !== filePath);
            const newSelectedFile = state.selectedFile === filePath ? (newOpenFiles.length > 0 ? newOpenFiles[newOpenFiles.length - 1] : null) : state.selectedFile;

            return {
              openFiles: newOpenFiles,
              selectedFile: newSelectedFile,
            };
          },
          false,
          "removeOpenFile"
        );
      },

      toggleFileTree: () => {
        set(
          (state) => ({
            isFileTreeExpanded: !state.isFileTreeExpanded,
          }),
          false,
          "toggleFileTree"
        );
      },

      clearAllFiles: () => {
        set(
          {
            selectedFile: null,
            fileContent: {},
            openFiles: [],
          },
          false,
          "clearAllFiles"
        );
      },
    }),
    {
      name: "jet-ide-store", // 存储名称，用于开发工具
    }
  )
);
