'use server';
/**
 * @fileOverview An AI agent for suggesting improvements to course descriptions to increase student engagement.
 *
 * - aiEnhanceCourseDescription - A function that handles the course description enhancement process.
 * - AiEnhanceCourseDescriptionInput - The input type for the aiEnhanceCourseDescription function.
 * - AiEnhanceCourseDescriptionOutput - The return type for the aiEnhanceCourseDescription function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AiEnhanceCourseDescriptionInputSchema = z.object({
  courseDescription: z
    .string()
    .describe('The course description that needs improvement.'),
});
export type AiEnhanceCourseDescriptionInput = z.infer<
  typeof AiEnhanceCourseDescriptionInputSchema
>;

const AiEnhanceCourseDescriptionOutputSchema = z.object({
  enhancedDescription: z
    .string()
    .describe('The enhanced course description with suggestions.'),
});
export type AiEnhanceCourseDescriptionOutput = z.infer<
  typeof AiEnhanceCourseDescriptionOutputSchema
>;

export async function aiEnhanceCourseDescription(
  input: AiEnhanceCourseDescriptionInput
): Promise<AiEnhanceCourseDescriptionOutput> {
  return aiEnhanceCourseDescriptionFlow(input);
}

const prompt = ai.definePrompt({
  name: 'aiEnhanceCourseDescriptionPrompt',
  input: {schema: AiEnhanceCourseDescriptionInputSchema},
  output: {schema: AiEnhanceCourseDescriptionOutputSchema},
  prompt: `You are an AI assistant designed to improve course descriptions to increase student engagement.

  Given the current course description, provide an enhanced version that is more engaging and appealing to students.
  Focus on highlighting the benefits of the course, its unique features, and the value students will gain.

  Current Course Description: {{{courseDescription}}}

  Enhanced Course Description:`,
});

const aiEnhanceCourseDescriptionFlow = ai.defineFlow(
  {
    name: 'aiEnhanceCourseDescriptionFlow',
    inputSchema: AiEnhanceCourseDescriptionInputSchema,
    outputSchema: AiEnhanceCourseDescriptionOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
