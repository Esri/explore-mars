import { BlobWriter, HttpReader, ZipReader } from "@zip.js/zip.js";

interface GltfResource {
  uri?: string;
}
interface GltfDocument {
  buffers?: GltfResource[];
  images?: GltfResource[];
}

export async function importModel(url: string) {
  const files = await readArchive(url);
  const root = [...files.entries()].find(([name]) => name.endsWith(".gltf"));
  if (!root) {
    throw new Error("The model archive does not contain a .gltf file.");
  }

  const [filename, file] = root;
  const document = JSON.parse(await file.text()) as GltfDocument;
  const directory = filename.slice(0, filename.lastIndexOf("/") + 1);
  const assetUrls: string[] = [];
  const dispose = () => {
    for (const url of assetUrls) {
      URL.revokeObjectURL(url);
    }
  };

  try {
    resolveResources(document, files, directory, assetUrls);
    const blob = new Blob([JSON.stringify(document)], { type: "model/gltf+json" });
    const url = URL.createObjectURL(blob);
    assetUrls.push(url);
    return { url, dispose };
  } catch (cause) {
    dispose();
    throw cause;
  }
}

async function readArchive(url: string) {
  const reader = new ZipReader(new HttpReader(url, { preventHeadRequest: true }));
  try {
    const entries = await reader.getEntries();
    const files = new Map<string, Blob>();
    for (const entry of entries) {
      if (entry.directory) {
        continue;
      }
      const blob = await entry.getData(new BlobWriter());
      files.set(entry.filename, blob);
    }
    return files;
  } finally {
    await reader.close();
  }
}

function resolveResources(
  document: GltfDocument,
  files: Map<string, Blob>,
  directory: string,
  assetUrls: string[],
) {
  const resources = [...(document.buffers ?? []), ...(document.images ?? [])];
  for (const resource of resources) {
    if (!resource.uri || resource.uri.startsWith("data:")) {
      continue;
    }
    const path = decodeURIComponent(resource.uri);
    const file = files.get(directory + path) ?? files.get(path);
    if (!file) {
      throw new Error(`The model archive is missing ${resource.uri}.`);
    }
    const assetUrl = URL.createObjectURL(file);
    assetUrls.push(assetUrl);
    resource.uri = assetUrl;
  }
}
