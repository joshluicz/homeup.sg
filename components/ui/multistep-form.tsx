"use client";

import { type ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

export type MultistepFormStep = {
  id: string;
  title: string;
  description?: string;
};

const contentVariants = {
  hidden: { opacity: 0, x: 40 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.28 } },
  exit: { opacity: 0, x: -40, transition: { duration: 0.2 } },
};

export type MultistepFormProps = {
  steps: MultistepFormStep[];
  currentStep: number;
  onStepChange: (step: number) => void;
  children: ReactNode;
  onBack: () => void;
  onNext: () => void;
  onSubmit: () => void;
  isStepValid: boolean;
  isSubmitting?: boolean;
  submitLabel?: string;
  nextLabel?: string;
  className?: string;
  footerExtra?: ReactNode;
};

export function MultistepForm({
  steps,
  currentStep,
  onStepChange,
  children,
  onBack,
  onNext,
  onSubmit,
  isStepValid,
  isSubmitting = false,
  submitLabel = "Submit",
  nextLabel = "Next",
  className,
  footerExtra,
}: MultistepFormProps) {
  const isLastStep = currentStep === steps.length - 1;
  const progress =
    steps.length > 1 ? (currentStep / (steps.length - 1)) * 100 : 100;

  return (
    <div className={cn("w-full", className)}>
      <motion.div
        className="mb-6"
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="mb-2 flex justify-between gap-1">
          {steps.map((step, index) => (
            <button
              key={step.id}
              type="button"
              className="flex flex-1 flex-col items-center gap-1.5"
              onClick={() => {
                if (index <= currentStep) onStepChange(index);
              }}
              disabled={index > currentStep}
              aria-label={step.title}
            >
              <motion.span
                className={cn(
                  "h-2.5 w-2.5 rounded-full transition-colors",
                  index < currentStep
                    ? "bg-primary-600"
                    : index === currentStep
                      ? "bg-primary-600 ring-4 ring-primary-600/20"
                      : "bg-neutral-200",
                )}
                whileTap={{ scale: 0.95 }}
              />
              <span
                className={cn(
                  "hidden text-xs sm:block",
                  index === currentStep
                    ? "font-medium text-primary-700"
                    : "text-neutral-500",
                )}
              >
                {step.title}
              </span>
            </button>
          ))}
        </div>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-neutral-100">
          <motion.div
            className="h-full bg-primary-600"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </motion.div>

      <Card className="overflow-hidden rounded-2xl border-neutral-200/80 shadow-sm">
        <AnimatePresence mode="wait">
          <motion.div
            key={steps[currentStep]?.id ?? currentStep}
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={contentVariants}
          >
            {steps[currentStep]?.description && (
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold">
                  {steps[currentStep].title}
                </CardTitle>
                <CardDescription>{steps[currentStep].description}</CardDescription>
              </CardHeader>
            )}
            <CardContent className={steps[currentStep]?.description ? "pt-0" : "pt-6"}>
              {children}
            </CardContent>
          </motion.div>
        </AnimatePresence>

        <CardFooter className="flex flex-col gap-3 border-t border-neutral-100 pb-5 pt-4 sm:flex-row sm:justify-between">
          {footerExtra}
          <div className="flex w-full gap-2 sm:w-auto">
            <Button
              type="button"
              variant="outline"
              onClick={onBack}
              disabled={currentStep === 0 || isSubmitting}
              className="flex flex-1 items-center gap-1 sm:flex-none"
            >
              <ChevronLeft className="h-4 w-4" />
              Back
            </Button>
            <Button
              type="button"
              onClick={isLastStep ? onSubmit : onNext}
              disabled={!isStepValid || isSubmitting}
              className="flex flex-1 items-center gap-1 sm:flex-none"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Submitting…
                </>
              ) : isLastStep ? (
                <>
                  {submitLabel}
                  <Check className="h-4 w-4" />
                </>
              ) : (
                <>
                  {nextLabel}
                  <ChevronRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        </CardFooter>
      </Card>

      <p className="mt-3 text-center text-sm text-neutral-500">
        Step {currentStep + 1} of {steps.length}: {steps[currentStep]?.title}
      </p>
    </div>
  );
}
