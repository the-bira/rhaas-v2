"use client";

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { RadioGroup, RadioGroupItem } from "../ui/radio-group";
import { Checkbox } from "../ui/checkbox";
import { Stepper } from "../utils/Stepper";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTransition } from "react";
import { Job } from "@/generated/prisma";
import { WorkModel } from '@/enums/WorkModel';

const JobFormSchema = z.object({
  step1: z.object({
    title: z.string().min(1),
    tags: z.array(z.string()),
  }),
  step2: z.object({
    description: z.string().min(1).max(10000),
  }),
  step3: z.object({
    requirements: z.string().optional(),
    responsibilities: z.string().optional(),
  }),
  step4: z.object({
    workModel: z.enum(Object.keys(WorkModel) as [keyof typeof WorkModel, ...string[]]),
    benefits: z.string().optional(),
  }),
});