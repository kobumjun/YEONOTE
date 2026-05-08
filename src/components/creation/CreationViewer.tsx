"use client";

import { useMemo } from "react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import htmlDocx from "html-docx-js/dist/html-docx";
import type { CreationType, DocumentContent, ImageContent, PresentationContent } from "@/types/template";
import { Button } from "@/components/ui/button";

export function CreationViewer({
  title,
  type,
  content,
}: {
  title: string;
  type: CreationType;
  content: unknown;
}) {
  const docContent = useMemo(
    () => ((type === "document" ? content : { html: "" }) ?? { html: "" }) as DocumentContent,
    [content, type]
  );
  const presentationContent = useMemo(
    () => ((type === "presentation" ? content : { slides: [] }) ?? { slides: [] }) as PresentationContent,
    [content, type]
  );
  const imageContent = useMemo(
    () => ((type === "image" ? content : { imageUrl: "" }) ?? { imageUrl: "" }) as ImageContent,
    [content, type]
  );

  async function exportDocumentDocx() {
    if (type !== "document") return;
    const blob = htmlDocx.asBlob(docContent.html ?? "<p></p>");
    downloadBlob(blob, `${title}.docx`);
  }

  async function exportDocumentPdf() {
    if (type !== "document") return;
    const el = document.getElementById("document-preview");
    if (!el) return;
    const canvas = await html2canvas(el, { scale: 2 });
    const img = canvas.toDataURL("image/png");
    const pdf = new jsPDF("p", "pt", "a4");
    const width = 540;
    const height = (canvas.height * width) / canvas.width;
    pdf.addImage(img, "PNG", 30, 30, width, height);
    pdf.save(`${title}.pdf`);
  }

  async function exportPresentationPptx() {
    if (type !== "presentation") return;
    const res = await fetch("/api/export/pptx", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, slides: presentationContent.slides ?? [] }),
    });
    if (!res.ok) return;
    const j = await res.json();
    if (typeof j.pptxBase64 === "string") {
      const bytes = Uint8Array.from(atob(j.pptxBase64), (c) => c.charCodeAt(0));
      const blob = new Blob([bytes], { type: "application/vnd.openxmlformats-officedocument.presentationml.presentation" });
      downloadBlob(blob, j.filename || `${title}.pptx`);
    }
  }

  if (type === "document") {
    return (
      <div className="mx-auto max-w-4xl p-6">
        <div className="mb-4 flex gap-2">
          <Button variant="outline" onClick={() => void exportDocumentDocx()}>Download DOCX</Button>
          <Button variant="outline" onClick={() => void exportDocumentPdf()}>Download PDF</Button>
          <Button variant="outline" onClick={() => downloadText(docContent.html ?? "", `${title}.txt`)}>Download TXT</Button>
        </div>
        <article id="document-preview" className="prose max-w-none rounded-xl border bg-card p-8" dangerouslySetInnerHTML={{ __html: docContent.html ?? "" }} />
      </div>
    );
  }

  if (type === "presentation") {
    return (
      <div className="mx-auto max-w-5xl p-6">
        <div className="mb-4">
          <Button variant="outline" onClick={() => void exportPresentationPptx()}>Download PPTX</Button>
        </div>
        <div className="space-y-4">
          {(presentationContent.slides ?? []).map((slide, i) => (
            <section key={`${slide.title}-${i}`} className="rounded-xl border bg-card p-6">
              <h2 className="text-xl font-semibold">{i + 1}. {slide.title}</h2>
              <ul className="mt-3 list-disc space-y-1 pl-6">
                {(slide.bullets ?? []).map((b, idx) => <li key={`${i}-${idx}`}>{b}</li>)}
              </ul>
              {slide.notes ? <p className="mt-3 text-sm text-muted-foreground">Notes: {slide.notes}</p> : null}
            </section>
          ))}
        </div>
      </div>
    );
  }

  if (type === "image") {
    return (
      <div className="mx-auto max-w-5xl p-6">
        <div className="mb-4">
          <Button variant="outline" onClick={() => downloadUrl(imageContent.imageUrl, `${title}.png`)}>Download image</Button>
        </div>
        <img src={imageContent.imageUrl} alt={title} className="w-full rounded-xl border bg-card object-contain" />
      </div>
    );
  }

  return null;
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  downloadUrl(url, filename);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function downloadUrl(url: string, filename: string) {
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
}

function downloadText(text: string, filename: string) {
  const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
  downloadBlob(blob, filename);
}
