type UploadProgressHandler = (percent: number) => void;

type UploadFileToPresignedUrlInput = {
  uploadUrl: string;
  file: File;
  headers: Record<string, string>;
  onProgress?: UploadProgressHandler;
};

export async function uploadFileToPresignedUrl({
  uploadUrl,
  file,
  headers,
  onProgress,
}: UploadFileToPresignedUrlInput): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", uploadUrl);

    for (const [headerName, headerValue] of Object.entries(headers)) {
      xhr.setRequestHeader(headerName, headerValue);
    }

    xhr.upload.onprogress = (event) => {
      if (!event.lengthComputable || !onProgress) {
        return;
      }

      onProgress(Math.round((event.loaded / event.total) * 100));
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve();
        return;
      }

      reject(new Error(`Upload failed with status ${xhr.status}.`));
    };

    xhr.onerror = () => {
      reject(new Error("Upload failed due to a network error."));
    };

    xhr.send(file);
  });
}
