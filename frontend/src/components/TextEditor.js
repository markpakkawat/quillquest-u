import React, { forwardRef, useImperativeHandle } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Highlight from '@tiptap/extension-highlight';
import '../assets/css/components/TextEditor.css';

const TextEditor = forwardRef(({ initialContent, onContentChange, className = '', editorStyles }, ref) => {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Highlight.configure({ 
        multicolor: true,
        HTMLAttributes: {
          class: 'highlight',
        },
      }),
    ],
    content: initialContent,
    onUpdate: ({ editor }) => {
      onContentChange(editor.getHTML());
    },
  });

  useImperativeHandle(ref, () => ({
    editor,
  }));

  return (
    <div className={`text-editor-wrapper ${className}`} style={editorStyles}>
      <EditorContent editor={editor} />
    </div>
  );
});

export default TextEditor;