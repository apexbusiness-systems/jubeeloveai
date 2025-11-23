import { supabase } from '@/integrations/supabase/client'
import { premiumStories } from '@/data/storySeedData'

export async function initializeStories() {
  try {
    // Check if stories already exist
    const { data: existingStories, error: checkError } = await supabase
      .from('stories')
      .select('id')
      .limit(1)

    if (checkError) throw checkError

    // If stories already exist, don't re-insert
    if (existingStories && existingStories.length > 0) {
      console.log('Stories already initialized')
      return { success: true, alreadyInitialized: true }
    }

    // Insert all stories
    const { data, error } = await supabase
      .from('stories')
      .insert(
        premiumStories.map(story => ({
          title: story.title,
          category: story.category,
          age_range: story.age_range,
          description: story.description,
          illustration_style: story.illustration_style,
          pages: story.pages
        }))
      )

    if (error) throw error

    console.log('Successfully initialized stories database')
    return { success: true, count: premiumStories.length }
  } catch (error) {
    console.error('Error initializing stories:', error)
    return { success: false, error }
  }
}
