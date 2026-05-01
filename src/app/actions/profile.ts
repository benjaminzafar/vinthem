'use server';
﻿import { logger } from '@/lib/logger';

import { revalidatePath } from 'next/cache';

import { createAdminClient, createClient } from '@/utils/supabase/server';

type AddressRecord = {
  id: string;
  firstName: string;
  lastName: string;
  street: string;
  city: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
};

type AddressInput = {
  id?: string;
  firstName: string;
  lastName: string;
  street: string;
  city: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
};

type ProfileActionResult = {
  success: boolean;
  message: string;
  addresses?: AddressRecord[];
  error?: string;
};

function revalidateProfileViews() {
  revalidatePath('/profile');
  revalidatePath('/[lang]/profile', 'page');
}

function sanitizeText(value: string, maxLength = 120): string {
  return value.replace(/[<>]/g, '').trim().slice(0, maxLength);
}

function sanitizeCountry(value: string): string {
  return value.replace(/[^A-Za-z]/g, '').slice(0, 2).toUpperCase();
}

function sanitizeAddressInput(input: AddressInput): AddressInput {
  return {
    id: input.id ? sanitizeText(input.id, 80) : undefined,
    firstName: sanitizeText(input.firstName, 80),
    lastName: sanitizeText(input.lastName, 80),
    street: sanitizeText(input.street, 160),
    city: sanitizeText(input.city, 80),
    postalCode: sanitizeText(input.postalCode, 24),
    country: sanitizeCountry(input.country || 'SE'),
    isDefault: Boolean(input.isDefault),
  };
}

async function getAuthenticatedClient() {
  const sessionClient = await createClient();
  const {
    data: { user },
    error,
  } = await sessionClient.auth.getUser();

  if (error) {
    throw error;
  }

  if (!user) {
    throw new Error('Authentication required.');
  }

  const privilegedClient = process.env.SUPABASE_SERVICE_ROLE_KEY ? createAdminClient() : null;

  return { supabase: privilegedClient ?? sessionClient, user };
}

async function fetchUserAddresses(
  supabase: Awaited<ReturnType<typeof createClient>> | ReturnType<typeof createAdminClient>,
  userId: string
): Promise<AddressRecord[]> {
  const { data, error } = await supabase
    .from('addresses')
    .select('id, firstName:first_name, lastName:last_name, street, city, postalCode:postal_code, country, isDefault:is_default')
    .eq('user_id', userId)
    .order('is_default', { ascending: false })
    .order('created_at', { ascending: false });

  if (error) {
    throw error;
  }

  return data ?? [];
}

export async function saveAddressAction(input: AddressInput): Promise<ProfileActionResult> {
  try {
    const { supabase, user } = await getAuthenticatedClient();
    const safeInput = sanitizeAddressInput(input);

    if (!safeInput.firstName || !safeInput.lastName || !safeInput.street || !safeInput.city || !safeInput.postalCode || !safeInput.country) {
      throw new Error('All address fields are required.');
    }

    const existingAddresses = await fetchUserAddresses(supabase, user.id);
    const shouldBeDefault = safeInput.isDefault || existingAddresses.length === 0 || existingAddresses.every((address) => !address.isDefault || address.id === safeInput.id);

    if (shouldBeDefault) {
      const { error: resetError } = await supabase
        .from('addresses')
        .update({ is_default: false })
        .eq('user_id', user.id);

      if (resetError) {
        throw resetError;
      }
    }

    const payload = {
      user_id: user.id,
      first_name: safeInput.firstName,
      last_name: safeInput.lastName,
      street: safeInput.street,
      city: safeInput.city,
      postal_code: safeInput.postalCode,
      country: safeInput.country,
      is_default: shouldBeDefault,
    };

    if (safeInput.id) {
      const { error } = await supabase
        .from('addresses')
        .update(payload)
        .eq('id', safeInput.id)
        .eq('user_id', user.id);

      if (error) {
        throw error;
      }
    } else {
      const { error } = await supabase.from('addresses').insert(payload);

      if (error) {
        throw error;
      }
    }

    const addresses = await fetchUserAddresses(supabase, user.id);
    revalidateProfileViews();

    return {
      success: true,
      message: safeInput.id ? 'Address updated successfully.' : 'Address added successfully.',
      addresses,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to save address.';
    logger.error('[Action Error] saveAddressAction:', { error, input, message });
    return { success: false, message, error: message };
  }
}

export async function deleteAddressAction(addressId: string): Promise<ProfileActionResult> {
  try {
    const { supabase, user } = await getAuthenticatedClient();
    const safeAddressId = sanitizeText(addressId, 80);

    if (!safeAddressId) {
      throw new Error('Address ID is required.');
    }

    const { error } = await supabase
      .from('addresses')
      .delete()
      .eq('id', safeAddressId)
      .eq('user_id', user.id);

    if (error) {
      throw error;
    }

    const addresses = await fetchUserAddresses(supabase, user.id);

    if (addresses.length > 0 && !addresses.some((address) => address.isDefault)) {
      const fallbackId = addresses[0].id;
      const { error: defaultError } = await supabase
        .from('addresses')
        .update({ is_default: true })
        .eq('id', fallbackId)
        .eq('user_id', user.id);

      if (defaultError) {
        throw defaultError;
      }
    }

    const nextAddresses = await fetchUserAddresses(supabase, user.id);
    revalidateProfileViews();

    return {
      success: true,
      message: 'Address deleted successfully.',
      addresses: nextAddresses,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to delete address.';
    logger.error('[Action Error] deleteAddressAction:', { error, addressId, message });
    return { success: false, message, error: message };
  }
}

export async function setDefaultAddressAction(addressId: string): Promise<ProfileActionResult> {
  try {
    const { supabase, user } = await getAuthenticatedClient();
    const safeAddressId = sanitizeText(addressId, 80);

    if (!safeAddressId) {
      throw new Error('Address ID is required.');
    }

    const { error: resetError } = await supabase
      .from('addresses')
      .update({ is_default: false })
      .eq('user_id', user.id);

    if (resetError) {
      throw resetError;
    }

    const { error } = await supabase
      .from('addresses')
      .update({ is_default: true })
      .eq('id', safeAddressId)
      .eq('user_id', user.id);

    if (error) {
      throw error;
    }

    const addresses = await fetchUserAddresses(supabase, user.id);
    revalidateProfileViews();

    return {
      success: true,
      message: 'Default address updated successfully.',
      addresses,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update default address.';
    logger.error('[Action Error] setDefaultAddressAction:', { error, addressId, message });
    return { success: false, message, error: message };
  }
}

