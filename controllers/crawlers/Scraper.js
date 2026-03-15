import { ApifyClient } from 'apify-client'

// Initialize the ApifyClient with your Apify API token
// Replace the '<YOUR_API_TOKEN>' with your token
import dotenv from 'dotenv'
dotenv.config()
export async function Scraper (params) {
  try {
    const client = new ApifyClient({
      token: process.env.APIFY_KEY
    })

    // Prepare Actor input
    const input = {
      urls: [''],
      count: 10
    }
   const jobUrl = 'https://www.linkedin.com/jobs/search/?currentJobId=4380376835&distance=25&geoId=102264497&keywords=Frontend%20Developer&origin=JOB_SEARCH_PAGE_KEYWORD_HISTORY&refresh=true'

    // Run the Actor and wait for it to finish

    const run = await client
      .actor('curious_coder/linkedin-jobs-scraper')
      .call(input)

    console.log('Results from dataset')
    console.log(
      `💾 Check your data here: https://console.apify.com/storage/datasets/${run.defaultDatasetId}`
    )
    const { items } = await client.dataset(run.defaultDatasetId).listItems()
    items.forEach(item => {
      console.dir(item)
    })
  } catch (error) {
    console.log(error)
  }
}

// 📚 Want to learn more 📖? Go to → https://docs.apify.com/api/client/js/docs
