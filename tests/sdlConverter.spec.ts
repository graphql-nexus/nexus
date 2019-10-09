import { convertSDL, core } from "..";
import { EXAMPLE_SDL } from "./_sdl";

const { SDLConverter } = core;

describe("SDLConverter", () => {
  test("printObjectTypes", () => {
    expect(new SDLConverter(EXAMPLE_SDL).printObjectTypes()).toMatchSnapshot();
  });

  test("printEnumTypes", () => {
    expect(new SDLConverter(EXAMPLE_SDL).printEnumTypes()).toMatchSnapshot();
  });
});

test("convertSDL", () => {
  expect(convertSDL(EXAMPLE_SDL)).toMatchSnapshot();
});

test("convertSDL as commonjs", () => {
  expect(convertSDL(EXAMPLE_SDL, true)).toMatchSnapshot();
});
