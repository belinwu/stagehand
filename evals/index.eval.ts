import { Eval } from "braintrust";
import { Stagehand } from "../lib";
import { z } from "zod";

const vanta = async () => {
  const stagehand = new Stagehand({ env: "LOCAL" });
  await stagehand.init();

  await stagehand.page.goto("https://www.vanta.com/");
  await stagehand.waitForSettledDom();

  const observation = await stagehand.observe("find the request demo button");

  if (!observation) return false;

  const observationResult = await stagehand.page
    .locator(stagehand.observations[observation].result)
    .first()
    .innerHTML();

  const expectedLocator = `body > div.page-wrapper > div.nav_component > div.nav_element.w-nav > div.padding-global > div > div > nav > div.nav_cta-wrapper.is-new > a.nav_cta-button-desktop.is-smaller.w-button`;

  const expectedResult = await stagehand.page
    .locator(expectedLocator)
    .first()
    .innerHTML();

  await stagehand.context.close();

  return observationResult == expectedResult;
};

const vanta_h = async () => {
  const stagehand = new Stagehand({ env: "LOCAL" });
  await stagehand.init();

  await stagehand.page.goto("https://www.vanta.com/");
  await stagehand.waitForSettledDom();

  const observation = await stagehand.observe("find the buy now button");

  await stagehand.context.close();

  // we should have no saved observation since the element shouldn't exist
  return observation === null;
};

const simple_google_search = async () => {
  const stagehand = new Stagehand({ env: "LOCAL" });
  await stagehand.init();

  await stagehand.page.goto("https://www.google.com");

  await stagehand.act({
    action: 'Search for "OpenAI"',
  });

  const expectedUrl = "https://www.google.com/search?q=OpenAI";
  const currentUrl = await stagehand.page.url();
  await stagehand.context.close();

  return currentUrl.startsWith(expectedUrl);
};

const peeler_simple = async () => {
  const stagehand = new Stagehand({ env: "LOCAL" });
  await stagehand.init();

  await stagehand.page.goto(`file://${process.cwd()}/evals/assets/peeler.html`);
  await stagehand.waitForSettledDom();

  await stagehand.act({ action: "add the peeler to cart" });

  const successMessageLocator = stagehand.page.locator(
    'text="Congratulations, you have 1 A in your cart"',
  );
  const isVisible = await successMessageLocator.isVisible();

  await stagehand.context.close();
  return isVisible;
};

const peeler_complex = async () => {
  const stagehand = new Stagehand({
    env: "LOCAL",
    verbose: true,
  });
  await stagehand.init();

  await stagehand.page.goto(`https://chefstoys.com/`);

  await stagehand.act({
    action: "search for peelers",
  });

  await stagehand.act({
    action: 'click on the first "OXO" brand peeler',
  });

  const { price } = await stagehand.extract({
    instruction: "get the price of the peeler",
    schema: z.object({ price: z.number().nullable() }),
    modelName: "gpt-4o-2024-08-06",
  });

  await stagehand.context.close();

  return price !== null;
};

const extract_collaborators_from_github_repository = async () => {
  const stagehand = new Stagehand({ env: "LOCAL", verbose: 1 });
  await stagehand.init();

  await stagehand.page.goto("https://github.com/facebook/react");
  await stagehand.act({
    action: "find the contributors section",
  });

  await stagehand.waitForSettledDom();

  const { contributors } = await stagehand.extract({
    instruction: "Extract top 20 contributors of this repository",
    schema: z.object({
      contributors: z.array(
        z.object({
          github_username: z.string(),
          information: z.string(),
        }),
      ),
    }),
    modelName: "gpt-4o-2024-08-06",
  });

  await stagehand.context.close();

  console.log("Extracted collaborators:", contributors);

  return contributors.length === 20;
};

const wikipedia = async () => {
  const stagehand = new Stagehand({
    env: "LOCAL",
    verbose: true,
  });
  await stagehand.init();

  await stagehand.page.goto(`https://en.wikipedia.org/wiki/Baseball`);
  await stagehand.act({
    action: 'click the "hit and run" link in this article',
  });

  const url = "https://en.wikipedia.org/wiki/Hit_and_run_(baseball)";
  const currentUrl = await stagehand.page.url();
  await stagehand.context.close();

  return currentUrl === url;
};

const tasks = {
  vanta,
  vanta_h,
  peeler_simple,
  peeler_complex,
  wikipedia,
  simple_google_search,
  extract_collaborators_from_github_repository,
};

const exactMatch = (args: { input; output; expected? }) => {
  return {
    name: "Exact match",
    score: Boolean(args.output) ? 1 : 0,
  };
};

Eval("stagehand", {
  data: () => {
    return [
      {
        input: {
          name: "vanta",
        },
      },
      {
        input: {
          name: "vanta_h",
        },
      },
      {
        input: {
          name: "peeler_simple",
        },
      },
      {
        input: { name: "wikipedia" },
      },
      { input: { name: "peeler_complex" } },
      { input: { name: "simple_google_search" } },
      { input: { name: "extract_collaborators_from_github_repository" } },
    ];
  },
  task: async (input) => {
    try {
      const result = await tasks[input.name](input);
      if (result) {
        console.log(`✅ ${input.name}: Passed`);
      } else {
        console.log(`❌ ${input.name}: Failed`);
      }
      return result;
    } catch (error) {
      console.error(`❌ ${input.name}: Error - ${error}`);
      return false;
    }
  },
  scores: [exactMatch],
});
