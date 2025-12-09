import { Page, Locator, expect } from "@playwright/test";

/**
 * Get an element by its data-testid attribute
 */
export async function getByTestId(
  page: Page,
  testId: string
): Promise<Locator> {
  return page.locator(`[data-testid="${testId}"]`);
}

/**
 * Set up a mock project in localStorage to bypass the welcome screen
 * This simulates having opened a project before
 */
export async function setupMockProject(page: Page): Promise<void> {
  await page.addInitScript(() => {
    const mockProject = {
      id: "test-project-1",
      name: "Test Project",
      path: "/mock/test-project",
      lastOpened: new Date().toISOString(),
    };

    const mockState = {
      state: {
        projects: [mockProject],
        currentProject: mockProject,
        theme: "dark",
        sidebarOpen: true,
        apiKeys: { anthropic: "", google: "" },
        chatSessions: [],
        chatHistoryOpen: false,
        maxConcurrency: 3,
      },
      version: 0,
    };

    localStorage.setItem("automaker-storage", JSON.stringify(mockState));
  });
}

/**
 * Click an element by its data-testid attribute
 */
export async function clickElement(page: Page, testId: string): Promise<void> {
  const element = await getByTestId(page, testId);
  await element.click();
}

/**
 * Wait for an element with a specific data-testid to appear
 */
export async function waitForElement(
  page: Page,
  testId: string,
  options?: { timeout?: number; state?: "attached" | "visible" | "hidden" }
): Promise<Locator> {
  const element = page.locator(`[data-testid="${testId}"]`);
  await element.waitFor({
    timeout: options?.timeout ?? 5000,
    state: options?.state ?? "visible",
  });
  return element;
}

/**
 * Wait for an element with a specific data-testid to be hidden
 */
export async function waitForElementHidden(
  page: Page,
  testId: string,
  options?: { timeout?: number }
): Promise<void> {
  const element = page.locator(`[data-testid="${testId}"]`);
  await element.waitFor({
    timeout: options?.timeout ?? 5000,
    state: "hidden",
  });
}

/**
 * Get a button by its text content
 */
export async function getButtonByText(
  page: Page,
  text: string
): Promise<Locator> {
  return page.locator(`button:has-text("${text}")`);
}

/**
 * Click a button by its text content
 */
export async function clickButtonByText(
  page: Page,
  text: string
): Promise<void> {
  const button = await getButtonByText(page, text);
  await button.click();
}

/**
 * Fill an input field by its data-testid attribute
 */
export async function fillInput(
  page: Page,
  testId: string,
  value: string
): Promise<void> {
  const input = await getByTestId(page, testId);
  await input.fill(value);
}

/**
 * Navigate to the board/kanban view
 */
export async function navigateToBoard(page: Page): Promise<void> {
  await page.goto("/");

  // Wait for the page to load
  await page.waitForLoadState("networkidle");

  // Check if we're on the board view already
  const boardView = page.locator('[data-testid="board-view"]');
  const isOnBoard = await boardView.isVisible().catch(() => false);

  if (!isOnBoard) {
    // Try to click on a recent project first (from welcome screen)
    const recentProject = page.locator('p:has-text("Test Project")').first();
    if (await recentProject.isVisible().catch(() => false)) {
      await recentProject.click();
      await page.waitForTimeout(200);
    }

    // Then click on Kanban Board nav button to ensure we're on the board
    const kanbanNav = page.locator('[data-testid="nav-board"]');
    if (await kanbanNav.isVisible().catch(() => false)) {
      await kanbanNav.click();
    }
  }

  // Wait for the board view to be visible
  await waitForElement(page, "board-view", { timeout: 10000 });
}

/**
 * Check if the agent output modal is visible
 */
export async function isAgentOutputModalVisible(page: Page): Promise<boolean> {
  const modal = page.locator('[data-testid="agent-output-modal"]');
  return await modal.isVisible();
}

/**
 * Wait for the agent output modal to be visible
 */
export async function waitForAgentOutputModal(
  page: Page,
  options?: { timeout?: number }
): Promise<Locator> {
  return await waitForElement(page, "agent-output-modal", options);
}

/**
 * Wait for the agent output modal to be hidden
 */
export async function waitForAgentOutputModalHidden(
  page: Page,
  options?: { timeout?: number }
): Promise<void> {
  await waitForElementHidden(page, "agent-output-modal", options);
}

/**
 * Drag a kanban card from one column to another
 */
export async function dragKanbanCard(
  page: Page,
  featureId: string,
  targetColumnId: string
): Promise<void> {
  const card = page.locator(`[data-testid="kanban-card-${featureId}"]`);
  const dragHandle = page.locator(`[data-testid="drag-handle-${featureId}"]`);
  const targetColumn = page.locator(`[data-testid="kanban-column-${targetColumnId}"]`);

  // Perform drag and drop
  await dragHandle.dragTo(targetColumn);
}

/**
 * Get a kanban card by feature ID
 */
export async function getKanbanCard(
  page: Page,
  featureId: string
): Promise<Locator> {
  return page.locator(`[data-testid="kanban-card-${featureId}"]`);
}

/**
 * Click the view output button on a kanban card
 */
export async function clickViewOutput(
  page: Page,
  featureId: string
): Promise<void> {
  // Try the running version first, then the in-progress version
  const runningBtn = page.locator(`[data-testid="view-output-${featureId}"]`);
  const inProgressBtn = page.locator(
    `[data-testid="view-output-inprogress-${featureId}"]`
  );

  if (await runningBtn.isVisible()) {
    await runningBtn.click();
  } else if (await inProgressBtn.isVisible()) {
    await inProgressBtn.click();
  } else {
    throw new Error(`View output button not found for feature ${featureId}`);
  }
}

/**
 * Perform a drag and drop operation that works with @dnd-kit
 * This uses explicit mouse movements with pointer events
 */
export async function dragAndDropWithDndKit(
  page: Page,
  sourceLocator: Locator,
  targetLocator: Locator
): Promise<void> {
  const sourceBox = await sourceLocator.boundingBox();
  const targetBox = await targetLocator.boundingBox();

  if (!sourceBox || !targetBox) {
    throw new Error("Could not find source or target element bounds");
  }

  // Start drag from the center of the source element
  const startX = sourceBox.x + sourceBox.width / 2;
  const startY = sourceBox.y + sourceBox.height / 2;

  // End drag at the center of the target element
  const endX = targetBox.x + targetBox.width / 2;
  const endY = targetBox.y + targetBox.height / 2;

  // Perform the drag and drop with pointer events
  await page.mouse.move(startX, startY);
  await page.mouse.down();
  await page.waitForTimeout(150); // Give dnd-kit time to recognize the drag
  await page.mouse.move(endX, endY, { steps: 15 });
  await page.waitForTimeout(100); // Allow time for drop detection
  await page.mouse.up();
}

/**
 * Get the concurrency slider container
 */
export async function getConcurrencySliderContainer(
  page: Page
): Promise<Locator> {
  return page.locator('[data-testid="concurrency-slider-container"]');
}

/**
 * Get the concurrency slider
 */
export async function getConcurrencySlider(page: Page): Promise<Locator> {
  return page.locator('[data-testid="concurrency-slider"]');
}

/**
 * Get the displayed concurrency value
 */
export async function getConcurrencyValue(page: Page): Promise<string | null> {
  const valueElement = page.locator('[data-testid="concurrency-value"]');
  return await valueElement.textContent();
}

/**
 * Change the concurrency slider value by clicking on the slider track
 */
export async function setConcurrencyValue(
  page: Page,
  targetValue: number,
  min: number = 1,
  max: number = 10
): Promise<void> {
  const slider = page.locator('[data-testid="concurrency-slider"]');
  const sliderBounds = await slider.boundingBox();

  if (!sliderBounds) {
    throw new Error("Concurrency slider not found or not visible");
  }

  // Calculate position for target value
  const percentage = (targetValue - min) / (max - min);
  const targetX = sliderBounds.x + sliderBounds.width * percentage;
  const centerY = sliderBounds.y + sliderBounds.height / 2;

  // Click at the target position to set the value
  await page.mouse.click(targetX, centerY);
}

/**
 * Set up a mock project with custom concurrency value
 */
export async function setupMockProjectWithConcurrency(
  page: Page,
  concurrency: number
): Promise<void> {
  await page.addInitScript((maxConcurrency: number) => {
    const mockProject = {
      id: "test-project-1",
      name: "Test Project",
      path: "/mock/test-project",
      lastOpened: new Date().toISOString(),
    };

    const mockState = {
      state: {
        projects: [mockProject],
        currentProject: mockProject,
        theme: "dark",
        sidebarOpen: true,
        apiKeys: { anthropic: "", google: "" },
        chatSessions: [],
        chatHistoryOpen: false,
        maxConcurrency: maxConcurrency,
      },
      version: 0,
    };

    localStorage.setItem("automaker-storage", JSON.stringify(mockState));
  }, concurrency);
}
