import path from "path";

export class FileSystem {
  protected static cachedInstance: FileSystem;

  static getInstance() {
    if (!this.cachedInstance) {
      this.cachedInstance = new FileSystem();
    }
    return this.cachedInstance;
  }

  protected get util() {
    return require("util") as typeof import("util");
  }

  protected get fs() {
    return require("fs") as typeof import("fs");
  }

  protected get mkdir() {
    return this.util.promisify(this.fs.mkdir);
  }

  protected get readFile() {
    return this.util.promisify(this.fs.readFile);
  }

  protected get writeFile() {
    return this.util.promisify(this.fs.writeFile);
  }

  protected get unlink() {
    return this.util.promisify(this.fs.unlink);
  }

  protected ensureAbsolute(filePath: string) {
    if (!path.isAbsolute(filePath)) {
      throw new Error(
        `GraphQL Nexus: Expected an absolute path, saw ${filePath}`
      );
    }
    return filePath;
  }

  getFile(fileName: string) {
    return this.readFile(this.ensureAbsolute(fileName), "utf8");
  }

  /**
   * Unlinks & writes a new file - useful when we are generating the
   * type definitions, as this causes the ts server to know the file has changed.
   * @param path
   * @param toSave
   */
  async replaceFile(filePath: string, toSave: string) {
    if (this.fs.existsSync(this.ensureAbsolute(filePath))) {
      await this.unlink(filePath);
    }
    const dirName = path.dirname(filePath);
    if (!this.fs.existsSync(dirName)) {
      await this.mkdir(dirName, { recursive: true });
    }
    await this.writeFile(filePath, toSave);
  }
}
