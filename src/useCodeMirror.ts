import type React from "react";
import { useEffect, useState, useRef } from "react";

import { EditorState, EditorSelection } from "@codemirror/state";
import {
  EditorView,
  placeholder,
  Decoration,
  WidgetType,
  ViewUpdate,
  ViewPlugin,
  DecorationSet,
} from "@codemirror/view";
import { basicSetup } from "codemirror";
import { syntaxTree } from "@codemirror/language";

import { sql } from "@codemirror/lang-sql";

interface Props {
  docContent: string;
  onChange?: (state: EditorState) => void;
}

interface ISelectionRange {
  from: number;
  to: number;
}

const useCodeMirror = <T extends Element>(
  props: Props
): [React.MutableRefObject<T | null>, EditorView?] => {
  const refContainer = useRef<T>(null);
  const [editorView, setEditorView] = useState<EditorView>();
  const { onChange, docContent } = props;
  const defaultManualSelection: ISelectionRange = {
    from: 0,
    to: 0,
  };
  const [manualSelection, setManualSelection] = useState<ISelectionRange>(
    defaultManualSelection
  );

  class ConditionButton extends WidgetType {
    constructor() {
      super();
    }

    eq(other: ConditionButton) {
      return true;
    }

    toDOM() {
      let button = document.createElement("span");
      button.innerHTML = "condition";
      button.className = "hover:cursor-pointer underline text-blue-600 text-xs";
      return button;
    }

    ignoreEvent() {
      return false;
    }
  }

  function conditionBuilder(view: EditorView) {
    let widgets: any = [];
    for (let { from, to } of view.visibleRanges) {
      syntaxTree(view.state).iterate({
        from,
        to,

        enter: (node) => {
          if (
            node.name == "UnquotedTerm" &&
            view.state.doc.sliceString(node.from, node.to) === "condition"
          ) {
            let deco = Decoration.replace({
              widget: new ConditionButton(),
              side: 1,
            });
            widgets.push(deco.range(node.from, node.to));
          }
        },
      });
    }
    return Decoration.set(widgets);
  }

  const conditionBuilderPlugin = ViewPlugin.fromClass(
    class {
      decorations: DecorationSet;

      constructor(view: EditorView) {
        this.decorations = conditionBuilder(view);
      }

      update(update: ViewUpdate) {
        if (update.docChanged || update.viewportChanged)
          this.decorations = conditionBuilder(update.view);
      }
    },
    {
      decorations: (v) => v.decorations,

      eventHandlers: {
        mousedown: (e, view) => {
          let target = e.target as HTMLElement;
          if (target.nodeName == "SPAN" && target.innerHTML === "condition")
            return conditionClickHandler(view, view.posAtDOM(target));
        },
      },
    }
  );

  function conditionClickHandler(view: EditorView, pos: number) {
    setManualSelection({
      from: pos,
      to: pos + 9,
    });
    view.dispatch({
      selection: EditorSelection.create(
        [EditorSelection.range(pos, pos + 9)],
        1
      ),
    });
    return true;
  }

  useEffect(() => {
    if (!refContainer.current) return;

    const startState = EditorState.create({
      doc: docContent,
      extensions: [
        placeholder(
          "Your metric definition(SQL) comes here, you need not include table, group or split. \n You just have to give the calculation part eg: countDistinct(field_name)"
        ),
        basicSetup,
        conditionBuilderPlugin,
        EditorView.updateListener.of((update) => {
          if (update.docChanged) {
            onChange && onChange(update.state);
          }
        }),
        EditorView.theme(
          {
            "&": {
              color: "#737373",
              backgroundColor: "#FAFAF9",
            },
            ".cm-content": {
              caretColor: "#EF4444",
            },
            "&.cm-focused .cm-cursor": {
              borderLeftColor: "#0e9",
            },
            "&.cm-activeLine  .cm-line": {
              backgroundColor: "#FAFAF9",
            },

            "&.cm-focused .cm-selectionBackground, ::selection": {
              backgroundColor: "#FB923C",
            },
            ".cm-gutters": {
              backgroundColor: "#F3F4F6",
              color: "#737373",
              border: "none",
            },
            ".cm-cursor": {
              borderLeftColor: "#EF4444",
            },
          },
          { dark: true }
        ),
      ],
    });

    const view = new EditorView({
      state: startState,
      parent: refContainer.current,
    });
    setEditorView(view);

    return () => {
      view.destroy();
    };
  }, [refContainer]);

  return [refContainer, editorView];
};

export default useCodeMirror;
