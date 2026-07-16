"use client";

import { useState } from "react";
import { FileDown, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import type { ProjectReport } from "@/lib/reports";
import { TASK_STATUSES } from "@/lib/constants";

const STATUS_LABEL: Record<string, string> = {
  backlog: "Backlog",
  inprogress: "In Progress",
  review: "Review",
  done: "Done",
};

const INK = "#18181b";
const MUTED = "#71717a";
const RULE = "#e4e4e7";
const ACCENT = "#18181b";
const ACCENT_RGB: [number, number, number] = [24, 24, 27];
const SOFT_BG = "#f4f4f5";
const ZEBRA_RGB: [number, number, number] = [250, 250, 250];

function buildSummary(r: ProjectReport): string {
  const done = r.taskCounts.done ?? 0;
  const inProgress = r.taskCounts.inprogress ?? 0;
  const parts: string[] = [];

  parts.push(
    `${r.project.name} is currently in the ${r.project.stage} stage with ${r.progressPct}% overall completion across ${r.totalTasks} tracked task${r.totalTasks === 1 ? "" : "s"}.`
  );

  if (r.totalTasks > 0) {
    parts.push(`${done} task${done === 1 ? " is" : "s are"} complete and ${inProgress} currently in progress.`);
  }

  parts.push(
    r.overdueTasks.length > 0
      ? `${r.overdueTasks.length} task${r.overdueTasks.length === 1 ? " is" : "s are"} overdue and require attention.`
      : "No tasks are currently overdue."
  );

  parts.push(
    r.totalRisks > 0
      ? `${r.totalRisks} risk${r.totalRisks === 1 ? " has" : "s have"} been logged, including ${r.riskCounts.high} rated high severity.`
      : "No risks have been logged for this project."
  );

  if (r.daysToDue !== null) {
    parts.push(
      r.daysToDue < 0
        ? `The project due date has passed by ${Math.abs(r.daysToDue)} day${Math.abs(r.daysToDue) === 1 ? "" : "s"}.`
        : `The project is due in ${r.daysToDue} day${r.daysToDue === 1 ? "" : "s"}.`
    );
  }

  return parts.join(" ");
}

export function ExportPdfButton({ report, generatedBy }: { report: ProjectReport; generatedBy: string }) {
  const [loading, setLoading] = useState(false);

  async function handleExport() {
    setLoading(true);
    try {
      const [{ default: jsPDF }, { autoTable }] = await Promise.all([
        import("jspdf"),
        import("jspdf-autotable"),
      ]);

      const doc = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 48;
      const contentWidth = pageWidth - margin * 2;
      let y = margin;

      function ensureSpace(needed: number) {
        if (y + needed > pageHeight - 56) {
          doc.addPage();
          y = margin;
        }
      }

      function sectionHeading(title: string) {
        ensureSpace(28);
        doc.setDrawColor(ACCENT);
        doc.setFillColor(ACCENT);
        doc.rect(margin, y, 3, 14, "F");
        doc.setFont("helvetica", "bold");
        doc.setFontSize(12);
        doc.setTextColor(INK);
        doc.text(title, margin + 10, y + 11);
        y += 24;
      }

      y += 14;

      // Letterhead
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(MUTED);
      doc.text("BOWMAN HUB", margin, y);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      const generatedAt = new Date().toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
      doc.text(`Generated ${generatedAt}`, pageWidth - margin, y, { align: "right" });
      y += 8;
      doc.setDrawColor(RULE);
      doc.line(margin, y, pageWidth - margin, y);
      y += 28;

      doc.setFont("helvetica", "bold");
      doc.setFontSize(20);
      doc.setTextColor(INK);
      doc.text("Project Status Report", margin, y);
      y += 22;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(13);
      doc.setTextColor(MUTED);
      const titleLines = doc.splitTextToSize(report.project.name, contentWidth);
      doc.text(titleLines, margin, y);
      y += titleLines.length * 16 + 4;

      doc.setFontSize(9);
      doc.text(`Prepared by ${generatedBy} · Stage: ${report.project.stage}`, margin, y);
      y += 24;

      // Project overview table
      sectionHeading("Project Overview");
      autoTable(doc, {
        startY: y,
        margin: { left: margin, right: margin },
        theme: "plain",
        styles: { fontSize: 9.5, cellPadding: { top: 4, bottom: 4, left: 0, right: 8 }, textColor: INK },
        columnStyles: { 0: { fontStyle: "bold", cellWidth: 130, textColor: MUTED }, 1: { cellWidth: "auto" } },
        body: [
          ["Owner", report.owner?.name ?? "—"],
          ["Team size", String(report.team.length)],
          ["Start date", report.project.startDate || "—"],
          ["Due date", report.project.dueDate || "—"],
          [
            "Schedule",
            report.daysToDue === null
              ? "—"
              : report.daysToDue < 0
                ? `${Math.abs(report.daysToDue)} day(s) overdue`
                : `${report.daysToDue} day(s) remaining`,
          ],
        ],
      });
      y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 12;

      // Overall progress — visual bar
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9.5);
      doc.setTextColor(MUTED);
      doc.text("OVERALL PROGRESS", margin, y);
      doc.setTextColor(INK);
      doc.text(`${report.progressPct}%`, pageWidth - margin, y, { align: "right" });
      y += 8;
      const barHeight = 8;
      doc.setFillColor(SOFT_BG);
      doc.roundedRect(margin, y, contentWidth, barHeight, 3, 3, "F");
      const filledWidth = Math.max(barHeight, (contentWidth * Math.min(100, Math.max(0, report.progressPct))) / 100);
      doc.setFillColor(...ACCENT_RGB);
      doc.roundedRect(margin, y, filledWidth, barHeight, 3, 3, "F");
      y += barHeight + 24;

      // Executive summary — shaded callout
      sectionHeading("Executive Summary");
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      const summaryLines = doc.splitTextToSize(buildSummary(report), contentWidth - 24);
      const boxHeight = summaryLines.length * 14 + 20;
      ensureSpace(boxHeight);
      doc.setFillColor(SOFT_BG);
      doc.roundedRect(margin, y, contentWidth, boxHeight, 4, 4, "F");
      doc.setTextColor(INK);
      doc.text(summaryLines, margin + 12, y + 16, { lineHeightFactor: 1.4 });
      y += boxHeight + 20;

      // Task breakdown
      sectionHeading(`Task Breakdown (${report.totalTasks})`);
      if (report.totalTasks === 0) {
        doc.setFont("helvetica", "italic");
        doc.setFontSize(10);
        doc.setTextColor(MUTED);
        doc.text("No tasks recorded.", margin, y);
        y += 20;
      } else {
        autoTable(doc, {
          startY: y,
          margin: { left: margin, right: margin },
          theme: "grid",
          headStyles: { fillColor: [24, 24, 27], textColor: 255, fontSize: 9 },
          alternateRowStyles: { fillColor: ZEBRA_RGB },
          styles: { fontSize: 9.5, textColor: INK },
          head: [["Status", "Count", "% of total"]],
          body: TASK_STATUSES.map((s) => {
            const count = report.taskCounts[s];
            const pct = report.totalTasks ? Math.round((count / report.totalTasks) * 100) : 0;
            return [STATUS_LABEL[s], String(count), `${pct}%`];
          }),
        });
        y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 20;
      }

      // Risk summary
      sectionHeading(`Risk Summary (${report.totalRisks})`);
      if (report.totalRisks === 0) {
        doc.setFont("helvetica", "italic");
        doc.setFontSize(10);
        doc.setTextColor(MUTED);
        doc.text("No risks logged.", margin, y);
        y += 20;
      } else {
        autoTable(doc, {
          startY: y,
          margin: { left: margin, right: margin },
          theme: "grid",
          headStyles: { fillColor: [24, 24, 27], textColor: 255, fontSize: 9 },
          alternateRowStyles: { fillColor: ZEBRA_RGB },
          styles: { fontSize: 9, textColor: INK },
          head: [["Description", "Category", "Level", "Owner"]],
          body: report.risks.map((r) => [
            r.description,
            r.category || "—",
            r.level.charAt(0).toUpperCase() + r.level.slice(1),
            report.team.find((m) => m.id === r.ownerId)?.name ?? "—",
          ]),
        });
        y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 20;
      }

      // Team
      sectionHeading(`Team (${report.team.length})`);
      if (report.team.length === 0) {
        doc.setFont("helvetica", "italic");
        doc.setFontSize(10);
        doc.setTextColor(MUTED);
        doc.text("No members assigned.", margin, y);
        y += 20;
      } else {
        autoTable(doc, {
          startY: y,
          margin: { left: margin, right: margin },
          theme: "grid",
          headStyles: { fillColor: [24, 24, 27], textColor: 255, fontSize: 9 },
          alternateRowStyles: { fillColor: ZEBRA_RGB },
          styles: { fontSize: 9.5, textColor: INK },
          head: [["Name", "Role"]],
          body: report.team.map((m) => [m.name, m.role]),
        });
        y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 20;
      }

      // Task detail
      sectionHeading("Task Detail");
      if (report.tasks.length === 0) {
        doc.setFont("helvetica", "italic");
        doc.setFontSize(10);
        doc.setTextColor(MUTED);
        doc.text("No tasks recorded.", margin, y);
      } else {
        autoTable(doc, {
          startY: y,
          margin: { left: margin, right: margin },
          theme: "grid",
          headStyles: { fillColor: [24, 24, 27], textColor: 255, fontSize: 9 },
          alternateRowStyles: { fillColor: ZEBRA_RGB },
          styles: { fontSize: 9, textColor: INK },
          head: [["Task", "Owner", "Status", "Progress", "Due"]],
          body: report.tasks.map((t) => [
            t.title,
            report.team.find((m) => m.id === t.ownerId)?.name ?? "Unassigned",
            STATUS_LABEL[t.status] ?? t.status,
            `${t.progress}%`,
            t.dueDate || "—",
          ]),
        });
      }

      // Brand accent bar + footer on every page
      const pageCount = doc.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFillColor(...ACCENT_RGB);
        doc.rect(0, 0, pageWidth, 6, "F");
        doc.setDrawColor(RULE);
        doc.line(margin, pageHeight - 40, pageWidth - margin, pageHeight - 40);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.setTextColor(MUTED);
        doc.text("Bowman Hub — Confidential", margin, pageHeight - 26);
        doc.text(`Page ${i} of ${pageCount}`, pageWidth - margin, pageHeight - 26, { align: "right" });
      }

      const slug = report.project.name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
      doc.save(`${slug || "project"}-report-${new Date().toISOString().slice(0, 10)}.pdf`);
    } catch (err) {
      console.error("PDF export failed", err);
      toast.error(err instanceof Error ? `Couldn't export PDF: ${err.message}` : "Couldn't export PDF.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button variant="outline" size="sm" onClick={handleExport} disabled={loading}>
      {loading ? <Loader2 className="animate-spin" /> : <FileDown />}
      {loading ? "Exporting…" : "Export PDF"}
    </Button>
  );
}
