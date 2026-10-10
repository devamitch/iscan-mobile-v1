import { z } from "zod"

// Animation Types
export const AnimationConfigSchema = z.object({
  duration: z.number().default(300),
  easing: z.string().default("ease"),
  delay: z.number().default(0),
  damping: z.number().optional(),
  stiffness: z.number().optional(),
})

// Accordion Types
export const AccordionItemSchema = z.object({
  id: z.string(),
  title: z.string(),
  content: z.string().or(z.any()),
  icon: z.string().optional(),
  disabled: z.boolean().default(false),
})

export const AccordionPropsSchema = z.object({
  items: z.array(AccordionItemSchema),
  allowMultiple: z.boolean().default(false),
  animated: z.boolean().default(true),
  style: z.any().optional(),
  onItemPress: z.function().optional(),
})

// Badge Types
export const BadgePropsSchema = z.object({
  text: z.string().or(z.number()),
  variant: z.enum(["primary", "secondary", "success", "warning", "error", "info"]).default("primary"),
  size: z.enum(["small", "medium", "large"]).default("medium"),
  animated: z.boolean().default(true),
  style: z.any().optional(),
})

// Chip Types
export const ChipPropsSchema = z.object({
  label: z.string(),
  selected: z.boolean().default(false),
  onPress: z.function().optional(),
  onDelete: z.function().optional(),
  icon: z.string().optional(),
  avatar: z.string().optional(),
  disabled: z.boolean().default(false),
  variant: z.enum(["filled", "outlined", "filter"]).default("filled"),
  size: z.enum(["small", "medium", "large"]).default("medium"),
})

// Progress Types
export const ProgressPropsSchema = z.object({
  progress: z.number().min(0).max(1),
  animated: z.boolean().default(true),
  color: z.string().optional(),
  backgroundColor: z.string().optional(),
  height: z.number().default(8),
  borderRadius: z.number().optional(),
  showLabel: z.boolean().default(false),
  labelPosition: z.enum(["top", "bottom", "center"]).default("top"),
})

// Skeleton Types
export const SkeletonPropsSchema = z.object({
  width: z.number().or(z.string()),
  height: z.number().or(z.string()),
  borderRadius: z.number().optional(),
  animated: z.boolean().default(true),
  style: z.any().optional(),
})

// Toast Types
export const ToastPropsSchema = z.object({
  message: z.string(),
  type: z.enum(["success", "error", "warning", "info"]).default("info"),
  duration: z.number().default(3000),
  position: z.enum(["top", "bottom", "center"]).default("bottom"),
  action: z
    .object({
      label: z.string(),
      onPress: z.function(),
    })
    .optional(),
})

// Export inferred types
export type AnimationConfig = z.infer<typeof AnimationConfigSchema>
export type AccordionItem = z.infer<typeof AccordionItemSchema>
export type AccordionProps = z.infer<typeof AccordionPropsSchema>
export type BadgeProps = z.infer<typeof BadgePropsSchema>
export type ChipProps = z.infer<typeof ChipPropsSchema>
export type ProgressProps = z.infer<typeof ProgressPropsSchema>
export type SkeletonProps = z.infer<typeof SkeletonPropsSchema>
export type ToastProps = z.infer<typeof ToastPropsSchema>
