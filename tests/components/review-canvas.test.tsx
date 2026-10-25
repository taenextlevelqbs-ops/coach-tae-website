import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, expect, it, vi } from "vitest";
import { ReviewCanvas } from "@/modules/qb-lab/ReviewCanvas";
beforeEach(() => {
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue({
    clearRect: vi.fn(),
    beginPath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    stroke: vi.fn(),
  } as unknown as CanvasRenderingContext2D);
});
it("pauses, adds a timestamped note, seeks it and clears without network persistence", () => {
  const pause = vi.fn();
  const seek = vi.fn();
  render(
    <ReviewCanvas time={2.5} onPause={pause} onSeek={seek}>
      <div>Synthetic field</div>
    </ReviewCanvas>,
  );
  fireEvent.change(screen.getByLabelText("Timestamped coaching note"), {
    target: { value: "Keep a balanced base" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Add note at 2.5s" }));
  expect(pause).toHaveBeenCalled();
  fireEvent.click(
    screen.getByRole("button", { name: "2.5s · Keep a balanced base" }),
  );
  expect(seek).toHaveBeenCalledWith(2.5);
  const marker = screen.getByRole("button", { name: /Place review marker/ });
  fireEvent.keyDown(marker, { key: "ArrowLeft" });
  fireEvent.click(marker);
  expect(screen.getByText(/drawings ·/)).toHaveTextContent(
    "1 drawings · 1 notes",
  );
  fireEvent.click(
    screen.getByRole("button", { name: "Clear review notes and drawings" }),
  );
  expect(screen.getByText(/drawings ·/)).toHaveTextContent(
    "0 drawings · 0 notes",
  );
});
