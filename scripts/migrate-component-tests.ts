#!/usr/bin/env bun
/**
 * Migrate Component Tests for Bun + Happy-DOM Compatibility
 *
 * This script updates component test files to work with Bun's test runner
 * and happy-dom by replacing patterns that don't work with compatible alternatives.
 *
 * Usage:
 *   bun scripts/migrate-component-tests.ts [--dry-run] [--file <path>]
 *
 * Options:
 *   --dry-run    Show what would be changed without modifying files
 *   --file       Process a specific file instead of all component tests
 */

import { readFile, readdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

const COMPONENT_TESTS_DIR = "src/tests/unit/components";

interface MigrationResult {
  file: string;
  changes: string[];
  content: string;
}

function migrateTestContent(content: string): {
  content: string;
  changes: string[];
} {
  const changes: string[] = [];
  let result = content;

  // 1. Replace screen imports with render destructuring
  if (result.includes("import { render, screen }")) {
    result = result.replace(
      /import \{ render, screen \} from ["']@testing-library\/react["'];?/g,
      'import { render } from "@testing-library/react";'
    );
    changes.push(
      "Removed 'screen' from imports (use render destructuring instead)"
    );
  }

  // Also handle screen-only imports
  if (
    result.includes('from "@testing-library/react"') &&
    result.includes("screen")
  ) {
    result = result.replace(
      /import \{([^}]*)\bscreen\b([^}]*)\} from ["']@testing-library\/react["'];?/g,
      (_match, before, after) => {
        const otherImports = (before + after)
          .replace(/,\s*,/g, ",")
          .replace(/^,|,$/g, "")
          .trim();
        if (otherImports) {
          return `import { ${otherImports} } from "@testing-library/react";`;
        }
        return "";
      }
    );
  }

  // 2. Remove userEvent imports
  if (result.includes("userEvent")) {
    result = result.replace(
      /import userEvent from ["']@testing-library\/user-event["'];?\n?/g,
      ""
    );
    changes.push("Removed userEvent import (use native .click() instead)");
  }

  // 3. Replace screen.getByRole with destructured getByRole
  // This requires more context-aware replacement - we'll add a helper comment instead
  if (
    result.includes("screen.getBy") ||
    result.includes("screen.queryBy") ||
    result.includes("screen.findBy")
  ) {
    changes.push(
      "WARNING: Manual update needed - replace screen.X() with destructured queries from render()"
    );
    // Add a comment at the top of the file
    if (!result.includes("// TODO: Migrate from screen")) {
      result = `// TODO: Migrate from screen.X() to destructured queries from render()\n${result}`;
    }
  }

  // 4. Replace userEvent.setup() and user.click() with native click()
  if (result.includes("userEvent.setup()")) {
    changes.push(
      "WARNING: Manual update needed - replace userEvent.click() with element.click()"
    );
    if (!result.includes("// TODO: Migrate from userEvent")) {
      result = `// TODO: Migrate from userEvent to native DOM events\n${result}`;
    }
  }

  // 5. Replace toBeInTheDocument() with toBeDefined()
  if (result.includes(".toBeInTheDocument()")) {
    result = result.replace(/\.toBeInTheDocument\(\)/g, ".toBeDefined()");
    changes.push("Replaced .toBeInTheDocument() with .toBeDefined()");
  }

  // 6. Replace toHaveAttribute("x", "y") with getAttribute("x")).toBe("y")
  const attrRegex =
    /expect\(([^)]+)\)\.toHaveAttribute\(["']([^"']+)["'],\s*["']([^"']+)["']\)/g;
  if (attrRegex.test(result)) {
    result = result.replace(
      attrRegex,
      'expect($1.getAttribute("$2")).toBe("$3")'
    );
    changes.push("Replaced .toHaveAttribute() with .getAttribute().toBe()");
  }

  // 7. Replace toBeDisabled() with hasAttribute("disabled")).toBe(true)
  const disabledRegex = /expect\(([^)]+)\)\.toBeDisabled\(\)/g;
  if (disabledRegex.test(result)) {
    result = result.replace(
      disabledRegex,
      'expect($1.hasAttribute("disabled")).toBe(true)'
    );
    changes.push(
      "Replaced .toBeDisabled() with .hasAttribute('disabled').toBe(true)"
    );
  }

  // 8. Replace toHaveClass("x") with classList.contains("x")).toBe(true)
  const classRegex = /expect\(([^)]+)\)\.toHaveClass\(["']([^"']+)["']\)/g;
  if (classRegex.test(result)) {
    result = result.replace(
      classRegex,
      'expect($1?.classList.contains("$2")).toBe(true)'
    );
    changes.push(
      "Replaced .toHaveClass() with .classList.contains().toBe(true)"
    );
  }

  return { content: result, changes };
}

async function processFile(
  filePath: string,
  dryRun: boolean
): Promise<MigrationResult | null> {
  const content = await readFile(filePath, "utf-8");
  const { content: newContent, changes } = migrateTestContent(content);

  if (changes.length === 0) {
    return null;
  }

  if (!dryRun) {
    await writeFile(filePath, newContent);
  }

  return { file: filePath, changes, content: newContent };
}

async function getTestFiles(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await getTestFiles(fullPath)));
    } else if (entry.name.endsWith(".test.tsx")) {
      files.push(fullPath);
    }
  }

  return files;
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");
  const fileIndex = args.indexOf("--file");
  const specificFile = fileIndex !== -1 ? args[fileIndex + 1] : null;

  console.log("🔄 Bun + Happy-DOM Component Test Migration");
  console.log("=".repeat(50));

  if (dryRun) {
    console.log("📋 DRY RUN MODE - No files will be modified\n");
  }

  let files: string[];
  if (specificFile) {
    files = [specificFile];
  } else {
    files = await getTestFiles(COMPONENT_TESTS_DIR);
  }

  console.log(`Found ${files.length} test file(s) to process\n`);

  let totalChanges = 0;
  let filesChanged = 0;

  for (const file of files) {
    const result = await processFile(file, dryRun);
    if (result) {
      filesChanged++;
      totalChanges += result.changes.length;
      console.log(`\n📄 ${result.file}`);
      for (const change of result.changes) {
        console.log(`   ✅ ${change}`);
      }
    }
  }

  console.log(`\n${"=".repeat(50)}`);
  console.log(`Summary: ${totalChanges} changes in ${filesChanged} file(s)`);

  if (dryRun && totalChanges > 0) {
    console.log("\nRun without --dry-run to apply changes");
  }

  if (totalChanges > 0) {
    console.log("\n⚠️  MANUAL STEPS REQUIRED:");
    console.log("   1. Update render() calls to destructure needed queries:");
    console.log(
      "      const { getByRole, getByText } = render(<Component />);"
    );
    console.log("   2. Replace screen.getByX() with getByX()");
    console.log("   3. Replace userEvent.click(el) with el.click()");
    console.log(
      "   4. Run tests to verify: bun test ./src/tests/unit/components/"
    );
  }
}

main().catch(console.error);
