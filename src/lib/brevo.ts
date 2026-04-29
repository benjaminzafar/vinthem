import { createAdminClient } from '@/utils/supabase/server';
import { maybeDecryptStoredValue } from '@/lib/integrations';
import { logger } from '@/lib/logger';

const BREVO_API_URL = 'https://api.brevo.com/v3';

/**
 * Retrieves the Brevo API Key from the encrypted integrations table.
 */
async function getBrevoApiKey(): Promise<string | null> {
  try {
    const supabase = createAdminClient();
    const { data: row } = await supabase
      .from('integrations')
      .select('value')
      .eq('key', 'BREVO_API_KEY')
      .single();

    if (!row) {
      logger.warn('[Brevo] BREVO_API_KEY not found in integrations table.');
      return null;
    }

    const key = await maybeDecryptStoredValue(row.value);

    if (!key) {
      logger.warn('[Brevo] BREVO_API_KEY found but is empty after decryption.');
    }

    return key;
  } catch (error) {
    logger.error('Failed to get Brevo API Key from DB:', error);
    return null;
  }
}

/**
 * Sends a transactional email using Brevo API v3.
 * Supports both HTML content or a specific Template ID.
 */
export async function sendTransactionalEmail(payload: {
  to: { email: string; name?: string }[];
  subject: string;
  htmlContent?: string;
  templateId?: number;
  params?: Record<string, unknown>;
}) {
  const apiKey = await getBrevoApiKey();
  if (!apiKey) {
    logger.error('Brevo API key missing. Cannot send email.');
    return { success: false, error: 'API_KEY_MISSING' };
  }

  try {
    const response = await fetch(`${BREVO_API_URL}/smtp/email`, {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'api-key': apiKey,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        sender: { name: 'Vinthem', email: 'info@vinthem.com' },
        ...payload,
      }),
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Failed to send email');

    return { success: true, messageId: data.messageId };
  } catch (error) {
    logger.error('Brevo Email Error:', error);
    return { success: false, error };
  }
}

/**
 * Adds or updates a contact in Brevo.
 */
export async function syncContactToBrevo(email: string, attributes?: Record<string, unknown>, listIds: number[] = []) {
  const apiKey = await getBrevoApiKey();
  if (!apiKey) {
    logger.warn('[Brevo Sync] No API Key found. Skipping sync.');
    return;
  }

  // Map common attributes to Brevo defaults if present
  const mappedAttributes = { ...attributes };
  if (attributes?.FULL_NAME && !attributes.FIRSTNAME) {
    mappedAttributes.FIRSTNAME = attributes.FULL_NAME;
  }

  try {
    const response = await fetch(`${BREVO_API_URL}/contacts`, {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'api-key': apiKey,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        email,
        attributes: mappedAttributes,
        listIds,
        updateEnabled: true,
      }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      logger.error('[Brevo Sync Error]', {
        status: response.status,
        email,
        data
      });
    } else {
      logger.info(`[Brevo Sync Success] Contact synced: ${email}`);
    }
  } catch (error) {
    logger.error('[Brevo Sync Exception]', error);
  }
}
