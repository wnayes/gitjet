# gitjet

_Under Construction_ :construction:

Fast Git GUI

## Log

A log viewer that prioritizes lazy loading as much data as possible to speed up
initial display.

    # Display log based on current working directory worktree
    gitjet log

    # Display log based on the given folder
    gitjet log [folder]

    # Display log for the given file
    gitjet log [filepath]

    # Display for the folder/file in the given branch
    gitjet log [folder | filepath] [branch]

## Blame

A simple blame viewer. Currently takes data directly from
`git blame --incremental` and presents it in a GUI.

    # Blame a file at HEAD
    gitjet blame [filepath]

    # Blame a file starting at a revision
    gitjet blame [revision] [filepath]

    # Blame with a focus on a given line (1-based index)
    gitjet blame -L 123 [filepath]

## License

[MIT](LICENSE.md)
