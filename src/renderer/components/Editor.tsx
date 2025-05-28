import React, { useRef, useEffect } from 'react'
import MonacoEditor from '@monaco-editor/react'
import { useAppStore } from '../store/appStore'
import type { editor } from 'monaco-editor'

// 声明 monaco 全局变量
declare global {
  const monaco: typeof import('monaco-editor')
}

const Editor: React.FC = () => {
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null)
  const { tabs, activeTabId, updateTabContent, saveTab, theme } = useAppStore()

  const activeTab = tabs.find(tab => tab.id === activeTabId)

  const handleEditorDidMount = (
    editor: editor.IStandaloneCodeEditor,
    monaco: typeof import('monaco-editor')
  ) => {
    editorRef.current = editor

    // 添加保存快捷键
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      if (activeTabId) {
        saveTab(activeTabId)
      }
    })

    // 设置编辑器主题
    monaco.editor.setTheme(theme === 'dark' ? 'vs-dark' : 'vs')
  }

  const handleEditorChange = (value: string | undefined) => {
    if (activeTabId && value !== undefined) {
      updateTabContent(activeTabId, value)
    }
  }

  useEffect(() => {
    if (editorRef.current) {
      // 当主题变化时更新编辑器主题
      const monaco = (window as any).monaco
      if (monaco) {
        monaco.editor.setTheme(theme === 'dark' ? 'vs-dark' : 'vs')
      }
    }
  }, [theme])

  if (!activeTab) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center text-gray-500 dark:text-gray-400">
          <div className="text-6xl mb-4">📝</div>
          <h2 className="text-xl font-semibold mb-2">欢迎使用 JetIDE</h2>
          <p className="text-sm">打开文件开始编辑，或创建新文件</p>
          <div className="mt-4 text-xs">
            <p>快捷键：</p>
            <p>Cmd/Ctrl + N - 新建文件</p>
            <p>Cmd/Ctrl + O - 打开文件</p>
            <p>Cmd/Ctrl + S - 保存文件</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col">
      <MonacoEditor
        height="100%"
        language={activeTab.language || 'plaintext'}
        value={activeTab.content}
        onChange={handleEditorChange}
        onMount={handleEditorDidMount}
        theme={theme === 'dark' ? 'vs-dark' : 'vs'}
        options={{
          fontSize: 14,
          fontFamily: 'JetBrains Mono, Consolas, Monaco, monospace',
          lineNumbers: 'on',
          minimap: { enabled: true },
          scrollBeyondLastLine: false,
          automaticLayout: true,
          tabSize: 2,
          insertSpaces: true,
          wordWrap: 'off',
          cursorSmoothCaretAnimation: 'on',
          smoothScrolling: true,
          contextmenu: true,
          mouseWheelZoom: true,
          multiCursorModifier: 'ctrlCmd',
          formatOnPaste: true,
          formatOnType: true,
        }}
      />
    </div>
  )
}

export default Editor
