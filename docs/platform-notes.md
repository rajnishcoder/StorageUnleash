# Platform Notes

## macOS
- **Window Presentation**: Configured with `titleBarStyle: 'hiddenInset'` and custom traffic light positioning.
- **Permissions**: Respect macOS Full Disk Access (TCC) and sandbox boundaries; gracefully present permission errors when protected folders (e.g. `~/Library/Application Support/com.apple.TCC`, `~/Downloads`) need user authorization.
- **File Manager**: Reveal action invokes macOS Finder via `shell.showItemInFolder`.
- **Trash**: Moves items to macOS Trash via native Electron `shell.trashItem`.

## Windows
- **Paths**: Correct handling of drive letters (`C:\`), UNC paths, and Windows backslashes (`\`).
- **File Manager**: Reveal action invokes Windows File Explorer.
- **Recycle Bin**: Moves items to Windows Recycle Bin via native Electron `shell.trashItem`.
- **Junctions & Symlinks**: Junction points and NTFS symlinks are identified and handled safely without infinite loops.
