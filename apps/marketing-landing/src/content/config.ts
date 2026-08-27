import { defineCollection, z } from 'astro:content';

const testimonialsCollection = defineCollection({
  type: 'data',
  schema: z.object({
    body: z.string(),
    author: z.object({
      name: z.string(),
      role: z.string(),
    }),
  }),
});

export const collections = {
  testimonials: testimonialsCollection,
};
