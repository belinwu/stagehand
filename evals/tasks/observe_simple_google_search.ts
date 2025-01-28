import { EvalFunction } from "@/types/evals";
import { initStagehand } from "@/evals/initStagehand";
import { performPlaywrightMethod } from "@/lib/a11y/utils";

export const observe_simple_google_search: EvalFunction = async ({
  modelName,
  logger,
}) => {
  const { stagehand, initResponse } = await initStagehand({
    modelName,
    logger,
  });

  const { debugUrl, sessionUrl } = initResponse;

  await stagehand.page.goto("https://www.google.com");

  // await stagehand.page.act({
  //   action: 'Search for "OpenAI"',
  // });
  const observation1 = await stagehand.page.observe({
    instruction: "Find the search bar and enter 'OpenAI'",
    useAccessibilityTree: true,
    returnAction: true,
  });
  console.log(observation1);

  if (observation1.length > 0) {
    const action1 = observation1[0];
    await performPlaywrightMethod(
      stagehand.page,
      stagehand.logger,
      action1.method,
      action1.arguments,
      action1.selector.replace("xpath=", ""),
    );
  }
  await stagehand.page.waitForTimeout(5000);
  const observation2 = await stagehand.page.observe({
    instruction: "Click the search button in the suggestions dropdown",
    useAccessibilityTree: true,
    returnAction: true,
  });
  console.log(observation2);

  if (observation2.length > 0) {
    const action2 = observation2[0];
    await performPlaywrightMethod(
      stagehand.page,
      stagehand.logger,
      action2.method,
      action2.arguments,
      action2.selector.replace("xpath=", ""),
    );
  }
  await stagehand.page.waitForTimeout(5000);

  const expectedUrl = "https://www.google.com/search?q=OpenAI";
  const currentUrl = stagehand.page.url();

  await stagehand.close();

  return {
    _success: currentUrl.startsWith(expectedUrl),
    currentUrl,
    debugUrl,
    sessionUrl,
    logs: logger.getLogs(),
  };
};
