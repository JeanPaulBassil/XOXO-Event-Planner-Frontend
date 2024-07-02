export const toCapitalCase = (str: string) => {
    return str.replace(/\b\w/g, (char) => char.toUpperCase());
}
