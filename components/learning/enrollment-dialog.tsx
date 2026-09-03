"use client";

import Link from "next/link";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, BookOpen, PlayCircle, ArrowRight } from "lucide-react";
import type { DemoCourse } from "@/lib/demo/data";

interface EnrollmentSuccessDialogProps {
  course: DemoCourse | null;
  isOpen: boolean;
  onClose: () => void;
}

export function EnrollmentSuccessDialog({
  course,
  isOpen,
  onClose,
}: EnrollmentSuccessDialogProps) {
  if (!course) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="space-y-3 text-center sm:text-left">
          <div className="mx-auto sm:mx-0 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="h-7 w-7" />
          </div>
          <div>
            <DialogTitle className="text-xl font-bold text-foreground">
              Successfully Enrolled!
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground pt-1">
              <strong className="text-foreground">{course.title}</strong> has been added to your active learning path in <strong className="text-primary">My Learning</strong>.
            </DialogDescription>
          </div>
        </DialogHeader>

        <div className="rounded-lg border bg-muted/30 p-4 text-xs space-y-2.5 my-2">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Target Competency:</span>
            <span className="font-semibold text-foreground">
              {course.competencyName} (Level {course.targetLevel})
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Initial Status:</span>
            <Badge variant="warning" className="text-[10px]">
              In Progress (0% Complete)
            </Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Curriculum:</span>
            <span className="font-mono">{course.modulesCount} Structured Modules</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Estimated Duration:</span>
            <span>{course.durationHours} Hours</span>
          </div>
        </div>

        <DialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
          <Link href="/my-learning" onClick={onClose}>
            <Button variant="outline" className="w-full sm:w-auto text-xs gap-1.5">
              <BookOpen className="h-3.5 w-3.5" />
              Go to My Learning
            </Button>
          </Link>
          <Link href={`/courses/${course.id}/learn`} onClick={onClose}>
            <Button className="w-full sm:w-auto text-xs gap-1.5 bg-primary text-primary-foreground">
              <PlayCircle className="h-3.5 w-3.5" />
              Start Learning Now
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </Link>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
