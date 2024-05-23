import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Root, createRoot } from "react-dom/client";
import { useBlameStore } from "../store";
import { RevisionShortData } from "../../../shared/ipc";
import { gitTimeAndTzToDate } from "../../../shared/GitTypes";
import {
  ContextMenu,
  ContextMenuItem,
  showContextMenu,
} from "../../components/ContextMenu";
import { Compartment, Text, EditorState } from "@codemirror/state";
import { languages } from "@codemirror/language-data";
import { defaultKeymap } from "@codemirror/commands";
import {
  gutter,
  GutterMarker,
  keymap,
  highlightSpecialChars,
  drawSelection,
  highlightActiveLine,
  rectangularSelection,
  crosshairCursor,
  lineNumbers,
  EditorView,
} from "@codemirror/view";
import {
  defaultHighlightStyle,
  syntaxHighlighting,
  bracketMatching,
  foldGutter,
  foldKeymap,
  LanguageDescription,
  LanguageSupport,
} from "@codemirror/language";
import {
  search,
  searchKeymap,
  highlightSelectionMatches,
} from "@codemirror/search";

export const BlameList = () => {
  const fileName = useBlameStore((state) => state.filePath);
  const fileContents = useBlameStore((state) => state.fileContents);

  const initialStartingLine = useBlameStore(
    (store) => store.options.startingLine ?? 1
  );

  const divRef = useRef<HTMLDivElement>(null);
  const [editorView, setEditorView] = useState<EditorView | null>(null);

  const langDescription = useCodeMirrorLanguage(fileName);
  const [langCompartment] = useState(() => new Compartment());
  const currentLangSupport = useRef<LanguageSupport | null>(null);
  const [langSupport, setLangSupport] = useState<LanguageSupport | null>(null);
  useEffect(() => {
    if (langDescription) {
      langDescription.load().then((langSupport) => {
        setLangSupport(langSupport);
      });
    }
  }, [langDescription]);

  useEffect(() => {
    if (!divRef.current || !fileContents.length) {
      return;
    }

    const doc = Text.of(fileContents);

    const scrollTo =
      initialStartingLine > 1
        ? EditorView.scrollIntoView(doc.line(initialStartingLine).from, {
            y: "center",
          })
        : undefined;

    const langCompartmentValue = langSupport ? [langSupport] : [];
    currentLangSupport.current = langSupport;

    const view = new EditorView({
      doc,
      extensions: [
        gutter({
          class: "blameGutter",
          lineMarker: (view, line) => {
            const index = view.state.doc.lineAt(line.from).number - 1;
            return new BlameLineGutterMarker(index);
          },
          initialSpacer: () => SpacerGutterMarker.Instance,
        }),
        lineNumbers(),
        highlightSpecialChars(),
        foldGutter(),
        drawSelection(),
        EditorState.allowMultipleSelections.of(true),
        syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
        bracketMatching(),
        rectangularSelection(),
        crosshairCursor(),
        highlightActiveLine(),
        highlightSelectionMatches(),
        search({ top: true }),
        keymap.of([...defaultKeymap, ...searchKeymap, ...foldKeymap]),
        EditorState.readOnly.of(true),
        langCompartment.of(langCompartmentValue),
      ],
      scrollTo,
      parent: divRef.current,
    });
    setEditorView(view);

    return () => {
      view.destroy();
      setEditorView(null);
    };
  }, [fileContents, langCompartment]); // Not putting langSupport here to avoid re-creating editor.

  useEffect(() => {
    if (editorView && langSupport) {
      editorView.dispatch({
        effects: [langCompartment.reconfigure(langSupport.extension)],
      });
    }
  }, [editorView, langSupport]);

  return <div className="blameList" ref={divRef} />;
};

/**
 * Choose a CodeMirror language based on the file name.
 * TODO: Consider best matching extension? Is there some existing API for this?
 */
function useCodeMirrorLanguage(fileName: string): LanguageDescription | null {
  if (!fileName) {
    return null;
  }
  return (
    languages.find((lang) =>
      lang.extensions.some((ext) => fileName.endsWith(ext))
    ) ?? null
  );
}

class BlameLineGutterMarker extends GutterMarker {
  public index: number;
  private _reactRoot: Root | undefined;

  public constructor(index: number) {
    super();
    this.index = index;
  }

  public eq(other: GutterMarker): boolean {
    return other instanceof BlameLineGutterMarker && other.index === this.index;
  }

  public toDOM?(_view: EditorView): Node {
    const outerEl = document.createElement("span");
    this._reactRoot = createRoot(outerEl);
    this._reactRoot.render(<BlameGutterRow index={this.index} />);
    return outerEl;
  }

  destroy(_dom: Node): void {
    this._reactRoot?.unmount();
  }
}

class SpacerGutterMarker extends GutterMarker {
  public static Instance = new SpacerGutterMarker();

  public eq(other: GutterMarker): boolean {
    return other instanceof SpacerGutterMarker;
  }

  public toDOM?(): Node {
    const outerEl = document.createElement("span");
    outerEl.className = "blameLineMetadata";
    return outerEl;
  }
}

const DateToday = Date.now();
const TwoDaysDurationMs = 172800000;
const OneWeekDurationMs = 604800000;
const OneMonthDurationMs = 2592000000;

interface IBlameGutterRowProps {
  index: number;
}

function BlameGutterRow({ index }: IBlameGutterRowProps) {
  const rowRevision: string | undefined = useBlameStore(
    (state) => state.revisionsByLine[index]
  );
  const rowRevShortData: RevisionShortData | undefined = useBlameStore(
    (state) => state.revisionShortData[rowRevision]
  );
  const rowSelected = useBlameStore(
    (state) => rowRevision === state.selectedRevision
  );
  const rowHovered = useBlameStore(
    (state) => rowRevision === state.hoveredRevision
  );

  const setHoveredRevision = useBlameStore((state) => state.setHoveredRevision);
  const onMouseEnter = useCallback(() => {
    if (rowSelected) {
      setHoveredRevision("");
    } else {
      setHoveredRevision(rowRevision || "");
    }
  }, [rowSelected, rowRevision, setHoveredRevision]);
  const onMouseLeave = useCallback(() => {
    setHoveredRevision("");
  }, []);

  const setSelectedRevision = useBlameStore(
    (state) => state.setSelectedRevision
  );

  const onListElementClicked = useCallback(() => {
    if (rowRevision) {
      setSelectedRevision(rowRevision);
    }
  }, [setSelectedRevision, rowRevision]);

  const onListElementContextMenu = useCallback(() => {
    if (rowRevision) {
      const previousRevision =
        useBlameStore.getState().previousRevisions[rowRevision];
      showContextMenu(
        <ContextMenu>
          {previousRevision && (
            <ContextMenuItem
              label="Blame previous revision"
              onClick={() => {
                gitjetBlame.blameOtherRevision(previousRevision);
              }}
            />
          )}
        </ContextMenu>
      );
    }
  }, [rowRevision]);

  const date = useMemo(() => {
    const time = rowRevShortData?.committer?.time;
    const tz = rowRevShortData?.committer?.tz;
    if (time && tz) {
      return gitTimeAndTzToDate(time, tz);
    }
    return null;
  }, [rowRevShortData]);

  let rowClasses = "blameLineMetadata";
  if (rowSelected) {
    rowClasses += " selected";
  }
  if (rowHovered) {
    rowClasses += " hovered";
  }

  let lineDateClasses = "blameFileLineDate";
  const dateRow = date?.getTime();
  if (dateRow) {
    const dateDiff = DateToday - dateRow;
    if (dateDiff < TwoDaysDurationMs) {
      lineDateClasses += " hottest";
    } else if (dateDiff < OneWeekDurationMs) {
      lineDateClasses += " hotter";
    } else if (dateDiff < OneMonthDurationMs) {
      lineDateClasses += " hot";
    }
  }

  return (
    <span
      className={rowClasses}
      title={rowRevShortData?.summary}
      data-index={index}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onClick={onListElementClicked}
      onContextMenu={onListElementContextMenu}
    >
      <span className="blameFileLineAuthor">
        {formatEmail(rowRevShortData?.author?.email)}
      </span>
      <span className={lineDateClasses}>{date?.toLocaleDateString()}</span>
    </span>
  );
}

function formatEmail(email: string | null | undefined): string {
  if (!email) {
    return "";
  }
  if (email.startsWith("<") && email.endsWith(">")) {
    return email.substring(1, email.length - 1);
  }
  return email;
}
