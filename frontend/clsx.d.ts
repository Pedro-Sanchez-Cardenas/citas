declare module 'clsx' {
  type ClassValue =
    | string
    | number
    | boolean
    | undefined
    | null
    | Record<string, unknown>
    | ClassValue[];

  function clsx(...inputs: ClassValue[]): string;

  export = clsx;
}
