export function cn(...classNames: unknown[]) {
  return classNames
    .filter((className): className is string => typeof className === "string" && className.length > 0)
    .join(" ");
}
