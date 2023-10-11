import * as zip from "@zip.js/zip.js";

interface BlobZIPEntry {
  name: string;
  url: string;
  blob: Blob;
}

const ZIP_PROGRESS_FACTOR = 0.5;

export default class GlTFImporter {
  public progress = 0;

  public task = "start";

  // private readonly zip = (window as any).zip;

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

  private async downloadAndExtractZip(url: string): Promise<zip.Entry[]> {
    const zipReader = new zip.ZipReader(
      new zip.HttpReader(url, { preventHeadRequest: true }),
    );
    const entries = await zipReader.getEntries({
      onprogress: async (loaded, total, entries) => {
        this.reportDownloadProgress({
          loaded,
          total,
          entries,
        });
      },
    });

    return entries;
  }

  private async zipEntriesToBlob(entries: zip.Entry[]) {
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

    const blobEntries = await Promise.all(promises);

    return blobEntries.filter((entry): entry is BlobZIPEntry => entry != null);
  }

  private async saveEntryToBlob(
    entry: zip.Entry,
  ): Promise<BlobZIPEntry | undefined> {
    const dataBlobWriter = new zip.BlobWriter("text/plain");
    const data = await entry.getData?.(dataBlobWriter);
    if (data != null) {
      const url = URL.createObjectURL(data);
      return {
        name: entry.filename,
        blob: data,
        url,
      };
    }
  }

  private async combineToSingleBlob(
    entries: BlobZIPEntry[],
  ): Promise<BlobZIPEntry> {
    const rootEntry = entries.find((entry) => entry.name.match(/\.gltf$/));

    if (rootEntry == null) {
      return await Promise.reject("Can not find a .gltf file in ZIP archive");
    }
    const assets = entries.reduce<Record<string, string>>((record, entry) => {
      record[entry.name] = entry.url;
      return record;
    }, {});
    const reader = new FileReader();

    return await new Promise((resolve, reject) => {
      reader.onload = () => {
        try {
          const gltfJson = JSON.parse(reader.result as string);

          // Replace original buffers and images by blob URLs
          const buffers = gltfJson.buffers ?? [];
          for (const buffer of buffers) {
            buffer.uri = assets[buffer.uri]
          }

          const images = gltfJson.images ?? [];
          for (const image of images) {
            image.uri = assets[image.uri]
          }

          const gltfContent = JSON.stringify(gltfJson, null, 2);
          const gltfBlob = new Blob([gltfContent], { type: "text/plain" });
          const gltfUrl = URL.createObjectURL(gltfBlob);
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
