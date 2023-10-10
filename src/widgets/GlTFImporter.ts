interface BlobZIPEntry {
  name: string;
  url: string;
  blob: Blob;
}

interface ZIPEntry {
  directory: boolean;
  filename: string;
  getData: (writer: any, onFinished: (_: any) => void) => void;
}

const ZIP_PROGRESS_FACTOR = 0.5;

export default class GlTFImporter {
  public progress = 0;

  public task = "start";

  private readonly zip = (window as any).zip;

  constructor(public onProgress = () => {}) {}

  public async import(url: string): Promise<string> {
    if (this.task !== "start" && this.task !== "done") {
      return await Promise.reject("Already importing glTF");
    }

    const entries = await this.downloadAndExtractZip(url);
    const blobEntries = await this.zipEntriesToBlob(entries);
    const gltfBlob = await this.combineToSingleBlob(blobEntries);

    this.reportProgress("done", 1);

    return gltfBlob.url;
  }

  private async downloadAndExtractZip(url: string): Promise<ZIPEntry[]> {
    return await new Promise((resolve, reject) => {
      const reader = new this.zip.HttpProgressReader(url, {
        onProgress: this.reportDownloadProgress.bind(this),
      });
      this.zip.createReader(
        reader,
        (zipReader: any) => {
          zipReader.getEntries(resolve);
        },
        reject,
      );
    });
  }

  private async zipEntriesToBlob(entries: ZIPEntry[]) {
    entries = entries.filter((entry) => !entry.directory);

    // const progress = (currentIndex, totalIndex)

    let completedBlobs = 0;

    const promises = entries.map(async (entry) =>
      // eslint-disable-next-line @typescript-eslint/return-await
      this.saveEntryToBlob(entry).then((blob) => {
        this.reportUnzipProgress(entries.length, ++completedBlobs);
        return blob;
      }),
    );

    return await Promise.all(promises);
  }

  private async saveEntryToBlob(entry: ZIPEntry): Promise<BlobZIPEntry> {
    return await new Promise((resolve, reject) => {
      entry.getData(new this.zip.BlobWriter("text/plain"), (data: any) => {
        const url = window.URL.createObjectURL(data);
        resolve({
          name: entry.filename,
          url,
          blob: data,
        });
      });
    });
  }

  private async combineToSingleBlob(
    entries: BlobZIPEntry[],
  ): Promise<BlobZIPEntry> {
    const rootEntry = entries.find((entry) => entry.name.match(/\.gltf$/));

    if (rootEntry == null) {
      return await Promise.reject("Can not find a .gltf file in ZIP archive");
    }
    const assets = entries.reduce<Record<string, string>>((previous, entry) => {
      previous[entry.name] = entry.url;
      return previous;
    }, {});
    const reader = new FileReader();

    return await new Promise((resolve, reject) => {
      reader.onload = () => {
        try {
          const gltfJson = JSON.parse(reader.result as string);

          // Replace original buffers and images by blob URLs
          if (Object.prototype.hasOwnProperty.call(gltfJson, "buffers")) {
            gltfJson.buffers.forEach(
              (buffer: any) => (buffer.uri = assets[buffer.uri]),
            );
          }

          if (
            Object.prototype.hasOwnProperty.call(
              gltfJson.hasOwnProperty,
              "images",
            )
          ) {
            gltfJson.images.forEach(
              (image: any) => (image.uri = assets[image.uri]),
            );
          }

          const gltfContent = JSON.stringify(gltfJson, null, 2);
          const gltfBlob = new Blob([gltfContent], { type: "text/plain" });
          const gltfUrl = window.URL.createObjectURL(gltfBlob);
          resolve({
            name: rootEntry.name,
            url: gltfUrl,
            blob: gltfBlob,
          });
        } catch (e) {
          reject(e);
        }
      };

      // Read initial blob
      reader.readAsText(rootEntry.blob);
    });
  }

  private reportDownloadProgress(event: any) {
    const value = (event.loaded / event.total) * (1 - ZIP_PROGRESS_FACTOR);
    this.reportProgress("download", value);
  }

  private reportUnzipProgress(total: number, completed: number) {
    const value =
      ZIP_PROGRESS_FACTOR + (completed / total) * ZIP_PROGRESS_FACTOR;
    this.reportProgress("unzip", value);
  }

  private reportProgress(task: string, value: number) {
    this.task = task;
    value = Math.floor(100 * value);
    if (value >= this.progress) {
      this.progress = value;
    }
    this.onProgress();
  }
}
