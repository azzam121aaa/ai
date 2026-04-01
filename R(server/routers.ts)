import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { invokeLLM } from "./_core/llm";
import {
  createConversation,
  getUserConversations,
  getConversation,
  updateConversationTitle,
  deleteConversation,
  addMessage,
  getConversationMessages,
} from "./db";

const conversationRouter = router({
  create: protectedProcedure
    .input(z.object({ title: z.string().optional() }).optional())
    .mutation(async ({ ctx, input }) => {
      const title = input?.title || "محادثة جديدة";
      await createConversation(ctx.user.id, title);
      return { success: true };
    }),

  list: protectedProcedure.query(async ({ ctx }) => {
    return await getUserConversations(ctx.user.id);
  }),

  get: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      return await getConversation(input.id, ctx.user.id);
    }),

  updateTitle: protectedProcedure
    .input(z.object({ id: z.number(), title: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await updateConversationTitle(input.id, ctx.user.id, input.title);
      return { success: true };
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      await deleteConversation(input.id, ctx.user.id);
      return { success: true };
    }),
});

const messageRouter = router({
  list: protectedProcedure
    .input(z.object({ conversationId: z.number() }))
    .query(async ({ ctx, input }) => {
      return await getConversationMessages(input.conversationId, ctx.user.id);
    }),

  send: protectedProcedure
    .input(z.object({ conversationId: z.number(), content: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const conversation = await getConversation(input.conversationId, ctx.user.id);
      if (!conversation) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "المحادثة غير موجودة أو غير مصرح لك بالوصول إليها",
        });
      }

      await addMessage(input.conversationId, "user", input.content);

      const messages = await getConversationMessages(input.conversationId, ctx.user.id);

      const llmMessages = messages.map((msg) => ({
        role: msg.role as "user" | "assistant",
        content: msg.content,
      }));

      try {
        const response = await invokeLLM({
          messages: [
            {
              role: "system",
              content: "أنت مساعد ذكي متخصص في الإجابة على الأسئلة بدقة وفائدة. أجب باللغة العربية دائماً.",
            },
            ...llmMessages,
          ],
        });

        const messageContent = response.choices[0]?.message?.content;
        const assistantMessage = typeof messageContent === 'string' 
          ? messageContent 
          : "عذراً، حدث خطأ في الحصول على الرد.";

        await addMessage(input.conversationId, "assistant", assistantMessage);

        return {
          success: true,
          message: assistantMessage,
        };
      } catch (error) {
        console.error("LLM Error:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "فشل في الحصول على رد من الذكاء الاصطناعي",
        });
      }
    }),
});

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),
  conversations: conversationRouter,
  messages: messageRouter,
});

export type AppRouter = typeof appRouter;
