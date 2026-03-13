import { describe, expect, test } from "vitest";
import { UrbanApes } from "@/lib/scrapers/urban-apes";

describe("UrbanApes scraper", () => {
  test("extracts Kiel location, opening hours, and pricing from the quick overview page", async () => {
    const scraper = new UrbanApes();

    const html = `
      <html><body>
        <div class="fusion-panel">
          <div class="panel-heading">
            <span class="fusion-toggle-heading">Opening hours</span>
          </div>
          <div class="panel-body">
            <p style="text-align: center;"><strong>Monday – Friday:</strong><br>09:00 a.m. – 11:00 p.m.</p>
            <p style="text-align: center;"><strong>Saturday &amp; Sunday:</strong><br>11:00 a.m.– 10:00 p.m.</p>
          </div>
        </div>
        <div class="fusion-panel">
          <div class="panel-heading">
            <span class="fusion-toggle-heading">Prices</span>
          </div>
          <div class="panel-body">
            <div class="table-1">
              <table width="100%">
                <thead>
                  <tr>
                    <th></th>
                    <th>Adults</th>
                    <th>Discounted*</th>
                    <th>Children*</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><strong>Day Ticket</strong></td>
                    <td>16.90 €</td>
                    <td>12.90 €</td>
                    <td>9.90 €</td>
                  </tr>
                  <tr>
                    <td><strong>Family Ticket</strong><br>Max. 4 people</td>
                    <td colspan="3">34.90 €</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p>All prices are in euros and include VAT.</p>
            <p><strong>*Children</strong>: Ages 4 to 13 (inclusive).</p>
          </div>
        </div>
        <div class="fusion-text">
          <p><strong>urban apes Kiel GmbH</strong><br>Grasweg 40<br>24118 Kiel</p>
        </div>
      </body></html>
    `;

    const workouts = await scraper.parseWorkouts(
      html,
      "https://www.urbanapes.de/kiel/quick-overview/",
    );

    expect(workouts).toHaveLength(2);
    expect(workouts.map((workout) => workout.courseCode)).toEqual([
      "urban-apes-kiel-mon-fri",
      "urban-apes-kiel-sat-sun",
    ]);
    expect(workouts[0]).toMatchObject({
      source: "Urban Apes",
      category: "Bouldering",
      categoryEn: "Bouldering",
      title: "urban apes Kiel",
      titleEn: "urban apes Kiel",
      dayOfWeek: "Mon-Fri",
      startTime: "09:00",
      endTime: "23:00",
      location: "Grasweg 40, 24118 Kiel",
      locationEn: "Grasweg 40, 24118 Kiel",
      priceStudent: 12.9,
      priceExternal: 16.9,
      priceExternalReduced: 9.9,
      bookingStatus: "see_text",
    });
    expect(workouts[1]).toMatchObject({
      dayOfWeek: "Sat-Sun",
      startTime: "11:00",
      endTime: "22:00",
      location: "Grasweg 40, 24118 Kiel",
    });
    expect(workouts[0].details).toMatchObject({
      openingHours: [
        {
          label: "Monday - Friday",
          days: "Mon-Fri",
          startTime: "09:00",
          endTime: "23:00",
        },
        {
          label: "Saturday & Sunday",
          days: "Sat-Sun",
          startTime: "11:00",
          endTime: "22:00",
        },
      ],
      pricing: [
        {
          label: "Day Ticket",
          adult: 16.9,
          discounted: 12.9,
          children: 9.9,
        },
        {
          label: "Family Ticket",
          note: "Max. 4 people",
          flat: 34.9,
        },
      ],
      pricingNotes: [
        "All prices are in euros and include VAT.",
        "*Children: Ages 4 to 13 (inclusive).",
      ],
    });
  });
});
