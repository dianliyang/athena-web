import { CAUSport } from "../lib/scrapers/cau-sport";
import * as cheerio from "cheerio";

async function debug() {
  const scraper = new CAUSport();
  const url = "https://server.sportzentrum.uni-kiel.de/angebote/aktueller_zeitraum/_Schwimmkurse_Erwachsene.html";
  
  console.log("Fetching category page...");
  const html = await scraper.fetchPage(url);
  const $ = cheerio.load(html);
  
  // Find the first workout duration link
  const durationUrlRaw = $("td.bs_szr a").first().attr("href");
  if (!durationUrlRaw) {
    console.log("No duration link found on page");
    return;
  }
  
  const durationUrl = durationUrlRaw.startsWith("http") 
    ? durationUrlRaw 
    : `https://server.sportzentrum.uni-kiel.de${durationUrlRaw}`;
    
  console.log(`Fetching detail page: ${durationUrl}`);
  const detailHtml = await scraper.fetchPage(durationUrl);
  const $detail = cheerio.load(detailHtml);
  
  console.log("\n--- Full Row Text for all TRs ---");
  $detail("tr").each((i, tr) => {
    const text = $detail(tr).text().trim().replace(/\s+/g, " ");
    const dateMatch = text.match(/(\d{2}\.\d{2}\.\d{4})/g);
    const timeMatch = text.match(/\d{1,2}[\.:]\d{2}\s*-\s*\d{1,2}[\.:]\d{2}/);
    console.log(`[Row ${i}] "${text}" | Dates: ${dateMatch?.length || 0} | Time: ${!!timeMatch}`);
  });

  const dates = await scraper.parsePlannedDates(durationUrl);
  console.log("\n--- Parsed Dates Result ---");
  console.log(`Count: ${dates.length}`);
  console.log(JSON.stringify(dates, null, 2));
}

debug().catch(console.error);
