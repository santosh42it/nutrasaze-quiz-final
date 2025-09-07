
import { supabase } from '../lib/supabase';

export const runCleanupWithNotification = async (): Promise<void> => {
  try {
    console.log('🧹 Running duplicate response cleanup...');
    
    // First, get all duplicate responses
    const { data: duplicates, error: fetchError } = await supabase
      .rpc('get_duplicate_responses');
    
    if (fetchError) {
      console.error('❌ Error fetching duplicates:', fetchError);
      return;
    }

    if (!duplicates || duplicates.length === 0) {
      console.log('✅ No duplicate responses found');
      return;
    }

    console.log(`📋 Found ${duplicates.length} duplicate response groups`);

    // Delete duplicates, keeping the latest one for each group
    for (const duplicate of duplicates) {
      const { error: deleteError } = await supabase
        .from('quiz_responses')
        .delete()
        .eq('contact', duplicate.contact)
        .neq('id', duplicate.latest_id);

      if (deleteError) {
        console.error(`❌ Error deleting duplicates for ${duplicate.contact}:`, deleteError);
      } else {
        console.log(`🗑️ Cleaned up duplicates for contact: ${duplicate.contact}`);
      }
    }

    console.log('✅ Duplicate cleanup completed successfully');
  } catch (error) {
    console.error('❌ Cleanup failed:', error);
  }
};

// Function to get duplicate responses (for SQL function compatibility)
export const getDuplicateResponses = async () => {
  const { data, error } = await supabase
    .from('quiz_responses')
    .select('contact, id, created_at')
    .order('contact')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching responses for cleanup:', error);
    return [];
  }

  // Group by contact and identify duplicates
  const contactGroups: { [key: string]: any[] } = {};
  
  data?.forEach(response => {
    if (!contactGroups[response.contact]) {
      contactGroups[response.contact] = [];
    }
    contactGroups[response.contact].push(response);
  });

  // Find contacts with multiple responses
  const duplicates = Object.entries(contactGroups)
    .filter(([_, responses]) => responses.length > 1)
    .map(([contact, responses]) => ({
      contact,
      latest_id: responses[0].id, // First one is latest due to sorting
      duplicate_count: responses.length
    }));

  return duplicates;
};
