
import { defineCollection, z } from 'astro:content';

const featuresCollection = defineCollection({
  type: 'data', // JSON/YAML files
  schema: z.object({
    title: z.string(),
    description: z.string(),
    icon: z.string(), // We'll map string names to icons in component
  }),
});

const testimonialsCollection = defineCollection({
  type: 'data',
  schema: z.object({
    body: z.string(),
    author: z.object({
      name: z.string(),
      role: z.string(),
      imageUrl: z.string(),
    }),
  }),
});

const faqCollection = defineCollection({
  type: 'data',
  schema: z.object({
    question: z.string(),
    answer: z.string(),
    category: z.string().optional(),
  }),
});

const plansCollection = defineCollection({
  type: 'data',
  schema: z.object({
    name: z.string(),
    price: z.string(),
    period: z.string(),
    description: z.string(),
    features: z.array(z.string()),
    cta: z.string(),
    href: z.string().optional(),
    featured: z.boolean().default(false),
  }),
});

export const collections = {
  features: featuresCollection,
  testimonials: testimonialsCollection,
  faqs: faqCollection,
  plans: plansCollection,
};
