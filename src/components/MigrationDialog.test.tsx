import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MigrationDialog } from "./MigrationDialog";

describe("MigrationDialog", () => {
  it("should not render when isOpen is false", () => {
    const { container } = render(
      <MigrationDialog
        isOpen={false}
        itemCount={5}
        onMerge={() => {}}
        onReplace={() => {}}
      />,
    );
    expect(container.firstChild).toBeNull();
  });

  it("should render correct item count and call callbacks", () => {
    const onMerge = vi.fn();
    const onReplace = vi.fn();

    render(
      <MigrationDialog
        isOpen={true}
        itemCount={42}
        onMerge={onMerge}
        onReplace={onReplace}
      />,
    );

    expect(screen.getByText(/42 эл/)).toBeDefined();
    expect(screen.getByText("Найдены локальные данные")).toBeDefined();

    const mergeBtn = screen.getByText("Объединить данные");
    fireEvent.click(mergeBtn);
    expect(onMerge).toHaveBeenCalled();

    const replaceBtn = screen.getByText("Использовать облако");
    fireEvent.click(replaceBtn);
    expect(onReplace).toHaveBeenCalled();
  });

  it("should disable buttons when loading", () => {
    render(
      <MigrationDialog
        isOpen={true}
        itemCount={5}
        onMerge={() => {}}
        onReplace={() => {}}
        loading={true}
      />,
    );

    const buttons = screen.getAllByRole("button");
    buttons.forEach((btn) => {
      expect((btn as HTMLButtonElement).disabled).toBe(true);
    });
  });
});
