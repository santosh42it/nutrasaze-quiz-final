
import { supabase } from '../lib/supabase';

export const runDuplicateCleanup = async (userEmail?: string) => {
  try {
    console.log('=== DUPLICATE CLEANUP START ===');
    
    let query = supabase
      .from('quiz_responses')
      .select('id, email, name, contact, created_at')
      .order('email')
      .order('created_at', { ascending: false });

    // If specific email provided, filter for that user
    if (userEmail) {
      query = query.eq('email', userEmail);
    }

    const { data: responses, error } = await query;

    if (error) {
      console.error('Error fetching responses for cleanup:', error);
      return { success: false, error: error.message };
    }

    if (!responses || responses.length === 0) {
      console.log('No responses found for cleanup');
      return { success: true, cleaned: 0 };
    }

    // Group by email
    const groupedByEmail = responses.reduce((acc, response) => {
      if (!acc[response.email]) {
        acc[response.email] = [];
      }
      acc[response.email].push(response);
      return acc;
    }, {} as Record<string, typeof responses>);

    let totalCleaned = 0;

    // Process each email group
    for (const [email, userResponses] of Object.entries(groupedByEmail)) {
      if (userResponses.length > 1) {
        // Keep the latest response (first in ordered list) and delete the rest
        const toDelete = userResponses.slice(1).map(r => r.id);
        console.log(`Email ${email}: Found ${userResponses.length} responses, deleting ${toDelete.length} duplicates`);

        const { error: deleteError } = await supabase
          .from('quiz_responses')
          .delete()
          .in('id', toDelete);

        if (deleteError) {
          console.error(`Error deleting duplicates for ${email}:`, deleteError);
        } else {
          totalCleaned += toDelete.length;
          console.log(`Successfully deleted ${toDelete.length} duplicates for ${email}`);
        }
      }
    }

    console.log(`=== CLEANUP COMPLETE: Removed ${totalCleaned} duplicate responses ===`);
    return { success: true, cleaned: totalCleaned };

  } catch (error) {
    console.error('Error in runDuplicateCleanup:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
};

// Function to run cleanup and show results to user
export const runCleanupWithNotification = async (userEmail?: string) => {
  const result = await runDuplicateCleanup(userEmail);
  
  if (result.success) {
    if (result.cleaned > 0) {
      alert(`✅ Cleanup completed! Removed ${result.cleaned} duplicate responses.`);
    } else {
      alert('✅ No duplicates found. Database is clean!');
    }
  } else {
    alert(`❌ Cleanup failed: ${result.error}`);
  }
  
  return result;
};
