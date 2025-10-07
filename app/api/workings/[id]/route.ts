import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getUserId } from "@/lib/auth";
import { lodgeWorkSchema, parseMeetingDate } from "../shared";

const partialSchema = lodgeWorkSchema.partial().extend({
  work: lodgeWorkSchema.shape.work.optional(),
});

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const userId = getUserId();
  if (!userId) return new NextResponse("Unauthorized", { status: 401 });
  const id = params?.id;
  if (!id) return new NextResponse("Not found", { status: 404 });
  try {
    const body = await req.json();
    const parsed = partialSchema.safeParse(body);
    if (!parsed.success)
      return new NextResponse("Invalid input", { status: 400 });
    const d = parsed.data;
    let meetingDate: Date | undefined;
    try {
      meetingDate = d.meetingDate ? parseMeetingDate(d.meetingDate) : undefined;
    } catch {
      return new NextResponse("Invalid meeting date", { status: 400 });
    }
    const month = meetingDate
      ? meetingDate.getMonth() + 1
      : d.month ?? undefined;
    const year = meetingDate ? meetingDate.getFullYear() : d.year ?? undefined;
    if (!month || !year) {
      return new NextResponse("Month and year are required", { status: 400 });
    }
    const updated = await db.lodgeWork.update({
      where: { id, userId },
      data: {
        meetingDate: meetingDate ?? null,
        month,
        year,
        ...(d.work ? { work: d.work } : {}),
        ...("candidateName" in d
          ? { candidateName: d.candidateName ?? null }
          : {}),
        ...("grandLodgeVisit" in d
          ? { grandLodgeVisit: d.grandLodgeVisit ?? false }
          : {}),
        ...("lecture" in d ? { lecture: d.lecture ?? null } : {}),
        ...("tracingBoard1" in d
          ? { tracingBoard1: d.tracingBoard1 ?? false }
          : {}),
        ...("tracingBoard2" in d
          ? { tracingBoard2: d.tracingBoard2 ?? false }
          : {}),
        ...("tracingBoard3" in d
          ? { tracingBoard3: d.tracingBoard3 ?? false }
          : {}),
        ...("notes" in d ? { notes: d.notes ?? null } : {}),
      },
    });
    return NextResponse.json(updated);
  } catch (e) {
    console.error("WORKINGS_PATCH", e);
    return new NextResponse("Server error", { status: 500 });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const userId = getUserId();
  if (!userId) return new NextResponse("Unauthorized", { status: 401 });
  const id = params?.id;
  if (!id) return new NextResponse("Not found", { status: 404 });
  try {
    await db.lodgeWork.delete({ where: { id, userId } });
    return new NextResponse(null, { status: 204 });
  } catch (e) {
    console.error("WORKINGS_DELETE", e);
    return new NextResponse("Server error", { status: 500 });
  }
}
