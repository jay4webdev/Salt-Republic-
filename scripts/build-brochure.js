const fs = require("fs");
const path = require("path");
const { PDFDocument, rgb, StandardFonts } = require("pdf-lib");

async function generateBrochure() {
  const pdfDoc = await PDFDocument.create();

  // Standard Fonts
  const fontHelvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontHelveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontHelveticaOblique = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);

  // Helper colors
  const black = rgb(0.08, 0.08, 0.08);
  const darkNavy = rgb(0.03, 0.1, 0.16);
  const mutedGrey = rgb(0.35, 0.38, 0.42);
  const oceanTeal = rgb(0.08, 0.58, 0.65);
  const lightGrey = rgb(0.94, 0.95, 0.96);
  const white = rgb(1, 1, 1);
  const gold = rgb(0.85, 0.65, 0.13);

  // Load available yacht images
  const readImg = (name) => fs.readFileSync(path.join(__dirname, "../public/images", name));
  const imgHero = await pdfDoc.embedJpg(readImg("hero.jpg"));
  const imgYachtExt = await pdfDoc.embedJpg(readImg("yacht-exterior.jpg"));
  const imgYachtCab = await pdfDoc.embedJpg(readImg("yacht-cabin.jpg"));
  const imgDining = await pdfDoc.embedJpg(readImg("dining.jpg"));
  const imgSandbank = await pdfDoc.embedJpg(readImg("sandbank.jpg"));
  const imgSunset = await pdfDoc.embedJpg(readImg("sunset.jpg"));
  const imgSnorkeling = await pdfDoc.embedJpg(readImg("snorkeling.jpg"));
  const imgToys = await pdfDoc.embedJpg(readImg("toys.jpg"));
  const imgInterior = await pdfDoc.embedJpg(readImg("yacht-interior.jpg"));

  // Page dimensions (Letter: 612 x 792)
  const W = 612;
  const H = 792;

  // -------------------------------------------------------------
  // PAGE 1: RATES & TRIP OPTIONS
  // -------------------------------------------------------------
  const p1 = pdfDoc.addPage([W, H]);

  // Left sidebar background strip (ocean teal accent)
  p1.drawRectangle({
    x: 0,
    y: 0,
    width: 22,
    height: H,
    color: oceanTeal,
  });

  // Header Title
  p1.drawText("Salt Republic", {
    x: 180,
    y: 735,
    size: 38,
    font: fontHelveticaBold,
    color: black,
  });
  p1.drawText("for all your Adventures at Sea in the Maldives....", {
    x: 235,
    y: 715,
    size: 13,
    font: fontHelveticaOblique,
    color: mutedGrey,
  });

  // Left composite image stack
  const leftX = 42;
  const leftW = 205;
  const imgH = 145;

  p1.drawImage(imgHero, { x: leftX, y: 550, width: leftW, height: imgH });
  p1.drawImage(imgSandbank, { x: leftX, y: 395, width: leftW, height: imgH });
  p1.drawImage(imgSunset, { x: leftX, y: 240, width: leftW, height: imgH });
  p1.drawImage(imgToys, { x: leftX, y: 85, width: leftW, height: imgH });

  // Border frames around left photos
  [550, 395, 240, 85].forEach((yPos) => {
    p1.drawRectangle({
      x: leftX,
      y: yPos,
      width: leftW,
      height: imgH,
      borderColor: white,
      borderWidth: 1.5,
    });
  });

  // Right column: Content & Pricing
  const rightX = 265;
  let curY = 675;

  // Services list
  const services = [
    "Full Day Trips to Sand Banks,",
    "Snorkeling Trips,",
    "Whale Sharks, Turtles,",
    "& Dolphin watching Trips,",
    "Fishing Trips,",
    "Overnight Trips to other Atolls,",
    "Sunset Dinner Cruises,",
    "Surf Trips,",
    "Personal Customised Trips.",
  ];

  services.forEach((s) => {
    p1.drawText(s, {
      x: rightX,
      y: curY,
      size: 15,
      font: fontHelveticaBold,
      color: darkNavy,
    });
    curY -= 19;
  });

  curY -= 10;
  p1.drawText(
    "Any or some of the above activities you like, can be scheduled during",
    { x: rightX, y: curY, size: 9, font: fontHelvetica, color: mutedGrey }
  );
  curY -= 13;
  p1.drawText(
    "a Full Day, Half Day or Overnight trip. Activities will be limited to time capacity.",
    { x: rightX, y: curY, size: 9, font: fontHelvetica, color: mutedGrey }
  );
  curY -= 13;
  p1.drawText("*You can choose and discuss your activities with our Team before trip.", {
    x: rightX,
    y: curY,
    size: 9.5,
    font: fontHelveticaBold,
    color: oceanTeal,
  });

  curY -= 24;

  // Pricing Blocks
  const drawPricingBox = (title, timing, price1, price2) => {
    p1.drawText(title, {
      x: rightX,
      y: curY,
      size: 12.5,
      font: fontHelveticaBold,
      color: darkNavy,
    });
    curY -= 14;
    p1.drawText(timing, {
      x: rightX,
      y: curY,
      size: 9.5,
      font: fontHelvetica,
      color: mutedGrey,
    });
    curY -= 16;
    p1.drawText(price1, {
      x: rightX,
      y: curY,
      size: 13,
      font: fontHelveticaBold,
      color: black,
    });
    if (price2) {
      curY -= 13;
      p1.drawText(price2, {
        x: rightX,
        y: curY,
        size: 9,
        font: fontHelveticaOblique,
        color: mutedGrey,
      });
    }
    curY -= 20;
  };

  drawPricingBox(
    "Full Day Trips (Max 17 pax for 12 hrs)",
    "Recommended 7am - 7pm in Malé Atoll",
    "US$ 1000 (8 pax or below) - US$ 1600 (over 8 pax)"
  );

  drawPricingBox(
    "Half Day Trips (Max 17 pax for 7 hrs)",
    "Recommended 3pm - 10pm in Malé Atoll",
    "US$ 800 (8 pax or below) - US$ 1000 (over 8 pax)"
  );

  drawPricingBox(
    "Overnight Trips (Max 10 pax for 28 hrs)",
    "Recommended 2pm - 6pm (next day) in Malé Atoll",
    "US$ 1800.00"
  );

  drawPricingBox(
    "Overnight Trips (Max 10 pax for 36 hrs)",
    "Recommended 9am - 9pm (next day) in Malé Atoll",
    "US$ 2200.00",
    "* To other Atolls rates depend on Travel distance."
  );

  p1.drawText("* Trips exceeding 1 night, discuss with our Team to customise your needs.", {
    x: rightX,
    y: curY,
    size: 9,
    font: fontHelveticaBold,
    color: darkNavy,
  });
  curY -= 18;
  p1.drawText("* Trip charges are for durations mentioned. Trip starting times will be", {
    x: rightX,
    y: curY,
    size: 8.5,
    font: fontHelvetica,
    color: mutedGrey,
  });
  curY -= 11;
  p1.drawText("according to customer requirements.", {
    x: rightX,
    y: curY,
    size: 8.5,
    font: fontHelvetica,
    color: mutedGrey,
  });

  // -------------------------------------------------------------
  // PAGE 2: INCLUSIONS, MEALS & NON-MOTORISED TOYS (FREE)
  // -------------------------------------------------------------
  const p2 = pdfDoc.addPage([W, H]);

  // Left vertical ocean ribbon with text
  p2.drawRectangle({ x: 0, y: 0, width: 44, height: H, color: oceanTeal });
  p2.drawText("Non motorised equipments are FREE for use during trips", {
    x: 28,
    y: 120,
    size: 15,
    font: fontHelveticaBold,
    color: white,
    rotate: { type: "degrees", angle: 90 },
  });

  // Top Left: What's included in your trips
  const colLeftX = 64;
  p2.drawText("Whats included in your trips", {
    x: colLeftX,
    y: 740,
    size: 18,
    font: fontHelveticaBold,
    color: darkNavy,
  });

  const inclusions = [
    "- Water, Soft drinks are available on all your trips.",
    "- Towels available if required.",
    "- BBQ Grill is available for your own use during Fishing trips.",
    "- Fishing Gear, Reels, bait etc available for Fishing trips.",
    "- Tables, Umbrellas & Cool box included for Sand bank Trips",
  ];

  let incY = 715;
  inclusions.forEach((inc) => {
    p2.drawText(inc, {
      x: colLeftX,
      y: incY,
      size: 9.5,
      font: fontHelvetica,
      color: darkNavy,
    });
    incY -= 17;
  });

  // Meal Options
  incY -= 10;
  p2.drawText("Meal Options", {
    x: colLeftX,
    y: incY,
    size: 16,
    font: fontHelveticaBold,
    color: darkNavy,
  });
  incY -= 20;

  const meals = [
    "- All overnight trips include breakfast from our set Menu.",
    "- Lunch, Dinner or other meals are available on board upon request",
    "  (advance booking required). $10/pax per Meal.",
    "- Meal preparations by our Boat Chef $50/day, if customers want to",
    "  bring their own food supplies.",
    "- Sunset Dinner Cruises includes Dinner from our set Menu.",
  ];

  meals.forEach((m) => {
    p2.drawText(m, {
      x: colLeftX,
      y: incY,
      size: 9.2,
      font: fontHelvetica,
      color: darkNavy,
    });
    incY -= 15;
  });

  // Top Right Images: Drinks & BBQ Grill
  p2.drawImage(imgDining, { x: 395, y: 645, width: 195, height: 110 });
  p2.drawImage(imgSunset, { x: 395, y: 515, width: 195, height: 115 });

  // Section Heading: Onboard Activities / Equipment available on your trips
  p2.drawText("Onboard Activities / Equipment available on your trips", {
    x: colLeftX,
    y: 475,
    size: 17,
    font: fontHelveticaBold,
    color: darkNavy,
  });

  // 6 Equipment photo grid
  const gridW = 255;
  const gridH = 96;

  // Row 1
  p2.drawText("Inflatable SUP boards", { x: colLeftX + 50, y: 450, size: 10, font: fontHelvetica, color: darkNavy });
  p2.drawText("Snorkelling Gear", { x: 335 + 70, y: 450, size: 10, font: fontHelvetica, color: darkNavy });
  p2.drawImage(imgToys, { x: colLeftX, y: 345, width: gridW, height: gridH });
  p2.drawImage(imgSnorkeling, { x: 335, y: 345, width: gridW, height: gridH });

  // Row 2
  p2.drawText("Inflatable Seating paddle boards", { x: colLeftX + 30, y: 325, size: 10, font: fontHelvetica, color: darkNavy });
  p2.drawText("Beach Umbrellas & Cool Box", { x: 335 + 50, y: 325, size: 10, font: fontHelvetica, color: darkNavy });
  p2.drawImage(imgSandbank, { x: colLeftX, y: 220, width: gridW, height: gridH });
  p2.drawImage(imgHero, { x: 335, y: 220, width: gridW, height: gridH });

  // Row 3
  p2.drawText("Inflatable slides & Trampolines", { x: colLeftX + 40, y: 200, size: 10, font: fontHelvetica, color: darkNavy });
  p2.drawText("Floaties", { x: 335 + 105, y: 200, size: 10, font: fontHelvetica, color: darkNavy });
  p2.drawImage(imgToys, { x: colLeftX, y: 95, width: gridW, height: gridH });
  p2.drawImage(imgSandbank, { x: 335, y: 95, width: gridW, height: gridH });

  // -------------------------------------------------------------
  // PAGE 3: MOTORISED EQUIPMENT FOR RENT
  // -------------------------------------------------------------
  const p3 = pdfDoc.addPage([W, H]);

  p3.drawRectangle({ x: 0, y: 0, width: 44, height: H, color: oceanTeal });
  p3.drawText("Motorised equipments are available for rent during trips based on usage.", {
    x: 28,
    y: 80,
    size: 14.5,
    font: fontHelveticaBold,
    color: white,
    rotate: { type: "degrees", angle: 90 },
  });

  // Heading 1: Jetskis
  p3.drawText("Jetskis and rides using Jetskis for US$150 per hour", {
    x: 145,
    y: 745,
    size: 15,
    font: fontHelveticaBold,
    color: darkNavy,
  });

  // Jetski images
  p3.drawImage(imgYachtExt, { x: 65, y: 550, width: 250, height: 180 });
  p3.drawImage(imgToys, { x: 330, y: 550, width: 250, height: 180 });

  p3.drawImage(imgHero, { x: 65, y: 380, width: 250, height: 155 });
  p3.drawImage(imgSandbank, { x: 330, y: 380, width: 250, height: 155 });

  // Heading 2: Battery Operated
  p3.drawText("Battery Operated Equipment for US$30 per hour", {
    x: 165,
    y: 350,
    size: 15,
    font: fontHelveticaBold,
    color: darkNavy,
  });

  // Sub-items
  p3.drawImage(imgSnorkeling, { x: 65, y: 200, width: 250, height: 135 });
  p3.drawImage(imgToys, { x: 330, y: 200, width: 250, height: 135 });

  p3.drawText("Kids electric surf boards", { x: 130, y: 185, size: 10, font: fontHelvetica, color: darkNavy });
  p3.drawText("Sublue Underwater Scooters", { x: 385, y: 185, size: 10, font: fontHelvetica, color: darkNavy });

  p3.drawImage(imgSunset, { x: 65, y: 40, width: 250, height: 135 });
  p3.drawImage(imgSnorkeling, { x: 330, y: 40, width: 250, height: 135 });

  p3.drawText("Foil board", { x: 165, y: 25, size: 10, font: fontHelvetica, color: darkNavy });
  p3.drawText("Stermay Underwater Scooter / SUP motor", { x: 350, y: 25, size: 10, font: fontHelvetica, color: darkNavy });

  // -------------------------------------------------------------
  // PAGE 4: OVERNIGHT FACILITIES & FISHING GEAR
  // -------------------------------------------------------------
  const p4 = pdfDoc.addPage([W, H]);

  p4.drawText("Facilities available for Overnight trips", {
    x: 55,
    y: 745,
    size: 19,
    font: fontHelveticaBold,
    color: darkNavy,
  });
  p4.drawText("Air conditioned Rooms and Bathrooms onboard", {
    x: 55,
    y: 723,
    size: 12.5,
    font: fontHelvetica,
    color: mutedGrey,
  });

  // Cabin photos
  p4.drawImage(imgYachtCab, { x: 55, y: 505, width: 240, height: 205 });
  p4.drawImage(imgInterior, { x: 315, y: 505, width: 240, height: 205 });

  // Section 2: Big game fishing & trolling
  p4.drawText("Additional Fishing Gear for Big game Fishing & Trolling", {
    x: 55,
    y: 470,
    size: 16,
    font: fontHelveticaBold,
    color: darkNavy,
  });

  p4.drawImage(imgSunset, { x: 55, y: 260, width: 240, height: 195 });
  p4.drawImage(imgYachtExt, { x: 315, y: 260, width: 240, height: 195 });

  // Section 3: Inflatable Outboard Lounge
  p4.drawText("Additional outboard Lounge (on request for long trips)", {
    x: 55,
    y: 230,
    size: 16,
    font: fontHelveticaBold,
    color: darkNavy,
  });

  p4.drawImage(imgHero, { x: 55, y: 40, width: 240, height: 175 });
  p4.drawImage(imgSandbank, { x: 315, y: 40, width: 240, height: 175 });

  // Save PDF
  const pdfBytes = await pdfDoc.save();
  const outPath = path.join(__dirname, "../public/packages/salt-republic-rates-and-packages.pdf");
  fs.writeFileSync(outPath, pdfBytes);
  console.log("Successfully generated brochure at:", outPath, "(", pdfBytes.length, "bytes )");

  // Also replace / update existing salt-republic-usd-package.pdf so any default references get the new content
  const fallbackPath = path.join(__dirname, "../public/packages/salt-republic-usd-package.pdf");
  fs.writeFileSync(fallbackPath, pdfBytes);
  console.log("Also updated fallback at:", fallbackPath);
}

generateBrochure().catch((err) => {
  console.error("Brochure generation failed:", err);
  process.exit(1);
});
