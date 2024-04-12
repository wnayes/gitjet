import { useLayoutEffect } from "react";
import { BlameList } from "./BlameList";
import { useBlameStore } from "../store";

export const App = () => {
  const setFileContents = useBlameStore((state) => state.setFileContents);
  const applyBlameData = useBlameStore((state) => state.applyBlameData);

  useLayoutEffect(() => {
    gitjetBlame.onReceiveFileContents((content) => {
      const fileLines = content.split("\n");
      setFileContents(fileLines);
    });
    gitjetBlame.onReceiveBlameData((blameData) => {
      applyBlameData(blameData);
    });
    gitjetBlame.ready();
  }, []);

  return (
    <div className="app">
      <BlameList />
    </div>
  );
};
