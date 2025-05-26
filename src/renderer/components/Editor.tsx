import React, { useRef, useEffect } from 'react'
import { Editor as MonacoEditor } from '@monaco-editor/react'
import { useAppStore } from '../store/appStore'

const Editor: React.FC = () => {
  const { tabs, activeTabId, updateTabContent, theme, settings } = useAppStore()
  const editorRef = useRef<any>(null)

  const activeTab = tabs.find(tab => tab.id === activeTabId)

  useEffect(() => {
    if (editorRef.current) {
      // 配置编辑器选项
      editorRef.current.updateOptions({
        fontSize: settings.fontSize,
        fontFamily: settings.fontFamily,
        tabSize: settings.tabSize,
        insertSpaces: settings.insertSpaces,
        wordWrap: settings.wordWrap ? 'on' : 'off',
        minimap: { enabled: settings.minimap },
      })
    }
  }, [settings])

  const handleEditorDidMount = (editor: any) => {
    editorRef.current = editor
    
    // 配置编辑器
    editor.updateOptions({
      fontSize: settings.fontSize,
      fontFamily: settings.fontFamily,
      tabSize: settings.tabSize,
      insertSpaces: settings.insertSpaces,
      wordWrap: settings.wordWrap ? 'on' : 'off',
      minimap: { enabled: settings.minimap },
      automaticLayout: true,
      scrollBeyondLastLine: false,
      renderWhitespace: 'selection',
      cursorBlinking: 'smooth',
      cursorSmoothCaretAnimation: true,
    })

    // 添加快捷键
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      if (activeTab) {
        useAppStore.getState().saveTab(activeTab.id)
      }
    })
  }

  const handleEditorChange = (value: string | undefined) => {
    if (activeTab && value !== undefined) {
      updateTabContent(activeTab.id, value)
    }
  }

  if (!activeTab) {
    return (
      <div className="flex items-center justify-center h-full bg-white dark:bg-gray-900">
        <div className="text-center text-gray-500 dark:text-gray-400">
          <div className="text-4xl mb-2">📝</div>
          <p>选择一个文件开始编辑</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full">
      <MonacoEditor
        height="100%"
        language={activeTab.language}
        value={activeTab.content}
        theme={theme === 'dark' ? 'vs-dark' : 'light'}
        onChange={handleEditorChange}
        onMount={handleEditorDidMount}
        options={{
          selectOnLineNumbers: true,
          roundedSelection: false,
          readOnly: false,
          cursorStyle: 'line',
          automaticLayout: true,
          scrollBeyondLastLine: false,
          renderWhitespace: 'selection',
          cursorBlinking: 'smooth',
          cursorSmoothCaretAnimation: true,
        }}
      />
    </div>
  )
}

export default Editor 