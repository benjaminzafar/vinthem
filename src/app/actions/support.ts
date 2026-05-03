'use server';
import { logger } from '@/lib/logger';
import { revalidatePath } from 'next/cache';
import { requireAdminUser } from '@/lib/admin';
import { createClient } from '@/utils/supabase/server';

type SupportRequestInput = {
  orderId: string;
  type: 'help' | 'replacement' | 'refund' | 'chat';
  message: string;
  imageUrl?: string;
};

type SupportActionResult = {
  success: boolean;
  message: string;
  error?: string;
};

type RefundStatus = 'Pending' | 'Approved' | 'Rejected' | 'Refunded';

type UpdateRefundStatusInput = {
  refundRequestId: string;
  status: RefundStatus;
};

type SupportTicketStatus = 'open' | 'in-progress' | 'resolved' | 'Approved' | 'WaitingItem' | 'Received' | 'Exchanged' | 'Refunded';

type SupportTicketMessage = {
  sender: 'admin' | 'customer';
  text: string;
  imageUrl?: string;
  createdAt: string;
};

type ReplySupportTicketInput = {
  ticketId: string;
  replyText?: string;
  imageUrl?: string;
  status?: SupportTicketStatus;
  existingMessages?: SupportTicketMessage[];
};

function sanitizeMessage(value: string): string {
  return value.replace(/[<>]/g, '').trim();
}

function normalizeSupportMessages(value: unknown): SupportTicketMessage[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap((entry) => {
    if (!entry || typeof entry !== 'object') {
      return [];
    }

    const record = entry as Record<string, unknown>;
    const textValue =
      typeof record.text === 'string'
        ? record.text
        : typeof record.content === 'string'
          ? record.content
          : '';

    if (!textValue.trim()) {
      return [];
    }

    return [{
      sender: record.sender === 'admin' || record.role === 'admin' ? 'admin' : 'customer',
      text: textValue.trim(),
      imageUrl: typeof record.imageUrl === 'string'
        ? record.imageUrl
        : typeof record.image_url === 'string'
          ? record.image_url
          : undefined,
      createdAt:
        typeof record.createdAt === 'string'
          ? record.createdAt
          : typeof record.created_at === 'string'
            ? record.created_at
            : typeof record.timestamp === 'string'
              ? record.timestamp
              : new Date().toISOString(),
    }];
  });
}

function revalidateSupportViews() {
  revalidatePath('/profile');
  revalidatePath('/[lang]/profile', 'page');
  revalidatePath('/admin/customers');
}

export async function submitSupportRequestAction(input: SupportRequestInput): Promise<SupportActionResult> {
  try {
    const supabase = await createClient();
    const { data: authData, error: userError } = await supabase.auth.getUser();
    const user = authData?.user;

    if (userError) {
      throw userError;
    }

    if (!user) {
      throw new Error('Authentication required.');
    }

    const safeOrderId = sanitizeMessage(input.orderId);
    const safeMessage = sanitizeMessage(input.message);

    if (!safeOrderId) {
      throw new Error('Order ID is required.');
    }

    if (input.type !== 'refund' && !safeMessage) {
      throw new Error('Message is required.');
    }

    if (input.type === 'refund') {
      const { error } = await supabase.from('refund_requests').insert({
        order_id: safeOrderId,
        reason: safeMessage || 'No reason provided',
        user_id: user.id,
        status: 'Pending',
      });

      if (error) {
        throw error;
      }
    } else {
      const subject = input.type === 'replacement'
        ? `Replacement Request: ${safeOrderId}`
        : input.type === 'chat'
          ? `Chat Inquiry: ${safeOrderId}`
          : `Order Help: ${safeOrderId}`;

      const initialMessage: SupportTicketMessage = {
        sender: 'customer',
        text: safeMessage,
        imageUrl: input.imageUrl ? sanitizeMessage(input.imageUrl) : undefined,
        createdAt: new Date().toISOString(),
      };

      const { error } = await supabase.from('support_tickets').insert({
        customer_email: user.email ?? null,
        subject,
        message: safeMessage,
        description: safeMessage,
        messages: [initialMessage],
        user_id: user.id,
        priority: input.type === 'replacement' ? 'HIGH' : 'NORMAL',
        status: 'open',
      });

      if (error) {
        throw error;
      }
    }

    revalidateSupportViews();

    return {
      success: true,
      message: 'Request sent successfully. Support will contact you shortly.',
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to send support request.';
    logger.error('[Action Error] submitSupportRequestAction:', error);
    return {
      success: false,
      message,
      error: message,
    };
  }
}

export async function customerReplySupportTicketAction(input: {
  ticketId: string;
  replyText: string;
  imageUrl?: string;
}): Promise<SupportActionResult> {
  try {
    const supabase = await createClient();
    const { data: authData } = await supabase.auth.getUser();
    const user = authData?.user;

    if (!user) {
      throw new Error('Authentication required.');
    }

    const ticketId = sanitizeMessage(input.ticketId);
    const replyText = sanitizeMessage(input.replyText);

    if (!ticketId || !replyText) {
      throw new Error('Ticket ID and message are required.');
    }

    // Verify ownership
    const { data: ticket, error: fetchError } = await supabase
      .from('support_tickets')
      .select('messages, user_id')
      .eq('id', ticketId)
      .eq('user_id', user.id)
      .maybeSingle();

    if (fetchError || !ticket) {
      throw new Error('Ticket not found or access denied.');
    }

    const existingMessages = normalizeSupportMessages(ticket.messages);
    const nextMessages: SupportTicketMessage[] = [
      ...existingMessages,
      {
        sender: 'customer',
        text: replyText,
        imageUrl: input.imageUrl ? sanitizeMessage(input.imageUrl) : undefined,
        createdAt: new Date().toISOString(),
      },
    ];

    const { error: updateError } = await supabase
      .from('support_tickets')
      .update({
        messages: nextMessages,
        status: 'open', // Re-open if it was resolved/pending
        updated_at: new Date().toISOString(),
      })
      .eq('id', ticketId);

    if (updateError) throw updateError;

    revalidateSupportViews();

    return {
      success: true,
      message: 'Reply sent successfully.',
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to send reply.';
    logger.error('[Action Error] customerReplySupportTicketAction:', error);
    return {
      success: false,
      message,
      error: message,
    };
  }
}

export async function updateRefundStatusAction(input: UpdateRefundStatusInput): Promise<SupportActionResult> {
  try {
    const { supabase } = await requireAdminUser();

    const refundRequestId = sanitizeMessage(input.refundRequestId);
    const allowedStatuses: RefundStatus[] = ['Pending', 'Approved', 'Rejected', 'Refunded'];

    if (!refundRequestId) {
      throw new Error('Refund request ID is required.');
    }

    if (!allowedStatuses.includes(input.status)) {
      throw new Error('Invalid refund status.');
    }

    const { error } = await supabase
      .from('refund_requests')
      .update({ status: input.status })
      .eq('id', refundRequestId);

    if (error) {
      throw error;
    }

    revalidatePath('/admin');
    revalidateSupportViews();

    return {
      success: true,
      message: `Request marked as ${input.status}.`,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update refund status.';
    logger.error('[Action Error] updateRefundStatusAction:', error);
    return {
      success: false,
      message,
      error: message,
    };
  }
}

export async function replySupportTicketAction(input: ReplySupportTicketInput): Promise<SupportActionResult> {
  try {
    const { supabase } = await requireAdminUser();
    const ticketId = sanitizeMessage(input.ticketId);
    const replyText = sanitizeMessage(input.replyText ?? '');
    const allowedStatuses: SupportTicketStatus[] = ['open', 'in-progress', 'resolved', 'Approved', 'WaitingItem', 'Received', 'Exchanged', 'Refunded'];
    const nextStatus = input.status ?? (replyText ? 'in-progress' : 'open');

    if (!ticketId) {
      throw new Error('Ticket ID is required.');
    }

    if (!allowedStatuses.includes(nextStatus)) {
      throw new Error('Invalid support ticket status.');
    }

    if (!replyText && input.status === undefined) {
      throw new Error('Reply text or a status change is required.');
    }

    const { data: currentTicket, error: ticketReadError } = await supabase
      .from('support_tickets')
      .select('message, messages')
      .eq('id', ticketId)
      .maybeSingle();

    if (ticketReadError) {
      throw ticketReadError;
    }

    const existingMessage = typeof currentTicket?.message === 'string' ? currentTicket.message.trim() : '';
    const existingMessages = normalizeSupportMessages(currentTicket?.messages);
    const nextMessages = replyText
      ? [
          ...existingMessages,
          {
            sender: 'admin' as const,
            text: replyText,
            imageUrl: input.imageUrl ? sanitizeMessage(input.imageUrl) : undefined,
            createdAt: new Date().toISOString(),
          },
        ]
      : existingMessages;
    const appendedReply = replyText
      ? `${existingMessage}${existingMessage ? '\n\n' : ''}[ADMIN ${new Date().toISOString()}] ${replyText}`
      : existingMessage;

    const { error } = await supabase
      .from('support_tickets')
      .update({
        status: nextStatus,
        ...(replyText ? { message: appendedReply, messages: nextMessages } : {}),
      })
      .eq('id', ticketId);

    if (error) {
      throw error;
    }

    revalidatePath('/admin');
    revalidateSupportViews();

    return {
      success: true,
      message: replyText ? 'Response confirmed.' : `Ticket marked as ${nextStatus}.`,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update support ticket.';
    logger.error('[Action Error] replySupportTicketAction:', error);
    return {
      success: false,
      message,
      error: message,
    };
  }
}

export async function deleteSupportTicketAction(ticketId: string): Promise<SupportActionResult> {
  try {
    const { supabase } = await requireAdminUser();
    const safeTicketId = sanitizeMessage(ticketId);

    if (!safeTicketId) {
      throw new Error('Ticket ID is required.');
    }

    const { error } = await supabase
      .from('support_tickets')
      .delete()
      .eq('id', safeTicketId);

    if (error) {
      throw error;
    }

    revalidatePath('/admin');
    revalidateSupportViews();

    return {
      success: true,
      message: 'Ticket permanently archived/deleted.',
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to delete support ticket.';
    logger.error('[Action Error] deleteSupportTicketAction:', error);
    return {
      success: false,
      message,
      error: message,
    };
  }
}

import { createAdminClient } from '@/utils/supabase/server';
import { createStripeRefundAction } from './stripe-refund';
import { sendTransactionalEmail } from '@/lib/brevo';
import { getIntegrationsAction } from './integrations';
import { SUPPORTED_LOCALES } from '@/lib/locales';

export async function updateReturnWorkflowAction(input: {
  requestId: string;
  status: 'Approved' | 'WaitingItem' | 'Received' | 'Exchanged' | 'Refunded';
  orderId?: string;
  amount?: number;
}): Promise<SupportActionResult> {
  try {
    const { supabase: userSupabase } = await requireAdminUser();
    const adminSupabase = createAdminClient();

    // 1. Fetch Request & User Info (Email and Language)
    const { data: request, error: fetchErr } = await adminSupabase
      .from('refund_requests')
      .select('*, users!inner(email, full_name)')
      .eq('id', input.requestId)
      .single();

    if (fetchErr || !request) throw new Error('Return request not found.');

    const userEmail = request.users.email;
    const userName = request.users.full_name || 'Customer';

    // 1.5 Fetch Active Locales from settings to ensure true dynamic globalization
    const { data: settingsRow } = await adminSupabase
      .from('settings')
      .select('data')
      .eq('id', 'primary')
      .single();
    
    const activeLocales = settingsRow?.data?.languages || ['en'];
    const effectiveLang = activeLocales.includes('en') ? 'en' : activeLocales[0] || 'en';

    // 2. Perform Financial Action if Status is 'Refunded'
    if (input.status === 'Refunded' && input.orderId) {
      const stripeRes = await createStripeRefundAction(input.orderId, input.amount);
      if (!stripeRes.success) {
        throw new Error(`Financial Refund Failed: ${stripeRes.message}`);
      }
    }

    // 3. Update Status and Append System Message Log
    const { error: updateErr } = await adminSupabase
      .from('refund_requests')
      .update({ 
        status: input.status
      })
      .eq('id', input.requestId);

    if (updateErr) throw updateErr;

    // 4. Send Localized Email via Brevo
    const configRes = await getIntegrationsAction();
    const config = configRes.data || {};
    
    const statusKey = 
      input.status === 'Approved' ? 'RETURN_APPROVE' :
      input.status === 'Received' ? 'RETURN_RECEIVED' :
      input.status === 'Refunded' ? 'REFUND_DONE' : null;

    if (statusKey && userEmail) {
      const templateKey = `BREVO_TPL_${statusKey}_${effectiveLang.toUpperCase()}`;
      const templateId = config[templateKey];
      const policyLink = `${process.env.NEXT_PUBLIC_SITE_URL}/${effectiveLang}/returns`;

      const subject = 
        input.status === 'Approved' ? 'Return Request Approved - Mavren Shop' :
        input.status === 'Received' ? 'Item Received - Return Update' :
        input.status === 'Refunded' ? 'Refund Processed - Mavren Shop' : 'Update on your Return Request';

      if (templateId && templateId !== '********') {
        await sendTransactionalEmail({
          to: [{ email: userEmail, name: userName }],
          subject,
          templateId: Number(templateId),
          params: {
            USER_NAME: userName,
            POLICY_LINK: policyLink,
            ORDER_ID: input.orderId || 'N/A'
          }
        });
      }
    }

    revalidateSupportViews();
    revalidatePath('/admin', 'layout');

    return {
      success: true,
      message: `Status updated to ${input.status} and customer notified in ${effectiveLang.toUpperCase()}.`,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Workflow update failed.';
    logger.error('[Action Error] updateReturnWorkflowAction:', error);
    return { success: false, message, error: message };
  }
}
