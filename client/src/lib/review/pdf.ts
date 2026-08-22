/**
 * Course Review Platform — shared pdf.js setup.
 * Importing this module wires the worker once for every consumer.
 */
import { getDocument, GlobalWorkerOptions } from "pdfjs-dist";
import pdfWorkerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";

GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

export { getDocument };
export type { PDFDocumentProxy, RenderTask } from "pdfjs-dist";

/** Reads how many pages a PDF has (used at upload/replace time). */
export async function countPdfPages(file: File): Promise<number> {
  const bytes = await file.arrayBuffer();
  const task = getDocument({ data: bytes });
  const doc = await task.promise;
  const n = doc.numPages;
  await task.destroy();
  return n;
}
