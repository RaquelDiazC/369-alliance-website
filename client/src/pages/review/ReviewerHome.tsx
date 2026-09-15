/**
 * Course Review Platform — reviewer home: the course folders this email was
 * granted access to (RLS already filters the list server-side).
 */
import { useEffect, useState } from "react";
import { ArrowRight, FolderOpen } from "lucide-react";
import { toast } from "sonner";

import { Card, CardContent } from "@/components/ui/card";
import { listCourses, type ReviewCourse } from "@/lib/review/api";
import { GOLD, NAVY } from "./ReviewPlatform";

export default function ReviewerHome({ onOpenCourse }: { onOpenCourse: (id: string) => void }) {
  const [courses, setCourses] = useState<ReviewCourse[] | null>(null);

  useEffect(() => {
    listCourses()
      .then(setCourses)
      .catch((e) => {
        setCourses([]);
        toast.error(e instanceof Error ? e.message : "Failed to load courses.");
      });
  }, []);

  return (
    <div className="mx-auto w-full max-w-[900px] px-4 py-10">
      <h1 className="text-2xl font-black tracking-tight" style={{ color: NAVY }}>
        Courses to review
      </h1>
      <p className="mt-1 text-[13px] text-muted-foreground">
        Open a course, go through it page by page and leave your comments in the panel on the right.
      </p>

      {courses === null && (
        <p className="py-16 text-center text-sm font-semibold text-muted-foreground">Loading…</p>
      )}
      {courses !== null && courses.length === 0 && (
        <Card className="mt-8 border-dashed">
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            No course has been shared with your email yet.
            <br />
            Ask the admin for access.
          </CardContent>
        </Card>
      )}

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        {(courses ?? []).map((c) => (
          <button
            key={c.id}
            onClick={() => onOpenCourse(c.id)}
            className="group flex items-center gap-3 rounded-xl border bg-white p-4 text-left shadow-sm transition hover:border-[#A68A64] hover:shadow-md"
          >
            <span
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
              style={{ background: NAVY }}
            >
              <FolderOpen size={18} style={{ color: GOLD }} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[15px] font-black" style={{ color: NAVY }}>
                {c.name}
              </span>
              <span className="block text-[12px] text-muted-foreground">Open for review</span>
            </span>
            <ArrowRight size={16} className="shrink-0 transition group-hover:translate-x-1" style={{ color: GOLD }} />
          </button>
        ))}
      </div>
    </div>
  );
}
