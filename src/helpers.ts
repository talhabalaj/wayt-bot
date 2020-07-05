export const cleanMetaData = (string: string): string => {
  string = string.replace(/(\W+)/gi, " ");
  return `${string}${string.split(" ").length == 2 ? " " : ""}`;
};
