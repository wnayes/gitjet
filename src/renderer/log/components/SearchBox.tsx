import { ChangeEventHandler, KeyboardEventHandler, useCallback } from "react";
import { pauseSearch, resumeSearch, useGitStore } from "../store";
import { Button } from "../../components/Button";
import { VscDebugPause, VscDebugStart } from "react-icons/vsc";

export function SearchBox() {
  const searchText = useGitStore((state) => state.searchText);
  const searching = useGitStore((state) => state.searching);
  const setSearchText = useGitStore((state) => state.setSearchText);
  const setSearching = useGitStore((state) => state.setSearching);

  const onChange: ChangeEventHandler<HTMLInputElement> = useCallback(
    (e) => {
      setSearchText(e.target.value);
    },
    [setSearchText]
  );

  const onKeyDown: KeyboardEventHandler<HTMLInputElement> = useCallback(
    (e) => {
      if (e.key === "Enter") {
        if (searching) {
          setSearching(false);
        }

        if (searchText) {
          setSearching(true);
          gitjet.search(searchText);
        }
      }
    },
    [searchText, searching]
  );

  return (
    <div className="searchBox">
      <input
        type="text"
        value={searchText}
        onChange={onChange}
        onKeyDown={onKeyDown}
        className="searchInput"
        placeholder="Search Messages, Paths, Authors, Date"
      />
      {searching && <SearchExtras />}
    </div>
  );
}

function SearchExtras() {
  const totalRevisionCount = useGitStore((state) => state.revisionData.length);
  const currentSearchIndex = useGitStore(
    (state) => state.searchCurrentRevisionIndex
  );
  if (currentSearchIndex === -1) {
    return null;
  }

  const searchProgressText = `${currentSearchIndex} / ${totalRevisionCount}`;
  return (
    <div className="searchExtras">
      <span className="searchProgressText">{searchProgressText}</span>
      <SearchControls />
    </div>
  );
}

function SearchControls() {
  const paused = useGitStore((state) => state.searchPaused);

  const pauseResumeSearchOnClick = useCallback(() => {
    if (paused) {
      resumeSearch();
    } else {
      pauseSearch();
    }
  }, [paused]);

  return (
    <Button onClick={pauseResumeSearchOnClick} className="searchButton">
      {paused ? (
        <VscDebugStart color="green" />
      ) : (
        <VscDebugPause color="orange" />
      )}
    </Button>
  );
}
