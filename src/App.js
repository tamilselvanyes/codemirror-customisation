import React, { useRef, useEffect } from "react";
import { EditorView, basicSetup } from "@codemirror/basic-setup";
import { sql } from "@codemirror/lang-sql";
import { showHint, sqlHint } from "@codemirror/sql-hint";

import "@codemirror/basic-setup/lib/basic-setup.css";
import "@codemirror/lang-sql/sql.css";

function App() {
  const editorRef = useRef(null);

  useEffect(() => {
    const editor = new EditorView({
      state: EditorState.create({
        doc: "",
        extensions: [basicSetup, sql(), showHint(), sqlHint()],
      }),
      parent: editorRef.current,
    });

    // Register a hint function to provide suggestions
    editor.contentDOM.addEventListener("keydown", (event) => {
      if (event.key === " ") {
        showHint({
          hint: sqlHint,
        })(editor);
      }
    });
  }, []);

  return <div ref={editorRef} />;
}

export default App;
