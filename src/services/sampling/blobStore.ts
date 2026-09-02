function storeBlob(blob: Blob, id: number) {
  saveBlob(blob, id);
  return globalThis.URL.createObjectURL(blob);
}

function saveBlob(blob: Blob, id: number) {
  const reader = new FileReader();
  reader.addEventListener("loadend", (_event: ProgressEvent) => {
    if (typeof (reader.result) === "string") {
      localStorage.setItem(`audioBlob_${id}`, reader.result);
    }
  });
  reader.readAsDataURL(blob);
}

async function loadBlob(id: number) {
  const existingBlobStr = localStorage.getItem(`audioBlob_${id}`);
  if (existingBlobStr) {
    const res = await fetch(existingBlobStr);
    const blob = await res.blob();
    return globalThis.URL.createObjectURL(blob);
  }
}

function deleteBlob(id: number) {
  localStorage.removeItem(`audioBlob_${id}`);
}

function loadDataUrl(id: number) {
  return localStorage.getItem(`audioBlob_${id}`) ?? undefined;
}

function replaceDataUrls(dataUrls: Map<number, string>, ids: Array<number>) {
  const existing = new Map(ids.map((id) => [id, loadDataUrl(id)]));

  try {
    ids.forEach((id) => {
      const dataUrl = dataUrls.get(id);
      if (dataUrl) {
        localStorage.setItem(`audioBlob_${id}`, dataUrl);
      } else {
        deleteBlob(id);
      }
    });
  } catch (error) {
    existing.forEach((dataUrl, id) => {
      if (dataUrl) localStorage.setItem(`audioBlob_${id}`, dataUrl);
      else deleteBlob(id);
    });
    throw error;
  }
}

const BlobService = {
  storeBlob,
  loadBlob,
  deleteBlob,
  loadDataUrl,
  replaceDataUrls,
};

export default BlobService;
