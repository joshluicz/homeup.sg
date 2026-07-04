"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { MultistepForm, type MultistepFormStep } from "@/components/ui/multistep-form";

const steps: MultistepFormStep[] = [
  { id: "personal", title: "Personal Info", description: "Let's start with some basic information" },
  { id: "professional", title: "Professional", description: "Tell us about your professional experience" },
  { id: "goals", title: "Website Goals", description: "What are you trying to achieve with your website?" },
  { id: "design", title: "Design", description: "Tell us about your aesthetic preferences" },
  { id: "budget", title: "Budget", description: "Let's talk about your investment and timeline" },
  { id: "requirements", title: "Requirements", description: "Any other specific needs for your website?" },
];

interface FormData {
  name: string;
  email: string;
  company: string;
  profession: string;
  industry: string;
  primaryGoal: string;
  targetAudience: string;
  stylePreference: string;
  inspirations: string;
  budget: string;
  timeline: string;
  features: string[];
  additionalInfo: string;
}

const fadeInUp = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.25 } },
};

export function MultistepFormDemo() {
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    name: "",
    email: "",
    company: "",
    profession: "",
    industry: "",
    primaryGoal: "",
    targetAudience: "",
    stylePreference: "",
    inspirations: "",
    budget: "",
    timeline: "",
    features: [],
    additionalInfo: "",
  });

  const updateFormData = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const toggleFeature = (feature: string) => {
    setFormData((prev) => {
      const features = prev.features.includes(feature)
        ? prev.features.filter((f) => f !== feature)
        : [...prev.features, feature];
      return { ...prev, features };
    });
  };

  const isStepValid = () => {
    switch (currentStep) {
      case 0:
        return formData.name.trim() !== "" && formData.email.trim() !== "";
      case 1:
        return formData.profession.trim() !== "" && formData.industry !== "";
      case 2:
        return formData.primaryGoal !== "";
      case 3:
        return formData.stylePreference !== "";
      case 4:
        return formData.budget !== "" && formData.timeline !== "";
      default:
        return true;
    }
  };

  const handleSubmit = () => {
    setIsSubmitting(true);
    setTimeout(() => {
      toast.success("Form submitted successfully!");
      setIsSubmitting(false);
    }, 1500);
  };

  return (
    <MultistepForm
      steps={steps}
      currentStep={currentStep}
      onStepChange={setCurrentStep}
      onBack={() => setCurrentStep((s) => Math.max(0, s - 1))}
      onNext={() => setCurrentStep((s) => Math.min(steps.length - 1, s + 1))}
      onSubmit={handleSubmit}
      isStepValid={isStepValid()}
      isSubmitting={isSubmitting}
      className="mx-auto max-w-lg py-8"
    >
      {currentStep === 0 && (
        <div className="space-y-4">
          <motion.div variants={fadeInUp} initial="hidden" animate="visible" className="space-y-2">
            <Label htmlFor="demo-name">Full Name</Label>
            <Input
              id="demo-name"
              placeholder="John Doe"
              value={formData.name}
              onChange={(e) => updateFormData("name", e.target.value)}
            />
          </motion.div>
          <motion.div variants={fadeInUp} initial="hidden" animate="visible" className="space-y-2">
            <Label htmlFor="demo-email">Email Address</Label>
            <Input
              id="demo-email"
              type="email"
              placeholder="john@example.com"
              value={formData.email}
              onChange={(e) => updateFormData("email", e.target.value)}
            />
          </motion.div>
          <motion.div variants={fadeInUp} initial="hidden" animate="visible" className="space-y-2">
            <Label htmlFor="demo-company">Company/Organization (Optional)</Label>
            <Input
              id="demo-company"
              placeholder="Your Company"
              value={formData.company}
              onChange={(e) => updateFormData("company", e.target.value)}
            />
          </motion.div>
        </div>
      )}

      {currentStep === 1 && (
        <div className="space-y-4">
          <motion.div variants={fadeInUp} initial="hidden" animate="visible" className="space-y-2">
            <Label htmlFor="demo-profession">What&apos;s your profession?</Label>
            <Input
              id="demo-profession"
              placeholder="e.g. Designer, Developer, Marketer"
              value={formData.profession}
              onChange={(e) => updateFormData("profession", e.target.value)}
            />
          </motion.div>
          <motion.div variants={fadeInUp} initial="hidden" animate="visible" className="space-y-2">
            <Label htmlFor="demo-industry">What industry do you work in?</Label>
            <Select value={formData.industry} onValueChange={(v) => updateFormData("industry", v)}>
              <SelectTrigger id="demo-industry">
                <SelectValue placeholder="Select an industry" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="technology">Technology</SelectItem>
                <SelectItem value="healthcare">Healthcare</SelectItem>
                <SelectItem value="education">Education</SelectItem>
                <SelectItem value="finance">Finance</SelectItem>
                <SelectItem value="retail">Retail</SelectItem>
                <SelectItem value="creative">Creative Arts</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </motion.div>
        </div>
      )}

      {currentStep === 2 && (
        <div className="space-y-4">
          <motion.div variants={fadeInUp} initial="hidden" animate="visible" className="space-y-2">
            <Label>What&apos;s the primary goal of your website?</Label>
            <RadioGroup
              value={formData.primaryGoal}
              onValueChange={(v) => updateFormData("primaryGoal", v)}
              className="space-y-2"
            >
              {[
                { value: "showcase", label: "Showcase portfolio/work" },
                { value: "sell", label: "Sell products/services" },
                { value: "generate-leads", label: "Generate leads/inquiries" },
                { value: "provide-info", label: "Provide information" },
                { value: "blog", label: "Blog/content publishing" },
              ].map((goal, index) => (
                <label
                  key={goal.value}
                  className="flex cursor-pointer items-center gap-2 rounded-md border p-3 hover:bg-neutral-50"
                >
                  <RadioGroupItem value={goal.value} id={`goal-${index}`} />
                  <span className="text-sm">{goal.label}</span>
                </label>
              ))}
            </RadioGroup>
          </motion.div>
          <motion.div variants={fadeInUp} initial="hidden" animate="visible" className="space-y-2">
            <Label htmlFor="demo-audience">Who is your target audience?</Label>
            <Textarea
              id="demo-audience"
              placeholder="Describe your ideal visitors/customers"
              value={formData.targetAudience}
              onChange={(e) => updateFormData("targetAudience", e.target.value)}
            />
          </motion.div>
        </div>
      )}

      {currentStep === 3 && (
        <div className="space-y-4">
          <motion.div variants={fadeInUp} initial="hidden" animate="visible" className="space-y-2">
            <Label>What style do you prefer for your website?</Label>
            <RadioGroup
              value={formData.stylePreference}
              onValueChange={(v) => updateFormData("stylePreference", v)}
              className="space-y-2"
            >
              {[
                { value: "modern", label: "Modern & Sleek" },
                { value: "minimalist", label: "Minimalist" },
                { value: "bold", label: "Bold & Creative" },
                { value: "corporate", label: "Corporate & Professional" },
              ].map((style, index) => (
                <label
                  key={style.value}
                  className="flex cursor-pointer items-center gap-2 rounded-md border p-3 hover:bg-neutral-50"
                >
                  <RadioGroupItem value={style.value} id={`style-${index}`} />
                  <span className="text-sm">{style.label}</span>
                </label>
              ))}
            </RadioGroup>
          </motion.div>
          <motion.div variants={fadeInUp} initial="hidden" animate="visible" className="space-y-2">
            <Label htmlFor="demo-inspirations">Any websites you like for inspiration?</Label>
            <Textarea
              id="demo-inspirations"
              placeholder="List websites you admire or want to emulate"
              value={formData.inspirations}
              onChange={(e) => updateFormData("inspirations", e.target.value)}
            />
          </motion.div>
        </div>
      )}

      {currentStep === 4 && (
        <div className="space-y-4">
          <motion.div variants={fadeInUp} initial="hidden" animate="visible" className="space-y-2">
            <Label htmlFor="demo-budget">What&apos;s your budget range? (USD)</Label>
            <Select value={formData.budget} onValueChange={(v) => updateFormData("budget", v)}>
              <SelectTrigger id="demo-budget">
                <SelectValue placeholder="Select your budget" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="under-1000">Under $1,000</SelectItem>
                <SelectItem value="1000-3000">$1,000 - $3,000</SelectItem>
                <SelectItem value="3000-5000">$3,000 - $5,000</SelectItem>
                <SelectItem value="5000-10000">$5,000 - $10,000</SelectItem>
                <SelectItem value="over-10000">Over $10,000</SelectItem>
              </SelectContent>
            </Select>
          </motion.div>
          <motion.div variants={fadeInUp} initial="hidden" animate="visible" className="space-y-2">
            <Label>What&apos;s your expected timeline?</Label>
            <RadioGroup
              value={formData.timeline}
              onValueChange={(v) => updateFormData("timeline", v)}
              className="space-y-2"
            >
              {[
                { value: "asap", label: "ASAP" },
                { value: "1-month", label: "Within 1 month" },
                { value: "3-months", label: "1-3 months" },
                { value: "flexible", label: "Flexible" },
              ].map((time, index) => (
                <label
                  key={time.value}
                  className="flex cursor-pointer items-center gap-2 rounded-md border p-3 hover:bg-neutral-50"
                >
                  <RadioGroupItem value={time.value} id={`time-${index}`} />
                  <span className="text-sm">{time.label}</span>
                </label>
              ))}
            </RadioGroup>
          </motion.div>
        </div>
      )}

      {currentStep === 5 && (
        <div className="space-y-4">
          <motion.div variants={fadeInUp} initial="hidden" animate="visible" className="space-y-2">
            <Label>Which features do you need?</Label>
            <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
              {[
                "Contact Form",
                "Blog/News",
                "E-commerce",
                "User Accounts",
                "Search Functionality",
                "Social Media Integration",
                "Newsletter Signup",
                "Analytics",
              ].map((feature) => {
                const key = feature.toLowerCase();
                return (
                  <label
                    key={feature}
                    className="flex cursor-pointer items-center gap-2 rounded-md border p-3 hover:bg-neutral-50"
                  >
                    <Checkbox
                      checked={formData.features.includes(key)}
                      onCheckedChange={() => toggleFeature(key)}
                    />
                    <span className="text-sm">{feature}</span>
                  </label>
                );
              })}
            </div>
          </motion.div>
          <motion.div variants={fadeInUp} initial="hidden" animate="visible" className="space-y-2">
            <Label htmlFor="demo-additional">Anything else we should know?</Label>
            <Textarea
              id="demo-additional"
              placeholder="Any additional requirements or information"
              value={formData.additionalInfo}
              onChange={(e) => updateFormData("additionalInfo", e.target.value)}
            />
          </motion.div>
        </div>
      )}
    </MultistepForm>
  );
}

export default MultistepFormDemo;
