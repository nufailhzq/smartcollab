import { prisma } from "@/lib/prisma";

export type PendingReport = Awaited<
  ReturnType<typeof getPendingFolioReports>
>[number];

/**
 * Pending Folio post reports for the admin moderation queue. Groups by post
 * so the admin sees one card per reported post with all reporters/reasons
 * stacked. Posts whose reports are all RESOLVED don't appear.
 */
export async function getPendingFolioReports() {
  const reports = await prisma.folioPostReport.findMany({
    where: { status: "PENDING" },
    orderBy: { createdAt: "desc" },
    include: {
      reporter: {
        select: { id: true, name: true, matricNum: true, role: true },
      },
      post: {
        include: {
          author: {
            select: { id: true, name: true, matricNum: true, role: true },
          },
          images: { orderBy: { position: "asc" } },
          _count: { select: { reactions: true, comments: true } },
        },
      },
    },
  });
  return reports;
}

export async function getResolvedFolioReports(take = 30) {
  return prisma.folioPostReport.findMany({
    where: { status: "RESOLVED" },
    orderBy: { createdAt: "desc" },
    take,
    include: {
      reporter: { select: { id: true, name: true, matricNum: true } },
    },
  });
}
