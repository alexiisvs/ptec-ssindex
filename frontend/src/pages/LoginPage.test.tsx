import "@testing-library/jest-dom/vitest";

import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";

import { LoginPage } from "./LoginPage";

const { signIn } = vi.hoisted(() => ({ signIn: vi.fn() }));

vi.mock("../auth/useAuth", () => ({
  useAuth: () => ({ signIn }),
}));

describe("LoginPage", () => {
  beforeEach(() => {
    window.localStorage.clear();
    signIn.mockReset();
    signIn.mockRejectedValue(new Error("Correo o contraseña incorrectos."));
  });

  afterEach(cleanup);

  it("shows remaining attempts and blocks the fifth failed login", async () => {
    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>,
    );

    fireEvent.change(screen.getByLabelText("Correo"), {
      target: { value: "cat@example.com" },
    });
    fireEvent.change(screen.getByLabelText("Contraseña"), {
      target: { value: "password123" },
    });

    const submitButton = screen.getByRole("button", { name: "Ingresar" });

    for (let attempt = 1; attempt <= 5; attempt += 1) {
      fireEvent.click(submitButton);
      await waitFor(() => expect(signIn).toHaveBeenCalledTimes(attempt));

      if (attempt === 1) {
        expect(screen.getByRole("alert")).toHaveTextContent(
          "Te quedan 4 intentos",
        );
      }
    }

    expect(submitButton).toBeDisabled();
    expect(screen.getByRole("alert")).toHaveTextContent("Demasiados intentos");
  });
});
