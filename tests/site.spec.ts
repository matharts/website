import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { GET as getApiCatalog } from "../src/pages/.well-known/api-catalog";
import { GET as getSiteSchema } from "../src/pages/schema/site.json";
import { GET as getSchemaMap } from "../src/pages/schemamap.xml";

function projectSearch(page: Page) {
  const dialog = page.getByRole("dialog", {
    name: "检索项目与页面",
    includeHidden: true
  });

  return {
    trigger: page.getByRole("button", { name: "检索项目" }).first(),
    dialog,
    input: dialog.getByRole("combobox", {
      name: "检索项目与页面",
      includeHidden: true
    }),
    status: dialog.getByRole("status", { includeHidden: true }),
    closeButton: dialog.getByRole("button", {
      name: "关闭检索",
      includeHidden: true
    })
  };
}

test.beforeEach(async ({ page }) => {
  await page.goto("/");
});

test("serves complete metadata and crawl discovery files", async ({ page, request }) => {
  await expect(page).toHaveTitle("MathArts · 中国数术数字基础设施");
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    "href",
    "https://matharts.cn/"
  );
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute(
    "content",
    "https://matharts.cn/preview.jpg"
  );
  await expect(page.locator('meta[property="og:image:width"]')).toHaveAttribute("content", "1200");
  await expect(page.locator('meta[property="og:image:height"]')).toHaveAttribute("content", "675");
  await expect(page.locator('meta[property="og:image:alt"]')).toHaveAttribute(
    "content",
    "MathArts 中国数术数字基础设施官网预览"
  );
  const themeColor = await page.locator('meta[name="theme-color"]').getAttribute("content");
  const [computedThemeColor, computedInkToken] = await page.evaluate((value) => {
    const probe = document.createElement("span");
    document.body.append(probe);
    probe.style.color = value ?? "";
    const themeColorValue = getComputedStyle(probe).color;
    probe.style.color = "var(--color-ink)";
    const inkTokenValue = getComputedStyle(probe).color;
    probe.remove();
    return [themeColorValue, inkTokenValue];
  }, themeColor);
  expect(computedThemeColor).toBe(computedInkToken);
  await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute(
    "content",
    "summary_large_image"
  );
  await expect(page.locator('meta[name^="twitter:"]:not([name="twitter:card"])')).toHaveCount(0);
  await expect(page.locator('link[rel="alternate"][type="text/plain"]')).toHaveAttribute(
    "href",
    "/llms.txt"
  );
  const structuredData = JSON.parse(
    (await page.locator('script[type="application/ld+json"]').textContent()) ?? "{}"
  );
  expect(structuredData["@context"]).toBe("https://schema.org");
  const graph = structuredData["@graph"] as Array<Record<string, unknown>>;
  expect(graph).toHaveLength(4);
  const organization = graph.find((node) => node["@type"] === "Organization");
  const website = graph.find((node) => node["@type"] === "WebSite");
  const image = graph.find((node) => node["@type"] === "ImageObject");
  const webpage = graph.find((node) => node["@type"] === "WebPage");
  expect(organization).toMatchObject({
    "@id": "https://matharts.cn/#organization",
    name: "MathArts",
    url: "https://matharts.cn/"
  });
  expect(website).toMatchObject({
    "@id": "https://matharts.cn/#website",
    url: "https://matharts.cn/",
    publisher: { "@id": "https://matharts.cn/#organization" }
  });
  expect(image).toMatchObject({
    "@id": "https://matharts.cn/preview.jpg#primaryimage",
    url: "https://matharts.cn/preview.jpg",
    contentUrl: "https://matharts.cn/preview.jpg",
    width: 1200,
    height: 675
  });
  expect(webpage).toMatchObject({
    "@id": "https://matharts.cn/#webpage",
    url: "https://matharts.cn/",
    isPartOf: { "@id": "https://matharts.cn/#website" },
    about: { "@id": "https://matharts.cn/#organization" },
    primaryImageOfPage: { "@id": "https://matharts.cn/preview.jpg#primaryimage" }
  });

  const robots = await request.get("/robots.txt");
  expect(robots.ok()).toBe(true);
  const robotsText = await robots.text();
  expect(robotsText).toContain("Sitemap: https://matharts.cn/sitemap-index.xml");
  expect(robotsText).not.toContain("Schemamap:");

  const schema = await request.get("/schema/site.json");
  expect(schema.ok()).toBe(true);
  expect(schema.headers()["content-type"]).toContain("application/json");
  const schemaGraph = (await schema.json()) as {
    "@context": string;
    "@graph": Array<Record<string, unknown>>;
  };
  expect(schemaGraph["@context"]).toBe("https://schema.org");
  expect(schemaGraph["@graph"]).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        "@id": "https://matharts.cn/#organization",
        "@type": "Organization"
      }),
      expect.objectContaining({
        "@id": "https://matharts.cn/#website",
        "@type": "WebSite"
      }),
      expect.objectContaining({
        "@id": "https://matharts.cn/#webpage",
        "@type": "WebPage"
      })
    ])
  );

  const schemaMap = await request.get("/schemamap.xml");
  expect(schemaMap.ok()).toBe(true);
  expect(schemaMap.headers()["content-type"]).toMatch(/^(?:application|text)\/xml/);
  const schemaMapXML = await schemaMap.text();
  expect(schemaMapXML).toContain("<loc>https://matharts.cn/schema/site.json</loc>");
  expect(schemaMapXML).toContain("<lastmod>2026-07-19</lastmod>");

  const apiCatalog = await request.get("/.well-known/api-catalog");
  expect(apiCatalog.ok()).toBe(true);
  expect(await apiCatalog.json()).toEqual({
    linkset: [
      {
        anchor: "https://matharts.cn/schema/site.json",
        type: [{ href: "https://schema.org/WebSite" }]
      },
      { anchor: "https://matharts.cn/schemamap.xml" }
    ]
  });

  const llms = await request.get("/llms.txt");
  expect(llms.ok()).toBe(true);
  expect(await llms.text()).toContain("[MathArts 首页](https://matharts.cn/)");

  const sitemapIndex = await request.get("/sitemap-index.xml");
  expect(sitemapIndex.ok()).toBe(true);
  const sitemapIndexXML = await sitemapIndex.text();
  const sitemapURL = sitemapIndexXML.match(
    /<loc>(https:\/\/matharts\.cn\/sitemap-0\.xml)<\/loc>/
  )?.[1];
  expect(sitemapURL).toBe("https://matharts.cn/sitemap-0.xml");

  const sitemap = await request.get(new URL(sitemapURL!).pathname);
  expect(sitemap.ok()).toBe(true);
  expect(await sitemap.text()).toContain("<loc>https://matharts.cn/</loc>");
});

test("declares structured-data media types at the route boundary", async () => {
  const schemaResponse = await getSiteSchema({} as never);
  expect(schemaResponse.headers.get("content-type")).toBe("application/ld+json");

  const apiCatalogResponse = await getApiCatalog({} as never);
  expect(apiCatalogResponse.headers.get("content-type")).toBe("application/linkset+json");

  const schemaMapResponse = await getSchemaMap({} as never);
  expect(schemaMapResponse.headers.get("content-type")).toBe("application/xml");
});

test("serves a custom non-indexable 404 page", async ({ page }) => {
  const response = await page.goto("/this-page-does-not-exist");

  expect(response?.status()).toBe(404);
  await expect(page).toHaveTitle("页面未找到 · MathArts");
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
    "content",
    /(^|,\s*)noindex(,|$)/
  );
  await expect(page.locator('link[rel="canonical"]')).toHaveCount(0);
  await expect(page.locator('script[type="application/ld+json"]')).toHaveCount(0);
  await expect(page.locator('script[type="module"]')).toHaveCount(0);
});

test("keeps navigation targets and search projections consistent", async ({ page }) => {
  const navigation = page.getByRole("navigation", { name: "页面索引" });
  const sectionHrefs = await navigation
    .getByRole("link")
    .evaluateAll((links) => links.map((link) => link.getAttribute("href")));

  expect(sectionHrefs).toEqual(["#top", "#about", "#work", "#building", "#method", "#participate"]);
  for (const href of sectionHrefs) {
    await expect(page.locator(href!)).toHaveCount(1);
  }

  const search = projectSearch(page);
  await search.trigger.click();
  await expect(search.dialog.getByRole("option")).toHaveCount(11);
  await expect(search.status).toHaveText("6 个项目 · 5 个导航入口");
  await expect(
    search.dialog.getByRole("option", { name: "ziwei，标准驱动紫微斗数排盘引擎，新标签页打开" })
  ).toBeVisible();
});

test("integrates readable section labels into the desktop side rail", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  const navigation = page.getByRole("navigation", { name: "页面索引" });
  const labels = navigation.locator(".rail__links span");
  const aboutLink = navigation.getByRole("link", { name: "组织" });
  const workLink = navigation.getByRole("link", { name: "成果" });

  await page.locator("#about").scrollIntoViewIfNeeded();
  await expect(aboutLink).toHaveAttribute("aria-current", "location");
  await expect(labels).toHaveCount(5);
  for (const label of await labels.all()) {
    await expect(label).toHaveCSS("position", "static");
    await expect(label).toBeVisible();
  }

  await workLink.hover();
  await expect(aboutLink.locator("span")).toBeVisible();
  await expect(workLink.locator("span")).toBeVisible();
  await expect(aboutLink.locator("i")).toHaveCSS("background-color", "rgba(0, 0, 0, 0)");
  await expect(workLink.locator("i")).not.toHaveCSS("background-color", "rgba(0, 0, 0, 0)");
  await expect(workLink.locator("i")).toHaveCSS("transition-property", "background-color");
});

test("presents active construction without invented progress claims", async ({ page }) => {
  const building = page.getByRole("region", { name: /仍在建设，\s*也持续公开。/ });

  await expect(building).toBeVisible();
  await expect(building.getByText("规则工程", { exact: true })).toBeVisible();
  await expect(building.getByText("历法与数术", { exact: true })).toBeVisible();
  await expect(building.getByText("开发基础设施", { exact: true })).toBeVisible();
  await expect(building.getByText("开放治理", { exact: true })).toBeVisible();
  await expect(building.locator("svg.development-diagram")).toHaveAttribute("aria-hidden", "true");
  const diagram = building.locator("[data-building-diagram]");
  const diagramHub = diagram.locator(".development-diagram__hub");
  await expect(diagramHub).not.toHaveCSS("stroke", "none");
  await expect(diagram).toHaveAttribute("data-motion-ready", "true");
  await diagram.scrollIntoViewIfNeeded();
  await expect(diagram).toHaveAttribute("data-revealed", "true");
  await expect(building.getByRole("link", { name: "浏览组织仓库 ↗" })).toHaveAttribute(
    "href",
    "https://github.com/matharts"
  );
  await expect(building.getByRole("link")).toHaveCount(1);
  await expect(
    page.locator("#participate").getByRole("link", { name: "参与讨论 ↗" })
  ).toHaveAttribute("href", "https://github.com/orgs/matharts/discussions");
});

test("keeps combobox focus on the input and activates an internal result", async ({ page }) => {
  const search = projectSearch(page);

  await search.trigger.click();
  await expect(search.dialog).toBeVisible();
  await expect(search.input).toBeFocused();
  await expect(search.input).toHaveAttribute("aria-expanded", "true");
  await expect(search.status).toHaveText("6 个项目 · 5 个导航入口");

  await search.input.fill("了解组织");
  await expect(search.status).toHaveText("1 项匹配");
  const activeOption = search.dialog.getByRole("option", { name: /了解组织/ });
  const activeId = await search.input.getAttribute("aria-activedescendant");
  expect(activeId).toBeTruthy();
  expect(await activeOption.getAttribute("id")).toBe(activeId);
  await expect(activeOption).toHaveAttribute("tabindex", "-1");
  await expect(activeOption).toHaveAttribute("aria-selected", "true");

  await search.input.press("Enter");
  await expect(search.dialog).not.toBeVisible();
  await expect(page).toHaveURL(/#about$/);
});

test("moves the command selection indicator without moving result rows", async ({ page }) => {
  const search = projectSearch(page);

  await search.trigger.click();
  const indicator = search.dialog.locator(".command__selection");
  const firstOption = search.dialog.getByRole("option").first();
  await expect(indicator).toHaveCSS("position", "absolute");
  await expect(firstOption).toHaveCSS("position", "relative");
  await expect(indicator).toHaveAttribute("data-ready", "true");
  const initialPosition = await indicator.evaluate((element) =>
    element.style.getPropertyValue("--command-selection-y")
  );

  await search.input.press("ArrowDown");

  await expect
    .poll(() =>
      indicator.evaluate((element) => element.style.getPropertyValue("--command-selection-y"))
    )
    .not.toBe(initialPosition);
  await expect(search.dialog.getByRole("option").nth(1)).toHaveAttribute("aria-selected", "true");
});

test("keeps the development diagram static when spatial motion is reduced", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.reload();

  const diagram = page.locator("[data-building-diagram]");
  await expect(diagram).not.toHaveAttribute("data-motion-ready", "true");
  await expect(diagram).not.toHaveAttribute("data-revealed", "true");

  await page.setViewportSize({ width: 1280, height: 800 });
  const railMarker = page
    .getByRole("navigation", { name: "页面索引" })
    .getByRole("link", { name: "组织" })
    .locator("i");
  await expect(railMarker).toHaveCSS("transition-property", "background-color");
});

test("uses purposeful reduced-motion-safe spatial backgrounds", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });

  const astronomy = page.locator('[data-spatial-backdrop="astronomy"]');
  const computation = page.locator('[data-spatial-backdrop="computation"]');
  await expect(page.locator("[data-spatial-backdrop]")).toHaveCount(2);
  await expect(astronomy).toHaveAttribute("aria-hidden", "true");
  await expect(computation).toHaveAttribute("aria-hidden", "true");
  await expect(astronomy).toBeVisible();
  await expect(computation).toBeVisible();
  await expect(astronomy).toHaveCSS("opacity", "0.52");
  await expect(computation).toHaveCSS("opacity", "0.5");

  const [astronomyBox, markBox, actionsBox, computationBox, principlesGridBox] = await Promise.all([
    astronomy.boundingBox(),
    page.locator(".hero__mark").boundingBox(),
    page.locator(".hero__actions").boundingBox(),
    computation.boundingBox(),
    page.locator(".principles__grid").boundingBox()
  ]);
  expect(astronomyBox).not.toBeNull();
  expect(markBox).not.toBeNull();
  expect(actionsBox).not.toBeNull();
  expect(computationBox).not.toBeNull();
  expect(principlesGridBox).not.toBeNull();
  expect(astronomyBox!.width).toBeGreaterThan(430);
  expect(astronomyBox!.y).toBeGreaterThanOrEqual(markBox!.y + markBox!.height);
  expect(astronomyBox!.y + astronomyBox!.height).toBeLessThan(actionsBox!.y);
  expect(computationBox!.width).toBeGreaterThan(340);
  expect(computationBox!.x + computationBox!.width).toBeLessThanOrEqual(1280);
  expect(computationBox!.y + computationBox!.height).toBeLessThanOrEqual(principlesGridBox!.y);

  await page.setViewportSize({ width: 960, height: 900 });
  const [mediumAstronomyBox, mediumComputationBox, principlesCopyBox] = await Promise.all([
    astronomy.boundingBox(),
    computation.boundingBox(),
    page.locator(".principles__head > p").boundingBox()
  ]);
  expect(mediumAstronomyBox).not.toBeNull();
  expect(mediumComputationBox).not.toBeNull();
  expect(principlesCopyBox).not.toBeNull();
  expect(mediumAstronomyBox!.width).toBeLessThanOrEqual(400);
  expect(mediumComputationBox!.width).toBeLessThanOrEqual(269);
  expect(mediumComputationBox!.x).toBeGreaterThanOrEqual(
    principlesCopyBox!.x + principlesCopyBox!.width
  );
  expect(mediumComputationBox!.x + mediumComputationBox!.width).toBeLessThanOrEqual(960);
  await expect(astronomy.locator(".spatial-backdrop__scene")).toHaveCSS(
    "animation-name",
    "spatial-orbit"
  );
  await expect(computation.locator(".spatial-backdrop__scene")).toHaveCSS(
    "animation-name",
    "spatial-lattice"
  );
  await expect(page.locator("canvas")).toHaveCount(0);

  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.reload();
  for (const scene of await page.locator(".spatial-backdrop__scene").all()) {
    await expect(scene).toHaveCSS("animation-name", "none");
  }

  await page.setViewportSize({ width: 375, height: 812 });
  await expect(astronomy).toBeHidden();
  await expect(computation).toBeHidden();
});

test("uses distinct structures across homepage sections", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  const splitSections = page.locator("main section.split");

  await expect(splitSections).toHaveCount(1);
  await expect(page.locator("#building.split")).toHaveCount(1);
  await expect(page.locator("#about.manifesto .manifesto__body")).toHaveCount(1);
  await expect(page.locator("#about.manifesto .manifesto__aside")).toHaveCount(1);
  const workTracks = page.locator("#work .work__catalog > .work-track");
  await expect(workTracks).toHaveCount(3);
  for (const track of await workTracks.all()) {
    await expect(track.locator(".work-track__projects > .project")).toHaveCount(2);
  }

  const [trackColumns, projectColumns] = await Promise.all([
    workTracks.first().evaluate((element) => getComputedStyle(element).gridTemplateColumns),
    workTracks
      .first()
      .locator(".work-track__projects")
      .evaluate((element) => getComputedStyle(element).gridTemplateColumns)
  ]);
  expect(trackColumns.split(" ")).toHaveLength(3);
  expect(projectColumns.split(" ")).toHaveLength(2);
  await expect(page.locator("#method.principles .principles__grid > li")).toHaveCount(4);
  await expect(
    page.locator("#participate.closing-actions .closing-actions__routes > div")
  ).toHaveCount(4);

  const [methodRatio, participateRatio] = await Promise.all(
    ["#method .principles__head", "#participate .closing-actions__intro"].map((selector) =>
      page.locator(selector).evaluate((element) => {
        const tracks = getComputedStyle(element)
          .gridTemplateColumns.split(" ")
          .map((track) => Number.parseFloat(track));
        return tracks.length === 2 ? tracks[0] / tracks[1] : null;
      })
    )
  );
  const usesSevenToFiveTemplate = (ratio: number | null) =>
    ratio !== null && Math.abs(ratio - 7 / 5) < 0.1;

  expect(usesSevenToFiveTemplate(methodRatio)).toBe(false);
  expect(usesSevenToFiveTemplate(participateRatio)).toBe(false);
});

test("turns participation routes into a responsive decision matrix", async ({ page }) => {
  const section = page.locator("#participate.closing-actions");
  const routes = section.locator(".closing-actions__routes");
  const footer = page.locator("footer.footer");
  const routePanels = routes.locator(":scope > div");
  const routeLinks = routePanels.locator("a");

  await page.setViewportSize({ width: 1280, height: 800 });
  await expect(section.locator(".closing-actions__intro > .closing-actions__guidance")).toHaveCount(
    1
  );
  await expect(section.locator(".closing-actions__body")).toHaveCount(0);
  await expect(routePanels).toHaveCount(4);
  await expect(routeLinks).toHaveCount(4);
  for (const panel of await routePanels.all()) {
    await expect(panel.locator("a")).toHaveCount(1);
    await expect(panel.locator(".closing-actions__description")).toHaveCount(1);
  }

  const [sectionColumns, desktopRouteColumns, desktopRouteHeights] = await Promise.all([
    section.evaluate((element) => getComputedStyle(element).gridTemplateColumns),
    routes.evaluate((element) => getComputedStyle(element).gridTemplateColumns),
    routePanels.evaluateAll((panels) => panels.map((panel) => panel.getBoundingClientRect().height))
  ]);
  expect(sectionColumns.split(" ")).toHaveLength(2);
  expect(desktopRouteColumns.split(" ")).toHaveLength(2);
  expect(desktopRouteHeights.every((height) => height >= 176)).toBe(true);
  await expect(section).not.toHaveCSS("border-bottom-width", "0px");
  await expect(footer).toHaveClass(/footer--joined/);
  await expect(footer).toHaveCSS("border-top-width", "0px");

  await page.setViewportSize({ width: 768, height: 900 });
  const tabletRouteColumns = await routes.evaluate(
    (element) => getComputedStyle(element).gridTemplateColumns
  );
  expect(tabletRouteColumns.split(" ")).toHaveLength(2);

  await page.setViewportSize({ width: 375, height: 812 });
  const mobileRouteColumns = await routes.evaluate(
    (element) => getComputedStyle(element).gridTemplateColumns
  );
  expect(mobileRouteColumns.split(" ")).toHaveLength(1);
});

test("keeps the compact hero close to one viewport tall", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });

  const heroToViewportRatio = await page.locator("#top").evaluate((hero) => {
    return hero.getBoundingClientRect().height / window.innerHeight;
  });

  expect(heroToViewportRatio).toBeLessThanOrEqual(1.45);
});

test("keeps narrow-screen Chinese copy readable and deliberately spaced", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });

  const leadMetrics = await page
    .locator(
      ".hero__statement > p, .manifesto__body > p, .work__head > p, .split__lead > p, .principles__head > p, .closing-actions__guidance"
    )
    .evaluateAll((elements) =>
      elements.map((element) => {
        const styles = getComputedStyle(element);
        const fontSize = Number.parseFloat(styles.fontSize);
        return {
          fontSize,
          lineHeightRatio: Number.parseFloat(styles.lineHeight) / fontSize
        };
      })
    );

  for (const metric of leadMetrics) {
    expect(metric.fontSize).toBeGreaterThanOrEqual(16);
    expect(metric.fontSize).toBeLessThan(18);
    expect(metric.lineHeightRatio).toBeGreaterThanOrEqual(1.65);
    expect(metric.lineHeightRatio).toBeLessThanOrEqual(1.75);
  }

  const supportingFontSizes = await page
    .locator(".project__description, .closing-actions__description, .footer > small")
    .evaluateAll((elements) =>
      elements.map((element) => Number.parseFloat(getComputedStyle(element).fontSize))
    );
  expect(supportingFontSizes.every((fontSize) => fontSize >= 14)).toBe(true);

  const sectionPadding = await page
    .locator(".manifesto, .work__head, .split__lead, .principles")
    .evaluateAll((elements) =>
      elements.map((element) => Number.parseFloat(getComputedStyle(element).paddingBlockStart))
    );
  expect(sectionPadding.every((padding) => padding >= 64 && padding <= 72)).toBe(true);
  await expect(page.locator(".closing-actions__routes")).toHaveCSS("margin-block-start", "64px");
});

test("keeps the participation heading composed at the desktop rail breakpoint", async ({
  page
}) => {
  await page.setViewportSize({ width: 960, height: 800 });

  const headingLines = await page.locator("#participate-title").evaluate((heading) => {
    const range = document.createRange();
    range.selectNodeContents(heading);
    return new Set(
      [...range.getClientRects()]
        .filter((rect) => rect.width > 0 && rect.height > 0)
        .map((rect) => Math.round(rect.top))
    ).size;
  });

  expect(headingLines).toBeLessThanOrEqual(3);
});

test("keeps a no-results command dialog open when Enter is pressed", async ({ page }) => {
  const search = projectSearch(page);
  const query = "不存在的命令面板结果";

  await search.trigger.click();
  await expect(search.dialog).toBeVisible();
  await expect(search.input).toBeFocused();

  await search.input.fill(query);
  await expect(search.status).toHaveText("零项匹配");
  await expect(search.input).not.toHaveAttribute("aria-activedescendant", /.+/);

  await search.input.press("Enter");

  await expect(search.dialog).toBeVisible();
  await expect(search.input).toBeFocused();
  await expect(search.input).toHaveValue(query);
  await expect(search.status).toHaveText("零项匹配");
});

test("restores focus and excludes listbox options from the tab sequence", async ({ page }) => {
  const search = projectSearch(page);

  await search.trigger.click();
  await expect(search.input).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(search.closeButton).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(search.trigger).toBeFocused();
});

test("closes a populated command dialog on the first Escape press", async ({ page }) => {
  const search = projectSearch(page);
  const main = page.locator("main");

  await search.trigger.click();
  await search.input.fill("历法");
  await expect
    .poll(() => main.evaluate((element) => element.closest("[inert]") !== null))
    .toBe(true);

  await search.input.press("Escape");

  await expect(search.dialog).not.toBeVisible();
  await expect(search.input).toHaveAttribute("aria-expanded", "false");
  await expect
    .poll(() => main.evaluate((element) => element.closest("[inert]") === null))
    .toBe(true);
  await expect(search.trigger).toBeFocused();
});

test("passes the baseline axe scan and serves optimized local images and fonts", async ({
  page
}) => {
  const accessibilityScan = await new AxeBuilder({ page }).analyze();
  expect(accessibilityScan.violations).toEqual([]);

  const imageSources = await page
    .locator('img[alt=""]')
    .evaluateAll((images) => images.map((image) => image.getAttribute("src")));
  expect(imageSources).toHaveLength(3);
  expect(imageSources.every((source) => source?.startsWith("/_astro/avatar."))).toBe(true);

  const heroImage = page.locator(".hero__mark img");
  await expect(heroImage).toHaveAttribute("loading", "eager");
  await expect(heroImage).toHaveAttribute("decoding", "sync");
  await expect(heroImage).toHaveAttribute("fetchpriority", "high");

  await page.evaluate(() => document.fonts.ready);

  const client = await page.context().newCDPSession(page);
  await client.send("DOM.enable");
  await client.send("CSS.enable");
  const { root } = await client.send("DOM.getDocument");
  const { nodeId } = await client.send("DOM.querySelector", {
    nodeId: root.nodeId,
    selector: ".hero__statement > p"
  });
  const { fonts } = await client.send("CSS.getPlatformFontsForNode", { nodeId });

  expect(
    fonts.some((font) => font.isCustomFont && font.familyName.startsWith("Noto Sans SC")),
    `Expected local Noto Sans SC; rendered fonts: ${fonts
      .map((font) => `${font.familyName} (${font.isCustomFont ? "custom" : "system"})`)
      .join(", ")}`
  ).toBe(true);

  const serifSelector = [
    ".mobile-head__brand",
    ".hero h1",
    ".hero__monogram",
    ".hero__proof dd",
    ".manifesto h2",
    ".manifesto__statement > span:first-child",
    ".manifesto__statement > strong",
    ".manifesto__criteria dt",
    ".work__head h2",
    ".work-track__intro h3",
    ".project strong",
    ".building__ledger dt",
    ".building__actions a",
    ".principles h2",
    ".principles__grid h3",
    ".closing-actions h2",
    ".closing-actions__routes a",
    ".footer__brand strong",
    ".command__search label",
    ".command__item strong",
    ".rail__brand"
  ].join(",");
  const { nodeIds } = await client.send("DOM.querySelectorAll", {
    nodeId: root.nodeId,
    selector: serifSelector
  });
  const serifFallbacks = (
    await Promise.all(
      nodeIds.map(async (serifNodeId) => {
        const usage = await client.send("CSS.getPlatformFontsForNode", {
          nodeId: serifNodeId
        });
        const { outerHTML } = await client.send("DOM.getOuterHTML", { nodeId: serifNodeId });
        return usage.fonts
          .filter((font) => font.glyphCount > 0 && !font.familyName.startsWith("Noto Serif SC"))
          .map((font) => ({ ...font, outerHTML }));
      })
    )
  ).flat();
  await client.detach();

  expect(
    serifFallbacks,
    `Expected all display glyphs to use local Noto Serif SC: ${serifFallbacks
      .map((font) => `${font.familyName} (${font.glyphCount} glyphs) in ${font.outerHTML}`)
      .join(", ")}`
  ).toEqual([]);

  const fontResources = await page.evaluate(() =>
    performance
      .getEntriesByType("resource")
      .map((entry) => entry.name)
      .filter((url) => /\.(?:woff2?|ttf)(?:$|\?)/.test(url))
  );
  expect(fontResources).toHaveLength(3);
  expect(fontResources.every((url) => new URL(url).pathname.startsWith("/_astro/fonts/"))).toBe(
    true
  );
  expect(fontResources.some((url) => /fonts\.(?:googleapis|gstatic)\.com/.test(url))).toBe(false);
});

test("loads the production page without console or runtime errors", async ({ page }) => {
  const errors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  page.on("pageerror", (error) => errors.push(error.message));

  await page.reload();
  expect(errors).toEqual([]);
});

test("closes the mobile menu after in-page navigation", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 800 });
  const menu = page.getByRole("banner", { name: "移动端导航" }).locator("details");
  await menu.locator("summary").click();
  await expect(menu).toHaveAttribute("open", "");
  await menu.getByRole("link", { name: "了解组织" }).click();
  await expect(menu).not.toHaveAttribute("open", "");
  await expect(page).toHaveURL(/#about$/);
  await expect(page.locator("#about-title")).toBeFocused();

  await menu.locator("summary").click();
  await menu.getByRole("button", { name: "检索项目" }).click();
  await expect(menu).not.toHaveAttribute("open", "");
  await expect(projectSearch(page).dialog).toBeVisible();
  await expect(projectSearch(page).input).toBeFocused();
});

test("moves focus to the main landmark from the skip link", async ({ page }) => {
  const skipLink = page.getByRole("link", { name: "跳到主要内容" });

  await skipLink.focus();
  await skipLink.press("Enter");

  await expect(page.locator("#main")).toBeFocused();
});

test("keeps compact layouts and clickable text on one line", async ({ page }) => {
  for (const width of [320, 375, 414, 768]) {
    await page.setViewportSize({ width, height: 800 });
    await expect
      .poll(() =>
        page.evaluate(() => ({
          clientWidth: document.documentElement.clientWidth,
          scrollWidth: document.documentElement.scrollWidth
        }))
      )
      .toEqual({ clientWidth: width, scrollWidth: width });

    const wrappedClickableText = await page.locator("a, button, summary").evaluateAll((elements) =>
      elements.flatMap((element) => {
        if (!(element instanceof HTMLElement) || element.getClientRects().length === 0) return [];

        const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
        const lineTops = new Set<number>();
        let textNode = walker.nextNode();
        while (textNode) {
          if (textNode.textContent?.trim()) {
            const range = document.createRange();
            range.selectNodeContents(textNode);
            for (const rect of range.getClientRects()) {
              if (rect.width > 0 && rect.height > 0) lineTops.add(Math.round(rect.top));
            }
          }
          textNode = walker.nextNode();
        }

        return lineTops.size > 1 ? [element.textContent?.trim() || element.tagName] : [];
      })
    );
    expect(wrappedClickableText, `wrapped clickable text at ${width}px`).toEqual([]);
  }
});
