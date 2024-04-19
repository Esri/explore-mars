/* Copyright 2023 Esri
 *
 * Licensed under the Apache License Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import * as zip from "@zip.js/zip.js";

interface BlobZIPEntry {
  name: string;
  url: string;
  blob: Blob;
}

export async function importModel(url: string): Promise<string> {
  const entries = await downloadAndExtractZip(url);
  const blobEntries = await zipEntriesToBlob(entries);
  const gltfBlob = await combineToSingleBlob(blobEntries);

  return gltfBlob.url;
}

async function downloadAndExtractZip(url: string): Promise<zip.Entry[]> {
  const zipReader = new zip.ZipReader(
    new zip.HttpReader(url, { preventHeadRequest: true }),
  );
  const entries = await zipReader.getEntries();

  return entries;
}

async function zipEntriesToBlob(entries: zip.Entry[]) {
  entries = entries.filter((entry) => !entry.directory);

  // we want to aggregate all of the promises, so we do not want to await them
  // eslint-disable-next-line @typescript-eslint/promise-function-async
  const promises = entries.map((entry) =>
    saveEntryToBlob(entry).then((blob) => {
      return blob;
    }),
  );

  const blobEntries = await Promise.all(promises);

  return blobEntries.filter((entry): entry is BlobZIPEntry => entry != null);
}

async function saveEntryToBlob(
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

async function combineToSingleBlob(
  entries: BlobZIPEntry[],
): Promise<BlobZIPEntry> {
  const rootEntry = entries.find((entry) => entry.name.match(/\.gltf$/));

  if (rootEntry == null) {
    return await Promise.reject("Can not find a .gltf file in ZIP archive");
  }

  const assets: Record<string, string> = {};
  for (const entry of entries) {
    assets[entry.name] = entry.url;
  }

  const reader = new FileReader();

  return await new Promise((resolve, reject) => {
    reader.onload = () => {
      try {
        const gltfJson = JSON.parse(reader.result as string);

        // Replace original buffers and images by blob URLs
        const buffers = gltfJson.buffers ?? [];
        for (const buffer of buffers) {
          buffer.uri = assets[buffer.uri];
        }

        const images = gltfJson.images ?? [];
        for (const image of images) {
          image.uri = assets[image.uri];
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
