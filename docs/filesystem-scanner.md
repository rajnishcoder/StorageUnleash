# Filesystem Scanner Specification

## Scanner Objectives
- Fast, non-blocking asynchronous directory traversal.
- Accurate file size and allocated size calculation.
- Hierarchical `FileNode` tree generation.
- Rate-limited progress throttling (prevent IPC saturation).
- Robust error tolerance (permission denied, broken symlinks, transient locks).
- Responsive cancellation token support.

## Symlink Handling Strategy
- Detect symbolic links using `lstat`.
- In V1, avoid following directory symlinks into external recursive loops to prevent double counting and infinite cycles.
- Symlinks are recorded as link nodes with target metadata.

## Progress Emission
- Batched progress updates at regular intervals (e.g., 50-100ms) to ensure smooth 60fps UI rendering without overwhelming Electron IPC serialization queues.
