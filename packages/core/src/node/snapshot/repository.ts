import {
  readSnapshot,
  readSnapshotOrEmpty,
  withLockedMutation,
  writeSnapshot,
} from "./file";
import { SessionSnapshot } from "./types";

/**
 * File-system boundary for a single Node dev-tool session.
 *
 * The repository deliberately knows nothing about MSW handlers or runtime
 * state. It only provides validated, atomic snapshot access.
 */
export class SnapshotRepository {
  public constructor(public readonly sessionPath: string) {}

  public read(): SessionSnapshot | null {
    return readSnapshot(this.sessionPath);
  }

  public readOrEmpty(): SessionSnapshot {
    return readSnapshotOrEmpty(this.sessionPath);
  }

  public write(snapshot: SessionSnapshot): void {
    writeSnapshot(this.sessionPath, snapshot);
  }

  public mutate(
    mutate: (previous: SessionSnapshot) => SessionSnapshot
  ): SessionSnapshot {
    return withLockedMutation(this.sessionPath, mutate);
  }
}
