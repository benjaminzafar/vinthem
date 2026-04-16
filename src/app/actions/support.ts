'use server';

import { revalidatePath } from 'next/cache';

import { requireAdminUser } from '@/lib/admin';
import { createClient } from '@/utils/supabase/server';

type SupportRequestInput = {
  orderId: string;
  type: 'help' | 'replacement' | 'refund' | 'chat';
  message: string;
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

type SupportTicketStatus = 'open' | 'in-progress' | 'resolved';

type SupportTicketMessage = {
  sender: 'admin' | 'customer';
  text: string;
  createdAt: string;
};

type ReplySupportTicketInput = {
  ticketId: string;
  replyText?: string;
  status?: SupportTicketStatus;
  existingMessages?: SupportTicketMessage[];
};

function sanitizeMessage(value: string): string {
  return value.replace(/[<>]/g, '').trim();
}

export async function submitSupportRequestAction(input: SupportRequestInput): Promise<SupportActionResult> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

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

      const { error } = await supabase.from('support_tickets').insert({
        subject,
        message: safeMessage,
        user_id: user.id,
        status: 'open',
      });

      if (error) {
        throw error;
      }
    }

    revalidatePath('/profile');
    revalidatePath('/admin/customers');

    return {
      success: true,
      message: 'Request sent successfully. Support will contact you shortly.',
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to send support request.';
    console.error('[Action Error] submitSupportRequestAction:', error);
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
    revalidatePath('/admin/customers');
    revalidatePath('/profile');

    return {
      success: true,
      message: `Request marked as ${input.status}.`,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update refund status.';
    console.error('[Action Error] updateRefundStatusAction:', error);
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
    const allowedStatuses: SupportTicketStatus[] = ['open', 'in-progress', 'resolved'];
    const nextStatus = input.status ?? (replyText ? 'in-progress' : 'open');

    if (!ticketId) {
      throw new Error('Ticket ID is required.');
    }

    if (!allowedStatuses.includes(nextStatus)) {
      throw new Error('Invalid support ticket status.');
    }

    const existingMessages = (input.existingMessages ?? []).filter(
      (message) => message && (message.sender === 'admin' || message.sender === 'customer') && sanitizeMessage(message.text)
    );

    const nextMessages = replyText
      ? [
          ...existingMessages,
          {
            sender: 'admin' as const,
            text: replyText,
            createdAt: new Date().toISOString(),
          },
        ]
      : existingMessages;

    if (!replyText && input.status === undefined) {
      throw new Error('Reply text or a status change is required.');
    }

    const { error } = await supabase
      .from('support_tickets')
      .update({
        messages: nextMessages,
        status: nextStatus,
        updated_at: new Date().toISOString(),
      })
      .eq('id', ticketId);

    if (error) {
      throw error;
    }

    revalidatePath('/admin');
    revalidatePath('/admin/customers');
    revalidatePath('/profile');

    return {
      success: true,
      message: replyText ? 'Response confirmed.' : `Ticket marked as ${nextStatus}.`,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update support ticket.';
    console.error('[Action Error] replySupportTicketAction:', error);
    return {
      success: false,
      message,
      error: message,
    };
  }
}
