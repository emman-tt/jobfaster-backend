async function Pupp () {
  const browser = await puppeteer.launch({ headless: 'new' })

  const page = await browser.newPage()

  try {
    await page.goto('https://tilios.vercel.app', {
      waitUntil: 'domcontentloaded'
    })

    const title = await page.title()
    await page.waitForSelector(containsText('Your home'))

    await page.waitForSelector(containsText('Add to Cart'), { timeout: 10000 })

    const productNames = await page.$$eval(
      'main.grid > div p.font-mono',
      elements => {
        return elements.map(el => el.textContent.trim())
      }
    )

    const products = await page.$$eval('main.grid > div', all => {
      return all.map(each => {
        const img = each.querySelector('.h-full.object-cover')
        const product_name = each.querySelector('.font-mono')
        const product_price = each.querySelector('.font-semibold')

        const priceContainer = each.querySelector('.font-semibold')
        const secondDiv = priceContainer.children[0]

        return {
          images: img.src,
          product_name: product_name.textContent,

          product_price: secondDiv?.textContent,
          discount: product_price.textContent
        }
      })
    })
  } catch (error) {
    console.error('Scraping failed:', error)
  } finally {
    await browser.close()
  }
}